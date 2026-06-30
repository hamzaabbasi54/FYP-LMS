#!/usr/bin/env bash
# USB cable — backend laptop par, phone par 127.0.0.1
set -e
export PATH="/home/hassan/Android/sdk/platform-tools:/home/hassan/Desktop/FYP Ahsan/flutter/bin:$PATH"
cd "$(dirname "$0")/.."
adb reverse tcp:3000 tcp:3000 2>/dev/null || true
flutter run --dart-define=USE_MOCK=false --dart-define=API_BASE_URL=http://127.0.0.1:3000/api
