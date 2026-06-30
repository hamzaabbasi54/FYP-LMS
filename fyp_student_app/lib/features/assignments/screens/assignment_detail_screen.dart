import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/models/assignment_model.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../../shared/widgets/status_chip.dart';
import '../data/assignments_repository.dart';

class AssignmentDetailScreen extends ConsumerWidget {
  const AssignmentDetailScreen({super.key, required this.assignmentId});

  final String assignmentId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detailAsync = ref.watch(assignmentDetailProvider(assignmentId));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Assignment'),
      ),
      body: detailAsync.when(
        loading: () => const LoadingView(message: 'Loading...'),
        error: (e, _) => ErrorView(
          message: e.toString(),
          onRetry: () => ref.invalidate(assignmentDetailProvider(assignmentId)),
        ),
        data: (assignment) => SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              AppCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          assignment.courseCode,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppColors.secondary,
                          ),
                        ),
                        const Spacer(),
                        StatusChip(
                          label: _statusLabel(assignment.status),
                          color: _statusColor(assignment.status),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      assignment.title,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      assignment.courseName,
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 16),
                    _DetailRow(
                      icon: Icons.person_outline,
                      label: 'Teacher',
                      value: assignment.instructor,
                    ),
                    _DetailRow(
                      icon: Icons.event,
                      label: 'Due date',
                      value: DateFormat('EEEE, MMM d, yyyy')
                          .format(assignment.dueDate),
                    ),
                    _DetailRow(
                      icon: Icons.star_outline,
                      label: 'Total marks',
                      value: assignment.maxMarks.toStringAsFixed(0),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              AppCard(
                child: Text(
                  assignment.description,
                  style: const TextStyle(
                    fontSize: 14,
                    height: 1.55,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              if (assignment.isGraded && assignment.obtainedMarks != null) ...[
                const SizedBox(height: 14),
                AppCard(
                  accentColor: AppColors.success,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Text(
                            'Your marks',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const Spacer(),
                          Text(
                            '${assignment.obtainedMarks!.toStringAsFixed(0)} / ${assignment.maxMarks.toStringAsFixed(0)}',
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w700,
                              color: AppColors.success,
                            ),
                          ),
                        ],
                      ),
                      if (assignment.feedback != null) ...[
                        const SizedBox(height: 10),
                        const Divider(color: AppColors.divider),
                        const SizedBox(height: 10),
                        const Text(
                          'Teacher feedback',
                          style: TextStyle(
                            fontSize: 12,
                            color: AppColors.textSecondary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          assignment.feedback!,
                          style: const TextStyle(fontSize: 14, height: 1.4),
                        ),
                      ],
                    ],
                  ),
                ),
              ] else ...[
                const SizedBox(height: 14),
                AppCard(
                  child: Row(
                    children: [
                      Icon(
                        Icons.info_outline,
                        size: 20,
                        color: AppColors.primary.withOpacity(0.7),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Text(
                          'Marks will appear here once your teacher grades this assignment on the web portal.',
                          style: TextStyle(
                            fontSize: 13,
                            color: AppColors.textSecondary,
                            height: 1.45,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  String _statusLabel(AssignmentStatus status) {
    return switch (status) {
      AssignmentStatus.pending => 'Pending',
      AssignmentStatus.submitted => 'Awaiting marks',
      AssignmentStatus.graded => 'Graded',
      AssignmentStatus.overdue => 'Overdue',
    };
  }

  Color _statusColor(AssignmentStatus status) {
    return switch (status) {
      AssignmentStatus.pending => AppColors.info,
      AssignmentStatus.submitted => AppColors.secondary,
      AssignmentStatus.graded => AppColors.success,
      AssignmentStatus.overdue => AppColors.error,
    };
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.textSecondary),
          const SizedBox(width: 10),
          Text(
            '$label: ',
            style: const TextStyle(
              fontSize: 13,
              color: AppColors.textSecondary,
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: AppColors.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
