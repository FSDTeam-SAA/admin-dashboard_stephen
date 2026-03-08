"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Clock3 } from "lucide-react";
import { verifyOtp, forgotPassword } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function VerifyOtpPage() {
  const router = useRouter();
  const email =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("email") || "" : "";
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const otpValue = otp.join("");

  async function onContinue() {
    try {
      await verifyOtp({ email, otp: otpValue });
      toast.success("OTP verified");
      router.push(`/reset-password?email=${encodeURIComponent(email)}&otp=${otpValue}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "OTP verification failed");
    }
  }

  async function onResend() {
    try {
      await forgotPassword({ email });
      toast.success("OTP resent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to resend OTP");
    }
  }

  return (
    <Card className="w-full max-w-3xl border-none bg-[#ececec] p-8 text-black md:p-10">
      <h1 className="text-heading-40">Verify Email</h1>
      <p className="text-body-16 mb-8 mt-2 text-black/80">Enter OTP to Verify your email address</p>

      <div className="mb-6 flex justify-between gap-3">
        {otp.map((digit, idx) => (
          <input
            key={idx}
            maxLength={1}
            value={digit}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, "");
              setOtp((prev) => prev.map((item, index) => (index === idx ? val : item)));
            }}
            className="text-title-24 h-18 w-14 rounded-2xl border border-black/80 bg-white text-center"
          />
        ))}
      </div>

      <div className="text-body-16 mb-6 flex items-center justify-between text-black/80">
        <p className="flex items-center gap-2">
          <Clock3 className="h-5 w-5" /> 00:59
        </p>
        <button type="button" onClick={onResend} className="text-[#7c6321]">
          Didn&apos;t get a code ? <span className="font-semibold">Resend it</span>
        </button>
      </div>

      <Button className="h-12 w-full" disabled={otpValue.length !== 6} onClick={onContinue}>
        Continue
      </Button>
    </Card>
  );
}
