import { useState, useEffect } from 'react';

// 声明全局变量类型
declare global {
  const __APP_VERSION__: string;
}

export interface VersionInfo {
  current: string;
  latest: string | null;
  hasUpdate: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useVersionChecker = () => {
  const [versionInfo, setVersionInfo] = useState<VersionInfo>({
    current: __APP_VERSION__,
    latest: null,
    hasUpdate: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const checkVersion = async () => {
      try {
        setVersionInfo(prev => ({ ...prev, isLoading: true, error: null }));

        let latestVersion: string;

        // 正常模式：从远程获取版本
        const response = await fetch('https://hexart.github.io/prompt-booster/version.json', {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const remotePackage = await response.json();
        latestVersion = remotePackage.version;


        // 比较版本号
        const hasUpdate = compareVersions(latestVersion, __APP_VERSION__) > 0;

        setVersionInfo({
          current: __APP_VERSION__,
          latest: latestVersion,
          hasUpdate,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setVersionInfo({
          current: __APP_VERSION__,
          latest: null,
          hasUpdate: false,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };

    // 延迟检查，避免阻塞初始渲染
    const timer = setTimeout(checkVersion, 2000);

    return () => clearTimeout(timer);
  }, []);

  return versionInfo;
};

// 简单的版本比较函数
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  const maxLength = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLength; i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;

    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }

  return 0;
}