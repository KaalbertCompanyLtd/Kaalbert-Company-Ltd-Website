import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.fn();

vi.mock("@/lib/r2-client", () => ({
  getR2Client: () => ({ send: sendMock }),
  getR2Bucket: () => "kaalbert-media",
  getR2PublicUrl: (key: string) => `https://pub-test.r2.dev/${key}`,
}));

import {
  encodeDownloadFileUpload,
  encodeImageUpload,
  MediaValidationError,
} from "@/lib/media-storage";

beforeEach(() => {
  sendMock.mockReset();
  sendMock.mockResolvedValue({});
});

describe("encodeImageUpload", () => {
  it("uploads a valid image to R2 and returns its public URL", async () => {
    const buffer = Buffer.from([1, 2, 3, 4]);
    const url = await encodeImageUpload({ buffer, contentType: "image/png" });

    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(url).toMatch(/^https:\/\/pub-test\.r2\.dev\/images\/.+\.png$/);
  });

  it("rejects an unsupported content type", async () => {
    await expect(
      encodeImageUpload({ buffer: Buffer.from([1]), contentType: "image/gif" }),
    ).rejects.toThrow(MediaValidationError);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("rejects an empty file", async () => {
    await expect(
      encodeImageUpload({ buffer: Buffer.alloc(0), contentType: "image/jpeg" }),
    ).rejects.toThrow(MediaValidationError);
  });

  it("rejects a file over the 2MB cap", async () => {
    const oversized = Buffer.alloc(2 * 1024 * 1024 + 1);
    await expect(
      encodeImageUpload({ buffer: oversized, contentType: "image/webp" }),
    ).rejects.toThrow(MediaValidationError);
  });

  it("accepts a file exactly at the 2MB cap", async () => {
    const atCap = Buffer.alloc(2 * 1024 * 1024);
    await expect(encodeImageUpload({ buffer: atCap, contentType: "image/webp" })).resolves.toMatch(
      /^https:\/\//,
    );
  });
});

describe("encodeDownloadFileUpload", () => {
  it("uploads a valid PDF to R2 and returns its public URL", async () => {
    const buffer = Buffer.from([1, 2, 3, 4]);
    const url = await encodeDownloadFileUpload({ buffer, contentType: "application/pdf" });

    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(url).toMatch(/^https:\/\/pub-test\.r2\.dev\/downloads\/.+\.pdf$/);
  });

  it("rejects a non-PDF content type", async () => {
    await expect(
      encodeDownloadFileUpload({ buffer: Buffer.from([1]), contentType: "image/png" }),
    ).rejects.toThrow(MediaValidationError);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("rejects an empty file", async () => {
    await expect(
      encodeDownloadFileUpload({ buffer: Buffer.alloc(0), contentType: "application/pdf" }),
    ).rejects.toThrow(MediaValidationError);
  });

  it("rejects a file over the 5MB cap", async () => {
    const oversized = Buffer.alloc(5 * 1024 * 1024 + 1);
    await expect(
      encodeDownloadFileUpload({ buffer: oversized, contentType: "application/pdf" }),
    ).rejects.toThrow(MediaValidationError);
  });
});
