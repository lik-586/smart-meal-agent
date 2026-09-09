@echo off
setlocal enabledelayedexpansion
title 智能美食搭配助手 - 停止服务
cd /d "%~dp0"

echo.
echo  正在停止智能美食搭配助手...
echo.

set "KILLED=0"

for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3001 " ^| findstr "LISTENING"') do (
    echo  停止后端进程 PID=%%p
    taskkill /f /pid %%p >nul 2>nul
    set "KILLED=1"
)

for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":5173 " ^| findstr "LISTENING"') do (
    echo  停止前端进程 PID=%%p
    taskkill /f /pid %%p >nul 2>nul
    set "KILLED=1"
)

REM 兜底：结束由启动器打开的标题窗口
taskkill /f /fi "WINDOWTITLE eq 后端服务 - 3001*" >nul 2>nul
taskkill /f /fi "WINDOWTITLE eq 前端服务 - 5173*" >nul 2>nul

if "!KILLED!"=="0" (
    echo  没有发现正在运行的服务（端口 3001 / 5173 均空闲）。
) else (
    echo.
    echo  已停止。
)

echo.
pause
