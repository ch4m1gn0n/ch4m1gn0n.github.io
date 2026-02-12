'use strict';

// Obsidian Custom Attachment Location 使用 ${filename}.assets 作为附件目录
// Hexo 的 post_asset_folder 只认与文章同名的文件夹
// 此脚本在构建时自动桥接两者

const fs = require('fs');
const path = require('path');

const postsDir = path.join(hexo.base_dir, 'source', '_posts');

function createAssetLinks() {
  if (!fs.existsSync(postsDir)) return;

  const entries = fs.readdirSync(postsDir);
  for (const entry of entries) {
    if (!entry.endsWith('.assets')) continue;

    const fullPath = path.join(postsDir, entry);
    try {
      if (!fs.statSync(fullPath).isDirectory()) continue;
    } catch (e) { continue; }

    const postName = entry.slice(0, -7); // 去掉 '.assets'
    const linkPath = path.join(postsDir, postName);

    // 如果已存在同名真实目录，不覆盖
    if (fs.existsSync(linkPath) && !fs.lstatSync(linkPath).isSymbolicLink()) continue;
    // 清理旧链接
    if (fs.existsSync(linkPath)) fs.unlinkSync(linkPath);

    fs.symlinkSync(entry, linkPath);
    hexo.log.info('Asset link: %s/ -> %s', postName, entry);
  }
}

function cleanAssetLinks() {
  if (!fs.existsSync(postsDir)) return;

  const entries = fs.readdirSync(postsDir);
  for (const entry of entries) {
    const fullPath = path.join(postsDir, entry);
    try {
      if (fs.lstatSync(fullPath).isSymbolicLink()) {
        fs.unlinkSync(fullPath);
        hexo.log.info('Cleaned asset link: %s', entry);
      }
    } catch (e) { /* ignore */ }
  }
}

// 在 Hexo 加载源文件前创建链接
createAssetLinks();

// 进程退出时清理链接（此时所有文件 I/O 已完成）
process.on('exit', cleanAssetLinks);

// 将 Obsidian 生成的 "PostName.assets/image.png" 路径
// 转换为 "image.png"，让 postAsset 从同名文件夹解析
hexo.extend.filter.register('before_post_render', function(data) {
  data.content = data.content.replace(
    /!\[([^\]]*)\]\(([^\/)]*?)\.assets\/([^)]+)\)/g,
    '![$1]($3)'
  );
  return data;
});
