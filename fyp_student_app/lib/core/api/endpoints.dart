/// Student app API endpoints.
/// Apni backend inhi paths par same format mein data return kare.
class ApiEndpoints {
  ApiEndpoints._();

  // Auth
  static const String login = '/student-auth/login';
  static const String logout = '/student-auth/logout';
  static const String me = '/student-auth/me';
  static const String changePassword = '/student-auth/change-password';

  // Portal
  static const String profile = '/student-portal/profile';
  static const String schedule = '/student-portal/schedule';
  static const String courses = '/student-portal/courses';

  static String courseAttendance(String courseId) =>
      '/student-portal/courses/$courseId/attendance';

  static String courseGrades(String courseId) =>
      '/student-portal/courses/$courseId/grades';

  static const String grades = '/student-portal/grades';

  static const String assignments = '/student-portal/assignments';
  static String assignmentDetail(String id) => '/student-portal/assignments/$id';
  static const String teacherUpdates = '/student-portal/announcements';
}
