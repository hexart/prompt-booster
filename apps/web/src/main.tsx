import './env';

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
    console.log('⏳ 开始加载React应用...');
  } catch (error) {
    console.error('❌ i18n初始化失败:', error);
  }
  
  // 现在才开始加载React和组件
  const React = await import('react');
  const ReactDOM = await import('react-dom/client');
  const { I18nextProvider } = await import('react-i18next');
  const { default: App } = await import('./App');
  
  // 导入样式
  await import('./index.css');
  await import('./scrollbar.css');

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>
    </React.StrictMode>
  );
};

init();