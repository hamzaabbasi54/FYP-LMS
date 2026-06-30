import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/courses/screens/course_detail_screen.dart';
import '../../features/profile/screens/change_password_screen.dart';
import '../../shared/widgets/main_shell.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final refreshListenable = _AuthRefreshListenable(ref);

  return GoRouter(
    initialLocation: '/',
    refreshListenable: refreshListenable,
    redirect: (context, state) {
      final authState = ref.read(authProvider);
      final isAuthenticated = authState.isAuthenticated;
      final isLoading = authState.status == AuthStatus.initial ||
          (authState.isLoading && authState.status != AuthStatus.unauthenticated);
      final isLoginRoute = state.matchedLocation == '/login';

      if (isLoading) return null;

      if (!isAuthenticated && !isLoginRoute) return '/login';
      if (isAuthenticated && isLoginRoute) return '/';

      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      ShellRoute(
        builder: (context, state, child) {
          return MainShell(tabPath: state.uri.path);
        },
        routes: [
          GoRoute(
            path: '/',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: SizedBox.shrink()),
          ),
          GoRoute(
            path: '/courses',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: SizedBox.shrink()),
          ),
          GoRoute(
            path: '/grades',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: SizedBox.shrink()),
          ),
          GoRoute(
            path: '/schedule',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: SizedBox.shrink()),
          ),
          GoRoute(
            path: '/profile',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: SizedBox.shrink()),
          ),
        ],
      ),
      GoRoute(
        path: '/courses/:id',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return CourseDetailScreen(courseId: id);
        },
      ),
      GoRoute(
        path: '/change-password',
        builder: (context, state) => const ChangePasswordScreen(),
      ),
    ],
  );
});

class _AuthRefreshListenable extends ChangeNotifier {
  _AuthRefreshListenable(this.ref) {
    ref.listen(authProvider, (_, __) => notifyListeners());
  }

  final Ref ref;
}
