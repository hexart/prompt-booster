// apps/web/src/core/prompt/services/promptGroupManager.ts
/**
 * 提示词组管理器
 * 专门负责提示词组的CRUD操作
 */
import { PromptGroup, PromptVersion } from '../models/prompt';
import { generateId } from '../../utils/idGenerator';

export const PROMPT_PENDING_MARKER = '__PENDING__';
export class PromptGroupManager {
  private groups: Record<string, PromptGroup> = {};
  private versions: Record<string, PromptVersion[]> = {};

  // 创建提示词组
  createGroup(originalPrompt: string): PromptGroup {
    const groupId = generateId();
    const group: PromptGroup = {
      id: groupId,
      originalPrompt,
      currentVersionNumber: 0,
      status: 'idle',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    this.groups[groupId] = group;
    this.versions[groupId] = [];
    
    return group;
  }

  // 获取组
  getGroup(groupId: string): PromptGroup | null {
    return this.groups[groupId] || null;
  }

  // 获取所有组
  getAllGroups(): PromptGroup[] {
    return Object.values(this.groups);
  }

  // 删除组
  deleteGroup(groupId: string): void {
    delete this.groups[groupId];
    delete this.versions[groupId];
  }

  // 创建版本
  createVersion(
    groupId: string,
    optimizedPrompt: string,
    modelInfo: {
      modelId: string;
      provider: string;
      modelName: string;
    },
    iterationDirection?: string
  ): PromptVersion {
    const group = this.groups[groupId];
    if (!group) {
      throw new Error(`Group ${groupId} not found`);
    }

    const versions = this.versions[groupId] || [];
    const versionNumber = versions.length > 0 
      ? Math.max(...versions.map(v => v.number)) + 1 
      : 1;

    const version: PromptVersion = {
      id: generateId(),
      number: versionNumber,
      groupId,
      originalPrompt: group.originalPrompt,
      optimizedPrompt,
      modelId: modelInfo.modelId,
      provider: modelInfo.provider,
      modelName: modelInfo.modelName,
      iterationDirection,
      status: 'completed',
      timestamp: Date.now()
    };

    this.versions[groupId].push(version);
    
    // 更新组的当前版本号
    group.currentVersionNumber = versionNumber;
    group.updatedAt = Date.now();
    group.status = 'completed';

    return version;
  }

  // 获取组的所有版本
  getVersions(groupId: string): PromptVersion[] {
    return this.versions[groupId] || [];
  }

  // 获取特定版本
  getVersion(groupId: string, versionNumber: number): PromptVersion | null {
    const versions = this.versions[groupId] || [];
    return versions.find(v => v.number === versionNumber) || null;
  }

  // 导入/导出数据（用于持久化）
  exportData() {
    return {
      groups: this.groups,
      versions: this.versions
    };
  }

  importData(data: { groups: Record<string, PromptGroup>; versions: Record<string, PromptVersion[]> }) {
    this.groups = data.groups || {};
    this.versions = data.versions || {};
  }
  
  // 添加预创建版本方法
  createPendingVersion(
    groupId: string,
    modelInfo: {
      modelId: string;
      provider: string;
      modelName: string;
    },
    iterationDirection?: string
  ): PromptVersion {
    const group = this.groups[groupId];
    if (!group) {
      throw new Error(`Group ${groupId} not found`);
    }

    const versions = this.versions[groupId] || [];
    const versionNumber = versions.length > 0 
      ? Math.max(...versions.map(v => v.number)) + 1 
      : 1;

    const version: PromptVersion = {
      id: generateId(),
      number: versionNumber,
      groupId,
      originalPrompt: group.originalPrompt,
      optimizedPrompt: PROMPT_PENDING_MARKER,
      modelId: modelInfo.modelId,
      provider: modelInfo.provider,
      modelName: modelInfo.modelName,
      iterationDirection,
      status: 'pending',
      timestamp: Date.now()
    };

    this.versions[groupId].push(version);
    
    // 更新组的当前版本号和状态
    group.currentVersionNumber = versionNumber;
    group.updatedAt = Date.now();
    group.status = iterationDirection ? 'iterating' : 'enhancing';

    return version;
  }

  // 添加更新版本内容方法
  updateVersionContent(groupId: string, versionId: string, optimizedPrompt: string) {
    const versions = this.versions[groupId];
    if (!versions) return;
    
    const version = versions.find(v => v.id === versionId);
    if (version) {
      version.optimizedPrompt = optimizedPrompt;
      version.status = 'completed';
      
      // 更新组状态
      const group = this.groups[groupId];
      if (group) {
        group.status = 'completed';
        group.updatedAt = Date.now();
      }
    }
  }
}