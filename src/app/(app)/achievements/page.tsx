"use client";

import { useMemo } from "react";
import {
  Award, Trophy, Flame, Shield, Zap, CheckCircle,
  ChevronRight, Star, Database, Cloud, Monitor, Server, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useMyAchievements } from "@/hooks/queries/use-achievements";
import { useMe } from "@/hooks/queries/use-auth";
import { useAuthStore } from "@/stores/auth.store";
import { usePublicProfile } from "@/hooks/queries/use-user-stats";
import { useMyCertificates } from "@/hooks/queries/use-certificates";
import type { AchievementWithStatusDTO } from "@/services/achievement.service";
import type { PublicProfileActivity } from "@/services/user-stats.service";

// ─── Types ─────────────────────────────────────────────────────────────────

type AchievementRarity = "common" | "rare" | "epic" | "legendary";

interface SkillData {
  name: string;
  value: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function deriveRarity(points: number): AchievementRarity {
  if (points >= 1000) return "legendary";
  if (points >= 200) return "epic";
  if (points >= 100) return "rare";
  return "common";
}

function getRarityConfig(rarity: AchievementRarity) {
  const configs = {
    common: { label: "CORE BRONZE", color: "bg-orange-500", textColor: "text-orange-600" },
    rare: { label: "ELITE SILVER", color: "bg-gray-400", textColor: "text-gray-600" },
    epic: { label: "EPIC PURPLE", color: "bg-purple-500", textColor: "text-purple-600" },
    legendary: { label: "LEGENDARY GOLD", color: "bg-yellow-500", textColor: "text-yellow-600" },
  };
  return configs[rarity];
}

function calculateLevel(xp: number): number {
  return Math.floor(xp / 300) + 1;
}

function getXpForNextLevel(currentXp: number): { current: number; needed: number } {
  const level = calculateLevel(currentXp);
  const xpForCurrentLevel = (level - 1) * 300;
  const xpForNextLevel = level * 300;
  return { current: currentXp - xpForCurrentLevel, needed: 300 };
}

// ─── Derive skill data from achievement categories ─────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  learning: "HỌC TẬP",
  streak: "KIÊN TRÌ",
  social: "CỘNG ĐỒNG",
  milestone: "CỘT MỐC",
  special: "ĐẶC BIỆT",
};

function deriveSkillsFromAchievements(achievements: AchievementWithStatusDTO[]): SkillData[] {
  const categoryMap = new Map<string, { total: number; sum: number }>();
  for (const a of achievements) {
    const cat = a.category || "learning";
    const entry = categoryMap.get(cat) || { total: 0, sum: 0 };
    entry.total += 1;
    entry.sum += a.progress ?? (a.unlocked ? 100 : 0);
    categoryMap.set(cat, entry);
  }

  const categories = Object.keys(CATEGORY_LABELS);
  return categories.map((cat) => {
    const entry = categoryMap.get(cat);
    const value = entry && entry.total > 0 ? Math.round(entry.sum / entry.total) : 0;
    return { name: CATEGORY_LABELS[cat], value };
  });
}

// ─── Helpers for heatmap ────────────────────────────────────────────────────

function buildHeatmapFromActivity(activity: PublicProfileActivity[]): number[] {
  // Build a map from date -> count
  const activityMap = new Map<string, number>();
  activity.forEach((item) => {
    activityMap.set(item.date, item.count);
  });

  // Generate last 365 days
  const result: number[] = [];
  const today = new Date();
  for (let i = 364; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const count = activityMap.get(dateStr) || 0;
    // Normalize to 0-4 scale for colors
    result.push(Math.min(count, 4));
  }
  return result;
}

// ─── Components ────────────────────────────────────────────────────────────

