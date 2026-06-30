import '../core/models/student_grade_model.dart';
import '../core/models/assignment_model.dart';
import '../core/models/course_model.dart';
import '../core/models/schedule_model.dart';
import '../core/models/user_model.dart';

/// Mock data for frontend development before backend is connected.
class MockData {
  MockData._();

  static const mockToken = 'mock_jwt_token_for_demo';

  static const student = StudentProfile(
    id: '1',
    name: 'Ahsan Ali',
    email: 'student@university.edu',
    registrationNumber: 'FYP-2022-001',
    department: 'Computer Science',
    semester: '6th Semester',
    program: 'BS Computer Science',
  );

  static const courses = <Course>[
    Course(
      id: '1',
      code: 'CS-301',
      name: 'Data Structures & Algorithms',
      instructor: 'Dr. Sarah Khan',
      credits: 3,
      attendancePercentage: 88.5,
      currentGrade: 'A',
    ),
    Course(
      id: '2',
      code: 'CS-302',
      name: 'Database Systems',
      instructor: 'Prof. Ahmed Raza',
      credits: 3,
      attendancePercentage: 92.0,
      currentGrade: 'A-',
    ),
    Course(
      id: '3',
      code: 'CS-303',
      name: 'Software Engineering',
      instructor: 'Dr. Fatima Noor',
      credits: 3,
      attendancePercentage: 75.0,
      currentGrade: 'B+',
    ),
    Course(
      id: '4',
      code: 'CS-304',
      name: 'Computer Networks',
      instructor: 'Dr. Usman Malik',
      credits: 3,
      attendancePercentage: 95.5,
      currentGrade: 'A',
    ),
    Course(
      id: '5',
      code: 'CS-305',
      name: 'Artificial Intelligence',
      instructor: 'Dr. Hina Shah',
      credits: 3,
      attendancePercentage: 82.0,
      currentGrade: 'B+',
    ),
  ];

  static const schedule = <ScheduleSlot>[
    ScheduleSlot(
      id: '1',
      courseId: '1',
      courseCode: 'CS-301',
      courseName: 'Data Structures & Algorithms',
      instructor: 'Dr. Sarah Khan',
      room: 'Lab 201',
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '10:30',
    ),
    ScheduleSlot(
      id: '2',
      courseId: '2',
      courseCode: 'CS-302',
      courseName: 'Database Systems',
      instructor: 'Prof. Ahmed Raza',
      room: 'Room 105',
      dayOfWeek: 1,
      startTime: '11:00',
      endTime: '12:30',
    ),
    ScheduleSlot(
      id: '3',
      courseId: '3',
      courseCode: 'CS-303',
      courseName: 'Software Engineering',
      instructor: 'Dr. Fatima Noor',
      room: 'Room 302',
      dayOfWeek: 2,
      startTime: '09:00',
      endTime: '10:30',
    ),
    ScheduleSlot(
      id: '4',
      courseId: '4',
      courseCode: 'CS-304',
      courseName: 'Computer Networks',
      instructor: 'Dr. Usman Malik',
      room: 'Lab 103',
      dayOfWeek: 3,
      startTime: '14:00',
      endTime: '15:30',
    ),
    ScheduleSlot(
      id: '5',
      courseId: '5',
      courseCode: 'CS-305',
      courseName: 'Artificial Intelligence',
      instructor: 'Dr. Hina Shah',
      room: 'Room 401',
      dayOfWeek: 4,
      startTime: '10:00',
      endTime: '11:30',
    ),
    ScheduleSlot(
      id: '6',
      courseId: '1',
      courseCode: 'CS-301',
      courseName: 'Data Structures & Algorithms',
      instructor: 'Dr. Sarah Khan',
      room: 'Lab 201',
      dayOfWeek: 5,
      startTime: '09:00',
      endTime: '10:30',
    ),
  ];

  static Map<String, CourseDetail> get courseDetails => {
        '1': CourseDetail(
          course: courses[0],
          attendance: _attendanceFor('CS-301'),
          grades: _gradesFor('CS-301'),
        ),
        '2': CourseDetail(
          course: courses[1],
          attendance: _attendanceFor('CS-302'),
          grades: _gradesFor('CS-302'),
        ),
        '3': CourseDetail(
          course: courses[2],
          attendance: _attendanceFor('CS-303'),
          grades: _gradesFor('CS-303'),
        ),
        '4': CourseDetail(
          course: courses[3],
          attendance: _attendanceFor('CS-304'),
          grades: _gradesFor('CS-304'),
        ),
        '5': CourseDetail(
          course: courses[4],
          attendance: _attendanceFor('CS-305'),
          grades: _gradesFor('CS-305'),
        ),
      };

  static List<AttendanceRecord> _attendanceFor(String code) => [
        AttendanceRecord(
          date: DateTime(2026, 6, 2),
          status: 'present',
          remarks: '$code — Lecture attended',
        ),
        AttendanceRecord(
          date: DateTime(2026, 6, 4),
          status: 'present',
          remarks: '$code — Lab session',
        ),
        AttendanceRecord(
          date: DateTime(2026, 6, 9),
          status: 'late',
          remarks: '$code — Arrived 10 min late',
        ),
        AttendanceRecord(
          date: DateTime(2026, 6, 11),
          status: 'absent',
          remarks: '$code — Unexcused absence',
        ),
        AttendanceRecord(
          date: DateTime(2026, 6, 16),
          status: 'present',
          remarks: '$code — Lecture attended',
        ),
      ];

