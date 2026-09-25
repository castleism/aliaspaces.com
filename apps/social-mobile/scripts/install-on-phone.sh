#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
apk="$root/dist/AliaSpaces-social-debug.apk"
sdk_root="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-$HOME/android-sdk}}"
adb_bin="${ADB:-$sdk_root/platform-tools/adb}"
evidence="/opt/cursor/artifacts/phone-install.txt"
if [[ ! -d /opt/cursor/artifacts ]]; then
  evidence="$root/dist/phone-install.txt"
fi

{
  echo "AliaSpaces phone install attempt $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "apk=$apk"
  if [[ ! -x "$adb_bin" ]]; then
    echo "result=no-adb-binary"
    echo "This cloud checkout could not talk to an Android phone."
    exit 2
  fi
  "$adb_bin" start-server >/dev/null
  devices="$("$adb_bin" devices | awk 'NR>1 && $2=="device" {print $1}')"
  if [[ -z "$devices" ]]; then
    echo "result=no-device"
    echo "adb is present but no authorized phone or emulator is attached."
    exit 3
  fi
  echo "devices=$devices"
  if [[ ! -f "$apk" ]]; then
    echo "result=missing-apk"
    exit 4
  fi
  while read -r serial; do
    [[ -z "$serial" ]] && continue
    echo "installing on $serial"
    "$adb_bin" -s "$serial" install -r "$apk"
    "$adb_bin" -s "$serial" shell am start -n com.aliaspaces.social.local/.MainActivity
    "$adb_bin" -s "$serial" shell am start -n com.aliaspaces.social.local/.WebsiteActivity
    "$adb_bin" -s "$serial" shell am start -n com.aliaspaces.social.local/.SocialLauncherActivity
    "$adb_bin" -s "$serial" shell am start -n com.aliaspaces.social.local/.LocalLauncherActivity
    echo "installed=$serial"
  done <<< "$devices"
  echo "result=installed"
  echo "Chrome cannot auto-install a mypersonas.online PWA without an owner tap. The APK launchers are the installed website and app copies."
} | tee "$evidence"
