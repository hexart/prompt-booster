import './env';

// 关键：先导入并初始化i18n，等待它完成
import i18n from './i18n';

// 等待i18n初始化完成后再渲染应用
const init = async () => {
  // 确保i18n已经初始化
  if (!i18n.isInitialized) {
    await i18n;
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