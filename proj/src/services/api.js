/**
 * API 服务层 — 统一封装云函数调用，支持 Mock 数据自动降级
 *
 * 策略：
 *   1. 优先调用 CloudBase 云函数
 *   2. 云函数不可用时（未配置环境 ID / 网络错误），自动降级为 Mock 数据
 *   3. 搜索建议：优先使用 localStorage 缓存，不调用云函数
 */

import { callFunction, ensureAuth } from './cloudbase';
import { communities as mockCommunities } from '../data/mockData';

// 是否使用 Mock 模式（由 cloudbase.js 的 getStatus() 决定）
let useMock = true;

// 初始化：检查 CloudBase 是否可用
async function init() {
  try {
    const auth = await ensureAuth();
    useMock = !auth;
  } catch {
    useMock = true;
  }
}

// 页面加载时初始化
init();

// ========== 小区相关 API ==========

/**
 * 搜索小区
 * @param {object} params
 * @param {string} params.keyword - 搜索关键词
 * @param {string} params.city - 城市
 * @param {string} params.district - 行政区
 * @param {number} params.page - 页码
 */
export async function searchCommunities({ keyword, city, district, page = 1 } = {}) {
  if (useMock) {
    return mockSearch(keyword, city, district);
  }

  try {
    const res = await callFunction('communities', {
      action: 'search',
      keyword,
      city,
      district,
      page,
      pageSize: 20,
    });

    if (res && res.result && res.result.code === 0) {
      return {
        list: res.result.data.list,
        total: res.result.data.total,
      };
    }
  } catch (e) {
    console.warn('搜索云函数调用失败，降级为 Mock:', e);
  }

  return mockSearch(keyword, city, district);
}

/**
 * 获取小区详情
 * @param {string} communityId
 */
export async function getCommunityDetail(communityId) {
  if (useMock) {
    return mockDetail(communityId);
  }

  try {
    const res = await callFunction('communities', {
      action: 'detail',
      communityId,
    });

    if (res && res.result && res.result.code === 0) {
      return res.result.data;
    }
  } catch (e) {
    console.warn('详情云函数调用失败，降级为 Mock:', e);
  }

  return mockDetail(communityId);
}

/**
 * 获取热门小区
 */
export async function getHotCommunities() {
  if (useMock) {
    return mockCommunities.slice(0, 6);
  }

  try {
    const res = await callFunction('communities', {
      action: 'hot',
    });

    if (res && res.result && res.result.code === 0) {
      return res.result.data;
    }
  } catch (e) {
    console.warn('热门云函数调用失败，降级为 Mock:', e);
  }

  return mockCommunities.slice(0, 6);
}

/**
 * 获取搜索建议（优先使用 localStorage 缓存）
 * @param {string} keyword - 输入的关键词
 */
export async function getSearchSuggestions(keyword) {
  if (!keyword || !keyword.trim()) {
    return [];
  }

  if (useMock) {
    return mockSuggestions(keyword);
  }

  try {
    const res = await callFunction('communities', {
      action: 'suggestions',
      keyword,
      limit: 8,
    });

    if (res && res.result && res.result.code === 0) {
      return res.result.data;
    }
  } catch (e) {
    console.warn('搜索建议云函数调用失败，降级为 Mock:', e);
  }

  return mockSuggestions(keyword);
}

/**
 * 按需刷新小区数据（fire-and-forget）
 * @param {string} communityId
 */
export async function refreshCommunity(communityId) {
  if (useMock) return;

  callFunction('dataSync', {
    action: 'refresh',
    communityId,
  }).catch(() => {});
}

// ========== 用户相关 API ==========

/**
 * 添加收藏
 */
export async function addFavorite(communityId) {
  if (useMock) return { favorited: true };

  try {
    const res = await callFunction('users', {
      action: 'add-favorite',
      communityId,
    });
    if (res && res.result && res.result.code === 0) {
      return res.result.data;
    }
  } catch (e) {
    console.warn('收藏云函数调用失败:', e);
  }
  return { favorited: true };
}

/**
 * 取消收藏
 */
export async function removeFavorite(communityId) {
  if (useMock) return { favorited: false };

  try {
    const res = await callFunction('users', {
      action: 'remove-favorite',
      communityId,
    });
    if (res && res.result && res.result.code === 0) {
      return res.result.data;
    }
  } catch (e) {
    console.warn('取消收藏云函数调用失败:', e);
  }
  return { favorited: false };
}

/**
 * 获取收藏列表
 */
export async function getFavorites() {
  if (useMock) return [];

  try {
    const res = await callFunction('users', {
      action: 'get-favorites',
    });
    if (res && res.result && res.result.code === 0) {
      return res.result.data;
    }
  } catch (e) {
    console.warn('获取收藏云函数调用失败:', e);
  }
  return [];
}

/**
 * 对比多个小区
 */
export async function compareCommunities(ids) {
  if (useMock) {
    return mockCommunities.filter((c) => ids.includes(c._id));
  }

  try {
    const res = await callFunction('communities', {
      action: 'compare',
      ids,
    });
    if (res && res.result && res.result.code === 0) {
      return res.result.data;
    }
  } catch (e) {
    console.warn('对比云函数调用失败，降级为 Mock:', e);
  }
  return mockCommunities.filter((c) => ids.includes(c._id));
}

// ========== Mock 实现（降级使用） ==========

function mockSearch(keyword, city, district) {
  let filtered = [...mockCommunities];

  if (keyword && keyword.trim()) {
    const kw = keyword.trim().toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.name.toLowerCase().includes(kw) ||
        c.subDistrict.toLowerCase().includes(kw) ||
        c.district.toLowerCase().includes(kw) ||
        (c.searchKeywords &&
          c.searchKeywords.some((k) => k.toLowerCase().includes(kw))),
    );
  }

  if (city) {
    filtered = filtered.filter((c) => c.city === city);
  }
  if (district) {
    filtered = filtered.filter((c) => c.district === district);
  }

  return { list: filtered, total: filtered.length };
}

function mockDetail(communityId) {
  return mockCommunities.find((c) => c._id === communityId) || null;
}

function mockSuggestions(keyword) {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return [];

  return mockCommunities
    .filter(
      (c) =>
        c.name.toLowerCase().includes(kw) ||
        c.subDistrict.toLowerCase().includes(kw) ||
        c.district.toLowerCase().includes(kw) ||
        (c.searchKeywords &&
          c.searchKeywords.some((k) => k.toLowerCase().includes(kw))),
    )
    .slice(0, 8)
    .map((c) => ({
      _id: c._id,
      name: c.name,
      district: c.district,
      subDistrict: c.subDistrict,
      avgPrice: c.avgPrice,
    }));
}

export default {
  searchCommunities,
  getCommunityDetail,
  getHotCommunities,
  getSearchSuggestions,
  refreshCommunity,
  addFavorite,
  removeFavorite,
  getFavorites,
  compareCommunities,
};