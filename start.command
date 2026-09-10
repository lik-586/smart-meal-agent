#!/bin/bash
# 智能美食搭配助手 - macOS 一键启动（双击本文件运行）

# 切换到脚本所在目录（即项目根目录）
cd "$(dirname "$0")"

echo "===================================================="
echo "   智能美食搭配助手  -  一键启动"
echo "===================================================="
echo

# ==========================================================
# 第 1 步：检测 Node.js
# ==========================================================
if ! command -v node >/dev/null 2>&1; then
    echo " [X] 未检测到 Node.js，请先安装 Node.js 18 或更高版本"
    echo "     https://nodejs.org/zh-cn/download"
    echo
    read -n 1 -s -r -p "按任意键退出..."
    echo
    exit 1
fi
echo " [1/5] Node.js: $(node -v) ($(command -v node))"

# ==========================================================
# 第 2 步：清理端口 3001 / 5173 上的残留进程
# ==========================================================
for port in 3001 5173; do
    pids=$(lsof -ti:"$port" -sTCP:LISTEN 2>/dev/null)
    if [ -n "$pids" ]; then
        echo " [2/5] 清理端口 $port 上的旧进程: $pids"
        kill $pids 2>/dev/null
    fi
done

# ==========================================================
# 第 3 步：安装前端依赖（缺失时自动安装）
# ==========================================================
if [ ! -d "node_modules" ]; then
    echo " [3/5] 首次运行，正在安装前端依赖（可能需要几分钟）..."
    npm install --no-audit --no-fund
    if [ $? -ne 0 ]; then
        echo " [X] 前端依赖安装失败，请检查网络后重试"
        read -n 1 -s -r -p "按任意键退出..."
        echo
        exit 1
    fi
else
    echo " [3/5] 前端依赖已存在，跳过安装"
fi

# ==========================================================
# 第 4 步：安装后端依赖（缺失时自动安装）
# ==========================================================
if [ ! -d "server/node_modules" ]; then
    echo " [4/5] 首次运行，正在安装后端依赖（可能需要几分钟）..."
    npm --prefix server install --no-audit --no-fund
    if [ $? -ne 0 ]; then
        echo " [X] 后端依赖安装失败，请检查网络后重试"
        read -n 1 -s -r -p "按任意键退出..."
        echo
        exit 1
    fi
else
    echo " [4/5] 后端依赖已存在，跳过安装"
fi

# ==========================================================
# 第 5 步：准备配置文件 server/.env
# ==========================================================
if [ ! -f "server/.env" ] && [ -f "server/.env.example" ]; then
    cp "server/.env.example" "server/.env"
    echo " [提示] 已自动生成 server/.env（请按需填入 API Key）"
fi

echo " [5/5] 正在启动前后端..."
echo
echo "  前端页面 : http://localhost:5173"
echo "  后端接口 : http://localhost:3001/api/health"
echo "  智能体   : http://localhost:5173/agent"
echo
echo "  ------------------------------------------"
echo "   按 Ctrl+C 可停止前后端服务"
echo "   或双击「停止项目.command」一键停止"
echo "  ------------------------------------------"
echo

# 后台延迟打开浏览器（等 Vite 就绪）
( sleep 4; open http://localhost:5173 ) &

# 前台运行，便于查看日志、Ctrl+C 停止
npm run dev:all
