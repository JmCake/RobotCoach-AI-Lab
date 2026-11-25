@echo off
setlocal
pushd "%~dp0" || exit /b 1
set "STORY_PREVIEW_URL="
for /f "delims=" %%U in ('node.exe scripts\start-road-preview.mjs --story') do set "STORY_PREVIEW_URL=%%U"
if not defined STORY_PREVIEW_URL (
  pause
  popd
  exit /b 1
)
start "" "%STORY_PREVIEW_URL%"
popd
