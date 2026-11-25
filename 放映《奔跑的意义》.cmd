@echo off
setlocal
pushd "%~dp0" || exit /b 1
set "FILM_URL="
for /f "delims=" %%U in ('node.exe scripts\start-road-preview.mjs --feature') do set "FILM_URL=%%U"
if not defined FILM_URL (
  pause
  popd
  exit /b 1
)
start "" "%FILM_URL%"
popd
