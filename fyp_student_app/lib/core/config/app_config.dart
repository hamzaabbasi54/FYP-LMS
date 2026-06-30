/// App configuration — mobile app sirf API se data fetch karti hai.
class AppConfig {
  static const String appName = 'Campus Flow';
  static const String universityName = 'Student Portal';
  static const String appTagline = 'Learning Management System';

  /// `true` = mock data (API ki zaroorat nahi). `false` = real API se data.
  static const bool useMockData = bool.fromEnvironment(
    'USE_MOCK',
    defaultValue: false,
  );

  /// Apni API ka base URL — usually `/api` ke saath end ho.
  ///
  /// Examples:
  /// - Production: `https://your-server.com/api`
  /// - Emulator:     `http://10.0.2.2:3000/api`
  /// - Phone (WiFi): `http://<laptop-ip>:3000/api` — phone aur laptop same WiFi
  /// - Phone (USB):  `http://127.0.0.1:3000/api` + `adb reverse tcp:3000 tcp:3000`
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.141.27.78:3000/api',
  );

  static const String jwtStorageKey = 'student_jwt';
  static const int apiTimeoutSeconds = 15;

  /// Mock mode demo login
  static const String demoEmail = 'student@university.edu';
  static const String demoPassword = 'password123';
}
