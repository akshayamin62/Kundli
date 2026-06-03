"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import AppLogo from "@/components/AppLogo";
import {
  getCaptcha,
  requestLoginOtp,
  resendLoginOtp,
  verifyLoginOtp,
} from "@/lib/authApi";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [step, setStep] = useState<"request" | "verify">("request");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [resending, setResending] = useState(false);
  const [accountWarning, setAccountWarning] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === "verify") {
      otpInputRef.current?.focus();
    }
  }, [step]);

  const startResendTimer = useCallback(() => {
    setResendTimer(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const fetchCaptcha = async () => {
    try {
      const data = await getCaptcha();
      setCaptchaToken(data.token);
      setCaptchaQuestion(data.question);
      setCaptchaAnswer("");
    } catch {
      toast.error("Failed to load captcha");
    }
  };

  useEffect(() => {
    if (step === "request") {
      fetchCaptcha();
    }
  }, [step]);

  const handleResendOTP = async () => {
    if (resendTimer > 0 || resending) return;
    setResending(true);
    try {
      const message = await resendLoginOtp(email);
      toast.success(message);
      startResendTimer();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to resend OTP.";
      toast.error(message);
    } finally {
      setResending(false);
    }
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    if (!captchaToken || !captchaQuestion) {
      toast.error("Please wait for captcha to load");
      return;
    }
    if (!captchaAnswer) {
      toast.error("Please enter the captcha answer");
      return;
    }

    setAccountWarning(null);
    setLoading(true);
    try {
      const message = await requestLoginOtp({
        email,
        captchaToken,
        captchaAnswer,
      });
      toast.success(message, { duration: 4000 });
      setStep("verify");
      startResendTimer();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to send OTP.";
      if (message.toLowerCase().includes("no account found")) {
        setAccountWarning(message);
      } else {
        toast.error(message);
      }
      fetchCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyLoginOtp(email, otp);
      toast.success("Login successful!");
      setTimeout(() => router.push("/"), 800);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Invalid OTP.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-astrogyan-boy/10 via-white to-astrogyan-girl/10 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <Toaster position="top-right" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-astrogyan-boy/20 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-astrogyan-girl/20 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "1.5s" }}
        />
      </div>

      <div className="relative max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <AppLogo href="/login" height={100} />
          </div>
          {/* <h2 className="text-3xl font-bold text-astrogyan-boy mb-2">Sign in</h2> */}
          <p className="text-gray-600 text-sm">
            {/* Enter your registered email. We will send a one-time code to sign in. */}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
          {step === "request" ? (
            <form onSubmit={handleRequestOTP} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setAccountWarning(null);
                  }}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-astrogyan-boy/30 focus:border-astrogyan-boy text-gray-900"
                  placeholder="you@example.com"
                />
                {accountWarning ? (
                  <p
                    role="alert"
                    className="mt-2 text-sm font-medium text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2"
                  >
                    {accountWarning}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Solve to verify
                </label>
                {captchaQuestion ? (
                  <div className="bg-gray-200 border-2 border-gray-400 rounded-xl p-4 mb-3 text-center">
                    <span className="text-2xl font-bold  font-mono">{captchaQuestion}</span>
                  </div>
                ) : null}
                {captchaQuestion && (
                  <input
                    type="number"
                    required
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-astrogyan-boy/30 focus:border-astrogyan-boy text-center font-semibold"
                    placeholder="Your answer"
                  />
                )}
                {captchaQuestion && (
                  <button
                    type="button"
                    onClick={() => {
                      fetchCaptcha();
                      toast.success("Captcha regenerated!");
                    }}
                    className="mt-3 w-full py-2 border-2 border-purple-600 text-purple-600 font-semibold rounded-xl hover:bg-purple-600/10 flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>

                    <span>New Question</span>
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-astrogyan-boy hover:bg-astrogyan-boy-dark text-white font-semibold rounded-xl shadow-lg shadow-astrogyan-boy/25 disabled:opacity-50"
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="text-center mb-2">
                <h3 className="text-2xl font-bold  mb-2">Enter OTP</h3>
                <p className="text-gray-600 text-sm">
                  Code sent to{" "}
                  <span className="font-semibold ">{email}</span>
                </p>
              </div>

              <input
                ref={otpInputRef}
                id="otp"
                type="text"
                required
                maxLength={6}
                pattern="[0-9]{6}"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="block w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-center text-2xl font-bold tracking-widest text-gray-900 focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
                placeholder="000000"
              />

              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resendTimer > 0 || resending}
                className="w-full py-3 border-2 border-astrogyan-boy text-astrogyan-boy hover:bg-astrogyan-boy/10 font-semibold rounded-xl disabled:opacity-50"
              >
                {resending
                  ? "Sending..."
                  : resendTimer > 0
                    ? `Resend OTP (${resendTimer}s)`
                    : "Resend OTP"}
              </button>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-3 bg-astrogyan-boy hover:bg-astrogyan-boy-dark text-white font-semibold rounded-xl shadow-lg shadow-astrogyan-boy/25 disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify & Login"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("request");
                  setOtp("");
                  setCaptchaAnswer("");
                  fetchCaptcha();
                }}
                className="w-full py-2 text-astrogyan-boy hover:text-astrogyan-boy-dark font-medium"
              >
                ← Back to Email
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
