/** Giá trị `?tab=` hợp lệ của trang /friends; thông báo lời mời kết bạn trỏ tới `?tab=requests` (contract §1). */
export const FRIENDS_TABS = ["friends", "requests", "search", "blocked"] as const;
export type FriendsTab = (typeof FRIENDS_TABS)[number];

/** Giá trị lạ hoặc thiếu rơi về tab đầu tiên, không ném lỗi. */
export function parseFriendsTab(value: string | null): FriendsTab {
  return (FRIENDS_TABS as readonly string[]).includes(value ?? "") ? (value as FriendsTab) : "friends";
}
