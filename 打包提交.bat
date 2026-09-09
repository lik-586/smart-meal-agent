@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

set "OUT=..\智能美食搭配助手-提交包.zip"
if exist "%OUT%" del /f "%OUT%"

echo 正在打包（已排除 node_modules / .git / server/data / dist 等）...
tar -a -cf "%OUT%" --exclude=node_modules --exclude=.git --exclude=server/data --exclude=dist --exclude=.kiro .

if exist "%OUT%" (
    for %%F in ("%OUT%") do echo 已生成：%%~fF
) else (
    echo 打包失败，请确认系统自带 tar 命令可用（Win10/11 自带）
)
echo.
pause
