double _readDouble(dynamic value, [double fallback = 0]) {
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value) ?? fallback;
  return fallback;
}

int _readInt(dynamic value, [int fallback = 0]) {
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value) ?? fallback;
  return fallback;
}

DateTime _parseLocalDate(dynamic value) {
  final raw = value?.toString() ?? '';
  if (raw.length >= 10) {
    final parts = raw.substring(0, 10).split('-');
    if (parts.length == 3) {
      final y = int.tryParse(parts[0]);
      final m = int.tryParse(parts[1]);
      final d = int.tryParse(parts[2]);
      if (y != null && m != null && d != null) {
        return DateTime(y, m, d);
      }
    }
  }
  return DateTime.tryParse(raw) ?? DateTime.now();
}

String _formatAssessmentType(String type) {
  switch (type.toLowerCase()) {
    case 'quiz':
      return 'Quiz';
    case 'midterm':
      return 'Midterm';
    case 'final':
      return 'Final';
    case 'assignment':
      return 'Assignment';
    default:
      if (type.isEmpty) return 'Assessment';
      return type[0].toUpperCase() + type.substring(1);
  }
}

class Course {
  const Course({
    required this.id,
    required this.code,
    required this.name,
    required this.instructor,
    required this.credits,
    required this.attendancePercentage,
    required this.currentGrade,
    this.totalClasses = 0,
    this.presentClasses = 0,
  });

  final String id;
  final String code;
  final String name;
  final String instructor;
  final int credits;
  final double attendancePercentage;
  final String currentGrade;
  final int totalClasses;
  final int presentClasses;

  factory Course.fromJson(Map<String, dynamic> json) {
    final attendanceSummary = json['attendance_summary'];
    double attendancePct = 0;
    int totalClasses = 0;
    int presentClasses = 0;
    if (attendanceSummary is Map) {
      attendancePct = _readDouble(attendanceSummary['percentage']);
      totalClasses = _readInt(attendanceSummary['total_classes']);
      presentClasses = _readInt(attendanceSummary['present'] ??
          attendanceSummary['present_classes']);
    } else {
      attendancePct = _readDouble(json['attendance_percentage']);
    }

    return Course(
      id: (json['course_assignment_id'] ?? json['id'])?.toString() ?? '',
      code: json['course_code']?.toString() ?? json['code']?.toString() ?? '',
      name: json['course_title']?.toString() ??
          json['name']?.toString() ??
          json['title']?.toString() ??
          '',
      instructor: json['instructor']?.toString() ??
          json['instructor_name']?.toString() ??
          '',
      credits: _readInt(json['credit_hours'] ?? json['credits']),
      attendancePercentage: attendancePct,
      currentGrade: json['current_grade']?.toString() ?? '—',
      totalClasses: totalClasses,
      presentClasses: presentClasses,
    );
  }
}

class AttendanceRecord {
  const AttendanceRecord({
    required this.date,
    required this.status,
    required this.remarks,
  });

  final DateTime date;
  final String status;
  final String remarks;

  factory AttendanceRecord.fromJson(Map<String, dynamic> json) {
    return AttendanceRecord(
      date: _parseLocalDate(json['date']),
      status: json['status']?.toString().toLowerCase() ?? 'unknown',
      remarks: json['remarks']?.toString() ?? '',
    );
  }

  bool get isPresent => status.toLowerCase() == 'present';
  bool get isAbsent => status.toLowerCase() == 'absent';
  bool get isLate => status.toLowerCase() == 'late';
}

class GradeRecord {
  const GradeRecord({
    required this.title,
    required this.type,
    required this.score,
    required this.maxScore,
    required this.date,
  });

  final String title;
  final String type;
  final double score;
  final double maxScore;
  final DateTime date;

  factory GradeRecord.fromJson(Map<String, dynamic> json) {
    return GradeRecord(
      title: json['title']?.toString() ?? json['assessment_title']?.toString() ?? '',
      type: _formatAssessmentType(
        json['type']?.toString() ?? json['assessment_type']?.toString() ?? '',
      ),
      score: _readDouble(json['score'] ?? json['obtained_marks']),
      maxScore: _readDouble(json['max_score'] ?? json['max_marks'], 100),
      date: _parseLocalDate(json['date']),
    );
  }

  double get percentage => maxScore > 0 ? (score / maxScore) * 100 : 0;
}

class CourseDetail {
  const CourseDetail({
    required this.course,
    required this.attendance,
    required this.grades,
  });

  final Course course;
  final List<AttendanceRecord> attendance;
  final List<GradeRecord> grades;
}
