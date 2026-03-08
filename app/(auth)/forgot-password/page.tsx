"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "@/lib/api";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const router = useRouter();

  async function onSubmit(formData: FormData) {
    const email = String(formData.get("email") || "");
    try {
      await forgotPassword({ email });
      toast.success("OTP sent to your email");
      router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Request failed");
    }
  }

  return (
    <Card className="w-full max-w-3xl border-none bg-[#ececec] p-8 text-black md:p-10">
      <h1 className="text-heading-40">Change Password</h1>
      <p className="text-body-16 mb-8 mt-2 text-black/80">Create a strong password</p>

      <form action={onSubmit} className="space-y-5">
        <div>
          <Label className="text-black">Email Address</Label>
          <Input name="email" type="email" placeholder="you@example.com" className="border-black/40 bg-white text-black" required />
        </div>

        <Button className="h-12 w-full">Continue</Button>
      </form>
    </Card>
  );
}

