#!/bin/bash
# Builds the debug APK on the aarch64 sandbox. Toolchain lives in /tmp/tc (re-downloaded if missing).
set -e
TC=/tmp/tc; mkdir -p $TC; cd $TC
if ! ls -d $TC/jdk-17* >/dev/null 2>&1; then curl -sL -o jdk.tgz "https://api.adoptium.net/v3/binary/latest/17/ga/linux/aarch64/jdk/hotspot/normal/eclipse" && tar xzf jdk.tgz && rm jdk.tgz; fi
[ -d gradle-8.9 ] || { curl -sL -o g.zip https://services.gradle.org/distributions/gradle-8.9-bin.zip && unzip -q g.zip && rm g.zip; }
if [ ! -d sdk/platforms/android-34 ]; then mkdir -p sdk/platforms && curl -sL -o p.zip https://dl.google.com/android/repository/platform-34-ext7_r03.zip && unzip -q p.zip -d sdk/platforms && mv sdk/platforms/android-34* sdk/platforms/android-34 2>/dev/null || true; rm -f p.zip; fi
if [ ! -d sdk/build-tools/34.0.0 ]; then mkdir -p sdk/build-tools && curl -sL -o b.zip https://dl.google.com/android/repository/build-tools_r34-linux.zip && unzip -q b.zip -d sdk/build-tools && mv sdk/build-tools/android-* sdk/build-tools/34.0.0 && rm b.zip
  curl -sL -o t.zip https://github.com/lzhiyong/android-sdk-tools/releases/download/35.0.2/android-sdk-tools-static-aarch64.zip && unzip -q -o t.zip -d armtools && rm t.zip && cp armtools/build-tools/* sdk/build-tools/34.0.0/ && chmod +x sdk/build-tools/34.0.0/*; fi
export JAVA_HOME=$(ls -d $TC/jdk-17*) PATH=$(ls -d $TC/jdk-17*)/bin:$PATH
rm -rf /tmp/build && cp -r "$1" /tmp/build && cd /tmp/build
echo "sdk.dir=$TC/sdk" > local.properties
echo "android.aapt2FromMavenOverride=$TC/sdk/build-tools/34.0.0/aapt2" >> gradle.properties
$TC/gradle-8.9/bin/gradle assembleDebug --no-daemon --console=plain -q
ls -la /tmp/build/app/build/outputs/apk/debug/app-debug.apk
