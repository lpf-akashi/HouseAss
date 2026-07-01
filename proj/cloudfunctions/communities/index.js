/**
 * communities 云函数 — 小区搜索、详情、对比、热门、通勤、周边配套
 *
 * 入口参数:
 *   action: 'search' | 'detail' | 'compare' | 'hot' | 'suggestions' | 'commute' | 'nearby-poi'
 */

const cloud = require('@cloudbase/node-sdk');
const https = require('https');

const app = cloud.init({
  env: cloud.SYMBOL_CURRENT_ENV,
});

const db = app.database();
const _ = db.command;

// 高德地图 API Key（从环境变量获取）
const AMAP_KEY = process.env.AMAP_API_KEY || '';

// 缓存热门小区结果（60秒），减少数据库查询
let hotCache = { data: null, expireAt: 0 };

// 通勤时间缓存（24小时）
const commuteCache = new Map();

exports.main = async (event, context) => {
  const { action } = event;

  try {
    switch (action) {
      case 'search':
        return await handleSearch(event);
      case 'detail':
        return await handleDetail(event);
      case 'compare':
        return await handleCompare(event);
      case 'hot':
        return await handleHot(event);
      case 'suggestions':
        return await handleSuggestions(event);
      case 'commute':
        return await handleCommute(event);
      case 'nearby-poi':
        return await handleNearbyPoi(event);
      default:
        return { code: 400, message: `未知 action: ${action}` };
    }
  } catch (e) {
    console.error(`[communities] ${action} 错误:`, e);
    return { code: 500, message: e.message || '服务器内部错误' };
  }
};

/**
 * 搜索小区
 * 支持关键词（小区名/板块/地铁站）、城市、行政区筛选
 */
async function handleSearch({ keyword, city, district, page = 1, pageSize = 20 }) {
  const conditions = {};

  if (city) conditions.city = city;
  if (district) conditions.district = district;

  // 关键词搜索：用 searchKeywords 数组做模糊匹配
  if (keyword && keyword.trim()) {
    const kw = keyword.trim();
    conditions.searchKeywords = db.RegExp({
      regexp: kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      options: 'i',
    });
  }

  // 限制 pageSize
  const limit = Math.min(Math.max(1, +pageSize || 20), 50);
  const skip = (Math.max(1, +page || 1) - 1) * limit;

  const [listResult, countResult] = await Promise.all([
    db
      .collection('communities')
      .where(conditions)
      .orderBy('avgPrice', 'asc')
      .skip(skip)
      .limit(limit)
      .field({
        _id: true,
        name: true,
        city: true,
        district: true,
        subDistrict: true,
        avgPrice: true,
        priceRange: true,
        priceTrend: true,
        priceChange: true,
        buildYear: true,
        attentionLevel: true,
        attentionText: true,
        nearbyMetro: true,
        listingCount: true,
        highlights: { $slice: 2 }, // 只返回前2条亮点
      })
      .get(),
    db
      .collection('communities')
      .where(conditions)
      .count(),
  ]);

  return {
    code: 0,
    data: {
      list: listResult.data,
      total: countResult.total,
      page: +page || 1,
      pageSize: limit,
    },
  };
}

/**
 * 小区详情
 * 返回完整信息，含 needsRefresh 标志
 */
async function handleDetail({ communityId }) {
  if (!communityId) {
    return { code: 400, message: '缺少 communityId' };
  }

  const result = await db
    .collection('communities')
    .doc(communityId)
    .get();

  if (!result.data || result.data.length === 0) {
    return { code: 404, message: '小区不存在' };
  }

  const community = result.data[0];

  // 判断是否需要刷新数据（超过7天）
  const now = Date.now();
  const updatedAt = community.dataUpdatedAt ? new Date(community.dataUpdatedAt).getTime() : 0;
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const needsRefresh = now - updatedAt > sevenDays;

  return {
    code: 0,
    data: {
      ...community,
      needsRefresh,
    },
  };
}

/**
 * 小区对比（最多5个）
 */
async function handleCompare({ ids }) {
  if (!ids) {
    return { code: 400, message: '缺少 ids' };
  }

  const idList = ids.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 5);

  if (idList.length === 0) {
    return { code: 400, message: 'ids 不能为空' };
  }

  const result = await db
    .collection('communities')
    .where({ _id: _.in(idList) })
    .field({
      _id: true,
      name: true,
      district: true,
      subDistrict: true,
      avgPrice: true,
      priceRange: true,
      priceTrend: true,
      priceChange: true,
      buildYear: true,
      propertyType: true,
      developer: true,
      propertyMgmt: true,
      propertyFee: true,
      greenRate: true,
      plotRatio: true,
      totalUnits: true,
      distanceToMetro: true,
      listingCount: true,
      avgDaysOnMarket: true,
      monthlyTransactions: true,
      attentionLevel: true,
      attentionText: true,
      highlights: true,
      risks: true,
    })
    .get();

  return {
    code: 0,
    data: result.data,
  };
}

