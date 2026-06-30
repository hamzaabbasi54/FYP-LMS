import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_response.dart';
import '../../../core/api/endpoints.dart';
import '../../../core/config/app_config.dart';
import '../../../core/models/assignment_model.dart';
import '../../../mock/mock_data.dart';

final assignmentsRepositoryProvider = Provider<AssignmentsRepository>((ref) {
  return AssignmentsRepository(ref.watch(apiClientProvider));
});

class AssignmentsRepository {
  AssignmentsRepository(this._dio);

  final Dio _dio;

  Future<List<Assignment>> getAssignments() async {
    if (AppConfig.useMockData) {
      await MockData.simulateNetworkDelay();
      return MockData.assignments;
    }

    final response = await _dio.get(ApiEndpoints.assignments);
    return ApiResponse.list(response.data)
        .map((e) => Assignment.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Assignment> getAssignment(String id) async {
    if (AppConfig.useMockData) {
      await MockData.simulateNetworkDelay();
      return MockData.assignments.firstWhere(
        (a) => a.id == id,
        orElse: () => throw Exception('Assignment not found'),
      );
    }

    final response = await _dio.get(ApiEndpoints.assignmentDetail(id));
    return Assignment.fromJson(ApiResponse.object(response.data));
  }
}

final assignmentsProvider = FutureProvider<List<Assignment>>((ref) async {
  return ref.watch(assignmentsRepositoryProvider).getAssignments();
});

final assignmentDetailProvider =
    FutureProvider.family<Assignment, String>((ref, id) async {
  return ref.watch(assignmentsRepositoryProvider).getAssignment(id);
});
