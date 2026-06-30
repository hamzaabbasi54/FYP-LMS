import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/models/course_model.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/loading_view.dart';
import '../data/courses_repository.dart';

class CoursesScreen extends ConsumerWidget {
  const CoursesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final coursesAsync = ref.watch(coursesProvider);

    return coursesAsync.when(
      loading: () => const LoadingView(message: 'Loading...'),
      error: (e, _) => ErrorView(
        message: e.toString(),
        onRetry: () => ref.invalidate(coursesProvider),
      ),
      data: (courses) {
        if (courses.isEmpty) {
          return const EmptyState(
            icon: Icons.auto_stories_outlined,
            title: 'No courses',
            subtitle: 'You are not enrolled in any courses.',
          );
        }

        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(coursesProvider),
          color: AppColors.primary,
          backgroundColor: AppColors.surface,
          child: ListView.separated(
            padding: const EdgeInsets.all(20),
            itemCount: courses.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              return _CourseTile(course: courses[index]);
            },
          ),
        );
      },
    );
  }
}

class _CourseTile extends StatelessWidget {
  const _CourseTile({required this.course});

  final Course course;

  @override
  Widget build(BuildContext context) {
    final attColor = AppColors.attendanceColor(course.attendancePercentage);

    return AppCard(
      accentColor: attColor,
      onTap: () => context.push('/courses/${course.id}'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                course.code,
                style: const TextStyle(
                  color: AppColors.secondary,
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: attColor.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  course.currentGrade,
                  style: TextStyle(
                    color: attColor,
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            course.name,
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 15,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            course.instructor,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 13,
            ),
          ),
          const SizedBox(height: 14),
          ClipRRect(
            borderRadius: BorderRadius.circular(3),
            child: LinearProgressIndicator(
              value: course.attendancePercentage / 100,
              minHeight: 5,
              backgroundColor: AppColors.divider,
              valueColor: AlwaysStoppedAnimation<Color>(attColor),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            '${course.attendancePercentage.toStringAsFixed(0)}% attendance · ${course.credits} credits',
            style: TextStyle(
              fontSize: 12,
              color: attColor,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
