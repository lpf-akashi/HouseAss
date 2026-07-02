import cloudbase from '@cloudbase/js-sdk';

const envId = import.meta.env.VITE_CLOUDBASE_ENV_ID || '';

let app = null;
let auth = null;
let initialized = false;
let initError = null;

function getApp() {
  if (app) return app;
  if (!envId) {
    initError = '未配置环境变量';
    return null;
  }
  try {
    app = cloudbase.init({ env: envId });
    auth = app.auth({ persistence: 'local' });
    initialized = true;
    return app;
  } catch (e) {
    initError = e.message;
    console.warn('CloudBase init failed:', e);
    return null;
  }
}

export async function ensureAuth() {
  const app = getApp();
  if (!app) return null;
  try {
    const loginState = await auth.getLoginState();
    if (loginState) return loginState;
    const newState = await auth.anonymousAuthProvider().signIn();
    return newState;
  } catch (e) {
    console.warn('CloudBase auth failed:', e);
    return null;
  }
}

export async function callFunction(name, data = {}) {
  const app = getApp();
  if (!app) return null;
  try {
    const res = await app.callFunction({ name, data });
    return res;
  } catch (e) {
    console.error(`CloudFunction [${name}] call failed:`, e);
    return null;
  }
}

export function getStatus() {
  return {
    initialized,
    envId: envId || '(未配置)',
    error: initError,
    mode: envId ? 'cloudbase' : 'mock',
  };
}

export default { ensureAuth, callFunction, getStatus };
