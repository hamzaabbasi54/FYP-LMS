import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../config/app_config.dart';
import 'session_manager.dart';

class SecureStorageService {
  SecureStorageService._();

  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  /// In-memory copy so the token is available immediately after login
  /// (secure storage write can lag slightly on some Android devices).
  static String? _memoryToken;

  static Future<void> saveToken(String token) async {
    SessionManager.bumpEpoch();
    _memoryToken = token;
    await _storage.write(key: AppConfig.jwtStorageKey, value: token);
  }

  static Future<String?> getToken() async {
    if (_memoryToken != null && _memoryToken!.isNotEmpty) {
      return _memoryToken;
    }
    final stored = await _storage.read(key: AppConfig.jwtStorageKey);
    // Re-check memory: login may have completed while storage read was in flight.
    if (_memoryToken != null && _memoryToken!.isNotEmpty) {
      return _memoryToken;
    }
    _memoryToken = stored;
    return _memoryToken;
  }

  static Future<void> deleteToken() async {
    SessionManager.bumpEpoch();
    _memoryToken = null;
    await _storage.delete(key: AppConfig.jwtStorageKey);
  }
}