/**
 * 热门小区（带简单缓存）
 */
async function handleHot({ city, limit = 6 }) {
  const cacheKey = `${city || 'all'}_${limit}`;
  const now = Date.now();

  if (hotCache.data && hotCache.expireAt > now && hotCache.key === cacheKey) {
    return { code: 0, data: hotCache.data };
  }

  const conditions = {};
  if (city) conditions.city = city;

  // 热门 = 看房关注等级高 + 按成交量降序
  const result = await db
    .collection('communities')
    .where({ ...conditions, attentionLevel: 'high' })
    .orderBy('monthlyTransactions', 'desc')
    .limit(+limit || 6)
    .field({
      _id: true,
      name: true,
      district: true,
      subDistrict: true,
      avgPrice: true,
      priceTrend: true,
      priceChange: true,
      attentionLevel: true,
      attentionText: true,
      highlights: { $slice: 2 },
    })
    .get();

  hotCache = { key: cacheKey, data: result.data, expireAt: now + 60000 };

  return { code: 0, data: result.data };
}

/**
 * 搜索建议（精简列表，用于前端 autocomplete 缓存）
 */
async function handleSuggestions({ city }) {
  const conditions = {};
  if (city) conditions.city = city;

  const result = await db
    .collection('communities')
    .where(conditions)
    .field({
      _id: true,
      name: true,
      district: true,
      subDistrict: true,
      avgPrice: true,
      searchKeywords: true,
    })
    .limit(1000)
    .get();

  return {
    code: 0,
    data: result.data,
  };
}

// ==================== 高德地图 API 工具函数 ====================

/**
 * 调用高德地图 HTTP API
 */
