import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_response.dart';
import '../../../core/api/endpoints.dart';
import '../../../core/config/app_config.dart';
import '../../../core/models/assignment_model.dart';
import '../../../mock/mock_data.dart';

final updatesRepositoryProvider = Provider<UpdatesRepository>((ref) {
  return UpdatesRepository(ref.watch(apiClientProvider));
});

class UpdatesRepository {
  UpdatesRepository(this._dio);

  final Dio _dio;

  Future<List<TeacherUpdate>> getUpdates() async {
    if (AppConfig.useMockData) {
      await MockData.simulateNetworkDelay();
      return MockData.teacherUpdates;
    }

    final response = await _dio.get(ApiEndpoints.teacherUpdates);
    return ApiResponse.list(response.data)
        .map((e) => TeacherUpdate.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}

final teacherUpdatesProvider = FutureProvider<List<TeacherUpdate>>((ref) async {
  return ref.watch(updatesRepositoryProvider).getUpdates();
});
