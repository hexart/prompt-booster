// packages/core/src/services/storageService.ts
import { createJSONStorage } from 'zustand/middleware';
import { STORAGE_KEYS } from '../config/constants';

/**
 * 存储类型枚举
 */
export enum StorageType {
    LOCAL = 'local',
    SESSION = 'session',
    MEMORY = 'memory' // 不持久化，仅内存存储
}

/**
 * 存储配置接口
 */
export interface StorageConfig {
    type: StorageType;
    key: keyof typeof STORAGE_KEYS;
    version?: number;
    migrate?: (state: unknown, version: number) => unknown;
}

// 内存存储实现
const memoryStorage: Record<string, string> = {};
const createMemoryStorage = () => {
    return {
        getItem: (name: string) => {
            const value = memoryStorage[name];
            return value === undefined ? null : value;
        },
        setItem: (name: string, value: string) => {
            memoryStorage[name] = value;
        },
        removeItem: (name: string) => {
            delete memoryStorage[name];
        }
    };
};

/**
 * 创建特定类型的存储
 */
export const createStorage = (config: StorageConfig) => {
    const { type, key, version } = config;
    const name = STORAGE_KEYS[key]; // 使用预定义的常量

    // 根据类型选择存储介质
    let storage: Storage | ReturnType<typeof createMemoryStorage>;

    switch (type) {
        case StorageType.LOCAL:
            storage = localStorage;
            break;
        case StorageType.SESSION:
            storage = sessionStorage;
            break;
        case StorageType.MEMORY:
        default:
            storage = createMemoryStorage();
    }

    // 封装存储为Zustand兼容的JSON存储
    const jsonStorage = createJSONStorage(() => storage);

    // 返回存储配置
    return {
        name,
        storage: jsonStorage,
        version: version || 0,
        ...(config.migrate ? { migrate: config.migrate } : {})
    };
};

/**
 * 清除指定存储中的所有数据
 */
export const clearStorage = (type: StorageType) => {
    switch (type) {
        case StorageType.LOCAL:
            localStorage.clear();
            break;
        case StorageType.SESSION:
            sessionStorage.clear();
            break;
        case StorageType.MEMORY:
            Object.keys(memoryStorage).forEach(key => {
                delete memoryStorage[key];
            });
            break;
    }
};

/**
 * 获取指定存储中的所有键
 */
export const getStorageKeys = (type: StorageType): string[] => {
    switch (type) {
        case StorageType.LOCAL:
            return Object.keys(localStorage);
        case StorageType.SESSION:
            return Object.keys(sessionStorage);
        case StorageType.MEMORY:
            return Object.keys(memoryStorage);
        default:
            return [];
    }
};