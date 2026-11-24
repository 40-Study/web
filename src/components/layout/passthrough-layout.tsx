/**
 * Layout không thêm DOM, chỉ để một route khai báo `metadata` (page.tsx là client component nên không export
 * metadata được). Dùng: `export { default } from "@/components/layout/passthrough-layout";` + `export const metadata`.
 */
export default function PassthroughLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
