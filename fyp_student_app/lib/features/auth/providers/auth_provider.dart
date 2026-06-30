import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/models/user_model.dart';
import '../../../core/providers/portal_refresh.dart';
import '../data/auth_repository.dart';

enum AuthStatus { initial, authenticated, unauthenticated }

class AuthState {
  const AuthState({
    this.status = AuthStatus.initial,
    this.user,
    this.isLoading = false,
    this.error,
  });

  final AuthStatus status;
  final StudentProfile? user;
  final bool isLoading;
  final String? error;

  bool get isAuthenticated => status == AuthStatus.authenticated;

  AuthState copyWith({
    AuthStatus? status,
    StudentProfile? user,
    bool? isLoading,
    String? error,
    bool clearError = false,
    bool clearUser = false,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: clearUser ? null : (user ?? this.user),
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier(this._repository, this._ref) : super(const AuthState());

  final AuthRepository _repository;
  final Ref _ref;

  Future<void> checkAuthStatus() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final user = await _repository.restoreSession();
      if (user != null) {
        state = state.copyWith(
          status: AuthStatus.authenticated,
          user: user,
          isLoading: false,
        );
      } else if (state.status != AuthStatus.authenticated) {
        state = state.copyWith(
          status: AuthStatus.unauthenticated,
          isLoading: false,
          clearUser: true,
        );
      } else {
        state = state.copyWith(isLoading: false);
      }
    } catch (_) {
      if (state.status != AuthStatus.authenticated) {
        state = state.copyWith(
          status: AuthStatus.unauthenticated,
          isLoading: false,
          clearUser: true,
        );
      } else {
        state = state.copyWith(isLoading: false);
      }
    }
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await _repository.login(email: email, password: password);
      refreshPortalData(_ref.invalidate);
      state = state.copyWith(
        status: AuthStatus.authenticated,
        user: response.user,
        isLoading: false,
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString().replaceFirst('Exception: ', ''),
      );
      return false;
    }
  }

  Future<void> logout({bool silent = false}) async {
    state = AuthState(
      status: AuthStatus.unauthenticated,
      isLoading: false,
      error: silent ? null : state.error,
    );
    await _repository.logout();
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.watch(authRepositoryProvider), ref);
});
