#!/usr/bin/env node
/**
 * 单窗口启动器
 * ------------------------------------------------------------------
 * 在同一个终端里同时拉起后端（3001）与前端（5173）：
 *   - 首次运行自动安装前后端依赖
 *   - 自动准备 server\.env
 *   - 两个服务的日志合并输出到当前窗口，并用前缀区分
 *   - 服务就绪后自动打开浏览器
 *   - Ctrl + C 一次性停掉全部服务（含子进程）
 *
 * 手动执行：node scripts/start.js   或   npm start
 */

const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SERVER_DIR = path.join(ROOT, 'server');
const WEB_PORT = 5173;
const API_PORT = 3001;
const IS_WIN = process.platform === 'win32';

/** npm 不一定在 PATH 里，优先使用 node 同目录下的那个 */
function resolveNpm() {
    const nodeDir = path.dirname(process.execPath);
    const candidate = IS_WIN ? path.join(nodeDir, 'npm.cmd') : path.join(nodeDir, 'npm');
    if (fs.existsSync(candidate)) return candidate;
    return IS_WIN ? 'npm.cmd' : 'npm';
}

const NPM = resolveNpm();

/** 保证 npm 脚本内部调用的 node 也能被找到 */
const NODE_DIR = path.dirname(process.execPath);
if (!String(process.env.PATH || '').toLowerCase().includes(NODE_DIR.toLowerCase())) {
    process.env.PATH = `${NODE_DIR}${IS_WIN ? ';' : ':'}${process.env.PATH || ''}`;
}

