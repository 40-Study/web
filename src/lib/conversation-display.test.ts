import { describe, expect, it } from "vitest";
import type { Conversation } from "@/services/conversation.service";
import {
  conversationDisplayName,
  conversationMatchesQuery,
  conversationSubtitle,
  participantDisplayName,
} from "./conversation-display";

const dm = (other: { full_name?: string; user_name: string }): Conversation =>
  ({
    type: "DIRECT",
    participants: [
      { user_id: "me", user_name: "student1", full_name: "Lê Văn C" },
      { user_id: "u2", ...other },
    ],
  }) as unknown as Conversation;

describe("hiển thị hội thoại (QA hồi quy A-12)", () => {
  it("DM hiện họ tên của người còn lại, rơi về user_name khi chưa có họ tên", () => {
    expect(conversationDisplayName(dm({ user_name: "student2", full_name: "Phạm Thị D" }), "me")).toBe("Phạm Thị D");
    expect(conversationDisplayName(dm({ user_name: "student2" }), "me")).toBe("student2");
    expect(conversationDisplayName(dm({ user_name: "student2", full_name: "   " }), "me")).toBe("student2");
  });

  it("nhóm dùng tên nhóm; thiếu dữ liệu thì câu chung", () => {
    expect(conversationDisplayName({ name: "Nhóm A", participants: [] } as unknown as Conversation, "me")).toBe("Nhóm A");
    expect(conversationDisplayName(undefined, "me")).toBe("Cuộc trò chuyện");
    expect(participantDisplayName(undefined)).toBeUndefined();
  });

  it("dòng phụ: nhóm hiện số thành viên, DM không hiện '2 thành viên'", () => {
    expect(conversationSubtitle(dm({ user_name: "x" }))).toBeNull();
    expect(
      conversationSubtitle({ type: "GROUP", participants: [{}, {}, {}] } as unknown as Conversation)
    ).toBe("3 thành viên");
  });

  it("tìm kiếm khớp họ tên lẫn user_name", () => {
    const c = dm({ user_name: "student2", full_name: "Phạm Thị D" });
    expect(conversationMatchesQuery(c, "phạm")).toBe(true);
    expect(conversationMatchesQuery(c, "STUDENT2")).toBe(true);
    expect(conversationMatchesQuery(c, "không có")).toBe(false);
    expect(conversationMatchesQuery(c, "  ")).toBe(true);
  });
});
