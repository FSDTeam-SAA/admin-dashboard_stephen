"use client";

import { Camera } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { changePassword, getProfile, updateProfile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["profile"], queryFn: getProfile });

  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      toast.success("Profile updated");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => toast.success("Password changed"),
    onError: (error) => toast.error(error.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-56" />
      </div>
    );
  }

  async function onProfileSubmit(formData: FormData) {
    profileMutation.mutate(formData);
  }

  async function onPasswordSubmit(formData: FormData) {
    passwordMutation.mutate({
      currentPassword: String(formData.get("currentPassword") || ""),
      newPassword: String(formData.get("newPassword") || ""),
      confirmPassword: String(formData.get("confirmPassword") || ""),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-heading-40">Setting</h2>
        <p className="text-body-16 text-white/80">Edit your personal information</p>
      </div>

      <Card className="p-4">
        <form action={onProfileSubmit} className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="text-title-24 relative flex h-24 w-24 items-center justify-center rounded-full bg-[#cfcfcf] text-[#111]">
            {getInitials(data?.name)}
            <label htmlFor="avatar" className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white text-black">
              <Camera className="h-4 w-4" />
            </label>
            <input id="avatar" name="avatar" type="file" className="hidden" />
          </div>

          <div className="flex-1">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div>
                <h3 className="text-title-24">{data?.name}</h3>
                <p className="text-body-16 text-white/80">@{data?.role}</p>
              </div>
              <Button size="sm" className="md:ml-6">Edit</Button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Input name="name" defaultValue={data?.name} placeholder="Name" />
              <Input name="phone" defaultValue={data?.phone ?? ""} placeholder="Phone" />
            </div>
          </div>
        </form>
      </Card>

      <Card className="p-5">
        <h3 className="text-title-24 mb-4">Change password</h3>
        <form action={onPasswordSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Current Password</Label>
              <Input name="currentPassword" type="password" placeholder="********" required />
            </div>
            <div>
              <Label>New Password</Label>
              <Input name="newPassword" type="password" placeholder="********" required />
            </div>
            <div>
              <Label>Confirm New Password</Label>
              <Input name="confirmPassword" type="password" placeholder="********" required />
            </div>
          </div>

          <div className="flex justify-end">
            <Button className="h-12 px-8" disabled={passwordMutation.isPending}>
              {passwordMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

