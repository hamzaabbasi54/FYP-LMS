import express from 'express';
import pool from '../config/db.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);
router.use(isAdmin); // Currently only admin views OBE reports globally

// GET /api/obe/reports - Fetches OBE data for active batches
router.get('/reports', async (req, res) => {
    try {
        const deptId = (req.user.role === 'deptadmin') ? req.user.department_id : null;
        const deptFilter = deptId ? ' AND b.department_id = ?' : '';
        const deptParams = deptId ? [deptId] : [];
        // Query 1: Get CLO Achievement grouped by Batch -> Semester -> Course -> CLO
        const [cloRows] = await pool.query(`
            SELECT
                base.batch_id,
                base.batch_name,
                base.semester_id,
                base.semester_name,
                base.course_id,
                base.course_code,
                base.course_title,
                base.clo_id,
                base.clo_number,
                base.clo_title,
                AVG(base.student_clo_percent) as avg_clo_achievement
            FROM (
                SELECT
                    b.id as batch_id,
                    b.name as batch_name,
                    sem.id as semester_id,
                    sem.name as semester_name,
                    c.id as course_id,
                    c.code as course_code,
                    c.title as course_title,
                    clo.id as clo_id,
                    clo.clo_number,
                    clo.title as clo_title,
                    qg.student_id,
                    (SUM(qg.score) / SUM(aq.max_marks)) * 100 as student_clo_percent
                FROM batches b
                JOIN semesters sem ON sem.batch_id = b.id
                JOIN course_assignments ca ON ca.semester_id = sem.id
                JOIN courses c ON ca.course_id = c.id
                JOIN assessments a ON a.course_assignment_id = ca.id
                JOIN assessment_questions aq ON aq.assessment_id = a.id
                JOIN clos clo ON aq.clo_id = clo.id
                JOIN question_grades qg ON qg.question_id = aq.id AND qg.assessment_id = a.id
                WHERE b.status = 'active' ${deptFilter}
                GROUP BY b.id, sem.id, c.id, clo.id, qg.student_id
            ) as base
            GROUP BY
                base.batch_id, base.batch_name, base.semester_id, base.semester_name,
                base.course_id, base.course_code, base.course_title, base.clo_id, base.clo_number, base.clo_title
        `, deptParams);

        // Query 2: Get PLO Achievement grouped by Batch -> PLO
        const [ploRows] = await pool.query(`
            SELECT
                batch_plo.batch_id,
                p.id as plo_id,
                p.plo_number,
                p.description as plo_name,
                AVG(batch_plo.avg_clo_achievement) as plo_achievement
            FROM (
                SELECT
                    base.batch_id,
                    base.clo_id,
                    AVG(base.student_clo_percent) as avg_clo_achievement
                FROM (
                    SELECT b.id as batch_id, clo.id as clo_id, qg.student_id,
                           (SUM(qg.score) / SUM(aq.max_marks)) * 100 as student_clo_percent
                    FROM batches b
                    JOIN semesters sem ON sem.batch_id = b.id
                    JOIN course_assignments ca ON ca.semester_id = sem.id
                    JOIN assessments a ON a.course_assignment_id = ca.id
                    JOIN assessment_questions aq ON aq.assessment_id = a.id
                    JOIN clos clo ON aq.clo_id = clo.id
                    JOIN question_grades qg ON qg.question_id = aq.id AND qg.assessment_id = a.id
                    WHERE b.status = 'active' ${deptFilter}
                    GROUP BY b.id, clo.id, qg.student_id
                ) as base
                GROUP BY base.batch_id, base.clo_id
            ) as batch_plo
            JOIN batch_clo_plo_mapping bcpm ON batch_plo.clo_id = bcpm.clo_id AND batch_plo.batch_id = bcpm.batch_id
            JOIN plos p ON bcpm.plo_id = p.id
            GROUP BY batch_plo.batch_id, p.id, p.plo_number, p.description
        `, deptParams);

        // Also fetch a list of all active batches to ensure they appear even if they have no grades yet
        const deptFilterSimple = deptId ? ' AND department_id = ?' : '';
        const [batches] = await pool.query(`
            SELECT id, name, (YEAR(CURRENT_DATE) - YEAR(start_date) + 1) as year_number
            FROM batches WHERE status = 'active' ${deptFilterSimple}
        `, deptParams);

        // Fetch actual attached PLOs for these batches
        const [attachedPLOs] = await pool.query(`
            SELECT bp.batch_id, p.id, p.plo_number, p.description
            FROM batch_plos bp
            JOIN plos p ON bp.plo_id = p.id
            JOIN batches b ON bp.batch_id = b.id
            WHERE b.status = 'active' ${deptFilter}
        `, deptParams);

        // Fetch precise CLO to PLO mappings for the batches
        const [cloPloMappings] = await pool.query(`
            SELECT m.batch_id, m.clo_id, p.plo_number
            FROM batch_clo_plo_mapping m
            JOIN plos p ON m.plo_id = p.id
            JOIN batches b ON m.batch_id = b.id
            WHERE b.status = 'active' ${deptFilter}
        `, deptParams);

        // Restructure data to match frontend OBEReports requirements
        const formattedBatches = batches.map(b => {
            // Find all PLOs for this batch (graded and ungraded)
            const bAttached = attachedPLOs.filter(ap => ap.batch_id === b.id);
            const totalPLOs = bAttached.length;

            // Find Graded PLOs for this batch
            const batchPLOs = ploRows
                .filter(p => p.batch_id === b.id)
                .map(p => ({
                    id: `PLO-${p.plo_number}`,
                    name: p.plo_name,
                    achievement: Math.round(p.plo_achievement)
                }));
            
            // Calculate overall batch achievement (based on graded PLOs)
            const overallAchievement = batchPLOs.length > 0 
                ? Math.round(batchPLOs.reduce((acc, p) => acc + p.achievement, 0) / batchPLOs.length)
                : 0;

            // Group CLOs into Semesters -> Courses
            const batchCLOs = cloRows.filter(c => c.batch_id === b.id);
            const semestersMap = {};
            batchCLOs.forEach(c => {
                if (!semestersMap[c.semester_id]) {
                    semestersMap[c.semester_id] = {
                        id: c.semester_id,
                        name: c.semester_name,
                        courses: {},
                        totalAchievement: 0,
                        cloCount: 0
                    };
                }
                
                if (!semestersMap[c.semester_id].courses[c.course_id]) {
                    semestersMap[c.semester_id].courses[c.course_id] = {
                        id: c.course_id,
                        code: c.course_code,
                        title: c.course_title,
                        clos: [],
                        totalAchievement: 0
                    };
                }

                // Find mapped PLO(s) using the exact mappings
                const mappedPlos = cloPloMappings
                    .filter(m => m.batch_id === b.id && m.clo_id === c.clo_id)
                    .map(m => `PLO-${m.plo_number}`);
                const mappedPloStr = mappedPlos.length > 0 ? mappedPlos.join(', ') : 'Mapped PLO';

                semestersMap[c.semester_id].courses[c.course_id].clos.push({
                    id: `CLO-${c.clo_number}`,
                    name: c.clo_title,
                    achievement: Math.round(c.avg_clo_achievement),
                    plo: mappedPloStr
                });
                
                semestersMap[c.semester_id].courses[c.course_id].totalAchievement += c.avg_clo_achievement;
                semestersMap[c.semester_id].totalAchievement += c.avg_clo_achievement;
                semestersMap[c.semester_id].cloCount++;
            });

            // Calculate semester & course averages
            const semesters = Object.values(semestersMap).map(s => {
                const coursesArray = Object.values(s.courses).map(course => ({
                    ...course,
                    achievement: course.clos.length > 0 ? Math.round(course.totalAchievement / course.clos.length) : 0
                }));
                
                return {
                    id: s.id,
                    name: s.name,
                    courses: coursesArray,
                    achievement: s.cloCount > 0 ? Math.round(s.totalAchievement / s.cloCount) : 0
                };
            });

            return {
                id: b.id,
                name: b.name,
                year: `Year ${b.year_number}`,
                totalPLOs: totalPLOs || 12, // fallback if no PLOs attached
                overallAchievement,
                plos: batchPLOs,
                semesters: semesters
            };
        });

        res.json({ success: true, data: formattedBatches });
    } catch (error) {
        console.error('Get OBE Reports Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch OBE reports' });
    }
});

export default router;
