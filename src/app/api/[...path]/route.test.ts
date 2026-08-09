import { readFileSync } from "node:fs";
import { NextRequest } from "next/server";
import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PROXY_FAILURE, proxyRequest } from "./route";

vi.mock("axios", () => ({
  default: {
    request: vi.fn(),
  },
}));

const requestMock = vi.mocked(axios.request);

function bytes(value: string): ArrayBuffer {
  return new TextEncoder().encode(value).buffer as ArrayBuffer;
}

describe("same-origin API proxy", () => {
  beforeEach(() => {
    requestMock.mockReset();
    delete process.env.BACKEND_URL;
  });

  it("preserves method, query, raw body and cookie while stripping hop-by-hop headers", async () => {
    requestMock.mockResolvedValue({
      data: bytes('{"ok":true}'),
      status: 201,
      statusText: "Created",
      headers: {
        "content-type": "application/json",
        connection: "keep-alive, x-remove-response",
        "keep-alive": "timeout=5",
        "x-remove-response": "secret",
        "x-backend": "fortex",
      },
    });
    const request = new NextRequest("http://localhost/api/echo/đúng?page=2&sort=asc", {
      method: "POST",
      headers: {
        cookie: "access_token=cookie-value",
        "content-type": "application/json",
        connection: "keep-alive, x-remove-request",
        "keep-alive": "timeout=5",
        "x-remove-request": "secret",
        "x-client": "fortex-web",
      },
      body: '{"course_id":"course-1"}',
    });

    const response = await proxyRequest(request, ["echo", "đúng"]);

    expect(requestMock).toHaveBeenCalledTimes(1);
    const config = requestMock.mock.calls[0][0];
    expect(config).toMatchObject({
      url: "http://127.0.0.1:5000/api/echo/%C4%91%C3%BAng?page=2&sort=asc",
      method: "POST",
      timeout: 15_000,
      responseType: "arraybuffer",
    });
    expect(new TextDecoder().decode(config.data as ArrayBuffer)).toBe('{"course_id":"course-1"}');
    expect(config.headers).toMatchObject({
      cookie: "access_token=cookie-value",
      "content-type": "application/json",
      "x-client": "fortex-web",
    });
    expect(config.headers).not.toHaveProperty("connection");
    expect(config.headers).not.toHaveProperty("keep-alive");
    expect(config.headers).not.toHaveProperty("x-remove-request");

    expect(response.status).toBe(201);
    expect(await response.text()).toBe('{"ok":true}');
    expect(response.headers.get("x-backend")).toBe("fortex");
    expect(response.headers.get("connection")).toBeNull();
    expect(response.headers.get("keep-alive")).toBeNull();
    expect(response.headers.get("x-remove-response")).toBeNull();
  });

  it("keeps separate cookies origin-scoped and usable on local HTTP", async () => {
    requestMock.mockResolvedValue({
      data: bytes("ok"),
      status: 200,
      statusText: "OK",
      headers: {
        "set-cookie": [
          "access_token=a; Path=/; Domain=api.fortex.ai.vn; HttpOnly; Secure; SameSite=None",
          "refresh_token=b; Path=/api/auth; Domain=api.fortex.ai.vn; HttpOnly; Secure; SameSite=None",
        ],
      },
    });

    const response = await proxyRequest(new NextRequest("http://localhost/api/auth/login"), [
      "auth",
      "login",
    ]);
    const setCookie = response.headers.get("set-cookie") ?? "";
    const cookies =
      (response.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.() ??
      setCookie.split(/,(?=\s*[^;,=]+=[^;,]+)/);

    expect(cookies).toHaveLength(2);
    expect(setCookie).toContain("access_token=a");
    expect(setCookie).toContain("refresh_token=b");
    expect(setCookie).not.toMatch(/domain=/i);
    expect(setCookie).not.toMatch(/;\s*secure/i);
    expect(setCookie.match(/SameSite=Lax/g)).toHaveLength(2);
  });

  it("returns the stable non-sensitive 502 contract on backend failure", async () => {
    process.env.BACKEND_URL = "http://internal-backend:5000";
    requestMock.mockRejectedValue(new Error("connect ECONNREFUSED internal-backend:5000"));

    const response = await proxyRequest(new NextRequest("https://fortex.ai.vn/api/auth/me"), [
      "auth",
      "me",
    ]);

    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body).toEqual(PROXY_FAILURE);
    expect(JSON.stringify(body)).not.toContain("internal-backend");
  });

  it("has no competing Next rewrite for /api", () => {
    const config = readFileSync("next.config.mjs", "utf8");
    expect(config).not.toMatch(/async\s+rewrites\s*\(/);
    expect(config).not.toContain("destination: 'http://localhost:5000/api");
  });
});
