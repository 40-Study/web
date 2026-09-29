/**
 * S1 (QA 260929): /api/hls/* đòi URL ký ngắn hạn. Khi URL hết hạn giữa chừng (403) player phải xin
 * URL mới ĐÚNG MỘT LẦN rồi phát tiếp; xin không được / vẫn 403 thì báo lỗi tiếng Việt (không khung
 * trắng). Mỗi test ĐỎ khi bỏ nhánh xử lý 403 hoặc bỏ giới hạn "một lần" của useHlsSource.
 */

import { useRef } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useHlsSource } from "./use-hls-source";
import {
  HLS_EXPIRED_MESSAGE,
  VIDEO_LOAD_FAILED_MESSAGE,
  VIDEO_PROCESSING_MESSAGE,
} from "@/lib/hls-playback";

const fake = vi.hoisted(() => {
  type Handler = (event: string, data: unknown) => void;
  const instances: FakeHls[] = [];
  class FakeHls {
    static isSupported = () => true;
    static Events = {
      FRAG_LOADED: "hlsFragLoaded",
      MANIFEST_PARSED: "hlsManifestParsed",
      ERROR: "hlsError",
    };
    static ErrorTypes = { NETWORK_ERROR: "networkError", MEDIA_ERROR: "mediaError" };
    static ErrorDetails = { MANIFEST_PARSING_ERROR: "manifestParsingError" };
    handlers: Record<string, Handler[]> = {};
    source: string | null = null;
    destroyed = false;
    constructor() {
      instances.push(this);
    }
    on(event: string, fn: Handler) {
      (this.handlers[event] ??= []).push(fn);
    }
    loadSource(url: string) {
      this.source = url;
    }
    attachMedia() {}
    recoverMediaError() {}
    destroy() {
      this.destroyed = true;
    }
    emit(event: string, data: unknown) {
      this.handlers[event]?.forEach((fn) => fn(event, data));
    }
  }
  return { FakeHls, instances };
});

vi.mock("hls.js", () => ({ default: fake.FakeHls }));

const URL_A = "/api/hls/11111111-2222-3333-4444-555555555555/master.m3u8?exp=100&sig=aaa";
const URL_B = "/api/hls/11111111-2222-3333-4444-555555555555/master.m3u8?exp=200&sig=bbb";
const URL_A2 = "/api/hls/11111111-2222-3333-4444-555555555555/master.m3u8?exp=300&sig=ccc";
const OTHER = "/api/hls/99999999-2222-3333-4444-555555555555/master.m3u8?exp=100&sig=zzz";

const forbidden = { fatal: true, type: "networkError", response: { code: 403 } };

