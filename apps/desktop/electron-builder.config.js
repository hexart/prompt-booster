/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
module.exports = {
  appId: 'com.hexart.prompt-booster',
  productName: '提示词增强器',
  copyright: `Copyright © ${new Date().getFullYear()} Hexart Studio`,
  asar: true,
  directories: {
    output: 'release',
    buildResources: 'build',
  },
  files: [
    'dist/**/*',  // 包含所有 dist 目录下的文件
    'package.json',
    'node_modules/'
  ],
  // 注意：我们使用 extraResources 而不是 extraFiles
  // extraResources 会放在应用的 Resources 目录下
  extraResources: [
    {
      from: 'dist/renderer',
      to: 'app/renderer' // 这样会被放在 Resources/app/renderer 目录下
    },
    {
      from: 'public',
      to: 'app/public'
    }
  ],
  extraMetadata: {
    main: 'dist/main.js',
  },
  // 确保在构建前验证所需文件
  beforeBuild: (context) => {
    const fs = require('fs');
    const path = require('path');
    
    // 检查 renderer 目录是否存在
    const rendererPath = path.join(context.appDir, 'dist', 'renderer');
    if (!fs.existsSync(rendererPath)) {
      console.error('错误: dist/renderer 目录不存在!');
      console.error('请先构建渲染器应用');
      process.exit(1);
    }
    
    console.log('✅ 检测到 dist/renderer 目录，继续构建...');
    
    // 检查 index.html 是否存在
    const indexPath = path.join(rendererPath, 'index.html');
    if (!fs.existsSync(indexPath)) {
      console.error('错误: dist/renderer/index.html 文件不存在!');
      process.exit(1);
    }
    
    console.log('✅ 检测到 index.html 文件，继续构建...');
  },
  mac: {
    artifactName: '${productName}_${version}.${ext}',
    target: ['dmg', 'zip'],
    category: 'public.app-category.developer-tools',
    darkModeSupport: true,
    icon: 'build/icon.icns',
    hardenedRuntime: true,
    gatekeeperAssess: false
  },
  dmg: {
    contents: [
      { x: 130, y: 220 },
      { x: 410, y: 220, type: 'link', path: '/Applications' }
    ],
    window: {
      width: 540,
      height: 380
    },
    title: '${productName} ${version}'
  },
  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
    artifactName: '${productName}_${version}.${ext}',
    icon: 'build/icon.ico'
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    deleteAppDataOnUninstall: false
  },
  linux: {
    target: ['AppImage', 'deb'],
    artifactName: '${productName}_${version}.${ext}',
    category: 'Development',
    icon: 'build/icon.png'
  },
  publish: [
    {
      provider: 'github',
      owner: 'hexart',
      repo: 'prompt-booster'
    }
  ]
}