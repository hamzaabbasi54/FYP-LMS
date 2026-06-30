import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/models/course_model.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/loading_view.dart';
import '../data/courses_repository.dart';

class CourseDetailScreen extends ConsumerWidget {
  const CourseDetailScreen({super.key, required this.courseId});

  final String courseId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detailAsync = ref.watch(courseDetailProvider(courseId));

    return detailAsync.when(
      loading: () => Scaffold(
        appBar: AppBar(title: const Text('Course Details')),
        body: const LoadingView(message: 'Loading course...'),
      ),
      error: (e, _) => Scaffold(
        appBar: AppBar(title: const Text('Course Details')),
        body: ErrorView(
          message: e.toString().replaceFirst('Exception: ', ''),
          onRetry: () => ref.invalidate(courseDetailProvider(courseId)),
        ),
      ),
      data: (detail) => DefaultTabController(
        length: 2,
        child: Scaffold(
          appBar: AppBar(
            title: Text(detail.course.code),
            bottom: TabBar(
              indicatorColor: AppColors.accent,
              labelColor: AppColors.textOnDark,
              unselectedLabelColor: AppColors.textOnDark.withOpacity(0.6),
              tabs: const [
                Tab(text: 'Attendance', icon: Icon(Icons.fact_check_outlined, size: 20)),
                Tab(text: 'Grades', icon: Icon(Icons.grade_outlined, size: 20)),
              ],
            ),
          ),
          body: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: AppCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        detail.course.name,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        detail.course.instructor,
                        style: const TextStyle(color: AppColors.textSecondary),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          _InfoChip(
                            icon: Icons.fact_check,
                            label:
                                '${detail.course.attendancePercentage.toStringAsFixed(1)}%',
                            color: AppColors.secondary,
                          ),
                          const SizedBox(width: 8),
                          _InfoChip(
                            icon: Icons.grade,
                            label: detail.course.currentGrade,
                            color: AppColors.accent,
                          ),
                          const SizedBox(width: 8),
                          _InfoChip(
                            icon: Icons.credit_score,
                            label: '${detail.course.credits} cr',
                            color: AppColors.primary,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              Expanded(
                child: TabBarView(
                  children: [
                    _AttendanceTab(records: detail.attendance),
                    _GradesTab(grades: detail.grades),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({
    required this.icon,
    required this.label,
    required this.color,
  });

  final IconData icon;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w600,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}

class _AttendanceTab extends StatelessWidget {
  const _AttendanceTab({required this.records});

  final List<AttendanceRecord> records;

  @override
  Widget build(BuildContext context) {
    if (records.isEmpty) {
      return const EmptyState(
        icon: Icons.event_busy_outlined,
        title: 'No Attendance Records',
        subtitle: 'Is course ki abhi tak attendance mark nahi hui.',
      );
    }

    final present = records.where((r) => r.isPresent).length;
    final absent = records.where((r) => r.isAbsent).length;
    final late = records.where((r) => r.isLate).length;

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      children: [
        AppCard(
          child: Row(
            children: [
              Expanded(
                child: _AttendanceStat(
                  label: 'Present',
                  count: present,
                  color: AppColors.success,
                ),
              ),
              Expanded(
                child: _AttendanceStat(
                  label: 'Absent',
                  count: absent,
                  color: AppColors.error,
                ),
              ),
              Expanded(
                child: _AttendanceStat(
                  label: 'Late',
                  count: late,
                  color: AppColors.warning,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        const Padding(
          padding: EdgeInsets.only(left: 4, bottom: 8),
          child: Text(
            'Day-by-day attendance',
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 14,
              color: AppColors.textPrimary,
            ),
          ),
        ),
        ...records.map(
          (record) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: _AttendanceTile(record: record),
          ),
        ),
      ],
    );
  }
}

class _AttendanceStat extends StatelessWidget {
  const _AttendanceStat({
    required this.label,
    required this.count,
    required this.color,
  });

  final String label;
  final int count;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          '$count',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w800,
            color: color,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: color,
          ),
        ),
      ],
    );
  }
}

class _AttendanceTile extends StatelessWidget {
  const _AttendanceTile({required this.record});

  final AttendanceRecord record;

  @override
  Widget build(BuildContext context) {
    final (color, icon, label) = switch (record.status) {
      'present' => (AppColors.success, Icons.check_circle, 'Present'),
      'absent' => (AppColors.error, Icons.cancel, 'Absent'),
      'late' => (AppColors.warning, Icons.schedule, 'Late'),
      _ => (AppColors.textSecondary, Icons.help_outline, record.status),
    };

    return AppCard(
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  DateFormat('EEE, MMM d, yyyy').format(record.date),
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                if (record.remarks.isNotEmpty)
                  Text(
                    record.remarks,
                    style: const TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 12,
                    ),
                  ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              label,
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.w600,
                fontSize: 12,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _GradesTab extends StatelessWidget {
  const _GradesTab({required this.grades});

  final List<GradeRecord> grades;

  @override
  Widget build(BuildContext context) {
    if (grades.isEmpty) {
      return const EmptyState(
        icon: Icons.grade_outlined,
        title: 'No Grades Yet',
        subtitle: 'Grades will appear here once assignments are graded.',
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: grades.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (context, index) {
        final grade = grades[index];
        return _GradeTile(grade: grade);
      },
    );
  }
}

class _GradeTile extends StatelessWidget {
  const _GradeTile({required this.grade});

  final GradeRecord grade;

  @override
  Widget build(BuildContext context) {
    final pct = grade.percentage;
    final color = pct >= 80
        ? AppColors.success
        : pct >= 60
            ? AppColors.warning
            : AppColors.error;

    return AppCard(
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  grade.title,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 4),
                Text(
                  '${grade.type} • ${DateFormat('MMM d').format(grade.date)}',
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${grade.score.toStringAsFixed(0)}/${grade.maxScore.toStringAsFixed(0)}',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                  color: color,
                ),
              ),
              Text(
                '${pct.toStringAsFixed(0)}%',
                style: TextStyle(color: color, fontSize: 12),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
