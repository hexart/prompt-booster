/**
 * 7. utils/id-generator.ts - ID生成工具
 */
// apps/web/src/core/utils/idGenerator.ts
import { v4 as uuidv4 } from 'uuid';

/**
 * 生成UUID
 * @returns 唯一UUID字符串
 */
export function generateUuid(): string {
    return uuidv4();
}

/**
 * 生成唯一ID
 * @returns 唯一ID字符串
 */
export function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * 生成数字ID
 * @returns 数字ID
 */
export function generateNumericId(): number {
    return Date.now();
}

/**
 * 生成带前缀的ID
 * @param prefix ID前缀
 * @returns 带前缀的唯一ID
 */
export function generatePrefixedId(prefix: string): string {
    return `${prefix}-${generateId()}`;
}