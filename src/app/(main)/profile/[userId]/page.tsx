"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  ProfileHeader,
  ActivityHeatmap,
  FeaturedAchievements,
} from "@/components/profile";
import type { User, UserStats, FeaturedAchievement } from "@/components/profile";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Mock data for public profile - replace with API calls
const MOCK_PUBLIC_USER: User = {
  id: "2",
  fullName: "Tran Thi Lan",
  username: "lan_coder",
  email: "lan@example.com",
  bio: "Full-stack developer in training. Love TypeScript and Go!",
  level: 18,
  totalXP: 5200,
  streak: 42,
  createdAt: new Date("2024-11-15"),
};

const MOCK_PUBLIC_STATS: UserStats = {
  streak: 42,
  coursesCompleted: 8,
  achievements: 25,
  lessonsCompleted: 156,
  totalStudyTime: 4560,
};

const MOCK_PUBLIC_ACHIEVEMENTS: FeaturedAchievement[] = [
  { id: "1", name: "Month Master", icon: "🌟", rarity: "rare", unlockedAt: new Date() },
  { id: "2", name: "Speed Learner", icon: "⚡", rarity: "epic", unlockedAt: new Date() },
  { id: "3", name: "Top 10", icon: "🏅", rarity: "epic", unlockedAt: new Date() },
  { id: "4", name: "Course Master", icon: "🎓", rarity: "rare", unlockedAt: new Date() },
  { id: "5", name: "Perfect Score", icon: "💯", rarity: "rare", unlockedAt: new Date() },
  { id: "6", name: "Mentor", icon: "🤝", rarity: "rare", unlockedAt: new Date() },
];

// Generate mock activity data
const generateActivityData = () => {
  const data = [];
  const today = new Date();
  for (let i = 140; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const rand = Math.random();
    const count = rand < 0.2 ? 0 : rand < 0.4 ? 1 : rand < 0.6 ? 3 : rand < 0.85 ? 5 : 8;
    data.push({ date: dateStr, count });
  }
  return data;
};

const MOCK_ACTIVITY = generateActivityData();

interface CompletedCourse {
  id: string;
  title: string;
  completedAt: Date;
}

const MOCK_COMPLETED_COURSES: CompletedCourse[] = [
  { id: "1", title: "Introduction to Python", completedAt: new Date("2025-02-15") },
  { id: "2", title: "JavaScript Fundamentals", completedAt: new Date("2025-01-20") },
  { id: "3", title: "React for Beginners", completedAt: new Date("2025-01-05") },
  { id: "4", title: "TypeScript Essentials", completedAt: new Date("2024-12-20") },
];

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const [activeTab, setActiveTab] = useState("overview");

  // In real app, fetch user data based on userId
  const user = MOCK_PUBLIC_USER;
  const stats = MOCK_PUBLIC_STATS;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Profile Header */}
      <ProfileHeader
        user={user}
        isOwnProfile={false}
        stats={stats}
      />

      {/* Main Content */}
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Featured Achievements */}
                <FeaturedAchievements achievements={MOCK_PUBLIC_ACHIEVEMENTS} />

                {/* Activity Heatmap */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      Learning Activity
                    </h2>
                    <span className="text-sm text-muted-foreground">Last 20 weeks</span>
                  </div>
                  <ActivityHeatmap data={MOCK_ACTIVITY} weeks={20} />
                </Card>

                {/* Completed Courses */}
                <Card className="p-6">
                  <h2 className="font-semibold mb-4 text-gray-900 dark:text-white">
                    Completed Courses
                  </h2>
                  <div className="space-y-3">
                    {MOCK_COMPLETED_COURSES.map((course) => (
                      <div
                        key={course.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                            <span className="text-white text-lg">✓</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {course.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Completed{" "}
                              {course.completedAt.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                        <Badge variant="success">Completed</Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Stats */}
                <Card className="p-6">
                  <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">
                    Stats
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total XP</span>
                      <Badge variant="xp">{user.totalXP.toLocaleString()} XP</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Level</span>
                      <Badge variant="level">Level {user.level}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Streak</span>
                      <Badge variant="streak">{stats.streak} days</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Courses</span>
                      <span className="text-sm font-medium">{stats.coursesCompleted}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Achievements</span>
                      <span className="text-sm font-medium">{stats.achievements}</span>
                    </div>
                  </div>
                </Card>

                {/* Badges Showcase */}
                <Card className="p-6">
                  <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">
                    Top Badges
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {MOCK_PUBLIC_ACHIEVEMENTS.slice(0, 6).map((achievement) => (
                      <div
                        key={achievement.id}
                        className="aspect-square rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-2xl"
                        title={achievement.name}
                      >
                        {achievement.icon}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <Card className="p-6">
              <h2 className="font-semibold mb-6 text-gray-900 dark:text-white">
                All Achievements ({stats.achievements})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {MOCK_PUBLIC_ACHIEVEMENTS.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-800"
                  >
                    <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-2xl mb-2 shadow-lg">
                      {achievement.icon}
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
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card className="p-6">
              <h2 className="font-semibold mb-4 text-gray-900 dark:text-white">
                Activity History
              </h2>
              <ActivityHeatmap data={MOCK_ACTIVITY} weeks={52} />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
