import { describe, expect, it } from "vitest";
import { parseSessionSettings } from "./session-settings";

/**
 * R2-C1 (re-review vòng 2 PR #18 lần 2): backend trả `settings` là CHUỖI JSON
 * (`json.Marshal(session.Settings)`), không phải object lồng. Payload thật
 * dạng chuỗi dưới đây lấy đúng shape `model.LivestreamSettings`
 * (`internal/model/livestream_session.go:56-63`).
 */
const REAL_PAYLOAD_UNLOCKED =
  '{"is_chat_enabled":true,"is_qa_enabled":true,"is_whiteboard_enabled":true,"is_screen_share_enabled":true,"is_polls_enabled":true,"whiteboard_locked":false}';
const REAL_PAYLOAD_LOCKED =
  '{"is_chat_enabled":true,"is_qa_enabled":true,"is_whiteboard_enabled":true,"is_screen_share_enabled":true,"is_polls_enabled":true,"whiteboard_locked":true}';

describe("parseSessionSettings (R2-C1)", () => {
  it("nạp đúng payload THẬT dạng chuỗi JSON — whiteboard_locked=false", () => {
    expect(parseSessionSettings(REAL_PAYLOAD_UNLOCKED)).toEqual({ whiteboardLocked: false });
  });

  it("nạp đúng payload THẬT dạng chuỗi JSON — whiteboard_locked=true", () => {
    expect(parseSessionSettings(REAL_PAYLOAD_LOCKED)).toEqual({ whiteboardLocked: true });
  });

  it("vẫn chấp nhận dạng object đã parse sẵn (phòng khi backend đổi shape)", () => {
    expect(parseSessionSettings({ whiteboard_locked: true })).toEqual({ whiteboardLocked: true });
    expect(parseSessionSettings({ whiteboard_locked: false })).toEqual({ whiteboardLocked: false });
  });

  it("chuỗi không phải JSON hợp lệ => fail-closed (whiteboardLocked=true)", () => {
    expect(parseSessionSettings("not json at all")).toEqual({ whiteboardLocked: true });
  });

  it("JSON hợp lệ nhưng không phải object (số/bool) => fail-closed", () => {
    expect(parseSessionSettings("42")).toEqual({ whiteboardLocked: true });
    expect(parseSessionSettings("true")).toEqual({ whiteboardLocked: true });
  });

  it("undefined/null => fail-closed (chưa fetch xong hoặc field vắng mặt)", () => {
    expect(parseSessionSettings(undefined)).toEqual({ whiteboardLocked: true });
    expect(parseSessionSettings(null)).toEqual({ whiteboardLocked: true });
  });

  it("object/chuỗi hợp lệ nhưng thiếu field whiteboard_locked => coi như false (khớp zero-value Go), không fail-closed", () => {
    expect(parseSessionSettings({})).toEqual({ whiteboardLocked: false });
    expect(parseSessionSettings("{}")).toEqual({ whiteboardLocked: false });
  });
});
