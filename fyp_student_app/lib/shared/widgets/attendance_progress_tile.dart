import 'package:flutter/material.dart';

import '../../core/models/course_model.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';

class AttendanceProgressTile extends StatelessWidget {
  const AttendanceProgressTile({
    super.key,
    required this.course,
    this.onTap,
    this.isLast = false,
  });

  final Course course;
  final VoidCallback? onTap;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final pct = course.attendancePercentage;
    final color = AppColors.attendanceColor(pct);
    final badgeBg = AppColors.attendanceBadgeBg(pct);
    final detail = course.totalClasses > 0
        ? '${course.presentClasses}/${course.totalClasses} classes attended'
        : 'Attendance from LMS';

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: 10),
          child: Row(
            children: [
              _AttendanceRing(percentage: pct, color: color),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      course.code,
                      style: AppTheme.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      course.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppTheme.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      detail,
                      style: AppTheme.inter(
                        fontSize: 10,
                        color: AppColors.textTertiary,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: badgeBg,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '${pct.toStringAsFixed(0)}%',
                  style: AppTheme.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: color,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AttendanceRing extends StatelessWidget {
  const _AttendanceRing({required this.percentage, required this.color});

  final double percentage;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 44,
      height: 44,
      child: Stack(
        alignment: Alignment.center,
        children: [
          SizedBox(
            width: 44,
            height: 44,
            child: CircularProgressIndicator(
              value: (percentage / 100).clamp(0.0, 1.0),
              strokeWidth: 4,
              backgroundColor: AppColors.surfaceMuted,
              valueColor: AlwaysStoppedAnimation<Color>(color),
              strokeCap: StrokeCap.round,
            ),
          ),
          Text(
            '${percentage.toStringAsFixed(0)}%',
            style: AppTheme.inter(
              fontSize: 10,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}