const C = {
    green: '\x1b[32m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    gray: '\x1b[90m',
    reset: '\x1b[0m',
};

const line = (text = '') => console.log(text);
const info = (text) => console.log(`${C.cyan}[启动器]${C.reset} ${text}`);
const ok = (text) => console.log(`${C.green}[启动器]${C.reset} ${text}`);
const warn = (text) => console.log(`${C.yellow}[启动器]${C.reset} ${text}`);
const fail = (text) => console.log(`${C.red}[启动器]${C.reset} ${text}`);

/* ------------------------------------------------------------------ */
/* 端口处理                                                            */
/* ------------------------------------------------------------------ */

function listeningPids(port) {
    const out = spawnSync('netstat', ['-ano', '-p', 'tcp'], { encoding: 'utf8' });
    const pids = new Set();
    const re = new RegExp(`:${port}\\s`);
    for (const raw of String(out.stdout || '').split(/\r?\n/)) {
        if (!re.test(raw) || !/LISTENING/i.test(raw)) continue;
        const pid = raw.trim().split(/\s+/).pop();
        if (/^\d+$/.test(pid) && pid !== '0' && pid !== '4') pids.add(pid);
    }
    return [...pids];
}

/** 清理占用端口的残留进程，避免启动时报端口被占用 */
function killPort(port) {
    let killed = 0;
    if (IS_WIN) {
        for (const pid of listeningPids(port)) {
            spawnSync('taskkill', ['/f', '/t', '/pid', pid], { stdio: 'ignore' });
            killed++;
        }
    } else {
        const r = spawnSync('sh', ['-c', `lsof -ti tcp:${port} | xargs -r kill -9`], { stdio: 'ignore' });
        killed = r.status === 0 ? 1 : 0;
    }
    if (killed > 0) info(`已清理占用端口 ${port} 的残留进程`);
    return killed;
}

function waitForPort(port, timeoutMs, isAlive) {
    const deadline = Date.now() + timeoutMs;
    return new Promise((resolve) => {
        const tryOnce = () => {
            if (!isAlive()) return resolve(false);
            if (Date.now() > deadline) return resolve(false);
            const socket = net.connect({ port, host: '127.0.0.1' });
            socket.setTimeout(800);
            const done = (result) => {
                socket.destroy();
                resolve(result);
            };
            socket.once('connect', () => done(true));
            socket.once('timeout', () => {
                socket.destroy();
                setTimeout(tryOnce, 400);
            });
            socket.once('error', () => setTimeout(tryOnce, 400));
        };
        tryOnce();
    });
}

/* ------------------------------------------------------------------ */
/* 依赖与环境                                                          */
/* ------------------------------------------------------------------ */

function installDeps(dir, label) {
    if (fs.existsSync(path.join(dir, 'node_modules'))) {
        ok(`${label}依赖已存在，跳过安装`);
        return true;
    }
    info(`首次运行，正在安装${label}依赖，请稍候...`);
    const r = spawnSync(NPM, ['install', '--no-audit', '--no-fund'], {
        cwd: dir,
        stdio: 'inherit',
        shell: IS_WIN,
    });
    if (r.status !== 0) {
        fail(`${label}依赖安装失败，请检查网络后重试`);
        return false;
    }
    ok(`${label}依赖安装完成`);
    return true;
}

function prepareEnv() {
    const envFile = path.join(SERVER_DIR, '.env');
    if (!fs.existsSync(envFile) && fs.existsSync(`${envFile}.example`)) {
        fs.copyFileSync(`${envFile}.example`, envFile);
        ok('已自动生成 server\\.env');
    }
    if (fs.existsSync(envFile)) {
        const content = fs.readFileSync(envFile, 'utf8');
        if (content.includes('your-text-api-key')) return true;
    }
    return false;
}

/* ------------------------------------------------------------------ */
/* 子进程管理                                                          */
/* ------------------------------------------------------------------ */

const children = [];

function pipeOutput(child, prefix, color) {
    const bind = (stream, out) => {
        let buffer = '';
        stream.setEncoding('utf8');
        stream.on('data', (chunk) => {
            buffer += chunk;
            const parts = buffer.split(/\r?\n/);
            buffer = parts.pop();
            for (const text of parts) out.write(`${color}[${prefix}]${C.reset} ${text}\n`);
        });
        stream.on('end', () => {
            if (buffer.trim()) out.write(`${color}[${prefix}]${C.reset} ${buffer}\n`);
        });
    };
    bind(child.stdout, process.stdout);
    bind(child.stderr, process.stderr);
}

function launch(label, color, cwd) {
    const child = spawn(NPM, ['run', 'dev'], {
        cwd,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: IS_WIN,
        env: { ...process.env, FORCE_COLOR: process.env.FORCE_COLOR || '1' },
    });
    child.label = label;
    child.alive = true;
    child.on('exit', (code) => {
        child.alive = false;
        fail(`${label}服务已退出（code=${code}）`);
        shutdown(code === 0 ? 1 : 1);
    });
    pipeOutput(child, label, color);
    children.push(child);
    return child;
}

function killTree(child) {
    if (!child || !child.alive || child.exitCode !== null) return;
    try {
        if (IS_WIN) {
            spawnSync('taskkill', ['/f', '/t', '/pid', String(child.pid)], { stdio: 'ignore' });
        } else {
            try {
                process.kill(-child.pid, 'SIGTERM');
            } catch {
                child.kill('SIGTERM');
            }
        }
    } catch {
        /* 忽略：进程可能已经退出 */
    }
}

let shuttingDown = false;
function shutdown(code) {
    if (shuttingDown) return;
    shuttingDown = true;
    for (const child of children) killTree(child);
    setTimeout(() => process.exit(code), 200);
}

process.on('SIGINT', () => {
    line();
    info('正在停止服务...');
    shutdown(0);
});
process.on('SIGTERM', () => shutdown(0));
process.on('SIGHUP', () => shutdown(0));

function openBrowser(url) {
    const cmd = IS_WIN ? `start "" "${url}"` : process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`;
    spawn(cmd, { shell: true, stdio: 'ignore', detached: !IS_WIN });
}

/* ------------------------------------------------------------------ */
/* 主流程                                                              */
/* ------------------------------------------------------------------ */

async function main() {
    line();
    line('  ====================================================');
    line('     智能美食搭配助手  -  一键启动（单窗口）');
    line('  ====================================================');
    line();

    killPort(API_PORT);
    killPort(WEB_PORT);

    if (!installDeps(ROOT, '前端')) process.exit(1);
    if (!installDeps(SERVER_DIR, '后端')) process.exit(1);

    const needKey = prepareEnv();

    info('正在启动后端与前端...');
    line();

    const backend = launch('后端', C.green, SERVER_DIR);
    const frontend = launch('前端', C.cyan, ROOT);

    const backendUp = await waitForPort(API_PORT, 60000, () => backend.alive);
    const frontendUp = await waitForPort(WEB_PORT, 60000, () => frontend.alive);

    if (!backendUp || !frontendUp) {
        fail('服务启动超时，请查看上方日志');
        shutdown(1);
        return;
    }

    line();
    line('  ====================================================');
    ok(`前端页面 :  http://localhost:${WEB_PORT}`);
    ok(`后端接口 :  http://localhost:${API_PORT}/api/health`);
    ok(`智能体   :  http://localhost:${WEB_PORT}/agent`);
    line('  ----------------------------------------------------');
    info('按 Ctrl + C 可一次性停止全部服务');
    line('  ====================================================');
    line();

    if (needKey) {
        warn('server\\.env 里仍是占位 API Key，可在网页右上角「设置」中填写自己的 Key');
        line();
    }

    openBrowser(`http://localhost:${WEB_PORT}`);
}

main().catch((err) => {
    fail(String(err && err.message ? err.message : err));
    shutdown(1);
});
