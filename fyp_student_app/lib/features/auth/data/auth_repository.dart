import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_response.dart';
import '../../../core/api/endpoints.dart';
import '../../../core/config/app_config.dart';
import '../../../core/models/user_model.dart';
import '../../../core/storage/secure_storage_service.dart';
import '../../../mock/mock_data.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.watch(apiClientProvider));
});

class AuthRepository {
  AuthRepository(this._dio);

  final Dio _dio;

  Future<AuthResponse> login({
    required String email,
    required String password,
  }) async {
    if (AppConfig.useMockData) {
      await MockData.simulateNetworkDelay();
      if (email == AppConfig.demoEmail && password == AppConfig.demoPassword) {
        await SecureStorageService.saveToken(MockData.mockToken);
        return AuthResponse(token: MockData.mockToken, user: MockData.student);
      }
      throw Exception('Invalid email or password. Use demo credentials.');
    }

    try {
      final response = await _dio.post(
        ApiEndpoints.login,
        data: {'email': email.trim().toLowerCase(), 'password': password},
      );
      final auth = AuthResponse.fromJson(
        ApiResponse.asMap(response.data),
      );
      if (auth.token.isEmpty) {
        throw Exception('Login failed: no token received.');
      }
      await SecureStorageService.saveToken(auth.token);
      return auth;
    } on DioException catch (e) {
      final data = e.response?.data;
      if (data is Map && data['message'] != null) {
        throw Exception(data['message'].toString());
      }
      if (e.type == DioExceptionType.connectionError ||
          e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.sendTimeout ||
          e.type == DioExceptionType.receiveTimeout) {
        throw Exception(
          'Server se connect nahi ho raha. Phone aur laptop same WiFi par hon aur backend chal raha ho.',
        );
      }
      final status = e.response?.statusCode;
      if (status != null) {
        throw Exception('Login failed (server $status). Email ya password check karein.');
      }
      throw Exception(
        'Login failed. API: ${AppConfig.apiBaseUrl}',
      );
    }
  }

  Future<void> logout() async {
    if (!AppConfig.useMockData) {
      try {
        await _dio.post(ApiEndpoints.logout);
      } catch (_) {}
    }
    await SecureStorageService.deleteToken();
  }

  Future<StudentProfile?> restoreSession() async {
    final token = await SecureStorageService.getToken();
    if (token == null || token.isEmpty) return null;

    if (AppConfig.useMockData) {
      return MockData.student;
    }

    try {
      final response = await _dio.get(ApiEndpoints.me);
      return StudentProfile.fromJson(ApiResponse.object(response.data));
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        await SecureStorageService.deleteToken();
        return null;
      }
      rethrow;
    }
  }

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    if (AppConfig.useMockData) {
      await MockData.simulateNetworkDelay();
      if (currentPassword != AppConfig.demoPassword) {
        throw Exception('Current password is incorrect.');
      }
      if (newPassword.length < 5) {
        throw Exception('New password must be at least 5 characters.');
      }
      if (currentPassword == newPassword) {
        throw Exception('New password must be different from current password.');
      }
      return;
    }

    try {
      final response = await _dio.put(
        ApiEndpoints.changePassword,
        data: {
          'oldPassword': currentPassword,
          'newPassword': newPassword,
        },
      );
      final body = ApiResponse.asMap(response.data);
      final newToken = ApiResponse.object(body)['token']?.toString() ??
          body['token']?.toString();
      if (newToken != null && newToken.isNotEmpty) {
        await SecureStorageService.saveToken(newToken);
      }
    } on DioException catch (e) {
      final data = e.response?.data;
      if (data is Map && data['message'] != null) {
        throw Exception(data['message'].toString());
      }
      if (e.type == DioExceptionType.connectionError ||
          e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.sendTimeout ||
          e.type == DioExceptionType.receiveTimeout) {
        throw Exception('Server se connect nahi ho raha. Internet ya WiFi check karein.');
      }
      throw Exception('Password change nahi ho saka. Dobara try karein.');
    }
  }
}
