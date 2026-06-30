import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_response.dart';
import '../../../core/api/endpoints.dart';
import '../../../core/config/app_config.dart';
import '../../../core/models/student_grade_model.dart';
import '../../../mock/mock_data.dart';

final gradesRepositoryProvider = Provider<GradesRepository>((ref) {
  return GradesRepository(ref.watch(apiClientProvider));
});

class GradesRepository {
  GradesRepository(this._dio);

  final Dio _dio;

  Future<List<SubjectGradeGroup>> getAllGrades() async {
    if (AppConfig.useMockData) {
      await MockData.simulateNetworkDelay();
      return groupGradesBySubject(MockData.studentGrades);
    }

    final response = await _dio.get(ApiEndpoints.grades);
    final entries = ApiResponse.list(response.data)
        .map((e) => StudentGradeEntry.fromJson(e as Map<String, dynamic>))
        .toList();
    return groupGradesBySubject(entries);
  }
}

final gradesProvider = FutureProvider<List<SubjectGradeGroup>>((ref) async {
  return ref.watch(gradesRepositoryProvider).getAllGrades();
});