  static List<GradeRecord> _gradesFor(String code) => [
        GradeRecord(
          title: 'Midterm Exam',
          type: 'Exam',
          score: 42,
          maxScore: 50,
          date: DateTime(2026, 4, 15),
        ),
        GradeRecord(
          title: 'Assignment 1',
          type: 'Assignment',
          score: 18,
          maxScore: 20,
          date: DateTime(2026, 3, 20),
        ),
        GradeRecord(
          title: 'Quiz 1',
          type: 'Quiz',
          score: 8,
          maxScore: 10,
          date: DateTime(2026, 5, 5),
        ),
        GradeRecord(
          title: 'Project',
          type: 'Project',
          score: 35,
          maxScore: 40,
          date: DateTime(2026, 6, 1),
        ),
      ];

  static Future<void> simulateNetworkDelay([
    Duration delay = const Duration(milliseconds: 800),
  ]) async {
    await Future<void>.delayed(delay);
  }

  static final assignments = <Assignment>[
    Assignment(
      id: '1',
      courseId: '1',
      courseCode: 'CS-301',
      courseName: 'Data Structures & Algorithms',
      title: 'Binary Search Tree Implementation',
      description:
          'Implement BST with insert, delete, and search operations. Submit a PDF report and source code zip.',
      instructor: 'Dr. Sarah Khan',
      dueDate: DateTime(2026, 6, 28),
      maxMarks: 20,
      status: AssignmentStatus.pending,
    ),
    Assignment(
      id: '2',
      courseId: '2',
      courseCode: 'CS-302',
      courseName: 'Database Systems',
      title: 'ER Diagram & Normalization',
      description:
          'Design ER diagram for a library system and normalize up to 3NF. Upload PDF only.',
      instructor: 'Prof. Ahmed Raza',
      dueDate: DateTime(2026, 6, 25),
      maxMarks: 15,
      status: AssignmentStatus.submitted,
      submittedFileName: 'library_er_diagram.pdf',
      submittedAt: DateTime(2026, 6, 20),
    ),
    Assignment(
      id: '3',
      courseId: '3',
      courseCode: 'CS-303',
      courseName: 'Software Engineering',
      title: 'SRS Document — Phase 1',
      description:
          'Submit Software Requirements Specification for your FYP project.',
      instructor: 'Dr. Fatima Noor',
      dueDate: DateTime(2026, 6, 10),
      maxMarks: 25,
      status: AssignmentStatus.graded,
      obtainedMarks: 22,
      submittedFileName: 'srs_phase1.pdf',
      submittedAt: DateTime(2026, 6, 8),
      feedback: 'Well structured. Improve non-functional requirements section.',
    ),
    Assignment(
      id: '4',
      courseId: '4',
      courseCode: 'CS-304',
      courseName: 'Computer Networks',
      title: 'Subnetting Lab Report',
      description: 'Complete lab exercises 1-5 and upload scanned report.',
      instructor: 'Dr. Usman Malik',
      dueDate: DateTime(2026, 6, 15),
      maxMarks: 10,
      status: AssignmentStatus.overdue,
    ),
    Assignment(
      id: '5',
      courseId: '5',
      courseCode: 'CS-305',
      courseName: 'Artificial Intelligence',
      title: 'Search Algorithms Comparison',
      description:
          'Compare BFS, DFS, A* on a sample graph. Code + analysis report required.',
      instructor: 'Dr. Hina Shah',
      dueDate: DateTime(2026, 7, 5),
      maxMarks: 20,
      status: AssignmentStatus.graded,
      obtainedMarks: 18,
      submittedFileName: 'search_algos.zip',
      submittedAt: DateTime(2026, 6, 18),
      feedback: 'Excellent analysis. Minor formatting issues in report.',
    ),
  ];

  static final teacherUpdates = <TeacherUpdate>[
    TeacherUpdate(
      id: '1',
      title: 'Midterm Exam Schedule',
      message:
          'Midterm exams for CS-301 and CS-302 will be held next week. Check the portal for exact dates and rooms.',
      teacherName: 'Dr. Sarah Khan',
      courseCode: 'CS-301',
      postedAt: DateTime(2026, 6, 18, 9, 30),
    ),
    TeacherUpdate(
      id: '2',
      title: 'Assignment Deadline Extended',
      message:
          'The ER Diagram assignment deadline is extended to June 27 due to server maintenance.',
      teacherName: 'Prof. Ahmed Raza',
      courseCode: 'CS-302',
      postedAt: DateTime(2026, 6, 19, 14, 0),
    ),
    TeacherUpdate(
      id: '3',
      title: 'Lab Session Cancelled',
      message:
          'Friday lab session for Computer Networks is cancelled. Practical will be rescheduled.',
      teacherName: 'Dr. Usman Malik',
      courseCode: 'CS-304',
      postedAt: DateTime(2026, 6, 20, 11, 15),
    ),
    TeacherUpdate(
      id: '4',
      title: 'FYP Proposal Submission',
      message:
          'All groups must submit final FYP proposal by end of this month via the student portal.',
      teacherName: 'Dr. Fatima Noor',
      courseCode: 'CS-303',
      postedAt: DateTime(2026, 6, 17, 10, 0),
    ),
  ];

  static final studentGrades = <StudentGradeEntry>[
    StudentGradeEntry(
      courseAssignmentId: '1',
      courseCode: 'CS-301',
      courseTitle: 'Data Structures & Algorithms',
      assessmentId: '1',
      title: 'Midterm Exam',
      type: 'Midterm',
      score: 42,
      maxScore: 50,
      date: DateTime(2026, 5, 15),
      feedback: 'Good work',
    ),
    StudentGradeEntry(
      courseAssignmentId: '1',
      courseCode: 'CS-301',
      courseTitle: 'Data Structures & Algorithms',
      assessmentId: '2',
      title: 'Quiz 1',
      type: 'Quiz',
      score: 18,
      maxScore: 20,
      date: DateTime(2026, 4, 10),
    ),
  ];
}
