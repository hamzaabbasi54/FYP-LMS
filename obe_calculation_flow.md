# OBE Calculation Flow: Comprehensive Guide

This document outlines the complete, step-by-step flow of how Outcome Based Education (OBE) is calculated within the system. You can use this guide to explain the technical architecture and mathematical calculations to faculty, administration, or external evaluators.

> [!NOTE]
> The OBE calculation uses a bottom-up approach. It starts at the granular level of individual student answers to questions, and bubbles up through Course Learning Outcomes (CLOs) to final Program Learning Outcomes (PLOs).

---

## 1. The Foundation: Questions and Weights
The entire OBE system relies on mapping individual assessment questions to specific CLOs.

* **Assessments** (Quizzes, Assignments, Midterms, Finals) have an overall **Weight** (e.g., a Midterm might carry a weight of 0.20 or 20%).
* **Questions** within those assessments have **Maximum Marks**.
* Each question **must** be mapped to a specific **CLO**.

> [!WARNING]
> **Unmapped Questions:** If an instructor creates an assessment but forgets to map a question to a CLO, the system completely ignores that question's score in the OBE calculation and generates a warning for the admin.

---

## 2. Step 1: Student CLO Percentage (`student_clo_percent`)
The system first calculates how well an *individual student* performed on a *specific CLO*. 

Instead of just averaging raw scores, the system calculates a **weighted percentage**. It finds all questions across all assessments that are mapped to that specific CLO.

**The Formula:**
```math
Student CLO % = [ Sum(Student Score × Assessment Weight) / Sum(Max Marks × Assessment Weight) ] × 100
```
*This ensures that a question in a heavily weighted Final Exam has a larger impact on the CLO achievement than a question in a lightly weighted Quiz.*

---

## 3. Step 2: Course CLO Achievement (`avg_clo_achievement`)
Once every student has a percentage for a CLO, the system aggregates this to the course level.

* For a specific course (e.g., *Introduction to Computer Technology*), the system takes the **Average** of the `student_clo_percent` across **all enrolled students**.
* **Result:** You get a single percentage for how well the class as a whole achieved that specific CLO (e.g., *CLO-1 Achievement: 82%*).

---

## 4. Step 3: Course & Semester Aggregation
To show high-level metrics for courses and semesters:
* **Course Achievement:** The average of all CLO percentages within that course.
* **Semester Achievement:** The average of the Course Achievements within that semester.

---

## 5. Step 4: Batch PLO Achievement (`plo_achievement`)
Program Learning Outcomes (PLOs) span the entire degree. CLOs from individual courses are mapped to these high-level PLOs via the **CLO-PLO Mapping** matrix.

To calculate how well a batch of students achieved a specific PLO:
1. The system identifies all CLOs (across all courses in all semesters) that are mapped to that specific PLO.
2. It takes the **Average** of the `avg_clo_achievement` values for those mapped CLOs.

> [!TIP]
> **Ungraded PLOs:** If a PLO has been attached to a batch but no CLOs have been mapped to it yet (or no grades have been entered for mapped CLOs), the system safely marks that PLO as **"Not Yet Assessed"** rather than showing a 0%.

---

## 6. Step 5: Overall Batch Achievement
Finally, to give the administration a single, overarching health metric for the entire batch:
* The system takes the average achievement of **all Graded PLOs**.
* Ungraded PLOs ("Not Yet Assessed") are excluded from this math so they don't drag the overall batch average down prematurely.

---

## Example Flow
1. **Q1 (Quiz 1, Weight 1):** Mapped to CLO-1. Max Marks: 10. Student A scores 8.
2. **Q3 (Midterm, Weight 3):** Mapped to CLO-1. Max Marks: 20. Student A scores 15.
3. **Student A's CLO-1 %:** `((8×1) + (15×3)) / ((10×1) + (20×3))` = `53 / 70` = **75.7%**
4. **Class CLO-1 %:** Average of Student A (75.7%), Student B (80%), Student C (60%) = **71.9%**
5. **PLO-2 %:** Since CLO-1 is mapped to PLO-2, this 71.9% contributes to the final PLO-2 achievement for the batch.
