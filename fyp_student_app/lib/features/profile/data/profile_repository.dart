import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_response.dart';
import '../../../core/api/endpoints.dart';
import '../../../core/config/app_config.dart';
import '../../../core/models/user_model.dart';
import '../../../mock/mock_data.dart';

final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  return ProfileRepository(ref.watch(apiClientProvider));
});

class ProfileRepository {
  ProfileRepository(this._dio);

  final Dio _dio;

  Future<StudentProfile> getProfile() async {
    if (AppConfig.useMockData) {
      await MockData.simulateNetworkDelay();
      return MockData.student;
    }

    final response = await _dio.get(ApiEndpoints.profile);
    return StudentProfile.fromJson(ApiResponse.object(response.data));
  }
}

final profileProvider = FutureProvider<StudentProfile>((ref) async {
  return ref.watch(profileRepositoryProvider).getProfile();
});
