import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/models/assignment_model.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../../shared/widgets/status_chip.dart';
import '../data/assignments_repository.dart';

class AssignmentsScreen extends ConsumerWidget {
  const AssignmentsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final assignmentsAsync = ref.watch(assignmentsProvider);

    return assignmentsAsync.when(
      loading: () => const LoadingView(message: 'Loading assignments...'),
      error: (e, _) => ErrorView(
        message: e.toString(),
        onRetry: () => ref.invalidate(assignmentsProvider),
      ),
      data: (assignments) {
        if (assignments.isEmpty) {
          return const EmptyState(
            icon: Icons.assignment_outlined,
            title: 'No assignments',
            subtitle: 'Your teachers have not posted any assignments yet.',
          );
        }

        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(assignmentsProvider),
          color: AppColors.primary,
          backgroundColor: AppColors.surface,
          child: ListView.separated(
            padding: const EdgeInsets.all(20),
            itemCount: assignments.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              return _AssignmentTile(assignment: assignments[index]);
            },
          ),
        );
      },
    );
  }
}

class _AssignmentTile extends StatelessWidget {
  const _AssignmentTile({required this.assignment});

  final Assignment assignment;

  @override
  Widget build(BuildContext context) {
    final status = _statusInfo(assignment.status);

    return AppCard(
      accentColor: status.color,
      onTap: () => context.push('/assignments/${assignment.id}'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                assignment.courseCode,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: AppColors.secondary,
                ),
              ),
              const Spacer(),
              StatusChip(label: status.label, color: status.color),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            assignment.title,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            assignment.instructor,
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(
                Icons.schedule,
                size: 14,
                color: AppColors.textSecondary.withOpacity(0.8),
              ),
              const SizedBox(width: 4),
              Text(
                'Due ${DateFormat('MMM d, yyyy').format(assignment.dueDate)}',
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                ),
              ),
              const Spacer(),
              if (assignment.isGraded && assignment.obtainedMarks != null)
                Text(
                  '${assignment.obtainedMarks!.toStringAsFixed(0)}/${assignment.maxMarks.toStringAsFixed(0)} marks',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppColors.success,
                  ),
                )
              else
                Text(
                  'Max ${assignment.maxMarks.toStringAsFixed(0)} marks',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  ({String label, Color color}) _statusInfo(AssignmentStatus status) {
    return switch (status) {
      AssignmentStatus.pending => (label: 'Pending', color: AppColors.info),
      AssignmentStatus.submitted => (
          label: 'Submitted',
          color: AppColors.secondary
        ),
      AssignmentStatus.graded => (label: 'Graded', color: AppColors.success),
      AssignmentStatus.overdue => (label: 'Overdue', color: AppColors.error),
    };
  }
}
