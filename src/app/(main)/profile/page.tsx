"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ProfileHeader,
  ActivityHeatmap,
  FeaturedAchievements,
} from "@/components/profile";
import type { User, UserStats, FeaturedAchievement } from "@/components/profile";
import { EditProfileForm } from "@/components/settings";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Mock data - replace with API calls
const MOCK_USER: User = {
  id: "1",
  fullName: "Nguyen Van Minh",
  username: "minh_learns",
  email: "minh@example.com",
  bio: "Learning something new every day! Passionate about programming and math.",
  level: 12,
  totalXP: 2450,
  streak: 14,
  createdAt: new Date("2025-03-01"),
};

const MOCK_STATS: UserStats = {
  streak: 14,
  coursesCompleted: 5,
  achievements: 12,
  lessonsCompleted: 87,
  totalStudyTime: 2340,
};

const MOCK_ACHIEVEMENTS: FeaturedAchievement[] = [
  { id: "1", name: "First Steps", icon: "📖", rarity: "common", unlockedAt: new Date() },
  { id: "2", name: "Week Warrior", icon: "🔥", rarity: "common", unlockedAt: new Date() },
  { id: "3", name: "Course Master", icon: "🎓", rarity: "rare", unlockedAt: new Date() },
  { id: "4", name: "Perfect Score", icon: "💯", rarity: "rare", unlockedAt: new Date() },
  { id: "5", name: "Renaissance", icon: "🎨", rarity: "epic", unlockedAt: new Date() },
];

// Generate mock activity data for past 140 days
const generateActivityData = () => {
  const data = [];
  const today = new Date();
  for (let i = 140; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    // Random activity count with higher probability of 0
    const rand = Math.random();
    const count = rand < 0.3 ? 0 : rand < 0.5 ? 1 : rand < 0.7 ? 2 : rand < 0.9 ? 4 : 7;
    data.push({ date: dateStr, count });
  }
  return data;
};

const MOCK_ACTIVITY = generateActivityData();

interface EnrolledCourse {
  id: string;
  title: string;
  thumbnail: string;
  progress: number;
  lessonsCompleted: number;
  totalLessons: number;
}

const MOCK_ENROLLED_COURSES: EnrolledCourse[] = [
  {
    id: "1",
    title: "Introduction to Python Programming",
    thumbnail: "/images/courses/python.png",
    progress: 75,
    lessonsCompleted: 15,
    totalLessons: 20,
  },
  {
    id: "2",
    title: "Web Development with React",
    thumbnail: "/images/courses/react.png",
    progress: 40,
    lessonsCompleted: 8,
    totalLessons: 20,
  },
  {
    id: "3",
    title: "Data Structures and Algorithms",
    thumbnail: "/images/courses/dsa.png",
    progress: 20,
    lessonsCompleted: 5,
    totalLessons: 25,
  },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [user, setUser] = useState(MOCK_USER);

  const handleProfileUpdate = async (data: {
    fullName: string;
    username: string;
    bio?: string;
    avatar?: File;
  }) => {
    // In real app, call API to update profile
    console.log("Updating profile:", data);
    setUser((prev) => ({
      ...prev,
      fullName: data.fullName,
      username: data.username,
      bio: data.bio,
    }));
    setEditProfileOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Profile Header */}
      <ProfileHeader
        user={user}
        isOwnProfile={true}
        stats={MOCK_STATS}
        onEditProfile={() => setEditProfileOpen(true)}
        onAvatarUpload={() => setEditProfileOpen(true)}
      />

      {/* Main Content */}
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Featured Achievements */}
                <FeaturedAchievements achievements={MOCK_ACHIEVEMENTS} />

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

                {/* Enrolled Courses */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      Enrolled Courses
                    </h2>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/courses">View All</Link>
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {MOCK_ENROLLED_COURSES.map((course) => (
                      <div
                        key={course.id}
                        className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                      >
                        <div className="w-16 h-12 rounded-lg bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {course.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <ProgressBar
                              value={course.progress}
                              size="sm"
                              className="flex-1"
                            />
                            <span className="text-xs text-muted-foreground shrink-0">
                              {course.lessonsCompleted}/{course.totalLessons}
                            </span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/courses/${course.id}`}>Continue</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Stats */}
                <Card className="p-6">
                  <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">
                    Quick Stats
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total XP</span>
                      <Badge variant="xp">{user.totalXP.toLocaleString()} XP</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Current Level</span>
                      <Badge variant="level">Level {user.level}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Current Streak</span>
                      <Badge variant="streak">{MOCK_STATS.streak} days</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Study Time</span>
                      <span className="text-sm font-medium">
                        {Math.floor(MOCK_STATS.totalStudyTime / 60)}h{" "}
                        {MOCK_STATS.totalStudyTime % 60}m
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Recent Activity */}
                <Card className="p-6">
                  <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">
                    Recent Activity
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                        <span className="text-sm">✓</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-900 dark:text-white">
                          Completed &quot;Variables and Data Types&quot;
                        </p>
                        <p className="text-xs text-muted-foreground">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center shrink-0">
                        <span className="text-sm">🏆</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-900 dark:text-white">
                          Earned &quot;Week Warrior&quot; badge
                        </p>
                        <p className="text-xs text-muted-foreground">Yesterday</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                        <span className="text-sm">📚</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-900 dark:text-white">
                          Started &quot;Data Structures&quot; course
                        </p>
                        <p className="text-xs text-muted-foreground">3 days ago</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {MOCK_ENROLLED_COURSES.map((course) => (
                <Card key={course.id} className="overflow-hidden">
                  <div className="h-32 bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-white" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {course.title}
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{course.progress}%</span>
                      </div>
                      <ProgressBar value={course.progress} />
                      <p className="text-sm text-muted-foreground">
                        {course.lessonsCompleted} of {course.totalLessons} lessons
                      </p>
                    </div>
                    <Button className="w-full mt-4" asChild>
                      <Link href={`/courses/${course.id}`}>Continue Learning</Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                View all your achievements and progress
              </p>
              <Button asChild>
                <Link href="/achievements">Go to Achievements</Link>
              </Button>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card className="p-6">
              <h2 className="font-semibold mb-4 text-gray-900 dark:text-white">
                Full Activity History
              </h2>
              <ActivityHeatmap data={MOCK_ACTIVITY} weeks={52} />
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <EditProfileForm
            user={user}
            onSubmit={handleProfileUpdate}
            onCancel={() => setEditProfileOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
