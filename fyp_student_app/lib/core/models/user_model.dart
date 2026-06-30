class StudentProfile {
  const StudentProfile({
    required this.id,
    required this.name,
    required this.email,
    required this.registrationNumber,
    required this.department,
    required this.semester,
    required this.program,
    this.avatarUrl,
    this.cgpa,
  });

  final String id;
  final String name;
  final String email;
  final String registrationNumber;
  final String department;
  final String semester;
  final String program;
  final String? avatarUrl;
  final double? cgpa;

  factory StudentProfile.fromJson(Map<String, dynamic> json) {
    final firstName = json['first_name']?.toString() ?? '';
    final lastName = json['last_name']?.toString() ?? '';
    final composedName = '$firstName $lastName'.trim();

    return StudentProfile(
      id: (json['student_id'] ?? json['id'])?.toString() ?? '',
      name: json['name']?.toString() ??
          json['full_name']?.toString() ??
          (composedName.isNotEmpty ? composedName : ''),
      email: json['email']?.toString() ?? '',
      registrationNumber: json['registration_number']?.toString() ??
          json['student_id_number']?.toString() ??
          json['roll_number']?.toString() ??
          '',
      department: json['department']?.toString() ??
          json['department_name']?.toString() ??
          '',
      semester: json['semester']?.toString() ??
          json['semester_name']?.toString() ??
          json['batch_name']?.toString() ??
          '',
      program: json['program']?.toString() ??
          json['program_name']?.toString() ??
          json['batch_name']?.toString() ??
          '',
      avatarUrl: json['avatar_url']?.toString(),
      cgpa: json['cgpa'] != null
          ? (json['cgpa'] is num
              ? (json['cgpa'] as num).toDouble()
              : double.tryParse(json['cgpa'].toString()))
          : null,
    );
  }
}

class AuthResponse {
  const AuthResponse({
    required this.token,
    required this.user,
  });

  final String token;
  final StudentProfile user;

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    final data = json['data'] as Map<String, dynamic>? ?? json;
    final userJson = data['user'] as Map<String, dynamic>? ?? data;
    return AuthResponse(
      token: data['token']?.toString() ?? '',
      user: StudentProfile.fromJson(userJson),
    );
  }
}
