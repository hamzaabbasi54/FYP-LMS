#!/usr/bin/env bash
# WiFi — phone aur laptop same network par
set -e
export PATH="/home/hassan/Android/sdk/platform-tools:/home/hassan/Desktop/FYP Ahsan/flutter/bin:$PATH"
cd "$(dirname "$0")/.."
IP=$(hostname -I | awk '{print $1}')
echo "API: http://${IP}:3000/api"
flutter run -d android --dart-define=USE_MOCK=false --dart-define=API_BASE_URL="http://${IP}:3000/api"
