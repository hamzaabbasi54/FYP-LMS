import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/models/assignment_model.dart';
import '../../../core/models/course_model.dart';
import '../../../core/models/schedule_model.dart';
import '../../../core/models/user_model.dart';
import '../../../core/providers/portal_refresh.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/attendance_progress_tile.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../auth/providers/auth_provider.dart';
import '../../courses/data/courses_repository.dart';
import '../../profile/data/profile_repository.dart';
import '../../schedule/data/schedule_repository.dart';
import '../../updates/data/updates_repository.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final profileAsync = ref.watch(profileProvider);
    final coursesAsync = ref.watch(coursesProvider);
    final scheduleAsync = ref.watch(scheduleProvider);
    final updatesAsync = ref.watch(teacherUpdatesProvider);

    final profile = profileAsync.maybeWhen(
      data: (p) => p,
      orElse: () => authState.user,
    );

    if (profile == null) {
      return const LoadingView(message: 'Loading your dashboard...');
    }

    final courses = coursesAsync.maybeWhen(
      data: (c) => c,
      orElse: () => <Course>[],
    );
    final updates = updatesAsync.maybeWhen(
      data: (u) => u,
      orElse: () => <TeacherUpdate>[],
    );
    final scheduleSlots = scheduleAsync.maybeWhen(
      data: (s) => s,
      orElse: () => <ScheduleSlot>[],
    );

    final avgAttendance = courses.isEmpty
        ? 0.0
        : courses.map((c) => c.attendancePercentage).reduce((a, b) => a + b) /
            courses.length;

    final nextClass = _findNextClass(scheduleSlots);

    return RefreshIndicator(
      onRefresh: () async => refreshPortalData(ref.invalidate),
      color: AppColors.primary,
      backgroundColor: AppColors.surface,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
        children: [
          _HeroCard(
            profile: profile,
            avgAttendance: avgAttendance,
            courseCount: courses.length,
          ),
          const SizedBox(height: 14),
          if (nextClass != null) ...[
            _NextClassCard(nextClass: nextClass),
            const SizedBox(height: 14),
          ],
          const _SectionLabel(text: 'Quick Access'),
          const SizedBox(height: 8),
          _QuickActions(),
          const SizedBox(height: 14),
          _AttendanceSection(courses: courses),
          const SizedBox(height: 14),
          _UpdatesSection(updatesAsync: updatesAsync, updates: updates),
        ],
      ),
    );
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard({
    required this.profile,
    required this.avgAttendance,
    required this.courseCount,
  });

  final StudentProfile profile;
  final double avgAttendance;
  final int courseCount;

  @override
  Widget build(BuildContext context) {
    final hour = DateTime.now().hour;
    final greeting = hour < 12
        ? 'Good morning'
        : hour < 17
            ? 'Good afternoon'
            : 'Good evening';

    final metaParts = <String>[
      if (profile.semester.isNotEmpty) profile.semester,
      if (profile.program.isNotEmpty) profile.program else profile.department,
    ];
    final meta = metaParts.join(' · ');

    final cgpaText = profile.cgpa != null
        ? profile.cgpa!.toStringAsFixed(1)
        : '—';
    final attendanceWarn = avgAttendance < 75;

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 22, 20, 18),
      decoration: BoxDecoration(
        color: AppColors.primary,
        borderRadius: BorderRadius.circular(22),
      ),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Positioned(
            top: -40,
            right: -40,
            child: Container(
              width: 160,
              height: 160,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.08),
                shape: BoxShape.circle,
              ),
            ),
          ),
          Positioned(
            bottom: -60,
            right: 20,
            child: Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.05),
                shape: BoxShape.circle,
              ),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '$greeting 👋',
                          style: AppTheme.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: Colors.white.withOpacity(0.7),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          profile.name,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: AppTheme.spaceGrotesk(
                            fontSize: 22,
                            color: Colors.white,
                          ),
                        ),
                        if (meta.isNotEmpty) ...[
                          const SizedBox(height: 3),
                          Text(
                            meta,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: AppTheme.inter(
                              fontSize: 11,
                              color: Colors.white.withOpacity(0.65),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Container(
                    width: 46,
                    height: 46,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: Colors.white.withOpacity(0.3)),
                    ),
                    child: Text(
                      profile.name.isNotEmpty
                          ? profile.name[0].toUpperCase()
                          : 'S',
                      style: AppTheme.spaceGrotesk(
                        fontSize: 20,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              Row(
                children: [
                  _HeroStat(value: cgpaText, label: 'Current CGPA'),
                  const SizedBox(width: 10),
                  _HeroStat(
                    value: '${avgAttendance.toStringAsFixed(0)}%',
                    label: 'Avg Attendance',
                    valueColor: attendanceWarn ? AppColors.heroYellow : Colors.white,
                  ),
                  const SizedBox(width: 10),
                  _HeroStat(
                    value: '$courseCount',
                    label: 'Courses',
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _HeroStat extends StatelessWidget {
  const _HeroStat({
    required this.value,
    required this.label,
    this.valueColor,
  });

  final String value;
  final String label;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.13),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              value,
              style: AppTheme.spaceGrotesk(
                fontSize: 20,
                color: valueColor ?? Colors.white,
              ),
            ),
            const SizedBox(height: 1),
            Text(
              label,
              style: AppTheme.inter(
                fontSize: 10,
                color: Colors.white.withOpacity(0.65),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NextClassCard extends StatelessWidget {
  const _NextClassCard({required this.nextClass});

  final _NextClassInfo nextClass;

  @override
  Widget build(BuildContext context) {
    final timeParts = _splitTime12(nextClass.slot.startTime);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: AppColors.nextClassGradient,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.white.withOpacity(0.15)),
            ),
            child: Column(
              children: [
                Text(
                  timeParts.$1,
                  style: AppTheme.spaceGrotesk(
                    fontSize: 18,
                    color: Colors.white,
                  ),
                ),
                Text(
                  timeParts.$2,
                  style: AppTheme.inter(
                    fontSize: 10,
                    color: Colors.white.withOpacity(0.6),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'NEXT CLASS',
                  style: AppTheme.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: Colors.white.withOpacity(0.5),
                    letterSpacing: 0.6,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  nextClass.slot.courseName,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: AppTheme.spaceGrotesk(
                    fontSize: 15,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '📍 ${nextClass.slot.room}',
                  style: AppTheme.inter(
                    fontSize: 11,
                    color: Colors.white.withOpacity(0.55),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.heroYellow,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              nextClass.countdownLabel,
              style: AppTheme.inter(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: const Color(0xFF1A1F36),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 2),
      child: Text(
        text.toUpperCase(),
        style: AppTheme.inter(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: AppColors.textTertiary,
          letterSpacing: 0.8,
        ),
      ),
    );
  }
}

class _QuickActions extends StatelessWidget {
  static const _items = [
    ('Courses', Icons.menu_book_outlined, AppColors.primarySoft, '/courses'),
    ('Grades', Icons.grade_outlined, Color(0xFFFFF8E1), '/grades'),
    ('Schedule', Icons.calendar_month_outlined, Color(0xFFEBFBEE), '/schedule'),
    ('Results', Icons.assessment_outlined, Color(0xFFFFF0F0), '/grades'),
  ];

  @override
  Widget build(BuildContext context) {
    return Row(
      children: _items.map((item) {
        return Expanded(
          child: Padding(
            padding: EdgeInsets.only(
              right: item == _items.last ? 0 : 10,
            ),
            child: Material(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(10),
              elevation: 0,
              shadowColor: Colors.black.withOpacity(0.05),
              child: InkWell(
                onTap: () => context.go(item.$4),
                borderRadius: BorderRadius.circular(10),
                child: Container(
                  padding: const EdgeInsets.fromLTRB(8, 14, 8, 10),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(10),
                    boxShadow: AppColors.cardShadow(opacity: 0.05),
                  ),
                  child: Column(
                    children: [
                      Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          color: item.$3,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(item.$2, size: 18, color: AppColors.textPrimary),
                      ),
                      const SizedBox(height: 7),
                      Text(
                        item.$1,
                        textAlign: TextAlign.center,
                        style: AppTheme.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _AttendanceSection extends StatelessWidget {
  const _AttendanceSection({required this.courses});

  final List<Course> courses;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: AppColors.cardShadow(),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Text(
                'Subject Attendance',
                style: AppTheme.spaceGrotesk(fontSize: 15),
              ),
              const Spacer(),
              GestureDetector(
                onTap: () => context.go('/courses'),
                child: Text(
                  'All courses →',
                  style: AppTheme.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.primary,
                  ),
                ),
              ),
            ],
          ),
          if (courses.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Text(
                'No subjects enrolled',
                style: AppTheme.inter(color: AppColors.textSecondary),
              ),
            )
          else
            ...courses.asMap().entries.map((entry) {
              final course = entry.value;
              return Column(
                children: [
                  if (entry.key > 0)
                    const Divider(height: 1, color: AppColors.background),
                  AttendanceProgressTile(
                    course: course,
                    onTap: () => context.push('/courses/${course.id}'),
                  ),
                ],
              );
            }),
        ],
      ),
    );
  }
}

class _UpdatesSection extends StatelessWidget {
  const _UpdatesSection({
    required this.updatesAsync,
    required this.updates,
  });

  final AsyncValue<List<TeacherUpdate>> updatesAsync;
  final List<TeacherUpdate> updates;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: AppColors.cardShadow(),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                'Important Updates',
                style: AppTheme.spaceGrotesk(fontSize: 15),
              ),
              const Spacer(),
              if (updates.length > 2)
                Text(
                  'See all →',
                  style: AppTheme.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.primary,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 14),
          if (updatesAsync.hasError)
            Text(
              'Could not load updates',
              style: AppTheme.inter(color: AppColors.error),
            )
          else if (updates.isEmpty)
            Text(
              'No new announcements',
              style: AppTheme.inter(color: AppColors.textSecondary),
            )
          else
            ...updates.take(4).map(
                  (update) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: _AnnouncementCard(update: update),
                  ),
                ),
        ],
      ),
    );
  }
}

class _AnnouncementCard extends StatelessWidget {
  const _AnnouncementCard({required this.update});

  final TeacherUpdate update;

  @override
  Widget build(BuildContext context) {
    final urgent = update.isImportant;
    final bg = urgent ? AppColors.errorSoft : AppColors.surfaceMuted;
    final border = urgent ? const Color(0xFFFCCFCF) : const Color(0xFFDDE3FF);
    final chipBg = urgent ? AppColors.error : AppColors.primarySoft;
    final chipFg = urgent ? Colors.white : AppColors.primary;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(14, 13, 14, 13),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: chipBg,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  urgent ? '⚠️ ${update.courseCode}' : '📘 ${update.courseCode}',
                  style: AppTheme.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: chipFg,
                  ),
                ),
              ),
              const Spacer(),
              Text(
                DateFormat('MMM d').format(update.postedAt),
                style: AppTheme.inter(
                  fontSize: 10,
                  color: AppColors.textTertiary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            update.title,
            style: AppTheme.inter(fontSize: 14, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 3),
          Text(
            update.message,
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
            style: AppTheme.inter(
              fontSize: 12,
              color: AppColors.textSecondary,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            '👤 ${update.teacherName} · ${_relativeTime(update.postedAt)}',
            style: AppTheme.inter(
              fontSize: 10,
              color: AppColors.textTertiary,
            ),
          ),
        ],
      ),
    );
  }
}

class _NextClassInfo {
  const _NextClassInfo({
    required this.slot,
    required this.startsAt,
  });

  final ScheduleSlot slot;
  final DateTime startsAt;

  String get countdownLabel => _formatCountdown(startsAt);
}

_NextClassInfo? _findNextClass(List<ScheduleSlot> slots) {
  if (slots.isEmpty) return null;

  final now = DateTime.now();
  _NextClassInfo? best;

  for (final slot in slots) {
    final startsAt = _nextOccurrence(now, slot.dayOfWeek, slot.startTime);
    if (startsAt.isBefore(now)) continue;
    if (best == null || startsAt.isBefore(best.startsAt)) {
      best = _NextClassInfo(slot: slot, startsAt: startsAt);
    }
  }

  return best;
}

DateTime _nextOccurrence(DateTime now, int dayOfWeek, String startTime) {
  final parts = startTime.split(':');
  final hour = int.tryParse(parts.first) ?? 0;
  final minute = parts.length > 1 ? (int.tryParse(parts[1]) ?? 0) : 0;

  var daysAhead = dayOfWeek - now.weekday;
  var candidate = DateTime(now.year, now.month, now.day, hour, minute)
      .add(Duration(days: daysAhead));

  if (candidate.isBefore(now)) {
    candidate = candidate.add(const Duration(days: 7));
  }

  return candidate;
}

(String, String) _splitTime12(String time24) {
  final parts = time24.split(':');
  var hour = int.tryParse(parts.first) ?? 0;
  final minute = parts.length > 1 ? parts[1].padLeft(2, '0') : '00';
  final ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  if (hour == 0) hour = 12;
  return ('${hour.toString().padLeft(2, '0')}:$minute', ampm);
}

String _formatCountdown(DateTime target) {
  final diff = target.difference(DateTime.now());
  if (diff.isNegative) return 'Now';
  final days = diff.inDays;
  final hours = diff.inHours % 24;
  final minutes = diff.inMinutes % 60;
  if (days > 0) return 'in ${days}d ${hours}h';
  if (diff.inHours > 0) return 'in ${diff.inHours}h ${minutes}m';
  if (minutes > 0) return 'in ${minutes}m';
  return 'Soon';
}

String _relativeTime(DateTime postedAt) {
  final diff = DateTime.now().difference(postedAt);
  if (diff.inMinutes < 1) return 'Just now';
  if (diff.inHours < 1) return '${diff.inMinutes} min ago';
  if (diff.inHours < 24) return '${diff.inHours} hours ago';
  if (diff.inDays == 1) return 'Yesterday';
  if (diff.inDays < 7) return '${diff.inDays} days ago';
  return DateFormat('MMM d').format(postedAt);
}


