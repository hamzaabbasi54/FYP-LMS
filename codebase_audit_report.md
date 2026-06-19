# CODEBASE AUDIT REPORT
Generated from: backend/migrations/001_initial_schema.sql, backend/routes/assessmentRoutes.js, backend/routes/courseRoutes.js, backend/routes/batchRoutes.js, backend/routes/obeRoutes.js, backend/utils/cgpa.js

---

## ISSUE 1 — CLO Mapping Tables

**Status:** PARTIAL

**What exists in schema:**
```sql
CREATE TABLE assessment_clo_mapping (
    assessment_id INT NOT NULL,
    clo_id INT NOT NULL,
    PRIMARY KEY (assessment_id, clo_id),
    CONSTRAINT fk_mapping_assess FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_mapping_assess_clo FOREIGN KEY (clo_id) REFERENCES clos(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE batch_clo_plo_mapping (
    batch_id INT NOT NULL,
    clo_id INT NOT NULL,
    plo_id INT NOT NULL,
    PRIMARY KEY (batch_id, clo_id, plo_id),
    CONSTRAINT fk_bcpm_batch FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
    CONSTRAINT fk_bcpm_clo FOREIGN KEY (clo_id) REFERENCES clos(id) ON DELETE CASCADE,
    CONSTRAINT fk_bcpm_plo FOREIGN KEY (plo_id) REFERENCES plos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**What exists in query code:**
The `assessment_clo_mapping` relationship is handled correctly via a junction table. In `backend/routes/assessmentRoutes.js` (Lines 158-160):
```javascript
if (mapped_clos && Array.isArray(mapped_clos) && mapped_clos.length > 0) {
    const mappingValues = mapped_clos.map(cloId => [assessmentId, cloId]);
    await conn.query('INSERT INTO assessment_clo_mapping (assessment_id, clo_id) VALUES ?', [mappingValues]);
}
```
However, for CLO-PLO mapping, `backend/routes/courseRoutes.js` (Line 604 & 734) attempts to query and insert into a globally scoped junction table called `clo_plo_mapping`:
```javascript
'INSERT INTO clo_plo_mapping (clo_id, plo_id) VALUES ?'
```
This table was explicitly commented out and removed from the schema (`backend/migrations/001_initial_schema.sql` line 237: `-- Removed global CLO_PLO_MAPPING`) in favor of `batch_clo_plo_mapping`.

**Conclusion:**
This is a real problem. The `assessment_clo_mapping` table exists and works as intended. However, `courseRoutes.js` is trying to write to `clo_plo_mapping` which no longer exists in the database schema. This creates a mismatch between global mapping and batch-scoped mapping, which will cause SQL errors when creating or updating courses.

---

## ISSUE 2 — Assessment Weight Constraint

**Status:** CONFIRMED

**What exists in schema:**
```sql
CREATE TABLE assessments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_assignment_id INT NOT NULL,
    type ENUM('quiz', 'assignment', 'midterm', 'final', 'project') NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT DEFAULT NULL,
    due_date DATETIME DEFAULT NULL,
    release_grades_on DATETIME DEFAULT NULL,
    max_score INT NOT NULL DEFAULT 100,
    weight DECIMAL(5, 2) DEFAULT NULL,
    duration_minutes INT DEFAULT NULL,
    status ENUM('draft', 'scheduled', 'published', 'needs_grading', 'graded') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ...
)
```

**What exists in validation code:**
There is no weight validation logic found in the backend code. The assessment insert handler in `backend/routes/assessmentRoutes.js` (Lines 147-151) passes the weight directly from the payload without validation against existing assessments:
```javascript
const [result] = await conn.query(
    `INSERT INTO assessments (course_assignment_id, type, title, description, due_date, conducted_date, release_grades_on, max_score, weight, duration_minutes, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [course_assignment_id, type, title, description || null, due_date || null, conducted_date || null, release_grades_on || null,
     finalMaxScore, weight || null, duration_minutes || null, status || 'draft']
);
```

**Conclusion:**
Unconstrained weight is a real risk. Because neither the database nor the backend code enforces a total weight limit of 100 per course assignment, a faculty member could easily create multiple assessments that sum to 120% or 80%. This would silently corrupt the final grades, CGPA, and relative attainment calculations for that course.

---

## ISSUE 3 — Grade Normalization / max_score

**Status:** CONFIRMED

**What exists in schema:**
```sql
CREATE TABLE grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assessment_id INT NOT NULL,
    student_id INT NOT NULL,
    score DECIMAL(6, 2) DEFAULT NULL,
    remarks TEXT DEFAULT NULL,
    graded_by INT DEFAULT NULL,
    ...
);

CREATE TABLE assessments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ...
    max_score INT NOT NULL DEFAULT 100,
    ...
);
```

**What exists in calculation code:**
Grade normalization correctly leverages table joins to convert raw scores to percentages. In `backend/utils/cgpa.js` (Lines 45-46):
```javascript
WHEN SUM(COALESCE(a.weight, 0)) = 0 THEN 0
ELSE SUM((g.score / a.max_score) * COALESCE(a.weight, 0)) / SUM(COALESCE(a.weight, 0)) * 100
```

**Conclusion:**
Attainment can be calculated correctly with the current structure. Anchoring `max_score` on `ASSESSMENTS` rather than `GRADES` is standard 3NF database normalization and reduces data redundancy. This structure works perfectly fine and requires no changes.

---

## OVERALL SUMMARY

| Issue | Status | Severity | Fix Required |
|-------|--------|----------|--------------|
| CLO mapping tables | PARTIAL | High | Yes |
| Assessment weight constraint | CONFIRMED | High | Yes |
| Grade max_score anchor | CONFIRMED | Low | No |

**Files audited:**
backend/migrations/001_initial_schema.sql, backend/routes/assessmentRoutes.js, backend/routes/courseRoutes.js, backend/routes/batchRoutes.js, backend/routes/obeRoutes.js, backend/utils/cgpa.js

**Files NOT found (searched but missing):**
Any schema definition or CREATE TABLE statement for clo_plo_mapping.

---
