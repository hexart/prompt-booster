/**
 * 策略接口定义
 * 定义各种可插拔的策略接口
 */
import { InternalAxiosRequestConfig } from 'axios';
import { ChatRequest, ChatResponse } from './core';

/**
 * 认证策略接口
 * 处理不同的API认证方式
 */
export interface AuthStrategy {
    /**
     * 应用认证信息到请求
     * @param config Axios请求配置
     * @returns 更新后的请求配置
     */
    applyAuth(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig;
}

/**
 * 请求格式化接口
 * 将统一的请求格式转换为特定API格式
 */
export interface RequestFormatter {
    /**
     * 格式化聊天请求
     * @param request 标准聊天请求
     * @returns 格式化后的请求体
     */
    formatRequest(request: ChatRequest): any;
}

/**
 * 响应解析接口
 * 解析不同API的响应格式
 */
export interface ResponseParser {
    /**
     * 解析流式响应块
     * @param chunk 响应数据块
     * @returns 解析出的文本内容
     */
    parseStreamChunk(chunk: any): string | null;

    /**
     * 解析完整响应
     * @param response 完整响应数据
     * @returns 标准化的聊天响应
     */
    parseFullResponse?(response: any): ChatResponse;
}