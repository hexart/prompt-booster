const { notarize } = require('electron-notarize');
const { build } = require('../package.json');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  
  // 仅在macOS上执行公证
  if (electronPlatformName !== 'darwin') {
    return;
  }
  
  // 检查是否配置了Apple ID环境变量
  if (!process.env.APPLE_ID || !process.env.APPLE_ID_PASSWORD) {
    console.log('跳过公证: 未设置APPLE_ID或APPLE_ID_PASSWORD环境变量');
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  console.log(`正在公证应用: ${appName}`);

  try {
    // 公证应用
    await notarize({
      appBundleId: build.appId,
      appPath: `${appOutDir}/${appName}.app`,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_ID_PASSWORD,
      ascProvider: process.env.APPLE_TEAM_ID
    });
    
    console.log(`✅ 公证成功: ${appName}`);
  } catch (error) {
    console.error(`❌ 公证失败:`, error);
  }
};