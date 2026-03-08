"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/lib/api";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const router = useRouter();
  const email =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("email") || "" : "";
  const otp =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("otp") || "" : "";
  const [show, setShow] = useState(false);

  async function onSubmit(formData: FormData) {
    const resolvedEmail = email || String(formData.get("email") || "");
    const resolvedOtp = otp || String(formData.get("otp") || "");
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");

    try {
      await resetPassword({ email: resolvedEmail, otp: resolvedOtp, password, confirmPassword });
      toast.success("Password changed successfully");
      router.push("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reset password");
    }
  }

  return (
    <Card className="w-full max-w-3xl border-none bg-[#ececec] p-8 text-black md:p-10">
      <h1 className="text-heading-40">Change Password</h1>
      <p className="text-body-16 mb-8 mt-2 text-black/80">Create a strong password</p>

      <form action={onSubmit} className="space-y-5">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="otp" value={otp} />

        <div>
          <Label className="text-black">Password</Label>
          <div className="relative">
            <Input
              name="password"
              type={show ? "text" : "password"}
              placeholder="********"
              className="border-black/40 bg-white pr-10 text-black"
              required
            />
            <button type="button" className="absolute right-3 top-3 text-black/70" onClick={() => setShow((prev) => !prev)}>
              {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div>
          <Label className="text-black">Confirm Password</Label>
          <Input name="confirmPassword" type={show ? "text" : "password"} className="border-black/40 bg-white text-black" required />
        </div>

        <Button className="h-12 w-full">Continue</Button>
      </form>
    </Card>
  );
}
