@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo 请先安装 Node.js 20 或更高版本，然后重新打开。
  pause
  exit /b 1
)
echo 凌晨两点半 - 请在浏览器打开 http://127.0.0.1:4173
node scripts/serve.mjs
pause
