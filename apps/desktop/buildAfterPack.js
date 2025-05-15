const fs = require('fs');
const path = require('path');

// 多语言配置 - 在这里定义而不是在electron-builder.json中
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
    }
    // 可以添加更多语言
};

exports.default = async (context) => {
    const { electronPlatformName, appOutDir } = context;

    // 只处理macOS平台
    if (electronPlatformName !== 'darwin') {
        return;
    }

    // 获取应用信息
    const { productFilename } = context.packager.appInfo;

    // 应用资源目录路径
    const resPath = path.join(appOutDir, `${productFilename}.app/Contents/Resources/`);

    console.log('\n> 创建语言资源文件...');

    // 为每种语言创建InfoPlist.strings文件
    for (const langKey in languageConfig) {
        const langConfig = languageConfig[langKey];

        // 创建语言目录路径，例如 zh_CN.lproj
        const langDirPath = path.join(resPath, `${langKey}.lproj`);
        if (!fs.existsSync(langDirPath)) {
            fs.mkdirSync(langDirPath, { recursive: true });
        }

        // 生成InfoPlist.strings内容
        let infoPlistContent = '';
        for (const key in langConfig) {
            infoPlistContent += `"${key}" = "${langConfig[key]}";\n`;
        }

        // 写入InfoPlist.strings文件
        const infoPlistPath = path.join(langDirPath, 'InfoPlist.strings');
        fs.writeFileSync(infoPlistPath, infoPlistContent, 'utf8');

        console.log(`  - 已创建 ${langKey} 语言资源文件`);
    }
};