function ProfileBanner({
  user,
  totalXp,
  streakDays,
  badgeCount,
  level = 1,
  levelProgress = 0
}: {
  user: { name?: string; avatar?: string; email?: string };
  totalXp: number;
  streakDays: number;
  badgeCount: number;
  level?: number;
  levelProgress?: number;
}) {
  // Use API level/progress if available, otherwise calculate
  const displayLevel = level || calculateLevel(totalXp);
  const { current, needed } = level > 0
    ? { current: levelProgress, needed: 100 } // API returns progress as percentage
    : getXpForNextLevel(totalXp);
  const nextLevelXp = displayLevel * 300;

  return (
    <div className="relative bg-gradient-to-r from-slate-800 via-slate-900 to-indigo-900 rounded-3xl p-8 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/2 w-96 h-32 bg-cyan-500/10 rounded-full blur-3xl" />

      <div className="relative flex items-center gap-8">
        {/* Avatar */}
        <div className="relative">
          <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 p-1 rotate-3">
            <div className="w-full h-full rounded-xl bg-slate-800 flex items-center justify-center overflow-hidden -rotate-3">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-white">
                  {user.name?.[0] || user.email?.[0]?.toUpperCase() || "?"}
                </span>
              )}
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-4 border-slate-900">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* User Info */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white mb-1">
            {user.name || "Learner"}
          </h1>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-cyan-400">—</span>
            <span className="text-cyan-400 text-sm font-medium tracking-wider">
              THE MICROSERVICES PIONEER
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              <span className="text-white font-semibold">{streakDays}</span>
              <span className="text-gray-400 text-sm">DAYS</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-white font-semibold">{badgeCount}</span>
              <span className="text-gray-400 text-sm">BADGES</span>
            </div>
          </div>
        </div>

        {/* Level & XP */}
        <div className="text-right">
          <div className="mb-2">
            <span className="text-cyan-400 text-sm font-medium tracking-wider">LEVEL</span>
          </div>
          <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 leading-none mb-4">
            {displayLevel}
          </div>

          <div className="text-right mb-2">
            <span className="text-gray-400 text-xs">EXPERIENCE POINTS</span>
            <span className="text-white ml-2 font-semibold">
              {totalXp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP
            </span>
          </div>
          <div className="w-64 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all"
              style={{ width: `${(current / needed) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function BadgeCard({
  name,
  icon,
  rarity,
  description
}: {
  name: string;
  icon: React.ReactNode;
  rarity: AchievementRarity;
  description: string;
}) {
  const config = getRarityConfig(rarity);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center hover:shadow-lg transition-shadow">
      <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="font-bold text-gray-900 mb-2">{name}</h3>
      <Badge className={cn("text-xs", config.color, "text-white")}>
        {config.label}
      </Badge>
      <p className="text-sm text-gray-500 mt-3 line-clamp-2">{description}</p>
    </div>
  );
}

function RadarChart({ skills }: { skills: SkillData[] }) {
  const centerX = 120;
  const centerY = 120;
  const maxRadius = 80;
  const levels = 5;

  // Calculate points for each skill
  const points = skills.map((skill, i) => {
    const angle = (Math.PI * 2 * i) / skills.length - Math.PI / 2;
    const radius = (skill.value / 100) * maxRadius;
    return {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      labelX: centerX + Math.cos(angle) * (maxRadius + 30),
      labelY: centerY + Math.sin(angle) * (maxRadius + 30),
      name: skill.name,
      value: skill.value,
    };
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <div className="relative">
      <svg viewBox="0 0 240 240" className="w-full max-w-[280px] mx-auto">
        {/* Background circles */}
        {Array.from({ length: levels }).map((_, i) => (
          <polygon
            key={i}
            points={skills.map((_, j) => {
              const angle = (Math.PI * 2 * j) / skills.length - Math.PI / 2;
              const radius = ((i + 1) / levels) * maxRadius;
              return `${centerX + Math.cos(angle) * radius},${centerY + Math.sin(angle) * radius}`;
            }).join(" ")}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}

        {/* Axes */}
        {skills.map((_, i) => {
          const angle = (Math.PI * 2 * i) / skills.length - Math.PI / 2;
          return (
            <line
              key={i}
              x1={centerX}
              y1={centerY}
              x2={centerX + Math.cos(angle) * maxRadius}
              y2={centerY + Math.sin(angle) * maxRadius}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          );
        })}

        {/* Data polygon */}
        <path
          d={pathD}
          fill="rgba(99, 102, 241, 0.2)"
          stroke="#6366f1"
          strokeWidth="2"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill="#6366f1"
          />
        ))}
      </svg>

      {/* Labels */}
      {points.map((p, i) => (
        <div
          key={i}
          className="absolute text-xs font-medium text-gray-700 bg-white px-2 py-1 rounded-full border border-gray-200"
          style={{
            left: `${(p.labelX / 240) * 100}%`,
            top: `${(p.labelY / 240) * 100}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          {p.name}
        </div>
      ))}
    </div>
  );
}

