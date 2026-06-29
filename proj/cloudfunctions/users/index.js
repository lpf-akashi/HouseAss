/**
 * users 云函数 — 用户收藏、订阅、通知管理
 *
 * 入口参数:
 *   action: 'add-favorite' | 'remove-favorite' | 'get-favorites'
 *          | 'subscribe' | 'unsubscribe' | 'get-subscriptions'
 *          | 'get-notifications' | 'mark-read'
 */

const cloud = require('@cloudbase/node-sdk');

const app = cloud.init({
  env: cloud.SYMBOL_CURRENT_ENV,
});

const db = app.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { action } = event;

  // 获取当前用户 uid（CloudBase 自动注入）
  const uid = cloud.getWXContext ? cloud.getWXContext().OPENID : null;

  try {
    switch (action) {
      case 'add-favorite':
        return await handleAddFavorite(event, uid);
      case 'remove-favorite':
        return await handleRemoveFavorite(event, uid);
      case 'get-favorites':
        return await handleGetFavorites(event, uid);
      case 'subscribe':
        return await handleSubscribe(event, uid);
      case 'unsubscribe':
        return await handleUnsubscribe(event, uid);
      case 'get-subscriptions':
        return await handleGetSubscriptions(event, uid);
      case 'get-notifications':
        return await handleGetNotifications(event, uid);
      case 'mark-read':
        return await handleMarkRead(event, uid);
      default:
        return { code: 400, message: `未知 action: ${action}` };
    }
  } catch (e) {
    console.error(`[users] ${action} 错误:`, e);
    return { code: 500, message: e.message || '服务器内部错误' };
  }
};

/**
 * 获取当前用户 uid
 * 匿名用户使用临时 ID，登录用户使用 CloudBase uid
 */
function getUserId(event, uid) {
  // 优先使用 CloudBase 认证 uid
  if (uid) return uid;
  // 匿名用户使用设备标识
  return event.userInfo?.openId || 'anonymous';
}

/**
 * 添加收藏
 */
async function handleAddFavorite(event, uid) {
  const userId = getUserId(event, uid);
  const { communityId } = event;

  if (!communityId) {
    return { code: 400, message: '缺少 communityId' };
  }

  // 检查是否已收藏
  const existing = await db
    .collection('favorites')
    .where({ userId, communityId })
    .count();

  if (existing.total > 0) {
    return { code: 0, data: { favorited: true, message: '已收藏' } };
  }

  // 获取小区信息做冗余存储
  const community = await db
    .collection('communities')
    .doc(communityId)
    .field({ name: true, district: true, subDistrict: true, avgPrice: true })
    .get();

  const info = community.data?.[0] || {};

  await db.collection('favorites').add({
    userId,
    communityId,
    communityName: info.name || '',
    district: info.district || '',
    subDistrict: info.subDistrict || '',
    avgPrice: info.avgPrice || 0,
    createdAt: new Date().toISOString(),
  });

  return { code: 0, data: { favorited: true } };
}

/**
 * 取消收藏
 */
async function handleRemoveFavorite(event, uid) {
  const userId = getUserId(event, uid);
  const { communityId } = event;

  if (!communityId) {
    return { code: 400, message: '缺少 communityId' };
  }

  await db
    .collection('favorites')
    .where({ userId, communityId })
    .remove();

  return { code: 0, data: { favorited: false } };
}

/**
 * 获取收藏列表（含小区详情）
 */
async function handleGetFavorites(event, uid) {
  const userId = getUserId(event, uid);

  const result = await db
    .collection('favorites')
    .where({ userId })
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();

  return { code: 0, data: result.data };
}

/**
 * 订阅小区
 */
async function handleSubscribe(event, uid) {
  const userId = getUserId(event, uid);
  const { communityId, type } = event;

  if (!communityId) {
    return { code: 400, message: '缺少 communityId' };
  }

  const types = Array.isArray(type) ? type : ['price_change'];

  // 检查是否已订阅
  const existing = await db
    .collection('subscriptions')
    .where({ userId, communityId })
    .count();

  if (existing.total > 0) {
    // 更新订阅类型
    await db
      .collection('subscriptions')
      .where({ userId, communityId })
      .update({ type: types, updatedAt: new Date().toISOString() });
  } else {
    await db.collection('subscriptions').add({
      userId,
      communityId,
      type: types,
      createdAt: new Date().toISOString(),
      lastNotifiedAt: null,
    });
  }

  return { code: 0, data: { subscribed: true } };
}

/**
 * 取消订阅
 */
async function handleUnsubscribe(event, uid) {
  const userId = getUserId(event, uid);
  const { communityId } = event;

  if (!communityId) {
    return { code: 400, message: '缺少 communityId' };
  }

  await db
    .collection('subscriptions')
    .where({ userId, communityId })
    .remove();

  return { code: 0, data: { subscribed: false } };
}

/**
 * 获取订阅列表
 */
async function handleGetSubscriptions(event, uid) {
  const userId = getUserId(event, uid);

  const result = await db
    .collection('subscriptions')
    .where({ userId })
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();

  // 获取订阅小区的名称
  const communityIds = result.data.map((s) => s.communityId);
  if (communityIds.length > 0) {
    const communities = await db
      .collection('communities')
      .where({ _id: _.in(communityIds) })
      .field({ _id: true, name: true, avgPrice: true, priceChange: true })
      .get();

    const nameMap = {};
    communities.data.forEach((c) => {
      nameMap[c._id] = c;
    });

    result.data.forEach((s) => {
      s.communityName = nameMap[s.communityId]?.name || '';
      s.currentAvgPrice = nameMap[s.communityId]?.avgPrice || 0;
      s.currentPriceChange = nameMap[s.communityId]?.priceChange || '';
    });
  }

  return { code: 0, data: result.data };
}

/**
 * 获取通知列表
 */
async function handleGetNotifications(event, uid) {
  const userId = getUserId(event, uid);
  const { page = 1, pageSize = 20 } = event;

  const limit = Math.min(Math.max(1, +pageSize || 20), 50);
  const skip = (Math.max(1, +page || 1) - 1) * limit;

  const [listResult, countResult, unreadResult] = await Promise.all([
    db
      .collection('notifications')
      .where({ userId })
      .orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(limit)
      .get(),
    db
      .collection('notifications')
      .where({ userId })
      .count(),
    db
      .collection('notifications')
      .where({ userId, read: false })
      .count(),
  ]);

  return {
    code: 0,
    data: {
      list: listResult.data,
      unreadCount: unreadResult.total,
      total: countResult.total,
      page: +page || 1,
      pageSize: limit,
    },
  };
}

/**
 * 标记通知已读
 */
async function handleMarkRead(event, uid) {
  const userId = getUserId(event, uid);
  const { notificationId } = event;

  if (notificationId) {
    // 标记单条
    await db
      .collection('notifications')
      .doc(notificationId)
      .update({ read: true });
  } else {
    // 全部标记已读
    await db
      .collection('notifications')
      .where({ userId, read: false })
      .update({ read: true });
  }

  return { code: 0 };
}