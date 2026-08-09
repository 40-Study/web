import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { describe, expect, it, vi } from "vitest";
import { api } from "./api-client";

function unauthorized(config: InternalAxiosRequestConfig) {
  return new AxiosError("unauthorized", "ERR_BAD_REQUEST", config, undefined, {
    status: 401,
    statusText: "Unauthorized",
    headers: {},
    config,
    data: { message: "expired" },
  });
}

describe("API cookie refresh boundary", () => {
  it("attempts refresh at most once for the original request", async () => {
    const refresh = vi.spyOn(axios, "post").mockResolvedValue({ data: {} });
    let requestAttempts = 0;

    await expect(
      api.get("/protected", {
        adapter: async (config) => {
          requestAttempts += 1;
          throw unauthorized(config);
        },
      })
    ).rejects.toMatchObject({ status: 401 });

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(requestAttempts).toBe(2);
  });

  it("signals expiry without forcing a public-route navigation", async () => {
    vi.spyOn(axios, "post").mockRejectedValue(new Error("refresh failed"));
    const expired = vi.fn();
    window.addEventListener("fortex:auth-session-expired", expired);
    const originalPath = window.location.pathname;

    await expect(
      api.get("/protected", {
        adapter: async (config) => {
          throw unauthorized(config);
        },
      })
    ).rejects.toMatchObject({ status: 401 });

    expect(expired).toHaveBeenCalledTimes(1);
    expect(window.location.pathname).toBe(originalPath);
    window.removeEventListener("fortex:auth-session-expired", expired);
  });
});
