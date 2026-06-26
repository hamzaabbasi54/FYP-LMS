import express from 'express';
import pool from '../config/db.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';
import { generateExcel } from '../utils/excel.js';
import { cacheGet, cacheSet } from '../config/redis.js';

const router = express.Router();

router.use(verifyToken);
router.use(isAdmin); // Currently only admin views OBE reports globally

// GET /api/obe/reports - Fetches OBE data for active batches
router.get('/reports', async (req, res) => {
    try {
        const deptId = (req.user.role === 'deptadmin') ? req.user.department_id : null;
        const cacheKey = `obe:reports:${deptId || 'all'}`;
        const cached = await cacheGet(cacheKey);
        if (cached) return res.json({ success: true, data: cached });

        const deptFilter = deptId ? ' AND b.department_id = ?' : '';
        const deptParams = deptId ? [deptId] : [];

        // Query 1: Get CLO Achievement grouped by Batch -> Semester -> Course -> CLO
        // FIX Issue #2: Incorporates assessment weight into CLO calculation
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
                    CASE WHEN SUM(aq.max_marks * COALESCE(a.weight, 1)) = 0 THEN 0
                         ELSE (SUM(qg.score * COALESCE(a.weight, 1)) / SUM(aq.max_marks * COALESCE(a.weight, 1))) * 100
                    END as student_clo_percent
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
        // FIX Issue #2: Incorporates assessment weight into PLO calculation
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
                           CASE WHEN SUM(aq.max_marks * COALESCE(a.weight, 1)) = 0 THEN 0
                                ELSE (SUM(qg.score * COALESCE(a.weight, 1)) / SUM(aq.max_marks * COALESCE(a.weight, 1))) * 100
                           END as student_clo_percent
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

        // FIX Issue #1: Detect unmapped questions (clo_id IS NULL) per course assignment
        const [unmappedWarnings] = await pool.query(`
            SELECT 
                ca.id as course_assignment_id,
                c.code as course_code,
                c.title as course_title,
                sem.batch_id,
                COUNT(aq.id) as unmapped_count,
                a.title as assessment_title
            FROM assessment_questions aq
            JOIN assessments a ON aq.assessment_id = a.id
            JOIN course_assignments ca ON a.course_assignment_id = ca.id
            JOIN courses c ON ca.course_id = c.id
            JOIN semesters sem ON ca.semester_id = sem.id
            JOIN batches b ON sem.batch_id = b.id
            WHERE aq.clo_id IS NULL AND b.status = 'active' ${deptFilter}
            GROUP BY ca.id, c.code, c.title, sem.batch_id, a.id, a.title
        `, deptParams);

        // Restructure data to match frontend OBEReports requirements
        const formattedBatches = batches.map(b => {
            // Find all PLOs for this batch (graded and ungraded)
            const bAttached = attachedPLOs.filter(ap => ap.batch_id === b.id);
            const totalPLOs = bAttached.length;

            // FIX Issue #4: Include ALL attached PLOs, marking ungraded ones as "Not Assessed"
            const gradedPloMap = {};
            ploRows.filter(p => p.batch_id === b.id).forEach(p => {
                gradedPloMap[p.plo_id] = {
                    id: `PLO-${p.plo_number}`,
                    name: p.plo_name,
                    achievement: Math.round(p.plo_achievement),
                    notAssessed: false
                };
            });

            const batchPLOs = bAttached.map(ap => {
                if (gradedPloMap[ap.id]) {
                    return gradedPloMap[ap.id];
                }
                // Ungraded PLO — show as "Not Yet Assessed"
                return {
                    id: `PLO-${ap.plo_number}`,
                    name: ap.description,
                    achievement: null,
                    notAssessed: true
                };
            });

            // Calculate overall batch achievement (only from graded PLOs)
            const gradedPLOs = batchPLOs.filter(p => !p.notAssessed);
            const overallAchievement = gradedPLOs.length > 0
                ? Math.round(gradedPLOs.reduce((acc, p) => acc + p.achievement, 0) / gradedPLOs.length)
                : 0;

            // Group CLOs into Semesters -> Courses
            const batchCLOs = cloRows.filter(c => c.batch_id === b.id);
            const semestersMap = {};
            batchCLOs.forEach(c => {
                if (!semestersMap[c.semester_id]) {
                    semestersMap[c.semester_id] = {
                        id: c.semester_id,
                        name: c.semester_name,
                        courses: {}
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
            });

            // FIX Issue #5: Calculate semester averages per-course instead of per-CLO
            const semesters = Object.values(semestersMap).map(s => {
                const coursesArray = Object.values(s.courses).map(course => ({
                    ...course,
                    achievement: course.clos.length > 0 ? Math.round(course.totalAchievement / course.clos.length) : 0
                }));

                // Average of course averages (not CLO averages)
                const semesterAchievement = coursesArray.length > 0
                    ? Math.round(coursesArray.reduce((acc, c) => acc + c.achievement, 0) / coursesArray.length)
                    : 0;

                return {
                    id: s.id,
                    name: s.name,
                    courses: coursesArray,
                    achievement: semesterAchievement
                };
            });

            // FIX Issue #1: Collect warnings for this batch
            const warnings = unmappedWarnings
                .filter(w => w.batch_id === b.id)
                .map(w => `⚠ "${w.assessment_title}" in ${w.course_code} has ${w.unmapped_count} question(s) not mapped to any CLO — they won't count towards OBE.`);

            return {
                id: b.id,
                name: b.name,
                year: `Year ${b.year_number}`,
                totalPLOs: totalPLOs, // FIX Issue #8: Removed || 12 fallback
                overallAchievement,
                plos: batchPLOs,
                semesters: semesters,
                warnings // FIX Issue #1: Unmapped question warnings
            };
        });

        await cacheSet(cacheKey, formattedBatches, 86400); // cache for 1 day
        res.json({ success: true, data: formattedBatches });
    } catch (error) {
        console.error('Get OBE Reports Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch OBE reports' });
    }
});

// FIX Issue #7: GET /api/obe/reports/:batchId/plo-report — Download PLO Report as Excel
router.get('/reports/:batchId/plo-report', async (req, res) => {
    try {
        const batchId = req.params.batchId;
        const deptId = (req.user.role === 'deptadmin') ? req.user.department_id : null;
        const deptFilter = deptId ? ' AND b.department_id = ?' : '';
        const deptParams = deptId ? [deptId] : [];

        // Get batch info
        const [batchRows] = await pool.query(
            `SELECT b.name FROM batches b WHERE b.id = ? AND b.status = 'active' ${deptFilter}`,
            [batchId, ...deptParams]
        );
        if (batchRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Batch not found' });
        }
        const batchName = batchRows[0].name;

        // Get PLO achievement data (weighted)
        const [ploData] = await pool.query(`
            SELECT
                p.plo_number as 'PLO Number',
                p.description as 'PLO Description',
                ROUND(AVG(batch_plo.avg_clo_achievement), 2) as 'Achievement (%)'
            FROM (
                SELECT
                    base.clo_id,
                    AVG(base.student_clo_percent) as avg_clo_achievement
                FROM (
                    SELECT clo.id as clo_id, qg.student_id,
                           CASE WHEN SUM(aq.max_marks * COALESCE(a.weight, 1)) = 0 THEN 0
                                ELSE (SUM(qg.score * COALESCE(a.weight, 1)) / SUM(aq.max_marks * COALESCE(a.weight, 1))) * 100
                           END as student_clo_percent
                    FROM batches b
                    JOIN semesters sem ON sem.batch_id = b.id
                    JOIN course_assignments ca ON ca.semester_id = sem.id
                    JOIN assessments a ON a.course_assignment_id = ca.id
                    JOIN assessment_questions aq ON aq.assessment_id = a.id
                    JOIN clos clo ON aq.clo_id = clo.id
                    JOIN question_grades qg ON qg.question_id = aq.id AND qg.assessment_id = a.id
                    WHERE b.id = ?
                    GROUP BY clo.id, qg.student_id
                ) as base
                GROUP BY base.clo_id
            ) as batch_plo
            JOIN batch_clo_plo_mapping bcpm ON batch_plo.clo_id = bcpm.clo_id AND bcpm.batch_id = ?
            JOIN plos p ON bcpm.plo_id = p.id
            GROUP BY p.id, p.plo_number, p.description
            ORDER BY p.plo_number
        `, [batchId, batchId]);

        if (ploData.length === 0) {
            return res.status(404).json({ success: false, message: 'No PLO data available for this batch' });
        }

        const buffer = generateExcel(ploData, `PLO Report - ${batchName}`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=PLO_Report_${batchName.replace(/\s+/g, '_')}.xlsx`);
        res.send(buffer);
    } catch (error) {
        console.error('Download PLO Report Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to generate PLO report' });
    }
});

// FIX Issue #7: GET /api/obe/reports/:batchId/clo-report — Download CLO Report as Excel
router.get('/reports/:batchId/clo-report', async (req, res) => {
    try {
        const batchId = req.params.batchId;
        const semesterId = req.query.semesterId || null;
        const deptId = (req.user.role === 'deptadmin') ? req.user.department_id : null;
        const deptFilter = deptId ? ' AND b.department_id = ?' : '';
        const deptParams = deptId ? [deptId] : [];

        // Get batch info
        const [batchRows] = await pool.query(
            `SELECT b.name FROM batches b WHERE b.id = ? AND b.status = 'active' ${deptFilter}`,
            [batchId, ...deptParams]
        );
        if (batchRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Batch not found' });
        }
        const batchName = batchRows[0].name;

        // Build semester filter
        const semFilter = semesterId ? ' AND sem.id = ?' : '';
        const semParams = semesterId ? [semesterId] : [];

        // Get CLO achievement data (weighted)
        const [cloData] = await pool.query(`
            SELECT
                sem.name as 'Semester',
                c.code as 'Course Code',
                c.title as 'Course Title',
                clo.clo_number as 'CLO Number',
                clo.title as 'CLO Description',
                ROUND(AVG(base.student_clo_percent), 2) as 'Achievement (%)'
            FROM (
                SELECT
                    sem.id as sem_id, c.id as course_id, clo.id as clo_id, qg.student_id,
                    CASE WHEN SUM(aq.max_marks * COALESCE(a.weight, 1)) = 0 THEN 0
                         ELSE (SUM(qg.score * COALESCE(a.weight, 1)) / SUM(aq.max_marks * COALESCE(a.weight, 1))) * 100
                    END as student_clo_percent
                FROM batches b
                JOIN semesters sem ON sem.batch_id = b.id
                JOIN course_assignments ca ON ca.semester_id = sem.id
                JOIN courses c ON ca.course_id = c.id
                JOIN assessments a ON a.course_assignment_id = ca.id
                JOIN assessment_questions aq ON aq.assessment_id = a.id
                JOIN clos clo ON aq.clo_id = clo.id
                JOIN question_grades qg ON qg.question_id = aq.id AND qg.assessment_id = a.id
                WHERE b.id = ? ${semFilter}
                GROUP BY sem.id, c.id, clo.id, qg.student_id
            ) as base
            JOIN semesters sem ON base.sem_id = sem.id
            JOIN courses c ON base.course_id = c.id
            JOIN clos clo ON base.clo_id = clo.id
            GROUP BY sem.id, sem.name, c.id, c.code, c.title, clo.id, clo.clo_number, clo.title
            ORDER BY sem.name, c.code, clo.clo_number
        `, [batchId, ...semParams]);

        if (cloData.length === 0) {
            return res.status(404).json({ success: false, message: 'No CLO data available' });
        }

        const sheetName = semesterId ? `CLO Report` : `CLO Report - ${batchName}`;
        const buffer = generateExcel(cloData, sheetName);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=CLO_Report_${batchName.replace(/\s+/g, '_')}.xlsx`);
        res.send(buffer);
    } catch (error) {
        console.error('Download CLO Report Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to generate CLO report' });
    }
});

export default router;
