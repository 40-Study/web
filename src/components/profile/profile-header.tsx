"use client";

import Link from "next/link";
import { Camera, Pencil, UserPlus } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";

export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  level: number;
  totalXP: number;
  streak: number;
  createdAt: Date | string;
}

export interface UserStats {
  streak: number;
  coursesCompleted: number;
  achievements: number;
  lessonsCompleted: number;
  totalStudyTime: number; // in minutes
}

interface ProfileHeaderProps {
  user: User;
  isOwnProfile: boolean;
  stats: UserStats;
  onEditProfile?: () => void;
  onAvatarUpload?: () => void;
  className?: string;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

export function ProfileHeader({
  user,
  isOwnProfile,
  stats,
  onEditProfile,
  onAvatarUpload,
  className,
}: ProfileHeaderProps) {
  return (
    <div
      className={cn(
        "bg-gradient-to-r from-primary-600 to-secondary-600 text-white",
        className
      )}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            <Avatar
              size="xl"
              src={user.avatar}
              fallback={user.fullName}
              className="w-28 h-28 border-4 border-white shadow-xl"
            />
            {user.streak > 0 && (
              <div className="absolute -bottom-2 -right-2 bg-orange-500 rounded-full p-2 shadow-lg">
                <span className="text-xl">🔥</span>
              </div>
            )}
            {isOwnProfile && (
              <button
                className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-lg hover:bg-gray-100 transition-colors"
                onClick={onAvatarUpload}
                aria-label="Upload avatar"
              >
                <Camera className="h-4 w-4 text-gray-600" />
              </button>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold">{user.fullName}</h1>
              <Badge variant="level">Level {user.level}</Badge>
            </div>
            <p className="opacity-80 mb-2">@{user.username}</p>
            {user.bio && <p className="mb-3 max-w-lg">{user.bio}</p>}
            <div className="flex items-center justify-center md:justify-start gap-4 text-sm opacity-80">
              <span>{formatNumber(user.totalXP)} XP</span>
              <span>•</span>
              <span>Joined {formatDate(user.createdAt)}</span>
            </div>
          </div>

          {/* Actions */}
          {isOwnProfile ? (
            <Button
              variant="outline"
              className="text-white border-white hover:bg-white/20"
              onClick={onEditProfile}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <Button
              variant="outline"
              className="text-white border-white hover:bg-white/20"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Follow
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="flex justify-center md:justify-start gap-8 mt-8">
          <div className="text-center">
            <p className="text-3xl font-bold">{stats.streak}</p>
            <p className="text-sm opacity-80">Day Streak</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{stats.coursesCompleted}</p>
            <p className="text-sm opacity-80">Courses</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{stats.achievements}</p>
            <p className="text-sm opacity-80">Achievements</p>
          </div>
          <div className="text-center hidden sm:block">
            <p className="text-3xl font-bold">{stats.lessonsCompleted}</p>
            <p className="text-sm opacity-80">Lessons</p>
          </div>
        </div>
      </div>
    </div>
  );
}
