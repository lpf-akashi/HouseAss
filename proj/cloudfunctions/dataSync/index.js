/**
 * dataSync 云函数 — 按需数据刷新、任务队列管理
 *
 * 入口参数:
 *   action: 'refresh' — 触发单个小区数据刷新
 *
 * 刷新流程:
 *   1. 检查 data_sync_jobs 是否已有 pending/running 任务（防重复）
 *   2. 创建任务记录，锁定 5 分钟
 *   3. 执行数据刷新（当前 MVP 阶段为占位，后续接入真实 API）
 *   4. 更新 communities 的 dataUpdatedAt
 *   5. 更新任务状态为 success/failed
 */

const cloud = require('@cloudbase/node-sdk');

const app = cloud.init({
  env: cloud.SYMBOL_CURRENT_ENV,
});

const db = app.database();
const _ = db.command;

// 任务锁定时长（毫秒）
const LOCK_DURATION = 5 * 60 * 1000; // 5 分钟
const MAX_RETRIES = 3;

exports.main = async (event, context) => {
  const { action } = event;

  try {
    switch (action) {
      case 'refresh':
        return await handleRefresh(event);
      default:
        return { code: 400, message: `未知 action: ${action}` };
    }
  } catch (e) {
    console.error(`[dataSync] ${action} 错误:`, e);
    return { code: 500, message: e.message || '服务器内部错误' };
  }
};

/**
 * 按需刷新单个小区数据
 *
 * 流程：
 * 1. 防重复检查
 * 2. 创建/锁定任务
 * 3. 执行刷新
 * 4. 更新结果
 */
async function handleRefresh({ communityId }) {
  if (!communityId) {
    return { code: 400, message: '缺少 communityId' };
  }

  const now = new Date();
  const nowISO = now.toISOString();

  // 1. 检查是否已有进行中的任务
  const existingJob = await db
    .collection('data_sync_jobs')
    .where({
      communityId,
      status: _.in(['pending', 'running']),
      lockedUntil: _.gt(nowISO),
    })
    .count();

  if (existingJob.total > 0) {
    return {
      code: 0,
      data: {
        refreshed: false,
        message: '该小区已有进行中的刷新任务',
      },
    };
  }

  // 2. 检查上次刷新时间
  const community = await db
    .collection('communities')
    .doc(communityId)
    .field({ dataUpdatedAt: true, sourceInfo: true })
    .get();

  const communityData = community.data?.[0];
  if (!communityData) {
    return { code: 404, message: '小区不存在' };
  }

  const lastUpdate = communityData.dataUpdatedAt
    ? new Date(communityData.dataUpdatedAt).getTime()
    : 0;
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  if (Date.now() - lastUpdate < sevenDays) {
    return {
      code: 0,
      data: {
        refreshed: false,
        message: '数据在7天内已更新，无需刷新',
      },
    };
  }

  // 3. 创建任务记录（锁定）
  const lockedUntil = new Date(now.getTime() + LOCK_DURATION).toISOString();

  const jobResult = await db.collection('data_sync_jobs').add({
    communityId,
    status: 'running',
    lockedUntil,
    retryCount: 0,
    maxRetries: MAX_RETRIES,
    lastError: '',
    createdAt: nowISO,
    updatedAt: nowISO,
  });

  const jobId = jobResult.id;

  try {
    // 4. 执行刷新逻辑
    // MVP 阶段：仅更新 dataUpdatedAt 时间戳，后续接入真实 API
    await refreshCommunityData(communityId);

    // 5. 更新任务状态为成功
    await db
      .collection('data_sync_jobs')
      .doc(jobId)
      .update({
        status: 'success',
        updatedAt: new Date().toISOString(),
      });

    return {
      code: 0,
      data: {
        refreshed: true,
        message: '数据刷新成功',
      },
    };
  } catch (err) {
    // 6. 更新任务状态为失败
    const job = await db.collection('data_sync_jobs').doc(jobId).get();
    const jobData = job.data?.[0] || {};
    const retryCount = (jobData.retryCount || 0) + 1;
    const finalStatus = retryCount >= MAX_RETRIES ? 'failed' : 'pending';

    await db
      .collection('data_sync_jobs')
      .doc(jobId)
      .update({
        status: finalStatus,
        retryCount,
        lastError: err.message || '未知错误',
        lockedUntil: finalStatus === 'pending'
          ? new Date(Date.now() + 60000).toISOString() // 1分钟后重试
          : nowISO,
        updatedAt: new Date().toISOString(),
      });

    console.error(`[dataSync] 刷新 ${communityId} 失败:`, err);

    return {
      code: 500,
      data: {
        refreshed: false,
        message: `刷新失败: ${err.message}`,
      },
    };
  }
}

/**
 * 刷新小区数据（MVP 阶段占位）
 *
 * 后续接入真实数据源时，在此函数中：
 * 1. 调用聚合数据 / 贝壳 API 获取最新房价
 * 2. 调用高德 API 获取通勤时间
 * 3. 更新 communities 集合
 * 4. 更新 sourceInfo 字段
 */
async function refreshCommunityData(communityId) {
  // MVP 阶段仅更新时间戳
  const now = new Date().toISOString();

  await db
    .collection('communities')
    .doc(communityId)
    .update({
      dataUpdatedAt: now,
      updatedAt: now,
      'sourceInfo.fetchedAt': now,
    });

  // 后续接入真实 API 时在此处添加数据拉取逻辑
  // 示例：
  // const priceData = await fetchFromJuheAPI(communityId);
  // await db.collection('communities').doc(communityId).update({
  //   avgPrice: priceData.avgPrice,
  //   priceChange: priceData.priceChange,
  //   ...
  // });

  return true;
}