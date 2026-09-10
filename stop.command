#!/bin/bash
# 智能美食搭配助手 - macOS 一键停止（双击本文件运行）

echo "===================================================="
echo "   智能美食搭配助手  -  停止服务"
echo "===================================================="
echo

killed=0
for port in 3001 5173; do
    pids=$(lsof -ti:"$port" -sTCP:LISTEN 2>/dev/null)
    if [ -n "$pids" ]; then
        echo " 停止端口 $port 上的进程: $pids"
        kill $pids 2>/dev/null
        killed=1
    fi
done

sleep 1

if [ "$killed" = "1" ]; then
    echo
    echo " 已停止全部服务，端口 3001 / 5173 已释放"
else
    echo " 没有检测到运行中的服务（端口 3001 / 5173 均空闲）"
fi

echo
read -n 1 -s -r -p "按任意键关闭窗口..."
echo
