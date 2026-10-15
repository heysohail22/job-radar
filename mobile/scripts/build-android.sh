#!/usr/bin/env bash
set -euo pipefail
mobile_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
workspace_dir="$(dirname "$mobile_dir")"
export JAVA_HOME="${JAVA_HOME:-$workspace_dir/.local-tools/jdk21}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
variant="${1:-debug}"
case "$variant" in
  debug) build_task=app:assembleDebug; metadata_mb=384; export NODE_ENV=development ;;
  release) build_task=app:assembleRelease; metadata_mb=768; export NODE_ENV=production ;;
  *) echo 'Use debug or release.' >&2; exit 1 ;;
esac
export NODE_OPTIONS="${NODE_OPTIONS:-} --max-old-space-size=1024"
export PATH="$JAVA_HOME/bin:$PATH"
if [[ ! -x "$JAVA_HOME/bin/javac" ]]; then
  echo 'Set JAVA_HOME to a full JDK with javac before building.' >&2
  exit 1
fi
if [[ ! -f "$mobile_dir/android/gradlew" ]]; then
  echo 'Generate Android first: pnpm exec expo prebuild --platform android --no-install' >&2
  exit 1
fi
cd "$mobile_dir/android"
exec ./gradlew "$build_task" -x lint -x test --no-daemon --max-workers=1 --no-parallel --build-cache --console=plain \
  -I "$mobile_dir/scripts/low-memory.gradle" \
  "-Dorg.gradle.jvmargs=-Xmx1536m -XX:MaxMetaspaceSize=${metadata_mb}m" \
  -Pkotlin.compiler.execution.strategy=in-process \
  -PreactNativeDevServerPort=8081 -PreactNativeArchitectures=arm64-v8a
