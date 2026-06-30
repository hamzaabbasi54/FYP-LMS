import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/models/schedule_model.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/loading_view.dart';
import '../data/schedule_repository.dart';

class ScheduleScreen extends ConsumerStatefulWidget {
  const ScheduleScreen({super.key});

  @override
  ConsumerState<ScheduleScreen> createState() => _ScheduleScreenState();
}

class _ScheduleScreenState extends ConsumerState<ScheduleScreen> {
  int _selectedDay = DateTime.now().weekday;

  DateTime _dateForWeekday(int weekday) {
    final now = DateTime.now();
    return now.add(Duration(days: weekday - now.weekday));
  }

  @override
  Widget build(BuildContext context) {
    final scheduleAsync = ref.watch(scheduleProvider);

    return scheduleAsync.when(
      loading: () => const LoadingView(message: 'Loading schedule...'),
      error: (e, _) => ErrorView(
        message: e.toString(),
        onRetry: () => ref.invalidate(scheduleProvider),
      ),
      data: (slots) {
        final daySlots = slots
            .where((s) => s.dayOfWeek == _selectedDay)
            .toList()
          ..sort((a, b) => a.startTime.compareTo(b.startTime));

        return Column(
          children: [
            _DaySelector(
              selectedDay: _selectedDay,
              onDaySelected: (day) => setState(() => _selectedDay = day),
              dateForWeekday: _dateForWeekday,
            ),
            Expanded(
              child: RefreshIndicator(
                onRefresh: () async => ref.invalidate(scheduleProvider),
                color: AppColors.primary,
                child: daySlots.isEmpty
                    ? ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        children: const [
                          SizedBox(height: 60),
                          EmptyState(
                            icon: Icons.event_available_outlined,
                            title: 'No Classes',
                            subtitle:
                                'You have no classes scheduled for this day.',
                          ),
                        ],
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
                        itemCount: daySlots.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (context, index) {
                          return _ScheduleTile(slot: daySlots[index]);
                        },
                      ),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _DaySelector extends StatelessWidget {
  const _DaySelector({
    required this.selectedDay,
    required this.onDaySelected,
    required this.dateForWeekday,
  });

  final int selectedDay;
  final ValueChanged<int> onDaySelected;
  final DateTime Function(int) dateForWeekday;

  @override
  Widget build(BuildContext context) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: List.generate(7, (index) {
            final day = index + 1;
            final isSelected = day == selectedDay;
            final isToday = day == DateTime.now().weekday;
            final date = dateForWeekday(day);

            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: GestureDetector(
                onTap: () => onDaySelected(day),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 52,
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.primary : AppColors.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isToday && !isSelected
                          ? AppColors.primary.withOpacity(0.4)
                          : AppColors.divider,
                    ),
                    boxShadow: isSelected
                        ? AppColors.cardShadow(opacity: 0.08)
                        : null,
                  ),
                  child: Column(
                    children: [
                      Text(
                        days[index],
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: isSelected
                              ? AppColors.textOnDark.withOpacity(0.8)
                              : AppColors.textTertiary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${date.day}',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: isSelected
                              ? AppColors.textOnDark
                              : AppColors.textPrimary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
        ),
      ),
    );
  }
}

class _ScheduleTile extends StatelessWidget {
  const _ScheduleTile({required this.slot});

  final ScheduleSlot slot;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      accentColor: AppColors.primary,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 50,
            padding: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.07),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Column(
              children: [
                Text(
                  slot.startTime,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 12,
                    color: AppColors.primary,
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 3),
                  child: Container(width: 14, height: 1, color: AppColors.divider),
                ),
                Text(
                  slot.endTime,
                  style: const TextStyle(
                    fontSize: 10,
                    color: AppColors.textTertiary,
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
                  slot.courseCode,
                  style: const TextStyle(
                    color: AppColors.secondary,
                    fontWeight: FontWeight.w600,
                    fontSize: 10,
                    letterSpacing: 0.3,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  slot.courseName,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.location_on_outlined, size: 13, color: AppColors.textTertiary),
                    const SizedBox(width: 3),
                    Text(
                      slot.room,
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(width: 10),
                    const Icon(Icons.person_outline, size: 13, color: AppColors.textTertiary),
                    const SizedBox(width: 3),
                    Expanded(
                      child: Text(
                        slot.instructor,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
