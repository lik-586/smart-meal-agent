@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title 智能美食搭配助手 - 停止服务
cd /d "%~dp0"

echo.
echo  正在停止智能美食搭配助手...
echo.

set "KILLED=0"

for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3001 " ^| findstr "LISTENING"') do (
    echo  停止后端进程 PID=%%p
    taskkill /f /t /pid %%p >nul 2>nul
    set "KILLED=1"
)

for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":5173 " ^| findstr "LISTENING"') do (
    echo  停止前端进程 PID=%%p
    taskkill /f /t /pid %%p >nul 2>nul
    set "KILLED=1"
)

if "!KILLED!"=="0" (
    echo  没有发现正在运行的服务（端口 3001 / 5173 均空闲）。
) else (
    echo.
    echo  已停止。
)

echo.
echo  提示：正常情况下在启动窗口按 Ctrl + C 即可停止服务。
echo.
pause
