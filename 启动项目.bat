@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title 智能美食搭配助手
cd /d "%~dp0"

echo.
echo  ====================================================
echo      智能美食搭配助手  -  一键启动（单窗口）
echo  ====================================================
echo.

REM ==========================================================
REM  定位 Node.js
REM ==========================================================
set "NODE_EXE="

where node >nul 2>nul
if !errorlevel!==0 (
    for /f "delims=" %%i in ('where node 2^>nul') do (
        if not defined NODE_EXE set "NODE_EXE=%%i"
    )
)

if not defined NODE_EXE (
    for /d %%d in ("%USERPROFILE%\.workbuddy\binaries\node\versions\*") do (
        if exist "%%d\node.exe" set "NODE_EXE=%%d\node.exe"
    )
)
if not defined NODE_EXE (
    if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" set "NODE_EXE=%LOCALAPPDATA%\Programs\nodejs\node.exe"
)
if not defined NODE_EXE (
    if exist "C:\Program Files\nodejs\node.exe" set "NODE_EXE=C:\Program Files\nodejs\node.exe"
)

if not defined NODE_EXE (
    echo  [X] 没有检测到 Node.js 运行环境
    echo.
    echo      请先安装 Node.js 18 或更高版本：
    echo        https://nodejs.org/zh-cn/download
    echo.
    echo      安装时勾选 "Add to PATH"，装好后重新双击本文件。
    echo.
    pause
    exit /b 1
)

for %%i in ("!NODE_EXE!") do set "NODE_DIR=%%~dpi"
set "PATH=!NODE_DIR!;!PATH!"

echo  Node.js : !NODE_EXE!
echo  后端与前端会在本窗口内一起启动，日志统一显示在这里。
echo  （停止服务：在本窗口按 Ctrl + C；若出现 Y/N 提示，输入 Y 回车）
echo.

REM ==========================================================
REM  单窗口启动：依赖安装 + 后端(3001) + 前端(5173)
REM  服务停止后（Ctrl+C）才会回到下面的提示
REM ==========================================================
"!NODE_EXE!" "%~dp0scripts\start.js"

echo.
echo  服务已停止。
echo     - 重新运行：双击本文件，或执行 npm start
echo     - 如需强制结束：双击「停止项目.bat」
echo.
pause
