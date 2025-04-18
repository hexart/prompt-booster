import { useState, useEffect } from 'react';
import WebApp from '../../web/src/App';
import './index.css';

function App() {
    const [appVersion, setAppVersion] = useState('');
    const [isMaximized, setIsMaximized] = useState(false);

    useEffect(() => {
        // Set platform attribute on body for CSS targeting
        if (window.appInfo?.platform) {
            document.body.setAttribute('data-platform', window.appInfo.platform);
        }

        // If in Electron environment, get app version
        if (window.electronAPI) {
            window.electronAPI.getAppVersion().then((version: string) => {
                setAppVersion(version);
            });

            // 监听窗口最大化/恢复事件
            window.electronAPI.onWindowStateChange?.((state: string) => {
                setIsMaximized(state === 'maximized');
            });
        }

        // 为Electron环境添加全局函数
        if (window.electronAPI) {
            // 将Electron API添加到全局window对象，以便web应用可以访问
            window.saveFileToLocal = window.electronAPI.saveFile;
            window.loadFileFromLocal = window.electronAPI.loadFile;
        }

        // Debug log for rendering
        console.log('App rendering, platform:', window.appInfo?.platform);
        console.log('Titlebar should be visible now');
    }, []);

    // 处理窗口控制按钮事件
    const handleMinimize = () => {
        window.electronAPI?.minimizeWindow?.();
    };

    const handleMaximizeRestore = () => {
        window.electronAPI?.maximizeRestoreWindow?.();
    };

    const handleClose = () => {
        window.electronAPI?.closeWindow?.();
    };

    return (
        <div className="app-container">
            {/* Debug info */}
            <div style={{ position: 'fixed', top: 0, right: 0, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '2px 5px', fontSize: '10px', zIndex: 10000 }}>
                Platform: {window.appInfo?.platform || 'unknown'}
            </div>

            {window.appInfo?.platform === 'darwin' && (
                <>
                    <div className="mac-drag-region"></div>
                    <div className="mac-traffic-lights-area"></div>
                </>
            )}
            {/* 自定义标题栏 */}
            <div className="titlebar">
                <div className="titlebar-drag-region"></div>
                <div className="titlebar-content">
                    <div className="titlebar-logo">
                        <img
                            src={window.electronAPI?.getIconPath?.() || "./icon.png"}
                            alt="Logo"
                            className="titlebar-logo-img"
                        />
                        <span className="titlebar-app-name">提示词增强器</span>
                    </div>

                    {window.appInfo?.platform === 'darwin' ? (
                        // macOS窗口上的控制按钮由系统提供，无需手动添加
                        <div className="titlebar-space"></div>
                    ) : (
                        // Windows/Linux窗口控制按钮
                        <div className="titlebar-controls">
                            <button className="titlebar-button" onClick={handleMinimize}>
                                <svg width="12" height="2" viewBox="0 0 12 2">
                                    <rect width="12" height="2" fill="currentColor" />
                                </svg>
                            </button>
                            <button className="titlebar-button" onClick={handleMaximizeRestore}>
                                {isMaximized ? (
                                    <svg width="12" height="12" viewBox="0 0 12 12">
                                        <path fill="currentColor" d="M2,4v6h6V4H2z M1,3h8v8H1V3z" />
                                    </svg>
                                ) : (
                                    <svg width="12" height="12" viewBox="0 0 12 12">
                                        <path fill="currentColor" d="M1,1v10h10V1H1z M10,10H2V2h8V10z" />
                                    </svg>
                                )}
                            </button>
                            <button className="titlebar-button close-button" onClick={handleClose}>
                                <svg width="12" height="12" viewBox="0 0 12 12">
                                    <path fill="currentColor" d="M1,1 L11,11 M1,11 L11,1" stroke="currentColor" strokeWidth="2" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 显示版本号 */}
            {appVersion && (
                <div className="version-info">v{appVersion}</div>
            )}

            {/* 主内容区域 */}
            <div className="content-container">
                <WebApp />
            </div>
        </div>
    );
}

export default App;