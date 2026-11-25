@echo off
setlocal
pushd "%~dp0" || exit /b 1
set "RESCUE_URL="
for /f "delims=" %%U in ('node.exe scripts\start-road-preview.mjs --rescue') do set "RESCUE_URL=%%U"
if not defined RESCUE_URL (
  pause
  popd
  exit /b 1
)
start "" "%RESCUE_URL%"
popd
