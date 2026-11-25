@echo off
setlocal
pushd "%~dp0" || exit /b 1
set "ROAD_PREVIEW_URL="
for /f "delims=" %%U in ('node.exe scripts\start-road-preview.mjs') do set "ROAD_PREVIEW_URL=%%U"
if not defined ROAD_PREVIEW_URL (
  pause
  popd
  exit /b 1
)
start "" "%ROAD_PREVIEW_URL%"
popd
