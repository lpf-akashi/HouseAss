/**
 * communities 云函数 — 小区搜索、详情、对比、热门
 *
 * 入口参数:
 *   action: 'search' | 'detail' | 'compare' | 'hot' | 'suggestions'
 */

const cloud = require('@cloudbase/node-sdk');

const app = cloud.init({
  env: cloud.SYMBOL_CURRENT_ENV,
});

const db = app.database();
const _ = db.command;

// 缓存热门小区结果（60秒），减少数据库查询
let hotCache = { data: null, expireAt: 0 };

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