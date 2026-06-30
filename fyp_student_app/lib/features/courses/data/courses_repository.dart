import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_response.dart';
import '../../../core/api/endpoints.dart';
import '../../../core/config/app_config.dart';
import '../../../core/models/course_model.dart';
import '../../../mock/mock_data.dart';

final coursesRepositoryProvider = Provider<CoursesRepository>((ref) {
  return CoursesRepository(ref.watch(apiClientProvider));
});

class CoursesRepository {
  CoursesRepository(this._dio);

  final Dio _dio;

  Future<List<Course>> getCourses() async {
    if (AppConfig.useMockData) {
      await MockData.simulateNetworkDelay();
      return MockData.courses;
    }

    final response = await _dio.get(ApiEndpoints.courses);
    return ApiResponse.list(response.data)
        .map((e) => Course.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<CourseDetail> getCourseDetail(String courseAssignmentId) async {
    if (AppConfig.useMockData) {
      await MockData.simulateNetworkDelay();
      final detail = MockData.courseDetails[courseAssignmentId];
      if (detail == null) throw Exception('Course not found');
      return detail;
    }

    try {
      final courses = await getCourses();
      final course = courses.firstWhere(
        (c) => c.id == courseAssignmentId,
        orElse: () => throw Exception('Course not found'),
      );

      final results = await Future.wait([
        _dio.get(ApiEndpoints.courseAttendance(courseAssignmentId)),
        _dio.get(ApiEndpoints.courseGrades(courseAssignmentId)),
      ]);

      return CourseDetail(
        course: course,
        attendance: ApiResponse.list(results[0].data)
            .map((e) => AttendanceRecord.fromJson(e as Map<String, dynamic>))
            .toList(),
        grades: ApiResponse.list(results[1].data)
            .map((e) => GradeRecord.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
    } on DioException catch (e) {
      final data = e.response?.data;
      if (data is Map && data['message'] != null) {
        throw Exception(data['message'].toString());
      }
      rethrow;
    }
  }
}

final coursesProvider = FutureProvider<List<Course>>((ref) async {
  return ref.watch(coursesRepositoryProvider).getCourses();
});

final courseDetailProvider =
    FutureProvider.family<CourseDetail, String>((ref, id) async {
  return ref.watch(coursesRepositoryProvider).getCourseDetail(id);
});
