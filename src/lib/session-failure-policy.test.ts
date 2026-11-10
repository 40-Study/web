import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";
import { ApiError, AuthError, ForbiddenError, NetworkError, NotFoundError, RateLimitError } from "./errors";
import {
  BOOTSTRAP_RETRY_DELAYS_MS,
  classifyRefreshFailure,
  classifySessionBootstrapError,
  getBootstrapRetryDelay,
} from "./session-failure-policy";

const config = { headers: {} } as InternalAxiosRequestConfig;
function axiosWithStatus(status: number) {
  return new AxiosError("failed", "ERR_BAD_RESPONSE", config, undefined, {
    status,
    statusText: String(status),
    headers: {},
    config,
    data: {},
  });
}

describe("classifySessionBootstrapError (QA-B-01 / QA-C-02)", () => {
  it.each([
    ["NetworkError (timeout/huỷ)", new NetworkError()],
    ["500", new ApiError(500, "UNKNOWN", "x")],
    ["504", new ApiError(504, "UNKNOWN", "x")],
    ["408", new ApiError(408, "UNKNOWN", "x")],
    ["429", new RateLimitError(10)],
  ])("%s -> transient (giữ phiên)", (_label, error) => {
    expect(classifySessionBootstrapError(error)).toBe("transient");
  });

  it.each([
    ["401", new AuthError()],
    ["403", new ForbiddenError()],
    ["404", new NotFoundError()],
    ["lỗi lạ không phải HTTP", new Error("boom")],
  ])("%s -> rejected (xoá phiên)", (_label, error) => {
    expect(classifySessionBootstrapError(error)).toBe("rejected");
  });
});

describe("classifyRefreshFailure", () => {
  it("không có response (timeout ECONNABORTED) -> transient", () => {
    expect(classifyRefreshFailure(new AxiosError("timeout", "ECONNABORTED", config))).toBe("transient");
  });

  it.each([500, 502, 503, 429, 408])("%i -> transient", (status) => {
    expect(classifyRefreshFailure(axiosWithStatus(status))).toBe("transient");
  });

  it.each([400, 401, 403])("%i (refresh token bị từ chối) -> rejected", (status) => {
    expect(classifyRefreshFailure(axiosWithStatus(status))).toBe("rejected");
  });

  it("lỗi không phải axios -> rejected như hành vi cũ", () => {
    expect(classifyRefreshFailure(new Error("refresh failed"))).toBe("rejected");
  });
});

describe("getBootstrapRetryDelay", () => {
  it("có giới hạn: hết danh sách thì trả null", () => {
    expect(BOOTSTRAP_RETRY_DELAYS_MS.map((_, i) => getBootstrapRetryDelay(i))).toEqual([2_000, 5_000, 10_000]);
    expect(getBootstrapRetryDelay(BOOTSTRAP_RETRY_DELAYS_MS.length)).toBeNull();
  });
});
