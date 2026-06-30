import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/models/student_grade_model.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/loading_view.dart';
import '../data/grades_repository.dart';

class GradesScreen extends ConsumerWidget {
  const GradesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final gradesAsync = ref.watch(gradesProvider);

    return gradesAsync.when(
      loading: () => const LoadingView(message: 'Loading grades...'),
      error: (e, _) => ErrorView(
        message: e.toString().replaceFirst('Exception: ', ''),
        onRetry: () => ref.invalidate(gradesProvider),
      ),
      data: (subjects) {
        if (subjects.isEmpty) {
          return const EmptyState(
            icon: Icons.grade_outlined,
            title: 'No grades yet',
            subtitle:
                'Teacher jab quiz, assignment ya midterm ke marks enter karega yahan dikhenge.',
          );
        }

        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(gradesProvider),
          color: AppColors.primary,
          backgroundColor: AppColors.surface,
          child: ListView.separated(
            padding: const EdgeInsets.all(20),
            itemCount: subjects.length,
            separatorBuilder: (_, __) => const SizedBox(height: 16),
            itemBuilder: (context, index) {
              return _SubjectGradesCard(group: subjects[index]);
            },
          ),
        );
      },
    );
  }
}

class _SubjectGradesCard extends StatelessWidget {
  const _SubjectGradesCard({required this.group});

  final SubjectGradeGroup group;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      accentColor: AppColors.primary,
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      group.courseCode,
                      style: const TextStyle(
                        color: AppColors.secondary,
                        fontWeight: FontWeight.w700,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      group.courseTitle,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 15,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Avg ${group.averagePercentage.toStringAsFixed(0)}%',
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w700,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...group.grades.map(
            (grade) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: _GradeRow(grade: grade),
            ),
          ),
        ],
      ),
    );
  }
}

class _GradeRow extends StatelessWidget {
  const _GradeRow({required this.grade});

  final StudentGradeEntry grade;

  @override
  Widget build(BuildContext context) {
    final pct = grade.percentage;
    final color = pct >= 80
        ? AppColors.success
        : pct >= 60
            ? AppColors.warning
            : AppColors.error;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surfaceMuted,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.divider),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.accentSoft,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        grade.type,
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: AppColors.accent,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      DateFormat('MMM d, yyyy').format(grade.date),
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textTertiary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  grade.title,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                    color: AppColors.textPrimary,
                  ),
                ),
                if (grade.feedback != null && grade.feedback!.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    grade.feedback!,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${grade.score.toStringAsFixed(grade.score % 1 == 0 ? 0 : 1)}/${grade.maxScore.toStringAsFixed(0)}',
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 15,
                  color: color,
                ),
              ),
              Text(
                '${pct.toStringAsFixed(0)}%',
                style: TextStyle(fontSize: 11, color: color),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
