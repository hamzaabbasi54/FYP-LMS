/// Helpers for FYP-LMS backend envelope: `{ success, message, data }`.
class ApiResponse {
  ApiResponse._();

  static Map<String, dynamic> asMap(dynamic raw) {
    if (raw is Map<String, dynamic>) return raw;
    if (raw is Map) return Map<String, dynamic>.from(raw);
    return {};
  }

  static dynamic data(dynamic raw) {
    final map = asMap(raw);
    return map['data'] ?? map;
  }

  static List<dynamic> list(dynamic raw) {
    final value = data(raw);
    if (value is List) return value;
    return [];
  }

  static Map<String, dynamic> object(dynamic raw) {
    final value = data(raw);
    if (value is Map<String, dynamic>) return value;
    if (value is Map) return Map<String, dynamic>.from(value);
    return asMap(raw);
  }

  static String? message(dynamic raw) => asMap(raw)['message']?.toString();
}
