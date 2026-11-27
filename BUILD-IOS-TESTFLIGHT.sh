#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
npm install
npx eas-cli@latest login
npx eas-cli@latest build --platform ios --profile ios-testflight
printf 'Setelah selesai, jalankan: npx eas-cli@latest submit -p ios --latest\n'
