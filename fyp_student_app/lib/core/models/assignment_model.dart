enum AssignmentStatus { pending, submitted, graded, overdue }

class Assignment {
  const Assignment({
    required this.id,
    required this.courseId,
    required this.courseCode,
    required this.courseName,
    required this.title,
    required this.description,
    required this.instructor,
    required this.dueDate,
    required this.maxMarks,
    required this.status,
    this.obtainedMarks,
    this.submittedFileName,
    this.submittedAt,
    this.feedback,
  });

  final String id;
  final String courseId;
  final String courseCode;
  final String courseName;
  final String title;
  final String description;
  final String instructor;
  final DateTime dueDate;
  final double maxMarks;
  final AssignmentStatus status;
  final double? obtainedMarks;
  final String? submittedFileName;
  final DateTime? submittedAt;
  final String? feedback;

  bool get isGraded => status == AssignmentStatus.graded;

  factory Assignment.fromJson(Map<String, dynamic> json) {
    return Assignment(
      id: json['id']?.toString() ?? '',
      courseId: json['course_id']?.toString() ?? '',
      courseCode: json['course_code']?.toString() ?? '',
      courseName: json['course_name']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      instructor: json['instructor']?.toString() ?? '',
      dueDate: DateTime.tryParse(json['due_date']?.toString() ?? '') ??
          DateTime.now(),
      maxMarks: (json['max_marks'] as num?)?.toDouble() ??
          (json['max_score'] as num?)?.toDouble() ??
          100,
      status: _parseStatus(json['status']?.toString()),
      obtainedMarks: (json['obtained_marks'] as num?)?.toDouble() ??
          (json['score'] as num?)?.toDouble(),
      submittedFileName: json['submitted_file_name']?.toString(),
      submittedAt: json['submitted_at'] != null
          ? DateTime.tryParse(json['submitted_at'].toString())
          : null,
      feedback: json['feedback']?.toString() ?? json['remarks']?.toString(),
    );
  }

  static AssignmentStatus _parseStatus(String? value) {
    switch (value?.toLowerCase()) {
      case 'submitted':
        return AssignmentStatus.submitted;
      case 'graded':
        return AssignmentStatus.graded;
      case 'overdue':
        return AssignmentStatus.overdue;
      default:
        return AssignmentStatus.pending;
    }
  }

  Assignment copyWith({
    AssignmentStatus? status,
    double? obtainedMarks,
    String? submittedFileName,
    DateTime? submittedAt,
    String? feedback,
  }) {
    return Assignment(
      id: id,
      courseId: courseId,
      courseCode: courseCode,
      courseName: courseName,
      title: title,
      description: description,
      instructor: instructor,
      dueDate: dueDate,
      maxMarks: maxMarks,
      status: status ?? this.status,
      obtainedMarks: obtainedMarks ?? this.obtainedMarks,
      submittedFileName: submittedFileName ?? this.submittedFileName,
      submittedAt: submittedAt ?? this.submittedAt,
      feedback: feedback ?? this.feedback,
    );
  }
}

class TeacherUpdate {
  const TeacherUpdate({
    required this.id,
    required this.title,
    required this.message,
    required this.teacherName,
    required this.courseCode,
    required this.postedAt,
    this.isImportant = true,
  });

  final String id;
  final String title;
  final String message;
  final String teacherName;
  final String courseCode;
  final DateTime postedAt;
  final bool isImportant;

  factory TeacherUpdate.fromJson(Map<String, dynamic> json) {
    return TeacherUpdate(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      message: json['message']?.toString() ?? '',
      teacherName: json['teacher_name']?.toString() ?? '',
      courseCode: json['course_code']?.toString() ?? '',
      postedAt: DateTime.tryParse(json['posted_at']?.toString() ?? '') ??
          DateTime.now(),
      isImportant: json['is_important'] as bool? ?? true,
    );
  }
}
