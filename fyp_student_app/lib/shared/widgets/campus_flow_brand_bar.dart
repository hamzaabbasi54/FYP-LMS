import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/config/app_config.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import 'campus_flow_logo.dart';
import 'notification_button.dart';

/// Top nav — real Campus Flow logo + Student Portal + notifications.
class CampusFlowBrandBar extends ConsumerWidget {
  const CampusFlowBrandBar({
    super.key,
    this.compact = false,
    this.subtitle,
  });

  final bool compact;
  final String? subtitle;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final topPadding = MediaQuery.of(context).padding.top;

    return Container(
      width: double.infinity,
      padding: EdgeInsets.fromLTRB(20, topPadding + 8, 20, compact ? 10 : 14),
      color: AppColors.background,
      child: Row(
        children: [
          CampusFlowLogo(
            width: compact ? 100 : 120,
            borderRadius: 8,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  compact ? (subtitle ?? AppConfig.universityName) : AppConfig.appName,
                  style: AppTheme.spaceGrotesk(
                    fontSize: compact ? 15 : 16,
                    fontWeight: FontWeight.w700,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (!compact) ...[
                  const SizedBox(height: 2),
                  Text(
                    subtitle ?? AppConfig.universityName,
                    style: AppTheme.inter(
                      fontSize: 10,
                      fontWeight: FontWeight.w500,
                      color: AppColors.textTertiary,
                    ),
                  ),
                ],
              ],
            ),
          ),
          const NotificationButton(),
        ],
      ),
    );
  }
}
