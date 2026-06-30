class ScheduleSlot {
  const ScheduleSlot({
    required this.id,
    required this.courseId,
    required this.courseCode,
    required this.courseName,
    required this.instructor,
    required this.room,
    required this.dayOfWeek,
    required this.startTime,
    required this.endTime,
  });

  final String id;
  final String courseId;
  final String courseCode;
  final String courseName;
  final String instructor;
  final String room;
  final int dayOfWeek;
  final String startTime;
  final String endTime;

  factory ScheduleSlot.fromJson(Map<String, dynamic> json) {
    return ScheduleSlot(
      id: json['id']?.toString() ?? '',
      courseId: json['course_id']?.toString() ?? json['id']?.toString() ?? '',
      courseCode: json['course_code']?.toString() ?? '',
      courseName: json['course_name']?.toString() ?? json['course_title']?.toString() ?? '',
      instructor: json['instructor']?.toString() ??
          json['instructor_name']?.toString() ??
          json['faculty_name']?.toString() ??
          '',
      room: json['room']?.toString() ?? json['shift']?.toString() ?? 'TBA',
      dayOfWeek: _parseDayOfWeek(json['day_of_week']),
      startTime: _formatTime(json['start_time']),
      endTime: _formatTime(json['end_time']),
    );
  }

  static int _parseDayOfWeek(dynamic value) {
    if (value is num) return value.clamp(1, 7).toInt();
    const map = {
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6,
      'sunday': 7,
    };
    return map[value?.toString().toLowerCase()] ?? 1;
  }

  static String _formatTime(dynamic value) {
    final raw = value?.toString() ?? '';
    if (raw.length >= 5) return raw.substring(0, 5);
    return raw;
  }

  static const List<String> dayNames = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  String get dayName =>
      dayOfWeek >= 1 && dayOfWeek <= 7 ? dayNames[dayOfWeek - 1] : 'Unknown';
}
