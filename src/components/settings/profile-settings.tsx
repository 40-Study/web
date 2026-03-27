"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Camera } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/auth.store";
import { useUpdateProfile } from "@/hooks/queries/use-auth";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const profileSchema = z.object({
  fullName: z
    .string()
    .min(2, "Tên tối thiểu 2 ký tự")
    .max(100, "Tên tối đa 100 ký tự"),
  username: z
    .string()
    .min(3, "Username tối thiểu 3 ký tự")
    .max(30, "Username tối đa 30 ký tự")
    .regex(/^[a-zA-Z0-9_]+$/, "Username chỉ chứa chữ, số và dấu gạch dưới"),
  bio: z.string().max(160, "Tiểu sử tối đa 160 ký tự").optional(),
  phone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileSettings() {
  const { user } = useAuthStore();
  const updateProfile = useUpdateProfile();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.name || "",
      username: "",
      bio: "",
      phone: "",
    },
  });

  const bio = watch("bio") || "";

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setAvatarError(null);
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setAvatarError("Chỉ chấp nhận ảnh JPG, PNG hoặc WebP");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setAvatarError("Ảnh phải nhỏ hơn 2MB");
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: ProfileFormData) => {
    updateProfile.mutate({
      full_name: data.fullName,
      username: data.username || undefined,
      bio: data.bio || undefined,
      phone: data.phone || undefined,
    });
  };

  const hasChanges = isDirty || avatarFile !== null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Hồ sơ</h2>
        <p className="text-sm text-gray-500 mt-1">Cập nhật thông tin cá nhân của bạn</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Avatar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Avatar
                size="xl"
                src={avatarPreview || user?.avatar}
                fallback={user?.name || "U"}
                className="w-20 h-20 ring-4 ring-gray-50"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <Camera className="h-5 w-5 text-white" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            <div>
              <p className="font-medium text-gray-900">{user?.name || "Người dùng"}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                Thay đổi ảnh đại diện
              </button>
              {avatarError && <p className="text-xs text-red-500 mt-1">{avatarError}</p>}
            </div>
          </div>
        </div>

        {/* Form fields */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ và tên</Label>
              <Input
                id="fullName"
                {...register("fullName")}
                error={errors.fullName?.message}
                placeholder="Nguyễn Văn A"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                <Input
                  id="username"
                  {...register("username")}
                  error={errors.username?.message}
                  placeholder="username"
                  className="pl-8 rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input
              id="phone"
              {...register("phone")}
              placeholder="0912 345 678"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Tiểu sử</Label>
            <Textarea
              id="bio"
              {...register("bio")}
              error={errors.bio?.message}
              placeholder="Giới thiệu ngắn về bạn..."
              maxLength={160}
              rows={3}
              className="rounded-xl"
            />
            <p className="text-xs text-gray-400 text-right">{bio.length}/160</p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <Button
            type="submit"
            className="rounded-xl px-8"
            disabled={!hasChanges || updateProfile.isPending}
          >
            {updateProfile.isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </form>
    </div>
  );
}
