/**
 * reading-time.ts — 阅读时间计算工具
 *
 * 根据文章内容估算阅读时间。
 * 中文字符按 300 字/分钟计算，英文单词按 200 词/分钟计算。
 */

/**
 * 计算文章的预估阅读时间
 *
 * @param content - 文章的原始内容（Markdown/MDX 文本）
 * @returns 格式化的阅读时间字符串，如 "3 分钟" 或 "约 5 分钟"
 */
export function getReadingTime(content: string): string {
  if (!content) return '1 分钟';

  // 去除 Markdown 语法符号
  const cleanContent = content
    .replace(/```[\s\S]*?```/g, '') // 移除代码块
    .replace(/`[^`]*`/g, '')        // 移除行内代码
    .replace(/#{1,6}\s/g, '')       // 移除标题标记
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // 链接保留文字
    .replace(/[*_~>-]/g, '')        // 移除格式符号
    .replace(/\s+/g, ' ')           // 合并空白
    .trim();

  // 统计中文字符数
  const chineseChars = (cleanContent.match(/[\u4e00-\u9fff]/g) || []).length;

  // 统计英文单词数（去除中文字符后按空格分词）
  const englishText = cleanContent.replace(/[\u4e00-\u9fff]/g, ' ');
  const englishWords = englishText.split(/\s+/).filter(w => w.length > 0).length;

  // 中文阅读速度：约 300 字/分钟
  // 英文阅读速度：约 200 词/分钟
  const chineseMinutes = chineseChars / 300;
  const englishMinutes = englishWords / 200;

  const totalMinutes = Math.ceil(chineseMinutes + englishMinutes);

  // 最少 1 分钟
  const minutes = Math.max(1, totalMinutes);

  if (minutes === 1) {
    return '1 分钟';
  }

  return `约 ${minutes} 分钟`;
}
