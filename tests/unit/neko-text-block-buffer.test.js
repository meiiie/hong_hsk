import { afterEach, describe, expect, it, vi } from "vitest";
import { NekoTextBlockBuffer } from "../../scripts/neko-acp-vite-plugin.mjs";

describe("NekoTextBlockBuffer", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("flushes a short partial answer after the maximum wait", () => {
    vi.useFakeTimers();
    const blocks = [];
    const stream = new NekoTextBlockBuffer((block) => blocks.push(block), 140, 120);

    stream.push("Một phần câu trả lời");
    vi.advanceTimersByTime(139);
    expect(blocks).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(blocks).toEqual(["Một phần câu trả lời"]);
  });

  it("flushes immediately at a readable boundary or target size", () => {
    vi.useFakeTimers();
    const blocks = [];
    const stream = new NekoTextBlockBuffer((block) => blocks.push(block), 140, 12);

    stream.push("Câu đã xong.");
    stream.push("123456789012");

    expect(blocks).toEqual(["Câu đã xong.", "123456789012"]);
  });

  it("flushes the final remainder once and ignores later tokens", () => {
    const blocks = [];
    const stream = new NekoTextBlockBuffer((block) => blocks.push(block), 140, 120);

    stream.push("Phần cuối");
    stream.finish();
    stream.finish();
    stream.push("không được nhận");

    expect(blocks).toEqual(["Phần cuối"]);
  });
});
