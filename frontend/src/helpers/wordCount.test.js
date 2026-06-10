import { describe, expect, test } from "vitest";
import { countWords, readingTime } from "./wordCount";

describe("countWords", () => {
  test("returns 0 for empty/null/undefined", () => {
    expect(countWords("")).toBe(0);
    expect(countWords(null)).toBe(0);
    expect(countWords(undefined)).toBe(0);
  });

  test("counts Chinese characters", () => {
    expect(countWords("你好世界")).toBe(4);
  });

  test("counts English words", () => {
    expect(countWords("hello world test")).toBe(3);
  });

  test("handles mixed Chinese and English", () => {
    expect(countWords("你好 hello 世界 world")).toBe(6);
  });

  test("ignores digits and punctuation", () => {
    expect(countWords("hello, world! 123 test.")).toBe(3);
  });

  test("strips Markdown syntax", () => {
    expect(countWords("# Hello\n\n**bold** text [link](url)")).toBe(4);
  });

  test("strips code blocks", () => {
    expect(countWords("before ```js\nconst x = 1;\n``` after")).toBe(2);
  });

  test("handles real-world article body", () => {
    const body =
      "# Getting Started\n\nThis is a **simple** guide.\n\n欢迎阅读本文。";
    expect(countWords(body)).toBe(13);
  });
});

describe("readingTime", () => {
  test("returns 0 for 0 words", () => {
    expect(readingTime(0)).toBe(0);
  });

  test("returns 1 for up to 300 words", () => {
    expect(readingTime(300)).toBe(1);
    expect(readingTime(1)).toBe(1);
  });

  test("returns 2 for 301 words", () => {
    expect(readingTime(301)).toBe(2);
  });

  test("respects custom wpm", () => {
    expect(readingTime(200, 100)).toBe(2);
  });
});
