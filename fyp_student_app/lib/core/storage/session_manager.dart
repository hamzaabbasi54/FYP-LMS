/// Global session handler to avoid circular dependency between Dio and auth providers.
class SessionManager {
  SessionManager._();

  static Future<void> Function()? onUnauthorized;

  /// Bumped on every login/logout so stale 401 responses are ignored.
  static int _epoch = 0;
  static int get epoch => _epoch;

  static int bumpEpoch() => ++_epoch;

  static Future<void> handleUnauthorized() async {
    await onUnauthorized?.call();
  }
}
