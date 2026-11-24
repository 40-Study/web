import Image from "next/image";
import { Star } from "lucide-react";
import type { FeaturedAchievement } from "./featured-achievements";

/**
 * Hình đại diện của một thành tích: ảnh huy hiệu nếu có, rồi emoji `icon`, còn lại là ngôi sao
 * (cùng biểu tượng với trang /achievements). Trước đây chữ cái đầu của tên ("N", "C", "V") làm ô huy hiệu
 * đọc như ký tự lạc (QA5 S5-07).
 */
export function AchievementGlyph({
  achievement,
  imageSize = 64,
}: {
  achievement: Pick<FeaturedAchievement, "name" | "icon" | "iconUrl" | "badgeUrl">;
  imageSize?: number;
}) {
  const url = achievement.badgeUrl || achievement.iconUrl;
  if (url) {
    return (
      <Image
        src={url}
        alt={achievement.name}
        width={imageSize}
        height={imageSize}
        className="h-full w-full object-cover"
      />
    );
  }
  if (achievement.icon) return <>{achievement.icon}</>;
  return <Star className="h-7 w-7 text-white" fill="currentColor" aria-hidden="true" />;
}
