import 'package:flutter/material.dart';

/// Campus Flow — matches logo & web brand (#0078C5).
class AppColors {
  AppColors._();

  static const Color primary = Color(0xFF0078C5);
  static const Color primaryLight = Color(0xFF0798E7);
  static const Color primaryDark = Color(0xFF05629F);
  static const Color primarySoft = Color(0xFFE0F2FE);

  static const Color secondary = Color(0xFF0078C5);
  static const Color secondaryLight = Color(0xFFDFF0FF);

  static const Color accent = Color(0xFF0078C5);
  static const Color accentSoft = Color(0xFFE0F2FE);

  static const Color background = Color(0xFFEFF8FF);
  static const Color backgroundSoft = Color(0xFFDFF0FF);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceMuted = Color(0xFFE0F2FE);

  static const Color textPrimary = Color(0xFF0E4569);
  static const Color textSecondary = Color(0xFF4A6578);
  static const Color textTertiary = Color(0xFF8898AA);
  static const Color textOnDark = Color(0xFFF8FAFC);

  static const Color success = Color(0xFF2F9E44);
  static const Color successSoft = Color(0xFFEBFBEE);
  static const Color error = Color(0xFFE03131);
  static const Color errorSoft = Color(0xFFFFF0F0);
  static const Color warning = Color(0xFFF59F00);
  static const Color warningSoft = Color(0xFFFFF8E1);
  static const Color info = Color(0xFF0078C5);

  static const Color divider = Color(0xFFD6EAF5);
  static const Color heroYellow = Color(0xFFFFD43B);

  static const LinearGradient headerGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF0078C5), Color(0xFF05629F)],
  );

  static const LinearGradient nextClassGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF0A527F), Color(0xFF05629F)],
  );

  static const LinearGradient softBgGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFFEFF8FF), Color(0xFFEFF8FF)],
  );

  static Color attendanceColor(double pct) {
    if (pct >= 85) return success;
    if (pct >= 75) return warning;
    return error;
  }

  static Color attendanceBadgeBg(double pct) {
    if (pct >= 85) return successSoft;
    if (pct >= 75) return warningSoft;
    return errorSoft;
  }

  static List<BoxShadow> cardShadow({double opacity = 0.05}) => [
        BoxShadow(
          color: Colors.black.withOpacity(opacity),
          blurRadius: 8,
          offset: const Offset(0, 2),
        ),
      ];
}
