@echo off
chcp 65001 >nul
echo MONEO - Build iOS (TestFlight, akun Apple Developer diperlukan)
call npm install
if errorlevel 1 goto fail
call npx eas-cli@latest login
if errorlevel 1 goto fail
call npx eas-cli@latest build --platform ios --profile ios-testflight
if errorlevel 1 goto fail
echo Setelah build berhasil, unggah ke App Store Connect/TestFlight:
echo npx eas-cli@latest submit --platform ios --latest
pause
exit /b 0
:fail
echo Build belum berhasil. Salin pesan error untuk diperiksa.
pause
exit /b 1
