import { adminMenu } from "@/lib/admin-menu";
import { areaMetadata } from "@/lib/area-metadata";

export { default } from "@/components/layout/passthrough-layout";

// QA6-A08: tiêu đề tab riêng, lấy từ mục menu (xem lib/area-metadata.ts).
export const metadata = areaMetadata(adminMenu, "/admin/users");
