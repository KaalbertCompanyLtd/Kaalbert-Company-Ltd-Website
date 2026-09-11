import { describe, expect, it } from "vitest";

import { encodeImageUpload, MediaValidationError } from "@/lib/media-storage";

describe("encodeImageUpload", () => {
  it("encodes a valid image as a base64 data URI", () => {
    const buffer = Buffer.from([1, 2, 3, 4]);
    const url = encodeImageUpload({ buffer, contentType: "image/png" });

    expect(url).toBe(`data:image/png;base64,${buffer.toString("base64")}`);
  });

  it("rejects an unsupported content type", () => {
    expect(() => encodeImageUpload({ buffer: Buffer.from([1]), contentType: "image/gif" })).toThrow(
      MediaValidationError,
    );
  });

  it("rejects an empty file", () => {
    expect(() => encodeImageUpload({ buffer: Buffer.alloc(0), contentType: "image/jpeg" })).toThrow(
      MediaValidationError,
    );
  });

  it("rejects a file over the 2MB cap", () => {
    const oversized = Buffer.alloc(2 * 1024 * 1024 + 1);
    expect(() => encodeImageUpload({ buffer: oversized, contentType: "image/webp" })).toThrow(
      MediaValidationError,
    );
  });

  it("accepts a file exactly at the 2MB cap", () => {
    const atCap = Buffer.alloc(2 * 1024 * 1024);
    expect(() => encodeImageUpload({ buffer: atCap, contentType: "image/webp" })).not.toThrow();
  });
});
