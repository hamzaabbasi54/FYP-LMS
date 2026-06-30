import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/config/app_config.dart';
import 'core/router/app_router.dart';
import 'core/storage/session_manager.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/providers/auth_provider.dart';

class FypStudentApp extends ConsumerStatefulWidget {
  const FypStudentApp({super.key});

  @override
  ConsumerState<FypStudentApp> createState() => _FypStudentAppState();
}

class _FypStudentAppState extends ConsumerState<FypStudentApp> {
  @override
  void initState() {
    super.initState();
    SessionManager.onUnauthorized = () async {
      if (!ref.read(authProvider).isAuthenticated) return;
      await ref.read(authProvider.notifier).logout(silent: true);
    };
    Future.microtask(
      () => ref.read(authProvider.notifier).checkAuthStatus(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: AppConfig.appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      routerConfig: router,
    );
  }
}
