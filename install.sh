#!/bin/bash
# Installs the latest Crewdex release into /Applications (or ~/Applications) and opens it.
#   curl -fsSL https://raw.githubusercontent.com/arifinrio95/crewdex/main/install.sh | bash
set -euo pipefail
REPO="arifinrio95/crewdex"
[ "$(uname)" = "Darwin" ] || { echo "Crewdex runs on macOS only."; exit 1; }
VER=$(sw_vers -productVersion); MAJOR=${VER%%.*}
[ "$MAJOR" -ge 13 ] || { echo "Crewdex needs macOS 13.3 or newer (you have $VER)."; exit 1; }
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
echo "Downloading Crewdex…"
curl -fsSL "https://github.com/$REPO/releases/latest/download/Crewdex.zip" -o "$TMP/Crewdex.zip"
ditto -x -k "$TMP/Crewdex.zip" "$TMP"
DEST="/Applications"; [ -w "$DEST" ] || { DEST="$HOME/Applications"; mkdir -p "$DEST"; }
rm -rf "$DEST/Crewdex.app"
ditto "$TMP/Crewdex.app" "$DEST/Crewdex.app"
xattr -dr com.apple.quarantine "$DEST/Crewdex.app" 2>/dev/null || true
echo "Installed $DEST/Crewdex.app"
if ! [ -x "/Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex" ] && ! command -v codex >/dev/null 2>&1; then
  echo "Note: Codex was not found. Install the ChatGPT desktop app or the Codex CLI (npm i -g @openai/codex) and sign in; Crewdex still works as a planner without it."
fi
open "$DEST/Crewdex.app"
