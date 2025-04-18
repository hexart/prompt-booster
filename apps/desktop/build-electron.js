const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 配置
const electronDistDir = path.join(__dirname, 'dist');
const electronMainDir = path.join(__dirname, 'electron');
const buildResourcesDir = path.join(__dirname, 'build');
const publicDir = path.join(__dirname, 'public');

console.log('⚡ Electron 构建过程开始');

// 1. 确保dist目录存在
if (!fs.existsSync(electronDistDir)) {
    fs.mkdirSync(electronDistDir, { recursive: true });
}

// 2. 确保build目录存在
if (!fs.existsSync(buildResourcesDir)) {
    fs.mkdirSync(buildResourcesDir, { recursive: true });
}

// 3. 确保public目录存在
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

// 4. 编译Electron主进程代码
console.log('🔨 编译 Electron 主进程代码...');
try {
    // 编译TypeScript文件
    execSync('npx tsc -p electron/tsconfig.json', { stdio: 'inherit' });
    console.log('✅ 主进程编译完成');
} catch (error) {
    console.error('❌ 编译主进程文件失败:', error);
    process.exit(1);
}

// 5. 检查和复制图标文件
console.log('📂 检查应用图标...');
const defaultIcon = path.join(__dirname, 'build/icon.png');
if (!fs.existsSync(defaultIcon)) {
    console.log('⚠️ 未找到图标文件, 创建默认图标...');
    
    // 复制示例图标或创建简单的默认图标
    try {
        console.log('请确保在build目录中有icon.png, icon.icns (macOS), icon.ico (Windows)');
    } catch (err) {
        console.warn('无法创建默认图标:', err);
    }
}

// 6. 将图标复制到public目录用于标题栏显示
if (fs.existsSync(defaultIcon) && !fs.existsSync(path.join(publicDir, 'icon.png'))) {
    try {
        fs.copyFileSync(defaultIcon, path.join(publicDir, 'icon.png'));
        console.log('✅ 已复制图标到public目录');
    } catch (err) {
        console.warn('无法复制图标到public目录:', err);
    }
}

// 7. 处理生产环境配置
if (process.env.NODE_ENV === 'production') {
    console.log('🔧 配置生产环境...');
    
    // 确保package.json中的main指向正确路径
    try {
        const packageJsonPath = path.join(__dirname, 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        if (packageJson.main !== 'dist/main.js') {
            packageJson.main = 'dist/main.js';
            fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
            console.log('✅ 已更新package.json中的main路径');
        }
    } catch (err) {
        console.warn('无法更新package.json:', err);
    }
}

// 8. 确保渲染进程的构建输出存在
const rendererDist = path.join(electronDistDir, 'renderer');
if (!fs.existsSync(rendererDist)) {
    console.log('📂 创建渲染进程输出目录...');
    fs.mkdirSync(rendererDist, { recursive: true });
}

// 9. 完成
console.log('🚀 Electron 构建准备完成!');
console.log('  下一步:');
console.log('  - 运行 "pnpm run electron:build" 创建完整的应用程序包');
console.log('  - 运行 "pnpm run electron:build:mac" 创建macOS应用程序包');
console.log('  - 运行 "pnpm run electron:build:win" 创建Windows应用程序包');
console.log('  - 运行 "pnpm run electron:build:linux" 创建Linux应用程序包');