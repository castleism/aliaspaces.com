#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
android="$root/android"
dist="$root/dist"
sdk_root="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-$HOME/android-sdk}}"
export ANDROID_SDK_ROOT="$sdk_root"
export ANDROID_HOME="$sdk_root"

mkdir -p "$dist" "$sdk_root"

if [[ ! -x "$sdk_root/cmdline-tools/latest/bin/sdkmanager" ]]; then
  echo "Installing Android command-line tools into $sdk_root"
  tmp="$(mktemp -d)"
  curl -fsSL -o "$tmp/cmdline-tools.zip" "https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip"
  unzip -q "$tmp/cmdline-tools.zip" -d "$tmp"
  mkdir -p "$sdk_root/cmdline-tools/latest"
  cp -a "$tmp/cmdline-tools/." "$sdk_root/cmdline-tools/latest/"
  rm -rf "$tmp"
fi

yes | "$sdk_root/cmdline-tools/latest/bin/sdkmanager" --sdk_root="$sdk_root" --licenses >/dev/null
"$sdk_root/cmdline-tools/latest/bin/sdkmanager" --sdk_root="$sdk_root" \
  "platform-tools" \
  "platforms;android-34" \
  "build-tools;34.0.0"

if [[ ! -f "$android/debug.keystore" ]]; then
  keytool -genkeypair -alias aliaspaceslocal -keyalg RSA -keysize 2048 -validity 10000 \
    -keystore "$android/debug.keystore" -storepass android -keypass android \
    -dname "CN=AliaSpaces Local Demo, OU=Local, O=AliaSpaces, L=Local, ST=Local, C=US"
fi

printf 'sdk.dir=%s\n' "$sdk_root" > "$android/local.properties"

if [[ ! -f "$android/gradle/wrapper/gradle-wrapper.jar" ]]; then
  if command -v gradle >/dev/null 2>&1; then
    (cd "$android" && gradle wrapper --gradle-version 8.7)
  else
    echo "Downloading Gradle wrapper jar"
    curl -fsSL -o "$android/gradle/wrapper/gradle-wrapper.jar" \
      "https://raw.githubusercontent.com/gradle/gradle/v8.7.0/gradle/wrapper/gradle-wrapper.jar"
  fi
fi

chmod +x "$android/gradlew" 2>/dev/null || true
if [[ ! -x "$android/gradlew" ]]; then
  cat > "$android/gradlew" <<'EOF'
#!/usr/bin/env sh
APP_HOME=$(cd "$(dirname "$0")" && pwd)
exec java -Xmx64m -Xms64m -classpath "$APP_HOME/gradle/wrapper/gradle-wrapper.jar" org.gradle.wrapper.GradleWrapperMain "$@"
EOF
  chmod +x "$android/gradlew"
fi

(cd "$android" && ./gradlew :app:assembleDebug --no-daemon)

apk="$(find "$android/app/build/outputs/apk/debug" -name '*.apk' | head -n 1)"
if [[ -z "$apk" ]]; then
  echo "Debug APK was not produced" >&2
  exit 1
fi

cp "$apk" "$dist/AliaSpaces-local-demo-debug.apk"
if [[ -d /opt/cursor/artifacts ]]; then
  cp "$apk" /opt/cursor/artifacts/AliaSpaces-local-demo-debug.apk
fi

keytool -printcert -jarfile "$dist/AliaSpaces-local-demo-debug.apk" || true
echo "APK ready: $dist/AliaSpaces-local-demo-debug.apk"
