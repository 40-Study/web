"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ProfileHeader,
  ActivityHeatmap,
  FeaturedAchievements,
} from "@/components/profile";
import type { User, UserStats, FeaturedAchievement } from "@/components/profile";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { usePublicProfile } from "@/hooks/queries/use-auth";
import { useAuthStore } from "@/stores/auth.store";

interface CompletedCourse {
  id: string;
  title: string;
  thumbnailUrl?: string;
  completedAt: Date;
}

function getAchievementRarity(category: string): FeaturedAchievement["rarity"] {
  switch (category) {
    case "special":
      return "legendary";
    case "social":
      return "epic";
    case "milestone":
      return "rare";
    default:
      return "common";
  }
}

function PublicProfilePageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-primary-600">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Skeleton variant="circular" className="h-28 w-28 bg-white/20" />
            <div className="flex-1 space-y-3 w-full max-w-xl">
              <Skeleton className="h-8 w-48 bg-white/20" />
              <Skeleton className="h-4 w-32 bg-white/20" />
              <Skeleton className="h-4 w-full bg-white/20" />
              <Skeleton className="h-4 w-56 bg-white/20" />
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-72 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const [activeTab, setActiveTab] = useState("overview");
  const { user: authUser } = useAuthStore();
  const { data, isLoading, error } = usePublicProfile(userId);
  const isOwnProfile = authUser?.id === userId;

  const user = useMemo<User | null>(() => {
    if (!data) return null;

    return {
      id: data.user_id,
      fullName: data.full_name || data.user_name,
      username: data.user_name,
      avatar: data.avatar_url,
      bio: data.bio,
      level: data.stats.level,
      totalXP: data.stats.total_points,
      streak: data.stats.current_streak,
      createdAt: data.joined_at,
    };
  }, [data]);

  const stats = useMemo<UserStats | null>(() => {
    if (!data) return null;

    return {
      streak: data.stats.current_streak,
      coursesCompleted: data.stats.courses_completed,
      achievements: data.stats.achievement_count,
      lessonsCompleted: data.stats.lessons_completed,
      totalStudyTime: data.stats.total_study_time_minutes,
    };
  }, [data]);

  const achievements = useMemo<FeaturedAchievement[]>(() => {
    if (!data) return [];

    return data.featured_achievements.map((achievement) => ({
      id: achievement.id,
      name: achievement.name,
      iconUrl: achievement.icon_url,
      badgeUrl: achievement.badge_url,
      rarity: getAchievementRarity(achievement.category),
      unlockedAt: achievement.earned_at,
    }));
  }, [data]);

  const completedCourses = useMemo<CompletedCourse[]>(() => {
    if (!data) return [];

    return data.completed_courses.map((course) => ({
      id: course.id,
      title: course.title,
      thumbnailUrl: course.thumbnail_url,
      completedAt: new Date(course.completed_at),
    }));
  }, [data]);

  if (isLoading) {
    return <PublicProfilePageSkeleton />;
  }

  if (error || !data || !user || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <Card className="p-8 max-w-md w-full text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Không tải được hồ sơ công khai
          </h1>
          <p className="text-muted-foreground">
            Hồ sơ này không tồn tại hoặc dữ liệu hiện chưa khả dụng.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ProfileHeader user={user} isOwnProfile={isOwnProfile} stats={stats} />

      <div className="container max-w-6xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="achievements">Thành tích</TabsTrigger>
            <TabsTrigger value="activity">Hoạt động</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <FeaturedAchievements achievements={achievements} />

                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      Hoạt động học tập
                    </h2>
                    <span className="text-sm text-muted-foreground">20 tuần gần nhất</span>
                  </div>
                  <ActivityHeatmap data={data.activity} weeks={20} />
                </Card>

                <Card className="p-6">
                  <h2 className="font-semibold mb-4 text-gray-900 dark:text-white">
                    Khóa học đã hoàn thành
                  </h2>
                  {completedCourses.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Chưa hoàn thành khóa học nào.</p>
                  ) : (
                    <div className="space-y-3">
                      {completedCourses.map((course) => (
                        <div
                          key={course.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
                              <span className="text-white text-lg">✓</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {course.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Hoàn thành{" "}
                                {course.completedAt.toLocaleDateString("vi-VN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                          <Badge variant="success">Đã hoàn thành</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">
                    Thống kê
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tổng XP</span>
                      <Badge variant="xp">{user.totalXP.toLocaleString("vi-VN")} XP</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Cấp độ</span>
                      <Badge variant="level">Cấp {user.level}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Streak</span>
                      <Badge variant="streak">{stats.streak} ngày</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Khóa học</span>
                      <span className="text-sm font-medium">{stats.coursesCompleted}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Thành tích</span>
                      <span className="text-sm font-medium">{stats.achievements}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Thời gian học</span>
                      <span className="text-sm font-medium">{stats.totalStudyTime} phút</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">
                    Huy hiệu nổi bật
                  </h3>
                  {achievements.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Chưa mở khóa huy hiệu nào.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {achievements.slice(0, 6).map((achievement) => (
                        <div
                          key={achievement.id}
                          className="aspect-square rounded-xl bg-yellow-500 flex items-center justify-center text-2xl text-white"
                          title={achievement.name}
                        >
                          {achievement.icon || achievement.name.slice(0, 1).toUpperCase()}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="achievements">
            <Card className="p-6">
              <h2 className="font-semibold mb-6 text-gray-900 dark:text-white">
                Toàn bộ thành tích ({stats.achievements})
              </h2>
              {achievements.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa mở khóa thành tích nào.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="text-center p-4 rounded-2xl bg-gray-50 dark:bg-gray-800"
                    >
                      <div className="w-14 h-14 mx-auto rounded-xl bg-yellow-500 flex items-center justify-center text-2xl mb-2 shadow-lg text-white">
                        {achievement.icon || achievement.name.slice(0, 1).toUpperCase()}
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {achievement.name}
                      </p>
                      <Badge variant="outline" size="sm" className="mt-1 capitalize">
                        {achievement.rarity}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card className="p-6">
              <h2 className="font-semibold mb-4 text-gray-900 dark:text-white">
                Lịch sử hoạt động
              </h2>
              <ActivityHeatmap data={data.activity} weeks={52} />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
