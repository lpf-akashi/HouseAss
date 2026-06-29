/**
 * 数据导入脚本 — 生成 JSON 文件用于 CloudBase 控制台导入
 *
 * 使用方法:
 *   node scripts/generate-import-json.cjs
 *   然后去 CloudBase 控制台 → 数据库 → communities 集合 → 导入 → 选择生成的 JSON 文件
 */

const fs = require('fs');
const path = require('path');

const mockPath = path.join(__dirname, '..', 'src', 'data', 'mockData.js');
const mockContent = fs.readFileSync(mockPath, 'utf-8');

const match = mockContent.match(/export const communities = (\[[\s\S]*?\n\]);/);
if (!match) {
  console.error('无法从 mockData.js 中提取 communities 数据');
  process.exit(1);
}

const communities = new Function('return ' + match[1])();

// 生成 CloudBase 兼容的导入格式（每行一个 JSON 对象）
const lines = communities.map((c) => JSON.stringify(c));
const output = lines.join('\n');

const outputPath = path.join(__dirname, '..', 'communities-import.json');
fs.writeFileSync(outputPath, output, 'utf-8');

console.log(`已生成 ${communities.length} 条数据 → ${outputPath}`);
console.log('\n下一步操作:');
console.log('1. 打开 CloudBase 控制台: https://console.cloud.tencent.com/tcb');
console.log('2. 进入环境: house-ass-d7glvbrq60ad20614');
console.log('3. 左侧菜单 → 数据库');
console.log('4. 新建集合: communities（如果不存在）');
console.log('5. 点击 communities 集合 → 导入');
console.log('6. 选择文件: proj/communities-import.json');
console.log('7. 导入格式选择: JSON Lines (每行一个 JSON)');
console.log('8. 点击导入');