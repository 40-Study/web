import { describe, expect, it } from "vitest";
import {
  extractUploadId,
  isHlsAuthFailure,
  pickVideoSource,
  signedQueryOf,
} from "./hls-playback";

const ID = "11111111-2222-3333-4444-555555555555";
const HLS = `/api/hls/${ID}/master.m3u8?exp=100&uid=u1&sig=abc`;
const ORIGINAL = `/api/hls/${ID}/video.mp4?exp=100&uid=u1&sig=def`;

describe("signedQueryOf / extractUploadId", () => {
  it("lấy query của URL ký và upload id", () => {
    expect(signedQueryOf(HLS)).toBe("exp=100&uid=u1&sig=abc");
    expect(signedQueryOf(`/api/hls/${ID}/master.m3u8`)).toBe("");
    expect(signedQueryOf(undefined)).toBe("");
    expect(extractUploadId(HLS)).toBe(ID);
    expect(extractUploadId("https://cdn.example/v.mp4")).toBeNull();
    expect(extractUploadId(null)).toBeNull();
  });
});

describe("isHlsAuthFailure", () => {
  it("chỉ 403 mới là chữ ký bị từ chối (lỗi mạng/5xx thì không)", () => {
    expect(isHlsAuthFailure({ response: { code: 403 } })).toBe(true);
    expect(isHlsAuthFailure({ response: { code: 500 } })).toBe(false);
    expect(isHlsAuthFailure({ response: { code: 404 } })).toBe(false);
    expect(isHlsAuthFailure({})).toBe(false);
    expect(isHlsAuthFailure(undefined)).toBe(false);
  });
});

describe("pickVideoSource", () => {
  it("HLS sẵn sàng -> phát URL HLS ký", () => {
    expect(pickVideoSource({ video_hls_url: HLS }, true)).toEqual({ state: "ready", src: HLS });
  });

  it("chưa biết HLS xong chưa -> checking (không phát bừa)", () => {
    expect(pickVideoSource({ video_hls_url: HLS }, undefined)).toEqual({ state: "checking" });
  });

  // Học viên/khách không có video_url gốc: HLS chưa xong = "đang xử lý", KHÔNG phát file gốc.
  it("HLS chưa xong và không có URL gốc (học viên/khách) -> processing", () => {
    expect(pickVideoSource({ video_hls_url: HLS }, false)).toEqual({ state: "processing" });
  });

  it("HLS chưa xong nhưng là chủ khoá (có URL gốc ký) -> phát file gốc", () => {
    expect(pickVideoSource({ video_hls_url: HLS, video_url: ORIGINAL }, false)).toEqual({
      state: "ready",
      src: ORIGINAL,
    });
  });

  it("video ngoài hệ thống (không có HLS) -> phát thẳng, không cần chờ /info", () => {
    expect(pickVideoSource({ video_url: "https://cdn.example/v.mp4" }, undefined)).toEqual({
      state: "ready",
      src: "https://cdn.example/v.mp4",
    });
  });

  it("không có video nào -> none", () => {
    expect(pickVideoSource({}, true)).toEqual({ state: "none" });
    expect(pickVideoSource(undefined, true)).toEqual({ state: "none" });
  });
});
