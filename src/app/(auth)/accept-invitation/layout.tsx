import type { Metadata } from "next";

/**
 * Metadata cho trang Chấp nhận lời mời (G1) — page là client component.
 * `robots: noindex` vì URL mang token lời mời, không được lập chỉ mục.
 */
export const metadata: Metadata = {
  title: "Lời mời tham gia",
  robots: { index: false, follow: false },
};

export default function AcceptInvitationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
