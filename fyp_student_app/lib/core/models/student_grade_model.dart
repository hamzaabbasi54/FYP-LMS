import 'course_model.dart';

class StudentGradeEntry {
  const StudentGradeEntry({
    required this.courseAssignmentId,
    required this.courseCode,
    required this.courseTitle,
    required this.assessmentId,
    required this.title,
    required this.type,
    required this.score,
    required this.maxScore,
    required this.date,
    this.feedback,
  });

  final String courseAssignmentId;
  final String courseCode;
  final String courseTitle;
  final String assessmentId;
  final String title;
  final String type;
  final double score;
  final double maxScore;
  final DateTime date;
  final String? feedback;

  double get percentage => maxScore > 0 ? (score / maxScore) * 100 : 0;

  factory StudentGradeEntry.fromJson(Map<String, dynamic> json) {
    final grade = GradeRecord.fromJson(json);
    return StudentGradeEntry(
      courseAssignmentId:
          (json['course_assignment_id'] ?? json['id'])?.toString() ?? '',
      courseCode: json['course_code']?.toString() ?? '',
      courseTitle: json['course_title']?.toString() ?? '',
      assessmentId: (json['assessment_id'] ?? json['id'])?.toString() ?? '',
      title: grade.title,
      type: grade.type,
      score: grade.score,
      maxScore: grade.maxScore,
      date: grade.date,
      feedback: json['feedback']?.toString(),
    );
  }
}

class SubjectGradeGroup {
  const SubjectGradeGroup({
    required this.courseCode,
    required this.courseTitle,
    required this.courseAssignmentId,
    required this.grades,
  });

  final String courseCode;
  final String courseTitle;
  final String courseAssignmentId;
  final List<StudentGradeEntry> grades;

  double get averagePercentage {
    if (grades.isEmpty) return 0;
    return grades.map((g) => g.percentage).reduce((a, b) => a + b) /
        grades.length;
  }
}

List<SubjectGradeGroup> groupGradesBySubject(List<StudentGradeEntry> entries) {
  final map = <String, List<StudentGradeEntry>>{};
  for (final entry in entries) {
    map.putIfAbsent(entry.courseAssignmentId, () => []).add(entry);
  }

  return map.entries.map((e) {
    final first = e.value.first;
    return SubjectGradeGroup(
      courseCode: first.courseCode,
      courseTitle: first.courseTitle,
      courseAssignmentId: first.courseAssignmentId,
      grades: e.value,
    );
  }).toList()
    ..sort((a, b) => a.courseCode.compareTo(b.courseCode));
}