function HeatmapCalendar({ data }: { data: number[] }) {
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const weeksPerMonth = 4;
  const daysPerWeek = 7;

  const getColor = (value: number) => {
    if (value === 0) return "bg-blue-100";
    if (value === 1) return "bg-blue-200";
    if (value === 2) return "bg-blue-300";
    if (value === 3) return "bg-blue-400";
    return "bg-blue-500";
  };

  return (
    <div>
      <div className="flex gap-1 mb-4">
        {months.map((month, monthIndex) => (
          <div key={month} className="flex-1">
            <div className="grid grid-cols-4 gap-0.5">
              {Array.from({ length: weeksPerMonth * daysPerWeek }).map((_, dayIndex) => {
                const dataIndex = monthIndex * 30 + dayIndex;
                const value = data[dataIndex] || 0;
                return (
                  <div
                    key={dayIndex}
                    className={cn("w-2 h-2 rounded-sm", getColor(value))}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        {months.map(month => (
          <span key={month}>{month}</span>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  iconBg,
  label,
  value
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", iconBg)}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function AchievementsPage() {
  const { data: meData, isLoading: meLoading } = useMe();
  const { data: rawAchievements = [], isLoading: achievementsLoading } = useMyAchievements();
  const { user } = useAuthStore();

  // Get user ID for public profile
  const userId = meData?.id || user?.id;

  // Fetch public profile (contains stats and activity heatmap)
  const { data: profileData, isLoading: profileLoading } = usePublicProfile(userId || "");

  // Fetch certificates
  const { data: certificatesData, isLoading: certificatesLoading } = useMyCertificates({ page: 1, page_size: 100 });

  const isLoading = meLoading || achievementsLoading || profileLoading;

  // Stats from public profile API
  const stats = profileData?.stats;
  const totalXp = stats?.total_points || 0;
  const currentStreak = stats?.current_streak || 0;
  const longestStreak = stats?.longest_streak || 0;
  const level = stats?.level || 1;
  const levelProgress = stats?.level_progress || 0;

  // Certificate count
  const certificateCount = certificatesData?.total || 0;

  // Calculate badge count from achievements
  const unlockedAchievements = rawAchievements.filter((a) => a.unlocked);
  const badgeCount = stats?.achievement_count || unlockedAchievements.length;

  // Build heatmap data from activity
  const heatmapData = useMemo(() => {
    if (profileData?.activity && profileData.activity.length > 0) {
      return buildHeatmapFromActivity(profileData.activity);
    }
    return Array.from({ length: 365 }, () => 0);
  }, [profileData?.activity]);

  // Derive skills from achievement categories
  const skills = useMemo(
    () => deriveSkillsFromAchievements(rawAchievements),
    [rawAchievements]
  );

  // Get top 3 achievements for display
  const topAchievements = unlockedAchievements
    .sort((a, b) => b.points - a.points)
    .slice(0, 3);

  // Find top skill
  const topSkill = skills.length > 0
    ? skills.reduce((max, s) => s.value > max.value ? s : max, skills[0])
    : null;

  const userData = {
    name: meData?.full_name || user?.name || "Learner",
    avatar: meData?.avatar_url || user?.avatar,
    email: meData?.email || user?.email,
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Profile Banner */}
      <ProfileBanner
        user={userData}
        totalXp={totalXp}
        streakDays={currentStreak}
        badgeCount={badgeCount}
        level={level}
        levelProgress={levelProgress}
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Badges */}
        <div className="lg:col-span-2 space-y-6">
          {/* Badge Collection */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <h2 className="text-xl font-bold text-gray-900">Bộ sưu tập Huy hiệu</h2>
              </div>
              <Button variant="outline" className="rounded-full gap-1">
                Xem tất cả
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {topAchievements.length > 0 ? (
                topAchievements.map((achievement) => (
                  <BadgeCard
                    key={achievement.id}
                    name={achievement.name}
                    icon={<Star className="w-10 h-10 text-yellow-400" />}
                    rarity={deriveRarity(achievement.points)}
                    description={achievement.description}
                  />
                ))
              ) : (
                <>
                  <BadgeCard
                    name="React Native Master"
                    icon={<Star className="w-10 h-10 text-yellow-400" />}
                    rarity="legendary"
                    description="Đã hoàn thành 5 dự án ứng dụng di động thực tế."
                  />
                  <BadgeCard
                    name="Docker & CI/CD"
                    icon={<Server className="w-10 h-10 text-gray-400" />}
                    rarity="rare"
                    description="Làm chủ quy trình triển khai tự động hóa."
                  />
                  <BadgeCard
                    name="DB MongoDB"
                    icon={<Database className="w-10 h-10 text-orange-400" />}
                    rarity="common"
                    description="Xây dựng cấu trúc dữ liệu NoSQL tối ưu."
                  />
                </>
              )}
            </div>
          </div>

          {/* Learning Frequency */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Flame className="w-6 h-6 text-orange-500" />
                <h2 className="text-xl font-bold text-gray-900">Tần suất học tập</h2>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>LESS</span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 bg-blue-100 rounded-sm" />
                  <div className="w-3 h-3 bg-blue-200 rounded-sm" />
                  <div className="w-3 h-3 bg-blue-300 rounded-sm" />
                  <div className="w-3 h-3 bg-blue-400 rounded-sm" />
                  <div className="w-3 h-3 bg-blue-500 rounded-sm" />
                </div>
                <span>MORE</span>
              </div>
            </div>

            <HeatmapCalendar data={heatmapData} />
          </div>
        </div>

        {/* Right Column - Stats & Radar */}
        <div className="space-y-6">
          {/* Skill Analysis */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-6 h-6 text-indigo-500" />
              <h2 className="text-xl font-bold text-gray-900">Phân tích Năng lực</h2>
            </div>

            <div className="relative h-64">
              <RadarChart skills={skills} />
            </div>

            {topSkill && (
              <div className="text-center mt-4">
                <span className="text-sm text-gray-500">TOP STAT: </span>
                <span className="text-sm font-bold text-indigo-600">
                  {topSkill.name} ({topSkill.value}%)
                </span>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <StatCard
            icon={<Zap className="w-6 h-6 text-blue-500" />}
            iconBg="bg-blue-100"
            label="TOTAL XP"
            value={totalXp.toLocaleString()}
          />

          <StatCard
            icon={<Flame className="w-6 h-6 text-orange-500" />}
            iconBg="bg-orange-100"
            label="LONGEST STREAK"
            value={`${longestStreak} Days`}
          />

          <StatCard
            icon={<CheckCircle className="w-6 h-6 text-green-500" />}
            iconBg="bg-green-100"
            label="CERTIFICATES"
            value={certificateCount > 0 ? `${certificateCount} Active` : "0"}
          />
        </div>
      </div>
    </div>
  );
}
