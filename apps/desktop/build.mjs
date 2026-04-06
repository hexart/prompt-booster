import { packager } from '@electron/packager';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 多语言配置
const languageConfig = {
  'en': {
    'CFBundleDisplayName': 'Prompt Booster',
    'CFBundleName': 'Prompt Booster'
  },
  'zh_CN': {
    'CFBundleDisplayName': '提示词增强',
    'CFBundleName': '提示词增强'
  },
  'zh_TW': {
    'CFBundleDisplayName': '提示詞增強',
    'CFBundleName': '提示詞增強'
  },
  'ja': {
    'CFBundleDisplayName': 'プロンプトブースター',
    'CFBundleName': 'プロンプトブースター'
  },
  'ko': {
    'CFBundleDisplayName': '프롬프트 부스터',
    'CFBundleName': '프롬프트 부스터'
  },
  'de': {
    'CFBundleDisplayName': 'Prompt Booster',
    'CFBundleName': 'Prompt Booster'
  },
  'nl': {
    'CFBundleDisplayName': 'Prompt Booster',
    'CFBundleName': 'Prompt Booster'
  },
  'ru': {
    'CFBundleDisplayName': 'Prompt Booster',
    'CFBundleName': 'Улучшитель Запросов'
  },
  'es': {
    'CFBundleDisplayName': 'Prompt Booster',
    'CFBundleName': 'Potenciador de Prompts'
  },
  'fr': {
    'CFBundleDisplayName': 'Prompt Booster',
    'CFBundleName': 'Amplificateur de Prompts'
  },
  'ar': {
    'CFBundleDisplayName': 'Prompt Booster',
    'CFBundleName': 'معزز النصوص'
  },
  'pt_BR': {
    'CFBundleDisplayName': 'Prompt Booster',
    'CFBundleName': 'Potenciador de Prompts'
  },
  'hi': {
    'CFBundleDisplayName': 'Prompt Booster',
    'CFBundleName': 'प्रॉम्प्ट बूस्टर'
  }
};

// 解析命令行参数
const args = process.argv.slice(2);
const platformArg = args.includes('--mac') ? 'darwin' : args.includes('--win') ? 'win32' : args.includes('--linux') ? 'linux' : null;

// 公共选项
const commonOpts = {
  name: 'Prompt Booster',
  appCopyright: 'Copyright © 2026 Hexart Studio',
  appBundleId: 'com.hexart.promptbooster',
  appCategoryType: 'public.app-category.utilities',
  executableName: 'prompt-booster',
  asar: false,
  overwrite: true,
  electronVersion: '41.1.1',
  dir: __dirname,
  out: path.join(__dirname, 'release'),
  ignore: (file) => {
    // 始终保留这些文件/目录
    if (file === '/main.js' || file === '/preload.js' || file === '/package.json') return false;
    if (file.startsWith('/web')) return false;  // 保留 web 目录
    // 排除构建相关
    if (/\.map$/.test(file)) return true;
    if (/\.git($|\/)/.test(file)) return true;
    if (/^\/\.vscode$/.test(file)) return true;
    if (/^\/\.DS_Store$/.test(file)) return true;
    if (/^\/src$/.test(file)) return true;
    if (/^\/build\.mjs$/.test(file)) return true;
    if (/^\/release$/.test(file)) return true;
    // 排除 desktop/node_modules 中不需要的包
    if (/^\/node_modules\/.*\/test/.test(file)) return true;
    if (/^\/node_modules\/.*\/docs/.test(file)) return true;
    return false;
  }
};

// macOS afterCopy hook - 创建多语言文件
const macAfterCopyFull = [async (opts) => {
  const { buildPath } = opts;
  const productName = 'Prompt Booster';
  const resPath = path.join(buildPath, `${productName}.app/Contents/Resources/`);

  console.log('\n> 创建语言资源文件...');
  for (const langKey in languageConfig) {
    const langConfig = languageConfig[langKey];
    const langDirPath = path.join(resPath, `${langKey}.lproj`);
    if (!fs.existsSync(langDirPath)) {
      fs.mkdirSync(langDirPath, { recursive: true });
    }

    let infoPlistContent = '';
    for (const key in langConfig) {
      infoPlistContent += `"${key}" = "${langConfig[key]}";\n`;
    }

    const infoPlistPath = path.join(langDirPath, 'InfoPlist.strings');
    fs.writeFileSync(infoPlistPath, infoPlistContent, 'utf8');
    console.log(`  - 已创建 ${langKey} 语言资源文件`);
  }
}];

// macOS 特定选项
const macOpts = {
  platform: 'darwin',
  arch: 'universal',
  icon: path.join(__dirname, 'build/icon.icns'),
  extendInfo: {
    LSHasLocalizedDisplayName: true
  },
  afterCopy: macAfterCopyFull
};

// Windows 特定选项
const winOpts = {
  platform: 'win32',
  arch: 'x64',
  icon: path.join(__dirname, 'build/icon.ico')
};

// Linux 特定选项
const linuxOpts = {
  platform: 'linux',
  arch: 'x64',
  icon: path.join(__dirname, 'build/icons'),
  synopsis: '提升你的提示词输入效率',
  description: 'Prompt Booster 是一款提升AI提示词输入效率的跨平台工具'
};

// 选择对应的选项
let opts;
switch (platformArg) {
  case 'darwin':
    opts = { ...commonOpts, ...macOpts };
    break;
  case 'win32':
    opts = { ...commonOpts, ...winOpts };
    break;
  case 'linux':
    opts = { ...commonOpts, ...linuxOpts };
    break;
  default:
    console.log('> 开始打包 Prompt Booster...\n');
    const results = await Promise.all([
      packager({ ...commonOpts, ...macOpts }),
      packager({ ...commonOpts, ...winOpts }),
      packager({ ...commonOpts, ...linuxOpts })
    ]);
    console.log('\n> 打包完成!');
    console.log(`  macOS: ${results[0]}`);
    console.log(`  Windows: ${results[1]}`);
    console.log(`  Linux: ${results[2]}`);
    process.exit(0);
}

console.log(`> 正在打包 ${platformArg}...`);

try {
  const appPath = await packager(opts);
  console.log(`\n> 打包完成: ${appPath}`);
} catch (err) {
  console.error('> 打包失败:', err);
  process.exit(1);
}
