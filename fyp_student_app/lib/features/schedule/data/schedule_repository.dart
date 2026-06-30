import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_response.dart';
import '../../../core/api/endpoints.dart';
import '../../../core/config/app_config.dart';
import '../../../core/models/schedule_model.dart';
import '../../../mock/mock_data.dart';

final scheduleRepositoryProvider = Provider<ScheduleRepository>((ref) {
  return ScheduleRepository(ref.watch(apiClientProvider));
});

class ScheduleRepository {
  ScheduleRepository(this._dio);

  final Dio _dio;

  Future<List<ScheduleSlot>> getSchedule() async {
    if (AppConfig.useMockData) {
      await MockData.simulateNetworkDelay();
      return MockData.schedule;
    }

    final response = await _dio.get(ApiEndpoints.schedule);
    return ApiResponse.list(response.data)
        .map((e) => ScheduleSlot.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}

final scheduleProvider = FutureProvider<List<ScheduleSlot>>((ref) async {
  return ref.watch(scheduleRepositoryProvider).getSchedule();
});
