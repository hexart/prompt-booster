import './env';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import App from './App';
import './index.css';
import './scrollbar.css';

// 关键：先导入i18n配置和Promise
import i18n, { i18nPromise } from './i18n';

// 等待i18n初始化完成后再渲染应用
const init = async () => {
  try {
    console.log('⏳ 开始初始化i18n...');
    
    // 等待i18n完全初始化
    await i18nPromise;
    
    // 再次确认i18n已就绪
    if (!i18n.isInitialized) {
      throw new Error('i18n 初始化未完成');
    }
    
    console.log('✅ i18n初始化完成，当前语言:', i18n.language);
    console.log('⏳ 开始渲染React应用...');

    // 直接渲染，不再动态import
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <I18nextProvider i18n={i18n}>
          <App />
        </I18nextProvider>
      </React.StrictMode>
    );
    
    console.log('✅ React应用渲染完成');
  } catch (error) {
    console.error('❌ 初始化失败:', error);
  }
};

init();