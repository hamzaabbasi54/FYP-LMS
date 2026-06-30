import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/grades/data/grades_repository.dart';
import '../../features/courses/data/courses_repository.dart';
import '../../features/profile/data/profile_repository.dart';
import '../../features/schedule/data/schedule_repository.dart';
import '../../features/updates/data/updates_repository.dart';

/// Tab paths — bottom nav + swipe order.
const portalTabPaths = ['/', '/courses', '/grades', '/schedule', '/profile'];

int portalTabIndexFromPath(String path) {
  final index = portalTabPaths.indexOf(path);
  return index < 0 ? 0 : index;
}

/// Force fresh API data (e.g. right after login or logout).
void refreshPortalData(void Function(ProviderBase<Object?> provider) invalidate) {
  invalidate(profileProvider);
  invalidate(coursesProvider);
  invalidate(scheduleProvider);
  invalidate(teacherUpdatesProvider);
  invalidate(gradesProvider);
}
