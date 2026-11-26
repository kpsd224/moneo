@echo off
chcp 65001 >nul
echo MONEO - Build Android APK
call npm install
if errorlevel 1 goto fail
call npx eas-cli@latest login
if errorlevel 1 goto fail
call npx eas-cli@latest build --platform android --profile android-apk
if errorlevel 1 goto fail
echo Jika berhasil, buka link hasil build di Expo dan download APK.
pause
exit /b 0
:fail
echo Build belum berhasil. Salin pesan error untuk diperiksa.
pause
exit /b 1