function amapRequest(path, params = {}) {
  return new Promise((resolve, reject) => {
    const query = Object.entries({ ...params, key: AMAP_KEY })
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    const url = `https://restapi.amap.com${path}?${query}`;

    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.status === '1') {
              resolve(json);
            } else {
              reject(new Error(json.info || '高德 API 请求失败'));
            }
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

// ==================== 通勤时间计算 ====================

/**
 * 通勤时间计算
 * @param {string} communityId - 小区ID
 * @param {string} destination - 目的地地址（如"国贸"、"中关村"）
 * @param {string} destinationLng - 目的地经度（可选，优先于 destination）
 * @param {string} destinationLat - 目的地纬度（可选，优先于 destination）
 * @param {string} mode - 出行方式：driving | transit | walking（默认 driving）
 */
async function handleCommute({ communityId, destination, destinationLng, destinationLat, mode = 'driving' }) {
  if (!communityId) {
    return { code: 400, message: '缺少 communityId' };
  }
  if (!destination && !(destinationLng && destinationLat)) {
    return { code: 400, message: '缺少目的地（destination 或 destinationLng+destinationLat）' };
  }
  if (!AMAP_KEY) {
    return { code: 500, message: '未配置高德地图 API Key' };
  }

  // 获取小区经纬度
  const communityResult = await db
    .collection('communities')
    .doc(communityId)
    .field({ _id: true, name: true, location: true })
    .get();

  if (!communityResult.data || communityResult.data.length === 0) {
    return { code: 404, message: '小区不存在' };
  }

  const community = communityResult.data[0];
  const origin = community.location;
  if (!origin || !origin.lng || !origin.lat) {
    return { code: 400, message: '该小区缺少经纬度信息' };
  }

  const originStr = `${origin.lng},${origin.lat}`;

  // 缓存检查（24小时）
  const cacheKey = `${communityId}_${destination || destinationLng}_${destinationLat}_${mode}`;
  const cached = commuteCache.get(cacheKey);
  if (cached && Date.now() - cached.time < 24 * 60 * 60 * 1000) {
    return { code: 0, data: cached.data };
  }

  try {
    // 解析目的地坐标
    let destStr;
    if (destinationLng && destinationLat) {
      destStr = `${destinationLng},${destinationLat}`;
    } else {
      // 通过地理编码获取目的地坐标
      const geoResult = await amapRequest('/v3/geocode/geo', { address: destination, city: '北京' });
      if (!geoResult.geocodes || geoResult.geocodes.length === 0) {
        return { code: 400, message: `无法解析目的地：${destination}` };
      }
      const loc = geoResult.geocodes[0].location.split(',');
      destStr = `${loc[0]},${loc[1]}`;
    }

    // 路径规划
    let routeResult;
    if (mode === 'transit') {
      // 公交/地铁
      routeResult = await amapRequest('/v3/direction/transit/integrated', {
        origin: originStr,
        destination: destStr,
        city: '北京',
      });
    } else if (mode === 'walking') {
      routeResult = await amapRequest('/v3/direction/walking', {
        origin: originStr,
        destination: destStr,
      });
    } else {
      // 默认驾车
      routeResult = await amapRequest('/v3/direction/driving', {
        origin: originStr,
        destination: destStr,
        strategy: '0', // 速度优先
      });
    }

    const route = routeResult.route;
    let commuteData = null;

    if (route && route.paths && route.paths.length > 0) {
      const path = route.paths[0];
      const duration = Math.round(path.duration / 60); // 转换为分钟
      const distance = path.distance; // 米

      commuteData = {
        communityId,
        communityName: community.name,
        destination: destination || `${destinationLng},${destinationLat}`,
        mode,
        modeLabel: mode === 'driving' ? '驾车' : mode === 'transit' ? '公交/地铁' : '步行',
        duration, // 分钟
        durationText: duration >= 60 ? `${Math.floor(duration / 60)}小时${duration % 60}分钟` : `${duration}分钟`,
        distance, // 米
        distanceText: distance >= 1000 ? `${(distance / 1000).toFixed(1)}公里` : `${distance}米`,
        cachedAt: new Date().toISOString(),
      };
    } else {
      commuteData = {
        communityId,
        communityName: community.name,
        destination: destination || `${destinationLng},${destinationLat}`,
        mode,
        modeLabel: mode === 'driving' ? '驾车' : mode === 'transit' ? '公交/地铁' : '步行',
        duration: -1,
        durationText: '无法计算',
        distance: -1,
        distanceText: '无法计算',
        cachedAt: new Date().toISOString(),
      };
    }

    // 写入缓存
    commuteCache.set(cacheKey, { data: commuteData, time: Date.now() });

    return { code: 0, data: commuteData };
  } catch (err) {
    // 如果有缓存，降级返回缓存（即使过期）
    if (cached) {
      return { code: 0, data: { ...cached.data, stale: true } };
    }
    return { code: 500, message: `通勤时间计算失败: ${err.message}` };
  }
}

// ==================== 周边配套查询 ====================

/**
 * 周边配套查询
 * @param {string} communityId - 小区ID
 * @param {number} radius - 搜索半径（米），默认 1000
 */
async function handleNearbyPoi({ communityId, radius = 1000 }) {
  if (!communityId) {
    return { code: 400, message: '缺少 communityId' };
  }
  if (!AMAP_KEY) {
    return { code: 500, message: '未配置高德地图 API Key' };
  }

  // 获取小区经纬度
  const communityResult = await db
    .collection('communities')
    .doc(communityId)
    .field({ _id: true, name: true, location: true })
    .get();

  if (!communityResult.data || communityResult.data.length === 0) {
    return { code: 404, message: '小区不存在' };
  }

  const community = communityResult.data[0];
  const loc = community.location;
  if (!loc || !loc.lng || !loc.lat) {
    return { code: 400, message: '该小区缺少经纬度信息' };
  }

  const locationStr = `${loc.lng},${loc.lat}`;
  const r = Math.min(Math.max(radius, 500), 3000); // 限制 500-3000 米

  // 并行查询多类POI
  const poiTypes = [
    { key: 'schools', types: '141200|141201', label: '学校', subTypes: { '141200': '小学', '141201': '中学' } },
    { key: 'hospitals', types: '090100|090101', label: '医院', subTypes: { '090100': '综合医院', '090101': '专科医院' } },
    { key: 'shopping', types: '060100|060101|060400', label: '购物', subTypes: { '060100': '商场', '060101': '超市', '060400': '商业街' } },
    { key: 'metro', types: '150500', label: '地铁站', subTypes: { '150500': '地铁站' } },
    { key: 'restaurants', types: '050000', label: '餐饮', subTypes: { '050000': '餐饮' } },
  ];

  try {
    const results = await Promise.all(
      poiTypes.map(async (pt) => {
        try {
          const res = await amapRequest('/v3/place/around', {
            location: locationStr,
            types: pt.types,
            radius: r,
            offset: 10,
            page: 1,
            extensions: 'base',
          });

          const pois = (res.pois || []).map((poi) => ({
            id: poi.id,
            name: poi.name,
            type: poi.type,
            typeLabel: pt.subTypes[poi.type] || pt.label,
            address: poi.address,
            distance: parseInt(poi.distance) || 0,
            distanceText: poi.distance ? `${poi.distance}米` : '',
            location: poi.location,
          }));

          return { key: pt.key, label: pt.label, pois };
        } catch {
          return { key: pt.key, label: pt.label, pois: [] };
        }
      })
    );

    const nearbyData = {};
    results.forEach((r) => {
      nearbyData[r.key] = { label: r.label, pois: r.pois };
    });

    return {
      code: 0,
      data: {
        communityId,
        communityName: community.name,
        radius: r,
        ...nearbyData,
        cachedAt: new Date().toISOString(),
      },
    };
  } catch (err) {
    return { code: 500, message: `周边配套查询失败: ${err.message}` };
  }
}