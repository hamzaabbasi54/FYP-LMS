import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/app_config.dart';
import '../storage/secure_storage_service.dart';
import '../storage/session_manager.dart';

final apiClientProvider = Provider<Dio>((ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: const Duration(seconds: AppConfig.apiTimeoutSeconds),
      receiveTimeout: const Duration(seconds: AppConfig.apiTimeoutSeconds),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ),
  );

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        options.extra['_sessionEpoch'] = SessionManager.epoch;
        final token = await SecureStorageService.getToken();
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode != 401) {
          handler.next(error);
          return;
        }

        final path = error.requestOptions.path;
        if (path.contains('/student-auth/login') ||
            path.contains('/student-auth/change-password')) {
          handler.next(error);
          return;
        }

        final requestEpoch = error.requestOptions.extra['_sessionEpoch'];
        if (requestEpoch is int && requestEpoch != SessionManager.epoch) {
          handler.next(error);
          return;
        }

        final currentToken = await SecureStorageService.getToken();
        if (currentToken == null || currentToken.isEmpty) {
          handler.next(error);
          return;
        }

        // Retry once with a fresh token (fixes race right after login on Android).
        final alreadyRetried = error.requestOptions.extra['_authRetried'] == true;
        if (!alreadyRetried) {
          final token = await SecureStorageService.getToken();
          if (token != null && token.isNotEmpty) {
            error.requestOptions.extra['_authRetried'] = true;
            error.requestOptions.extra['_sessionEpoch'] = SessionManager.epoch;
            error.requestOptions.headers['Authorization'] = 'Bearer $token';
            try {
              final response = await dio.fetch(error.requestOptions);
              handler.resolve(response);
              return;
            } catch (_) {}
          }
        }

        await SecureStorageService.deleteToken();
        await SessionManager.handleUnauthorized();
        handler.next(error);
      },
    ),
  );

  return dio;
});
