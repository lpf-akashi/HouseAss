/**
 * CloudBase SDK 初始化与服务封装
 *
 * MVP 阶段：如果未配置 CloudBase 环境 ID，自动降级为 Mock 模式，
 * 所有 callFunction 调用返回 null，由调用方使用 Mock 数据。
 */

import cloudbase from '@cloudbase/js-sdk';

// 从 Vite 环境变量读取（VITE_ 前缀的变量会自动注入）
const envId = import.meta.env.VITE_CLOUDBASE_ENV_ID || '';

let app = null;
let auth = null;
let initialized = false;
let initError = null;

/**
 * 初始化 CloudBase 实例
 * 只在首次调用时执行，后续调用直接返回已有实例
 */
function getApp() {
  if (app) return app;
  if (!envId) {
    initError = '未配置 VITE_CLOUDBASE_ENV_ID，使用 Mock 模式';
    return null;
  }
  try {
    app = cloudbase.init({ env: envId });
    auth = app.auth({ persistence: 'local' });
    initialized = true;
    return app;
  } catch (e) {
    initError = e.message;
    console.warn('CloudBase 初始化失败:', e);
    return null;
  }
}

/**
 * 获取匿名登录状态
 * MVP 阶段使用匿名登录，降低用户使用门槛
 */
export async function ensureAuth() {
  const app = getApp();
  if (!app) return null;

  try {
    const loginState = await auth.getLoginState();
    if (loginState) return loginState;
    const newState = await auth.anonymousAuthProvider().signIn();
    return newState;
  } catch (e) {
    console.warn('CloudBase 匿名登录失败:', e);
    return null;
  }
}

/**
 * 调用云函数
 *
 * @param {string} name - 云函数名称
 * @param {object} data - 传给云函数的参数
 * @returns {Promise<{result: any} | null>} 云函数返回结果，Mock 模式下返回 null
 *
 * 使用示例：
 *   const res = await callFunction('communities', { action: 'search', keyword: '万科' });
 *   if (res) { ... } else { /* 使用 Mock 数据 */ }
 */
export async function callFunction(name, data = {}) {
  const app = getApp();
  if (!app) return null;

  try {
    const res = await app.callFunction({ name, data });
    return res;
  } catch (e) {
    console.error(`云函数 [${name}] 调用失败:`, e);
    return null;
  }
}

/**
 * 获取 CloudBase 初始化状态
 */
export function getStatus() {
  return {
    initialized,
    envId: envId || '(未配置)',
    error: initError,
    mode: envId ? 'cloudbase' : 'mock',
  };
}

export default { ensureAuth, callFunction, getStatus };