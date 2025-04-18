const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const electron = process.platform === 'darwin'
    ? path.join(__dirname, '..', '..', 'node_modules', 'electron', 'Electron.app', 'Contents', 'MacOS', 'Electron')
    : path.join(__dirname, '..', '..', 'node_modules', 'electron', process.platform === 'win32' ? 'electron.exe' : 'electron');
const { createServer } = require('vite');

// Set environment variables
process.env.NODE_ENV = 'development';
process.env.VITE_DEV_SERVER_URL = 'http://localhost:5173';

async function startApp() {
    console.log('===== Starting Prompt Optimizer Electron App =====');

    // Create dist directory if it doesn't exist
    const electronDistDir = path.join(__dirname, 'dist');
    if (!fs.existsSync(electronDistDir)) {
        fs.mkdirSync(electronDistDir, { recursive: true });
    }

    try {
        // Compile TypeScript files for main process
        console.log('🔨 Compiling TypeScript for Electron...');
        execSync('npx tsc -p electron/tsconfig.json', { stdio: 'inherit' });

        // Check if compiled files exist
        const mainJsPath = path.join(electronDistDir, 'main.js');
        const preloadJsPath = path.join(electronDistDir, 'preload.js');

        if (fs.existsSync(mainJsPath)) {
            console.log('✅ main.js generated at:', mainJsPath);
        } else {
            console.error('❌ main.js not generated');
            process.exit(1);
        }

        if (fs.existsSync(preloadJsPath)) {
            console.log('✅ preload.js generated at:', preloadJsPath);
        } else {
            console.error('❌ preload.js not generated');
            process.exit(1);
        }

        // Inject electron-reloader if needed
        let mainContent = fs.readFileSync(mainJsPath, 'utf8');
        if (!mainContent.includes('electron-reloader')) {
            console.log('📝 Injecting hot-reload code to main.js...');
            const reloaderCode = `
// Add hot reload support
if (process.env.NODE_ENV === 'development') {
  try {
    const reloader = require('electron-reloader');
    reloader(module, {
      debug: true,
      watchRenderer: false,
      ignore: [
        /node_modules/,
        /dist\\/renderer/,
        /release/
      ]
    });
    console.log('✅ Hot reload activated');
  } catch (err) {
    console.log('❌ Error setting up electron-reloader:', err);
  }
}
`;
            // Insert reloader code after the imports
            const importEndIndex = mainContent.indexOf('const currentDir') || mainContent.indexOf('// 禁用生产环境警告');
            if (importEndIndex !== -1) {
                mainContent = mainContent.slice(0, importEndIndex) + reloaderCode + mainContent.slice(importEndIndex);
                fs.writeFileSync(mainJsPath, mainContent);
                console.log('✅ Hot reload code injected');
            } else {
                console.warn('⚠️ Could not find appropriate location to inject hot reload code');
            }
        } else {
            console.log('✅ main.js already includes hot reload code');
        }

        // Create Vite dev server
        console.log('🚀 Starting Vite dev server...');

        // Important: We need to use the web app's directory for proper HMR and style loading
        const webAppDir = path.join(__dirname, '..', 'web');

        // Check if web app directory exists
        if (!fs.existsSync(webAppDir)) {
            console.error(`❌ Web app directory not found at: ${webAppDir}`);
            console.error('Make sure the web app is in the correct location relative to the desktop app');
            process.exit(1);
        }

        // Change to web app directory to properly load styles and assets
        process.chdir(webAppDir);
        console.log(`📂 Changed working directory to: ${webAppDir}`);

        // Create Vite server using the web app's config
        const server = await createServer({
            configFile: path.join(webAppDir, 'vite.config.ts'),
            root: webAppDir,
            server: {
                port: 5173,
                strictPort: true,
                hmr: true,
            }
        });

        await server.listen();
        console.log('✅ Vite dev server running at http://localhost:5173');

        // Change back to desktop directory
        process.chdir(__dirname);

        // Wait for Vite server to be ready
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Start Electron app
        console.log('🔌 Starting Electron...');
        const electronProc = spawn(electron, ['.'], {
            stdio: 'inherit',
            env: {
                ...process.env,
                ELECTRON_ENABLE_LOGGING: '1',
                ELECTRON_ENABLE_STACK_DUMPING: '1',
            }
        });

        electronProc.on('close', (code) => {
            console.log(`Electron process exited with code: ${code}`);
            // 仅在正常退出时关闭服务器并退出
            if (code === 0) {
                server.close();
                process.exit(0);
            } else {
                console.log('Electron 异常退出，准备重启...');
                // 可以选择在这里重启 Electron
                // 或者保持服务器运行，允许手动重启
            }
        });

        // 添加全局异常处理
        process.on('uncaughtException', (error) => {
            console.error('未捕获的异常:', error);
            // 不立即退出，让开发环境继续运行
        });

        // Handle process termination
        process.on('SIGINT', () => {
            console.log('Received SIGINT, shutting down...');
            server.close();
            electronProc.kill();
            process.exit(0);
        });

    } catch (err) {
        console.error('Error starting application:', err);
        process.exit(1);
    }
}

startApp();