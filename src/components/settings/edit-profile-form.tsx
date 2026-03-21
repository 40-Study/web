"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const profileSchema = z.object({
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  bio: z.string().max(160, "Bio must be less than 160 characters").optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface EditProfileFormProps {
  user: {
    fullName: string;
    username: string;
    bio?: string;
    avatar?: string;
  };
  onSubmit: (data: ProfileFormData & { avatar?: File }) => Promise<void>;
  onCancel: () => void;
}

export function EditProfileForm({ user, onSubmit, onCancel }: EditProfileFormProps) {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user.fullName,
      username: user.username,
      bio: user.bio || "",
    },
  });

  const bio = watch("bio") || "";
  const username = watch("username");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setAvatarError(null);

    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setAvatarError("Please select a JPG, PNG, or WebP image");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setAvatarError("Image must be less than 2MB");
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...data,
        avatar: avatarFile || undefined,
      });
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setAvatarPreview(null);
    setAvatarFile(null);
    setAvatarError(null);
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-6">
        <Avatar
          size="xl"
          src={avatarPreview || user.avatar}
          fallback={user.fullName}
          className="w-20 h-20"
        />
        <div>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload Photo
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          <p className="text-xs text-muted-foreground mt-1">
            JPG, PNG or WebP. Max 2MB.
          </p>
          {avatarError && (
            <p className="text-xs text-destructive mt-1">{avatarError}</p>
          )}
        </div>
      </div>

      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          {...register("fullName")}
          error={errors.fullName?.message}
          placeholder="Your full name"
        />
      </div>

      {/* Username */}
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            @
          </span>
          <Input
            id="username"
            {...register("username")}
            error={errors.username?.message}
            placeholder="username"
            className="pl-8"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          40study.com/@{username || "username"}
        </p>
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          {...register("bio")}
          error={errors.bio?.message}
          placeholder="Tell us about yourself"
          maxLength={160}
          rows={3}
        />
        <p className="text-xs text-muted-foreground text-right">
          {bio.length}/160
        </p>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={resetForm}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
