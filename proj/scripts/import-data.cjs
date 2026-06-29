/**
 * 数据导入脚本
 * 将 src/data/mockData.js 中的小区数据导入 CloudBase 云数据库
 *
 * 使用方法（在 proj 目录下执行）:
 *   node scripts/import-data.js
 *
 * 前置条件：已通过 cloudbase login 登录
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ENV_ID = 'house-ass-d7glvbrq60ad20614';

// 读取 Mock 数据文件
const mockPath = path.join(__dirname, '..', 'src', 'data', 'mockData.js');
const mockContent = fs.readFileSync(mockPath, 'utf-8');

// 提取 communities 数组
const match = mockContent.match(/export const communities = (\[[\s\S]*?\n\]);/);
if (!match) {
  console.error('无法从 mockData.js 中提取 communities 数据');
  process.exit(1);
}

const communities = new Function(`return ${match[1]}`)();
console.log(`找到 ${communities.length} 条小区数据\n`);

// 为每条数据生成插入命令
async function importData() {
  let success = 0;
  let failed = 0;

  for (const community of communities) {
    const { _id, name } = community;
    try {
      // 构建 JSON 文件，通过 cloudbase db nosql execute 导入
      const jsonFile = path.join(__dirname, '..', `_temp_import_${_id}.json`);

      const insertCmd = JSON.stringify({
        insert: 'communities',
        documents: [community],
      });

      const command = JSON.stringify([
        {
          TableName: 'communities',
          CommandType: 'INSERT',
          Command: insertCmd,
        },
      ]);

      fs.writeFileSync(jsonFile, command, 'utf-8');

      // 使用 cloudbase CLI 导入
      const cmd = `cloudbase db nosql execute -e ${ENV_ID} --command ${JSON.stringify(JSON.parse(command))}`;

      try {
        execSync(cmd, {
          cwd: path.join(__dirname, '..'),
          stdio: 'pipe',
          timeout: 15000,
          encoding: 'utf-8',
        });
        console.log(`  [OK] ${name} (${_id})`);
        success++;
      } catch (execErr) {
        // 如果已存在，尝试更新
        console.log(`  [跳过] ${name} — 可能已存在，尝试更新...`);
        // 先删除再插入
        const deleteCmd = JSON.stringify([
          {
            TableName: 'communities',
            CommandType: 'DELETE',
            Command: JSON.stringify({
              delete: 'communities',
              deletes: [{ q: { _id }, limit: 1 }],
            }),
          },
        ]);
        fs.writeFileSync(jsonFile, deleteCmd, 'utf-8');
        try {
          execSync(
            `cloudbase db nosql execute -e ${ENV_ID} --command ${JSON.stringify(JSON.parse(deleteCmd))}`,
            {
              cwd: path.join(__dirname, '..'),
              stdio: 'pipe',
              timeout: 10000,
              encoding: 'utf-8',
            },
          );
        } catch (e) {
          // 忽略删除错误
        }

        // 重新插入
        fs.writeFileSync(jsonFile, command, 'utf-8');
        try {
          execSync(
            `cloudbase db nosql execute -e ${ENV_ID} --command ${JSON.stringify(JSON.parse(command))}`,
            {
              cwd: path.join(__dirname, '..'),
              stdio: 'pipe',
              timeout: 15000,
              encoding: 'utf-8',
            },
          );
          console.log(`  [OK] ${name} (重新插入成功)`);
          success++;
        } catch (retryErr) {
          console.error(`  [失败] ${name}: ${retryErr.message}`);
          failed++;
        }
      }

      // 清理临时文件
      try {
        fs.unlinkSync(jsonFile);
      } catch (e) {
        // 忽略
      }
    } catch (err) {
      console.error(`  [失败] ${name}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n导入完成: 成功 ${success} 条, 失败 ${failed} 条`);
}

importData().catch(console.error);