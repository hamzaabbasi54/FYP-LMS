import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Campus Flow horizontal logo — matches web aspect ratio (1000×300).
class CampusFlowLogo extends StatelessWidget {
  const CampusFlowLogo({
    super.key,
    this.width = 240,
    this.height,
    this.borderRadius = 0,
  });

  final double width;
  final double? height;
  final double borderRadius;

  static const String _assetPath = 'assets/images/campus_flow_logo.png';

  @override
  Widget build(BuildContext context) {
    final logoHeight = height ?? width * 0.3;

    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: Image.asset(
        _assetPath,
        width: width,
        height: logoHeight,
        fit: BoxFit.contain,
        alignment: Alignment.center,
        filterQuality: FilterQuality.high,
        errorBuilder: (_, __, ___) => Container(
          width: width,
          height: logoHeight,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            gradient: AppColors.headerGradient,
            borderRadius: BorderRadius.circular(borderRadius),
          ),
          child: const Icon(Icons.school_rounded, color: Colors.white, size: 36),
        ),
      ),
    );
  }
}
