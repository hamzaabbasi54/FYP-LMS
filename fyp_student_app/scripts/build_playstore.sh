#!/usr/bin/env bash
set -euo pipefail

# Campus Flow — Play Store release build
# Usage: ./scripts/build_playstore.sh [API_BASE_URL]
#
# Example:
#   ./scripts/build_playstore.sh https://api.campusflow.edu.pk/api

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export PATH="/home/hassan/Desktop/FYP Ahsan/flutter/bin:${PATH:-}"

API_URL="${1:-https://YOUR-SERVER-DOMAIN.com/api}"

echo "Building Play Store AAB..."
echo "API_BASE_URL=$API_URL"

flutter clean
flutter pub get
flutter build appbundle --release \
  --dart-define=USE_MOCK=false \
  --dart-define=API_BASE_URL="$API_URL"

flutter build apk --release \
  --dart-define=USE_MOCK=false \
  --dart-define=API_BASE_URL="$API_URL"

OUT_DIR="$ROOT/release"
mkdir -p "$OUT_DIR"

VERSION="$(grep '^version:' pubspec.yaml | awk '{print $2}')"
NAME="CampusFlow-${VERSION}-playstore.aab"
cp build/app/outputs/bundle/release/app-release.aab "$OUT_DIR/$NAME"

APK_NAME="CampusFlow-${VERSION%-*}-release.apk"
cp build/app/outputs/flutter-apk/app-release.apk "$OUT_DIR/$APK_NAME"

echo ""
echo "Done! Play Store upload (AAB):"
echo "  $OUT_DIR/$NAME"
echo ""
echo "Direct install (APK):"
echo "  $OUT_DIR/$APK_NAME"
echo ""
ls -lh "$OUT_DIR/$NAME" "$OUT_DIR/$APK_NAME"
