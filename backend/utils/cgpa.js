// ============================================
// File: backend/utils/cgpa.js
// CGPA Computation + Redis Cache + DB Sync
// ============================================

import pool from '../config/db.js';
import { cacheGet, cacheSet, cacheDel } from '../config/redis.js';

function percentageToGradePoint(pct) {
    if (pct < 50) {
        return 0.00;
    } else if (pct > 80) {
        return 4.00;
    } else {
        // Formula: GPA = 0.1X - 4 (for 50 <= X <= 80)
        return Number(((0.1 * pct) - 4).toFixed(2));
    }
}

/**
 * Compute CGPA for a student from grades, write to DB, and cache in Redis.
 * Call this after any grade is saved/updated.
 * @param {number} studentId
 * @param {import('mysql2/promise').PoolConnection} [conn] - optional DB connection (for use inside transactions)
 */
export async function recalcStudentCGPA(studentId, conn) {
    const db = conn || pool;
    try {
        // Get all course percentages for this student
        // course_pct = SUM((score/max_score) * weight) / SUM(weight) * 100
        // Only include assessments that have been fully graded
        const [courseGrades] = await db.query(
            `SELECT ca.course_id, c.credit_hours,
                    CASE 
                        WHEN SUM(COALESCE(a.weight, 0)) = 0 THEN 0
                        ELSE SUM((g.score / a.max_score) * COALESCE(a.weight, 0)) / SUM(COALESCE(a.weight, 0)) * 100
                    END as course_pct
             FROM grades g
             JOIN assessments a ON g.assessment_id = a.id
             JOIN course_assignments ca ON a.course_assignment_id = ca.id
             JOIN courses c ON ca.course_id = c.id
             WHERE g.student_id = ? AND a.status = 'graded' AND g.score IS NOT NULL
             GROUP BY ca.course_id, c.credit_hours`,
            [studentId]
        );

        if (courseGrades.length === 0) {
            // No grades yet — set CGPA to 0
            await db.query('UPDATE students SET cgpa = 0.00 WHERE id = ?', [studentId]);
            await cacheDel(`cgpa:student:${studentId}`);
            return 0.0;
        }

        // Compute weighted CGPA
        let totalWeightedGP = 0;
        let totalCredits = 0;
        for (const cg of courseGrades) {
            const pct = parseFloat(cg.course_pct) || 0;
            const gp = percentageToGradePoint(pct);
            const credits = cg.credit_hours || 3;
            totalWeightedGP += gp * credits;
            totalCredits += credits;
        }

        const cgpa = totalCredits > 0 ? Math.round((totalWeightedGP / totalCredits) * 100) / 100 : 0.0;

        // Write to DB
        await db.query('UPDATE students SET cgpa = ? WHERE id = ?', [cgpa, studentId]);

        // Cache in Redis (TTL 1 hour — auto-refreshes on next grade change anyway)
        await cacheSet(`cgpa:student:${studentId}`, JSON.stringify(cgpa), 3600);

        return cgpa;
    } catch (error) {
        console.error(`Error computing CGPA for student ${studentId}:`, error.message);
        return null;
    }
}

/**
 * Recalculate CGPA for all students who were graded in a specific assessment.
 * Call this after bulk grade saves.
 * @param {number} assessmentId
 * @param {import('mysql2/promise').PoolConnection} [conn]
 */
export async function recalcCGPAForAssessment(assessmentId, conn) {
    const db = conn || pool;
    try {
        // Get all student IDs that have grades for this assessment
        const [students] = await db.query(
            'SELECT DISTINCT student_id FROM grades WHERE assessment_id = ?',
            [assessmentId]
        );

        // Recalculate CGPA for each affected student (in parallel)
        await Promise.all(
            students.map(s => recalcStudentCGPA(s.student_id, conn))
        );

        return students.length;
    } catch (error) {
        console.error(`Error recalculating CGPAs for assessment ${assessmentId}:`, error.message);
        return 0;
    }
}

/**
 * Get cached CGPA for a student. Falls back to computation if cache miss.
 * @param {number} studentId
 * @returns {Promise<number>}
 */
export async function getCachedCGPA(studentId) {
    try {
        const cached = await cacheGet(`cgpa:student:${studentId}`);
        if (cached !== null) return JSON.parse(cached);

        // Cache miss — compute, store, and return
        return await recalcStudentCGPA(studentId);
    } catch {
        // Redis down — compute directly
        return await recalcStudentCGPA(studentId);
    }
}
