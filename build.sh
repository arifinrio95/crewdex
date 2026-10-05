#!/bin/zsh
# Builds Crewdex.app into ./build and (with --install) copies it to ~/Applications.
set -e
cd "${0:A:h}"
APP=build/Crewdex.app
rm -rf "$APP"; mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
# universal binary: Apple Silicon and Intel
for ARCH in arm64 x86_64; do
  swiftc -O -target $ARCH-apple-macos13.3 Sources/*.swift -o "build/Crewdex-$ARCH" \
    -framework Cocoa -framework WebKit -framework Quartz -framework QuickLookThumbnailing -framework UserNotifications
done
lipo -create build/Crewdex-arm64 build/Crewdex-x86_64 -output "$APP/Contents/MacOS/Crewdex"; rm build/Crewdex-arm64 build/Crewdex-x86_64
cp Info.plist "$APP/Contents/Info.plist"
cp -R web "$APP/Contents/Resources/web"
if [ ! -f build/AppIcon.icns ]; then
  swift scripts/icon.swift build/AppIcon.iconset >/dev/null && iconutil -c icns build/AppIcon.iconset -o build/AppIcon.icns
fi
cp build/AppIcon.icns "$APP/Contents/Resources/AppIcon.icns"
codesign --force --deep -s - "$APP" >/dev/null 2>&1 || true
echo "Built $APP"
if [[ "$1" == "--zip" ]]; then
  rm -f build/Crewdex.zip; ditto -c -k --keepParent "$APP" build/Crewdex.zip; echo "Zipped build/Crewdex.zip"
fi
if [[ "$1" == "--install" ]]; then
  mkdir -p ~/Applications; rm -rf ~/Applications/Crewdex.app; cp -R "$APP" ~/Applications/Crewdex.app; echo "Installed ~/Applications/Crewdex.app"
fi
