/**
 * Strip Markdown syntax from text before counting.
 * Handles: headings, bold/italic, links, images, code blocks, blockquotes, lists, hr.
 */
function stripMarkdown(text) {
  return text
    .replace(/```[\s\S]*?```/g, "") // fenced code blocks
    .replace(/`[^`]*`/g, "") // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links (keep text)
    .replace(/^#{1,6}\s+/gm, "") // headings
    .replace(/(\*{1,3}|_{1,3})(.*?)\1/g, "$2") // bold/italic
    .replace(/^>\s+/gm, "") // blockquotes
    .replace(/^[\s]*[-*+]\s+/gm, "") // unordered list markers
    .replace(/^[\s]*\d+\.\s+/gm, "") // ordered list markers
    .replace(/^-{3,}/gm, "") // horizontal rules
    .replace(/\n/g, " ") // newlines to spaces
    .trim();
}

/**
 * Count "words" for Chinese/English mixed text.
 * - Each Chinese character (CJK Unified Ideographs) = 1 word
 * - Each sequence of Latin letters = 1 word
 * - Digits and punctuation are not counted.
 */
export function countWords(text) {
  if (!text) return 0;

  const cleaned = stripMarkdown(text);

  let count = 0;
  let inWord = false;

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];

    // CJK Unified Ideographs block U+4E00–U+9FFF, plus extensions
    if (
      (ch >= "\u4e00" && ch <= "\u9fff") ||
      (ch >= "\u3400" && ch <= "\u4dbf")
    ) {
      count++;
      inWord = false;
    } else if (/[a-zA-Z]/.test(ch)) {
      if (!inWord) {
        count++;
        inWord = true;
      }
    } else {
      inWord = false;
    }
  }

  return count;
}

/**
 * Estimated reading time in minutes.
 * @param {number} wordCount - total word/char count
 * @param {number} wpm - reading speed (default 300)
 * @returns {number} minutes, rounded up
 */
export function readingTime(wordCount, wpm = 300) {
  if (!wordCount || wordCount <= 0) return 0;
  return Math.ceil(wordCount / wpm);
}
