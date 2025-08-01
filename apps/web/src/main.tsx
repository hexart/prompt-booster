import './env';
import i18n from './i18n';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import App from './App';
import './index.css';
import './scrollbar.css';

const renderApp = () => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>
    </React.StrictMode>
  );
};

// 确保在 i18n 初始化后再渲染
if (i18n.isInitialized) {
  renderApp();
} else {
  i18n.on('initialized', renderApp);
}