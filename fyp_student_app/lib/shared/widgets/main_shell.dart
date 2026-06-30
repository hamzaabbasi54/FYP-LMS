import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/config/app_config.dart';
import '../../core/providers/portal_refresh.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../features/grades/screens/grades_screen.dart';
import '../../features/courses/screens/courses_screen.dart';
import '../../features/dashboard/screens/dashboard_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../features/schedule/screens/schedule_screen.dart';
import 'campus_flow_brand_bar.dart';

class MainShell extends ConsumerStatefulWidget {
  const MainShell({super.key, required this.tabPath});

  final String tabPath;

  @override
  ConsumerState<MainShell> createState() => _MainShellState();
}

class _MainShellState extends ConsumerState<MainShell> {
  static const _titles = [
    'Dashboard',
    'My Courses',
    'My Grades',
    'Schedule',
    'Profile',
  ];

  static const _icons = [
    Icons.home_outlined,
    Icons.menu_book_outlined,
    Icons.grade_outlined,
    Icons.calendar_month_outlined,
    Icons.person_outline_rounded,
  ];

  static const _activeIcons = [
    Icons.home_rounded,
    Icons.menu_book_rounded,
    Icons.grade_rounded,
    Icons.calendar_month_rounded,
    Icons.person_rounded,
  ];

  static const _labels = ['Home', 'Courses', 'Grades', 'Schedule', 'Profile'];

  late final PageController _pageController;
  int _currentIndex = 0;
  bool _syncingFromRoute = false;

  @override
  void initState() {
    super.initState();
    _currentIndex = portalTabIndexFromPath(widget.tabPath);
    _pageController = PageController(initialPage: _currentIndex);
  }

  @override
  void didUpdateWidget(covariant MainShell oldWidget) {
    super.didUpdateWidget(oldWidget);
    final routeIndex = portalTabIndexFromPath(widget.tabPath);
    if (routeIndex != _currentIndex) {
      _syncingFromRoute = true;
      _currentIndex = routeIndex;
      _pageController.jumpToPage(routeIndex);
      _syncingFromRoute = false;
    }
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onTabSelected(int index) {
    if (index == _currentIndex) return;
    setState(() => _currentIndex = index);
    _pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 280),
      curve: Curves.easeOutCubic,
    );
    context.go(portalTabPaths[index]);
  }

  void _onPageChanged(int index) {
    if (_syncingFromRoute || index == _currentIndex) return;
    setState(() => _currentIndex = index);
    context.go(portalTabPaths[index]);
  }

  @override
  Widget build(BuildContext context) {
    final isHome = _currentIndex == 0;
    final bottomInset = MediaQuery.of(context).padding.bottom;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          CampusFlowBrandBar(
            compact: !isHome,
            subtitle: isHome ? AppConfig.universityName : _titles[_currentIndex],
          ),
          Expanded(
            child: PageView(
              controller: _pageController,
              onPageChanged: _onPageChanged,
              physics: const BouncingScrollPhysics(),
              children: const [
                _KeepAliveTab(child: DashboardScreen()),
                _KeepAliveTab(child: CoursesScreen()),
                _KeepAliveTab(child: GradesScreen()),
                _KeepAliveTab(child: ScheduleScreen()),
                _KeepAliveTab(child: ProfileScreen()),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          border: Border(
            top: BorderSide(color: Colors.black.withOpacity(0.06)),
          ),
        ),
        padding: EdgeInsets.fromLTRB(0, 10, 0, bottomInset > 0 ? bottomInset : 20),
        child: Row(
          children: List.generate(5, (i) {
            final selected = i == _currentIndex;
            return Expanded(
              child: GestureDetector(
                onTap: () => _onTabSelected(i),
                behavior: HitTestBehavior.opaque,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: selected
                            ? AppColors.primarySoft
                            : Colors.transparent,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        selected ? _activeIcons[i] : _icons[i],
                        size: 20,
                        color: selected
                            ? AppColors.primary
                            : AppColors.textTertiary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _labels[i],
                      style: AppTheme.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: selected
                            ? AppColors.primary
                            : AppColors.textTertiary,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
        ),
      ),
    );
  }
}

class _KeepAliveTab extends StatefulWidget {
  const _KeepAliveTab({required this.child});

  final Widget child;

  @override
  State<_KeepAliveTab> createState() => _KeepAliveTabState();
}

class _KeepAliveTabState extends State<_KeepAliveTab>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return widget.child;
  }
}
