// packages/core/src/model/store/modelStore.ts - 模型配置存储
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StandardModelType, ModelConfig, CustomInterface } from '../models/config';
import { defaultModelConfigs } from '../../config/defaults';
import { STORAGE_KEYS } from '../../config/constants';
import { generateId } from '../../utils';

// 模型类型（可以是标准类型或自定义接口ID）
export type ModelType = StandardModelType | string;

// Store状态接口
interface ModelState {
  // === 基础状态 ===
  // 当前选中的模型
  activeModel: ModelType;
  // 更新触发器
  lastUpdate: number;

  // === 配置数据 ===
  // 标准模型配置
  configs: Record<StandardModelType, ModelConfig>;
  // 自定义接口列表
  customInterfaces: CustomInterface[];

  // === 状态管理方法 ===
  // 设置当前活动模型
  setActiveModel: (model: ModelType) => void;
  // 获取当前活动模型配置
  getActiveModelConfig: () => ModelConfig | CustomInterface | null;

  // === 标准模型操作 ===
  // 更新标准模型配置
  updateConfig: (model: StandardModelType, config: Partial<ModelConfig>) => void;
  // 重置标准模型配置
  resetConfig: (model: StandardModelType) => void;

  // === 自定义接口操作 ===
  // 添加自定义接口
  addCustomInterface: (customInterface: Omit<CustomInterface, 'id'>) => string;
  // 更新自定义接口
  updateCustomInterface: (id: string, data: Partial<Omit<CustomInterface, 'id'>>) => void;
  // 删除自定义接口
  deleteCustomInterface: (id: string) => void;
  // 获取自定义接口
  getCustomInterface: (id: string) => CustomInterface | undefined;

  // === 工具方法 ===
  // 判断是否为自定义接口
  isCustomInterface: (model: ModelType) => boolean;
  // 获取启用的模型列表
  getEnabledModels: () => Array<{ id: string, name: string }>;
}

// 创建store
export const useModelStore = create<ModelState>()(
  persist(
    (set, get) => ({
      // === 基础状态 ===
      activeModel: 'openai',
      lastUpdate: Date.now(),

      // === 配置数据 ===
      configs: Object.entries(defaultModelConfigs).reduce((acc, [key, value]) => ({
        ...acc,
        [key]: {
          ...value,
          id: key
        }
      }), {} as Record<StandardModelType, ModelConfig>),

      customInterfaces: [],

      // === 状态管理方法 ===
      setActiveModel: (model) => set(state => ({
        ...state,
        activeModel: model,
        lastUpdate: Date.now()
      })),

      getActiveModelConfig: () => {
        const { activeModel, configs, customInterfaces } = get();
        if (Object.keys(configs).includes(activeModel)) {
          return {
            ...configs[activeModel as StandardModelType],
            id: activeModel
          };
        }
        return customInterfaces.find(i => i.id === activeModel) || null;
      },

      // === 标准模型操作 ===
      updateConfig: (model, config) => set(state => ({
        ...state,
        configs: {
          ...state.configs,
          [model]: {
            ...state.configs[model],
            ...config,
            id: model
          }
        },
        lastUpdate: Date.now()
      })),

      resetConfig: (model) => set(state => ({
        ...state,
        configs: {
          ...state.configs,
          [model]: {
            ...defaultModelConfigs[model],
            id: model
          }
        },
        lastUpdate: Date.now()
      })),

      // === 自定义接口操作 ===
      addCustomInterface: (customInterface) => {
        const id = generateId();

        // 检查是否已存在相同的接口（通过 providerName 和 model）
        const existingInterface = get().customInterfaces.find(
          item =>
            item.providerName === customInterface.providerName &&
            item.model === customInterface.model
        );

        if (existingInterface) {
          // 如果已存在，直接返回现有接口的ID
          return existingInterface.id;
        }

        set(state => ({
          ...state,
          customInterfaces: [
            ...state.customInterfaces,
            {
              id,
              ...customInterface
            }
          ],
          lastUpdate: Date.now()
        }));
        return id;
      },

      updateCustomInterface: (id, data) => {
        set(state => ({
          ...state,
          customInterfaces: state.customInterfaces.map(item =>
            item.id === id ? { ...item, ...data } : item
          ),
          lastUpdate: Date.now()
        }));
      },

      deleteCustomInterface: (id) => {
        set(state => {
          const newState = {
            ...state,
            customInterfaces: state.customInterfaces.filter(item => item.id !== id),
            lastUpdate: Date.now()
          };

          if (state.activeModel === id) {
            newState.activeModel = 'openai';
          }

          return newState;
        });
      },

      getCustomInterface: (id) => {
        return get().customInterfaces.find(item => item.id === id);
      },

      // === 工具方法 ===
      isCustomInterface: (model) => {
        const standardTypes: string[] = Object.keys(defaultModelConfigs);
        return !standardTypes.includes(model);
      },

      getEnabledModels: () => {
        const { configs, customInterfaces } = get();

        const standardModels = Object.entries(configs)
          .filter(([_, config]) => config.enabled !== false)
          .map(([id, config]) => ({
            id,
            name: `${config.providerName} - ${config.model}`
          }));

        const custom = customInterfaces
          .filter(item => item.enabled !== false)
          .map(item => ({
            id: item.id,
            name: `${item.providerName} - ${item.model}`
          }));

        return [...standardModels, ...custom];
      }
    }),
    {
      name: STORAGE_KEYS.MODEL_STORE,
      partialize: (state) => ({
        ...state,
        lastUpdate: state.lastUpdate
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.lastUpdate = Date.now();
        }
      }
    }
  )
);

setTimeout(() => {
  const state = useModelStore.getState();
  // 确保初始状态被持久化，只在第一次运行时执行
  if (state.lastUpdate === 0) {
    useModelStore.setState({
      ...state,
      lastUpdate: Date.now()
    });
  }
}, 0);