function Harness({ src, refresh }: { src: string | null; refresh?: () => Promise<string | null> }) {
  const ref = useRef<HTMLVideoElement>(null);
  const { error } = useHlsSource(ref, src, { refreshSource: refresh });
  return (
    <div>
      <video ref={ref} />
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

async function mount(src: string | null, refresh?: () => Promise<string | null>) {
  fake.instances.length = 0;
  const view = render(<Harness src={src} refresh={refresh} />);
  if (src) await waitFor(() => expect(fake.instances.length).toBe(1));
  return view;
}

describe("useHlsSource — URL ký hết hạn (403)", () => {
  it("403 -> xin URL mới đúng một lần rồi nạp lại bằng URL mới, không báo lỗi", async () => {
    const refresh = vi.fn().mockResolvedValue(URL_B);
    await mount(URL_A, refresh);
    expect(fake.instances[0].source).toBe(URL_A);

    act(() => fake.instances[0].emit("hlsError", forbidden));

    await waitFor(() => expect(fake.instances.length).toBe(2));
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fake.instances[0].destroyed).toBe(true);
    expect(fake.instances[1].source).toBe(URL_B);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("URL mới vẫn 403 -> KHÔNG xin lần nữa, hiện thông báo hết hạn tiếng Việt", async () => {
    const refresh = vi.fn().mockResolvedValue(URL_B);
    await mount(URL_A, refresh);
    act(() => fake.instances[0].emit("hlsError", forbidden));
    await waitFor(() => expect(fake.instances.length).toBe(2));

    act(() => fake.instances[1].emit("hlsError", forbidden));

    expect((await screen.findByRole("alert")).textContent).toBe(HLS_EXPIRED_MESSAGE);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("xin URL mới thất bại (null hoặc throw) -> báo lỗi hết hạn, không khung trắng", async () => {
    await mount(URL_A, vi.fn().mockResolvedValue(null));
    act(() => fake.instances[0].emit("hlsError", forbidden));
    expect((await screen.findByRole("alert")).textContent).toBe(HLS_EXPIRED_MESSAGE);
  });

  it("không có refreshSource -> báo lỗi hết hạn ngay", async () => {
    await mount(URL_A);
    act(() => fake.instances[0].emit("hlsError", forbidden));
    expect((await screen.findByRole("alert")).textContent).toBe(HLS_EXPIRED_MESSAGE);
  });

  it("phát lại được (segment tải xong) thì hết hạn lần sau lại được xin thêm một lần", async () => {
    const refresh = vi.fn().mockResolvedValueOnce(URL_B).mockResolvedValueOnce(URL_A2);
    await mount(URL_A, refresh);
    act(() => fake.instances[0].emit("hlsError", forbidden));
    await waitFor(() => expect(fake.instances.length).toBe(2));

    act(() => fake.instances[1].emit("hlsFragLoaded", {}));
    act(() => fake.instances[1].emit("hlsError", forbidden));

    await waitFor(() => expect(fake.instances.length).toBe(3));
    expect(refresh).toHaveBeenCalledTimes(2);
    expect(fake.instances[2].source).toBe(URL_A2);
  });
});

describe("useHlsSource — đổi src", () => {
  it("chỉ đổi chữ ký của cùng một video thì KHÔNG nạp lại player", async () => {
    const view = await mount(URL_A);
    view.rerender(<Harness src={URL_A2} />);
    // Cho effect chạy xong rồi khẳng định vẫn chỉ một instance, chưa bị destroy.
    await act(async () => {});
    expect(fake.instances.length).toBe(1);
    expect(fake.instances[0].destroyed).toBe(false);
  });

  it("đổi sang video khác thì nạp lại", async () => {
    const view = await mount(URL_A);
    view.rerender(<Harness src={OTHER} />);
    await waitFor(() => expect(fake.instances.length).toBe(2));
    expect(fake.instances[1].source).toBe(OTHER);
  });

  it("đang báo lỗi mà cha có URL ký mới thì tự hồi phục", async () => {
    const view = await mount(URL_A);
    act(() => fake.instances[0].emit("hlsError", forbidden));
    await screen.findByRole("alert");

    view.rerender(<Harness src={URL_A2} />);

    await waitFor(() => expect(fake.instances.length).toBe(2));
    expect(fake.instances[1].source).toBe(URL_A2);
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  });
});

describe("useHlsSource — lỗi khác 403", () => {
  it("lỗi mạng fatal (không phải 403) -> thông báo tải video thất bại, không xin URL mới", async () => {
    const refresh = vi.fn().mockResolvedValue(URL_B);
    await mount(URL_A, refresh);
    act(() => fake.instances[0].emit("hlsError", { fatal: true, type: "networkError", details: "levelLoadError" }));
    expect((await screen.findByRole("alert")).textContent).toBe(VIDEO_LOAD_FAILED_MESSAGE);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("manifest không parse được (vd backend trả 202 đang xử lý) -> thông báo đang xử lý", async () => {
    await mount(URL_A);
    act(() =>
      fake.instances[0].emit("hlsError", { fatal: true, type: "networkError", details: "manifestParsingError" })
    );
    expect((await screen.findByRole("alert")).textContent).toBe(VIDEO_PROCESSING_MESSAGE);
  });
});
