"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Upload } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { createManager } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AddManagerPage() {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: createManager,
    onSuccess: () => {
      toast.success("Manager added successfully");
      router.push("/managers");
    },
    onError: (error) => toast.error(error.message),
  });

  async function onSubmit(formData: FormData) {
    mutation.mutate(formData);
  }

  return (
    <div className="space-y-5">
      <Link href="/managers" className="text-heading-40 inline-flex items-center gap-2">
        <ChevronLeft className="h-6 w-6" /> Add Manager&apos;s
      </Link>
      <p className="text-body-16 text-white/80">Create and manage your Mange Manager&apos;s</p>

      <form action={onSubmit} className="space-y-4">
        <div>
          <Label>Manager Name</Label>
          <Input name="name" placeholder="Enter project manager name" required />
        </div>

        <div>
          <Label>Enter Email</Label>
          <Input name="email" type="email" placeholder="Enter Email" required />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Password</Label>
            <Input name="password" type="password" placeholder="**********" required />
          </div>
          <div>
            <Label>Confirm Password</Label>
            <Input name="confirmPassword" type="password" placeholder="**********" required />
          </div>
        </div>

        <div className="rounded-lg border border-dashed border-white/50 p-12 text-center">
          <Label htmlFor="avatar" className="cursor-pointer text-body-16">
            <Upload className="mx-auto mb-2 h-8 w-8 text-[#6d63d7]" />
            Upload Photo
            <p className="text-body-16 text-white/70">png,jpeg,jpg</p>
          </Label>
          <Input id="avatar" name="avatar" type="file" accept="image/*" className="hidden" />
        </div>

        <div className="grid gap-4 pt-2 md:grid-cols-2">
          <Link href="/managers">
            <Button type="button" variant="outline" className="h-12 w-full">
              Cancel
            </Button>
          </Link>
          <Button className="h-12" disabled={mutation.isPending}>
            {mutation.isPending ? "Adding..." : "Add Manager"}
          </Button>
        </div>
      </form>
    </div>
  );
}

