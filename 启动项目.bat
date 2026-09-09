@echo off
setlocal enabledelayedexpansion
title 智能美食搭配助手 - 启动器
cd /d "%~dp0"

echo.
echo  ====================================================
echo      智能美食搭配助手  -  一键启动
echo  ====================================================
echo.

REM ==========================================================
REM  第 1 步：定位 Node.js
REM ==========================================================
set "NODE_EXE="

where node >nul 2>nul
if !errorlevel!==0 (
    for /f "delims=" %%i in ('where node 2^>nul') do (
        if not defined NODE_EXE set "NODE_EXE=%%i"
    )
)

REM PATH 里没有时，尝试常见的安装位置
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
set "NPM_CMD=!NODE_DIR!npm.cmd"

echo  [1/5] Node.js  : !NODE_EXE!

REM ==========================================================
REM  第 2 步：清理可能残留的旧进程（端口 3001 / 5173）
REM ==========================================================
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3001 " ^| findstr "LISTENING"') do taskkill /f /pid %%p >nul 2>nul
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":5173 " ^| findstr "LISTENING"') do taskkill /f /pid %%p >nul 2>nul

REM ==========================================================
REM  第 3 步：安装依赖（已装过会自动跳过）
REM ==========================================================
if not exist "node_modules\" (
    echo  [2/5] 首次运行，正在安装前端依赖，请稍候...
    call "!NPM_CMD!" install --no-audit --no-fund
    if !errorlevel! neq 0 (
        echo  [X] 前端依赖安装失败，请检查网络后重试
        pause
        exit /b 1
    )
) else (
    echo  [2/5] 前端依赖已存在，跳过安装
)

if not exist "server\node_modules\" (
    echo  [3/5] 首次运行，正在安装后端依赖，请稍候...
    call "!NPM_CMD!" --prefix server install --no-audit --no-fund
    if !errorlevel! neq 0 (
        echo  [X] 后端依赖安装失败，请检查网络后重试
        pause
        exit /b 1
    )
) else (
    echo  [3/5] 后端依赖已存在，跳过安装
)

REM ==========================================================
REM  第 4 步：准备后端配置文件
REM ==========================================================
if not exist "server\.env" (
    if exist "server\.env.example" (
        copy /y "server\.env.example" "server\.env" >nul
        echo  [提示] 已自动生成 server\.env
    )
)

set "NEED_KEY=0"
if exist "server\.env" (
    findstr /C:"your-text-api-key" "server\.env" >nul
    if !errorlevel!==0 set "NEED_KEY=1"
)

echo  [4/5] 配置文件检查完成

REM ==========================================================
REM  第 5 步：启动后端与前端（分别开一个窗口，方便看日志）
REM ==========================================================
echo  [5/5] 正在启动服务...
echo.

start "后端服务 - 3001" cmd /k "cd /d "%~dp0" && "!NPM_CMD!" --prefix server run dev"
timeout /t 2 /nobreak >nul
start "前端服务 - 5173" cmd /k "cd /d "%~dp0" && "!NPM_CMD!" run dev"

echo  正在等待服务就绪，约 10 秒...
timeout /t 10 /nobreak >nul

echo.
echo  ====================================================
echo   启动完成
echo  ----------------------------------------------------
echo    前端页面 :  http://localhost:5173
echo    后端接口 :  http://localhost:3001/api/health
echo    智能体   :  http://localhost:5173/agent
echo  ====================================================
echo.

if "!NEED_KEY!"=="1" (
    echo  [!] 重要：server\.env 里还是占位的 API Key
    echo      请打开 server\.env 填写 TEXT_API_KEY，
    echo      或直接在网页右上角「设置」里填写自己的 Key。
    echo      填好后重启后端窗口（Ctrl+C 后重新执行 npm run server）。
    echo.
)

start "" http://localhost:5173

echo  提示：直接关闭那两个黑色窗口即可停止服务，
echo        也可以双击「停止项目.bat」。
echo.
echo  本窗口可以直接关掉，不影响服务运行。
echo.
pause
