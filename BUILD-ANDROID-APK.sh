#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
npm install
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile android-apk
