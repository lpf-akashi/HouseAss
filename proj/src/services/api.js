/**
 * API 服务层 — 统一封装云函数调用，支持 Mock 数据自动降级
 *
 * 策略：
 *   1. 优先调用 CloudBase 云函数
 *   2. 云函数不可用时（未配置环境 ID / 网络错误），自动降级为 Mock 数据
 *   3. 搜索建议：优先使用 localStorage 缓存，不调用云函数
 */

// import { callFunction, ensureAuth } from './cloudbase';
import { communities as mockCommunities } from '../data/mockData';

// 是否使用 Mock 模式（暂时强制 Mock，排查 React error #310）
const useMock = true;

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
  }).catch(() => { });
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

// ========== 地图与通勤 API ==========

/**
 * 计算通勤时间
 * @param {string} communityId - 小区ID
 * @param {string} destination - 目的地地址（如"国贸"、"中关村"）
 * @param {string} mode - 出行方式：driving | transit | walking
 */
export async function getCommuteTime(communityId, destination, mode = 'driving') {
  console.log('[api] getCommuteTime called', { communityId, destination, mode });
  if (useMock) {
    const result = mockCommuteTime(communityId, destination, mode);
    console.log('[api] getCommuteTime mock result', result);
    return result;
  }

  try {
    const res = await callFunction('communities', {
      action: 'commute',
      communityId,
      destination,
      mode,
    });
    if (res && res.result && res.result.code === 0) {
      return res.result.data;
    }
  } catch (e) {
    console.warn('通勤时间查询失败，降级为 Mock:', e);
  }
  return mockCommuteTime(communityId, destination, mode);
}

/**
 * 查询周边配套
 * @param {string} communityId - 小区ID
 * @param {number} radius - 搜索半径（米），默认 1000
 */
export async function getNearbyPoi(communityId, radius = 1000) {
  console.log('[api] getNearbyPoi called', { communityId, radius });
  if (useMock) {
    const result = mockNearbyPoi(communityId);
    console.log('[api] getNearbyPoi mock result', result);
    return result;
  }

  try {
    const res = await callFunction('communities', {
      action: 'nearby-poi',
      communityId,
      radius,
    });
    if (res && res.result && res.result.code === 0) {
      return res.result.data;
    }
  } catch (e) {
    console.warn('周边配套查询失败，降级为 Mock:', e);
  }
  return mockNearbyPoi(communityId);
}

// ========== Mock 降级函数 ==========

/**
 * Mock 通勤时间
 */
function mockCommuteTime(communityId, destination, mode) {
  const community = mockCommunities.find((c) => c._id === communityId);
  if (!community) return null;

  // 根据距离模拟通勤时间
  const baseMinutes = community.distanceToMetro
    ? Math.max(15, community.distanceToMetro * 5)
    : 30;

  const modeMultiplier = mode === 'driving' ? 0.6 : mode === 'transit' ? 1.5 : 2.0;
  const duration = Math.round(baseMinutes * modeMultiplier);
  const distance = Math.round(baseMinutes * 800 * (mode === 'driving' ? 1 : 0.6));

  return {
    communityId,
    communityName: community.name,
    destination,
    mode,
    modeLabel: mode === 'driving' ? '驾车' : mode === 'transit' ? '公交/地铁' : '步行',
    duration,
    durationText: duration >= 60 ? `${Math.floor(duration / 60)}小时${duration % 60}分钟` : `${duration}分钟`,
    distance,
    distanceText: distance >= 1000 ? `${(distance / 1000).toFixed(1)}公里` : `${distance}米`,
    cachedAt: new Date().toISOString(),
    mock: true,
  };
}

/**
 * Mock 周边配套
 */
function mockNearbyPoi(communityId) {
  const community = mockCommunities.find((c) => c._id === communityId);
  if (!community) return null;

  return {
    communityId,
    communityName: community.name,
    radius: 1000,
    schools: {
      label: '学校',
      pois: [
        { id: 's1', name: `${community.subDistrict}第一小学`, type: '141200', typeLabel: '小学', address: `${community.subDistrict}路100号`, distance: 300, distanceText: '300米' },
        { id: 's2', name: `${community.subDistrict}中学`, type: '141201', typeLabel: '中学', address: `${community.subDistrict}路200号`, distance: 600, distanceText: '600米' },
        { id: 's3', name: `${community.district}实验学校`, type: '141201', typeLabel: '中学', address: `${community.district}大道50号`, distance: 900, distanceText: '900米' },
      ],
    },
    hospitals: {
      label: '医院',
      pois: [
        { id: 'h1', name: `${community.district}人民医院`, type: '090100', typeLabel: '综合医院', address: `${community.district}路300号`, distance: 500, distanceText: '500米' },
        { id: 'h2', name: `${community.subDistrict}社区卫生中心`, type: '090100', typeLabel: '综合医院', address: `${community.subDistrict}路50号`, distance: 800, distanceText: '800米' },
      ],
    },
    shopping: {
      label: '购物',
      pois: [
        { id: 'sh1', name: `${community.subDistrict}购物中心`, type: '060100', typeLabel: '商场', address: `${community.subDistrict}路150号`, distance: 400, distanceText: '400米' },
        { id: 'sh2', name: '华联超市', type: '060101', typeLabel: '超市', address: `${community.subDistrict}路88号`, distance: 200, distanceText: '200米' },
      ],
    },
    metro: {
      label: '地铁站',
      pois: community.nearbyMetro
        ? (Array.isArray(community.nearbyMetro)
          ? community.nearbyMetro.map((m, i) => ({
            id: `m${i}`,
            name: m.trim(),
            type: '150500',
            typeLabel: '地铁站',
            address: `${community.subDistrict}路`,
            distance: 200 + i * 300,
            distanceText: `${200 + i * 300}米`,
          }))
          : community.nearbyMetro.split(',').map((m, i) => ({
            id: `m${i}`,
            name: m.trim(),
            type: '150500',
            typeLabel: '地铁站',
            address: `${community.subDistrict}路`,
            distance: 200 + i * 300,
            distanceText: `${200 + i * 300}米`,
          })))
        : [{ id: 'm1', name: '未知地铁站', type: '150500', typeLabel: '地铁站', address: '', distance: 500, distanceText: '500米' }],
    },
    restaurants: {
      label: '餐饮',
      pois: [
        { id: 'r1', name: '海底捞火锅', type: '050000', typeLabel: '餐饮', address: `${community.subDistrict}路200号`, distance: 350, distanceText: '350米' },
        { id: 'r2', name: '星巴克', type: '050000', typeLabel: '餐饮', address: `${community.subDistrict}路180号`, distance: 250, distanceText: '250米' },
      ],
    },
    cachedAt: new Date().toISOString(),
    mock: true,
  };
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
  getCommuteTime,
  getNearbyPoi,
};