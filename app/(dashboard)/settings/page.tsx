"use client";

import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { Camera, X, Loader2, Eye, EyeOff } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { changePassword, getProfile, updateProfile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";

// --- Sub-component: Password Input with Toggle ---
function PasswordInput({ name, id, required }: { name: string; id: string; required?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        className="pr-10"
        placeholder="********"
        required={required}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

// --- Main Page Component ---
export default function SettingsPage() {
  const queryClient = useQueryClient();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);

  const { data, isLoading } = useQuery({ 
    queryKey: ["profile"], 
    queryFn: getProfile 
  });

  const currentAvatar = useMemo(() => {
    if (avatarPreview) return avatarPreview;
    if (removeAvatar) return null;
    return data?.avatar?.url || null;
  }, [avatarPreview, data?.avatar?.url, removeAvatar]);

  // --- Mutations ---
  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      toast.success("Profile updated successfully");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setAvatarFile(null);
    },
    onError: (error: any) => toast.error(error.message || "Failed to update profile"),
  });

  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => toast.success("Password changed successfully"),
    onError: (error: any) => toast.error(error.message || "Failed to change password"),
  });

  // --- Handlers ---
  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setRemoveAvatar(false);
  };

  const clearAvatarSelection = () => {
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
      setAvatarFile(null);
    } else {
      setRemoveAvatar(true);
    }
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  };

  async function onProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (avatarFile) formData.set("avatar", avatarFile);
    formData.set("removeAvatar", removeAvatar ? "true" : "false");
    profileMutation.mutate(formData);
  }

  async function onPasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (formData.get("newPassword") !== formData.get("confirmPassword")) {
      return toast.error("Passwords do not match");
    }

    passwordMutation.mutate({
      currentPassword: String(formData.get("currentPassword") || ""),
      newPassword: String(formData.get("newPassword") || ""),
      confirmPassword: String(formData.get("confirmPassword") || ""),
    });
    e.currentTarget.reset();
  }

  useEffect(() => {
    return () => { if (avatarPreview) URL.revokeObjectURL(avatarPreview); };
  }, [avatarPreview]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto p-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      <header>
        <h2 className="text-[40px] font-bold leading-tight">Setting</h2>
        <p className="text-white/60">Edit your personal information</p>
      </header>

      {/* Profile Card */}
      <Card className="p-6 bg-[#1a1a1a] border-white/10">
        <form onSubmit={onProfileSubmit} className="flex flex-col gap-8 md:flex-row">
          {/* Avatar Section */}
          <div className="relative group self-center md:self-start">
            <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-[#333] border-2 border-white/10">
              {currentAvatar ? (
                <img src={currentAvatar} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl font-bold">{getInitials(data?.name)}</span>
              )}

              <label htmlFor="avatar" className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-8 w-8 text-white" />
              </label>
            </div>

            {(avatarPreview || (data?.avatar?.url && !removeAvatar)) && (
              <button
                type="button"
                onClick={clearAvatarSelection}
                className="absolute -top-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            
            <input
              ref={avatarInputRef}
              id="avatar"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Fields Section */}
          <div className="flex-1 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-semibold">{data?.name}</h3>
                <p className="text-white/50">@{data?.role || "user"}</p>
              </div>
              <Button type="submit" disabled={profileMutation.isPending} className="bg-white text-black hover:bg-white/90">
                {profileMutation.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : "Save Profile"}
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" defaultValue={data?.name} className="bg-[#222] border-white/10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" defaultValue={data?.phone ?? ""} className="bg-[#222] border-white/10" />
              </div>
            </div>
          </div>
        </form>
      </Card>

      {/* Password Card */}
      <Card className="p-6 bg-[#1a1a1a] border-white/10">
        <h3 className="text-2xl font-semibold mb-6">Change password</h3>
        <form onSubmit={onPasswordSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <PasswordInput id="currentPassword" name="currentPassword" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <PasswordInput id="newPassword" name="newPassword" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <PasswordInput id="confirmPassword" name="confirmPassword" required />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={passwordMutation.isPending} className="h-12 px-8">
              {passwordMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}