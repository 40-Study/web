/**
 * XMLHttpRequest giả cho test upload video (jsdom không gửi request thật). Test giữ từng instance qua `FakeXhr.instances`
 * rồi tự bắn sự kiện: tiến độ, lỗi mạng, phản hồi.
 */
export class FakeXhr {
  static instances: FakeXhr[] = [];
  static reset() {
    FakeXhr.instances = [];
  }

  method = "";
  url = "";
  status = 0;
  aborted = false;
  body: unknown;
  headers: Record<string, string> = {};
  upload: { onprogress: (() => void) | null } = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onreadystatechange: (() => void) | null = null;

  constructor() {
    FakeXhr.instances.push(this);
  }
  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }
  send(body: unknown) {
    this.body = body;
  }
  abort() {
    this.aborted = true;
  }
  getResponseHeader(name: string) {
    return this.headers[name] ?? null;
  }

  progress() {
    this.upload.onprogress?.();
  }
  respond(status: number, headers: Record<string, string> = {}) {
    this.status = status;
    this.headers = headers;
    this.onload?.();
  }
  failNetwork() {
    this.onerror?.();
  }
}
