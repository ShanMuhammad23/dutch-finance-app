"use client";
import { EmailIcon, PasswordIcon } from "@/assets/icons";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import InputGroup from "../FormElements/InputGroup";
import { Checkbox } from "../FormElements/checkbox";

export default function SigninWithPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState({
    email: process.env.NEXT_PUBLIC_DEMO_USER_MAIL || "",
    password: process.env.NEXT_PUBLIC_DEMO_USER_PASS || "",
    otp: "",
    remember: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOTP, setShowOTP] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({
      ...data,
      [e.target.name]: e.target.value,
    });
  };

  const sendOTP = async () => {
    setSendingOTP(true);
    setError(null);
    try {
      console.log('📧 Sending OTP to:', data.email);
      const response = await fetch("/api/auth/2fa/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();
      console.log('📧 Send OTP response:', result);

      if (!response.ok) {
        console.error('❌ Failed to send OTP:', result.error);
        setError(result.error || "Failed to send OTP. Please try again.");
        return false;
      }

      setOtpSent(true);
      console.log('✅ OTP sent successfully');
      return true;
    } catch (err) {
      console.error("❌ Send OTP error", err);
      setError("Failed to send OTP. Please try again.");
      return false;
    } finally {
      setSendingOTP(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const callbackUrl = searchParams?.get("callbackUrl") ?? "/";
      
      // Only include OTP if OTP input is shown AND OTP value exists
      const credentials: any = {
        email: data.email,
        password: data.password,
        callbackUrl,
      };
      
      // Only add OTP if we're in OTP verification step and have a value
      if (showOTP && data.otp && data.otp.trim() !== '') {
        credentials.otp = data.otp.trim();
      }
      
      console.log('🔐 Attempting login:', { 
        email: data.email, 
        hasOTP: showOTP && !!data.otp,
        showOTP 
      });
      
      const result = await signIn("credentials", {
        redirect: false,
        ...credentials,
      });

      if (!result) {
        setError("Unable to connect to the server. Please try again.");
        return;
      }

      if (result.error) {
        // Check if OTP is required - NextAuth passes error message through
        const errorMsg = result.error.toString().toUpperCase();
        const errorString = result.error.toString();
        console.log('🔍 Login error:', { error: result.error, errorString, errorMsg });
        
        // Check for OTP-related errors - be more explicit
        const isOTPRequired = errorMsg.includes("OTP_REQUIRED");
        const isOTPNotFound = errorMsg.includes("OTP_NOT_FOUND");
        const isOTPExpired = errorMsg.includes("OTP_EXPIRED");
        const isOTPInvalid = errorMsg.includes("OTP_INVALID");
        const isTwoFactorError = errorMsg.includes("TWO-FACTOR") || errorMsg.includes("VERIFICATION");
        
        if (isOTPRequired || (isOTPNotFound && !showOTP) || (!showOTP && isTwoFactorError)) {
          // First time - OTP is required, show OTP input and send code
          console.log('🔐 OTP required - showing input and sending code');
          setShowOTP(true);
          const sent = await sendOTP();
          if (!sent) {
            setError("Failed to send verification code. Please try again.");
          }
          return;
        } else if (isOTPNotFound && showOTP) {
          // OTP input shown but OTP not found in DB - resend
          console.log('🔐 OTP not found - resending code');
          setError("No OTP found. A new code has been sent to your email.");
          await sendOTP();
          return;
        } else if (isOTPExpired) {
          console.log('🔐 OTP expired - resending code');
          setError("OTP has expired. A new code has been sent to your email.");
          if (!showOTP) {
            setShowOTP(true);
          }
          await sendOTP();
          return;
        } else if (isOTPInvalid) {
          console.log('🔐 Invalid OTP');
          setError("Invalid OTP. Please check and try again.");
          return;
        }
        
        // Default error message
        console.log('❌ Unknown error, showing default message');
        setError("Invalid email or password.");
        return;
      }

      if (result.url) {
        router.replace(result.url);
        router.refresh();
      }
    } catch (err: any) {
      console.error("Sign-in error", err);
      // Handle OTP_REQUIRED error from NextAuth
      const errorMsg = err?.message?.toString() || err?.toString() || "";
      if (errorMsg.includes("OTP_REQUIRED") || errorMsg.includes("OTP_ERROR")) {
        if (!showOTP) {
          setShowOTP(true);
          await sendOTP();
          return;
        }
      }
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <InputGroup
        type="email"
        label="Email"
        className="mb-4 [&_input]:py-[15px]"
        placeholder="Enter your email"
        name="email"
        handleChange={handleChange}
        value={data.email}
        icon={<EmailIcon />}
        required
      />

      <InputGroup
        type="password"
        label="Password"
        className="mb-5 [&_input]:py-[15px]"
        placeholder="Enter your password"
        name="password"
        handleChange={handleChange}
        value={data.password}
        icon={<PasswordIcon />}
        required
        disabled={showOTP}
      />

      {showOTP && (
        <div className="mb-5">
          <div className="mb-3 rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-600/40 dark:bg-blue-900/20">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Two-Factor Authentication Required</strong>
              <br />
              {otpSent ? (
                <>A verification code has been sent to <strong>{data.email}</strong>. Please enter it below.</>
              ) : (
                <>Please enter the verification code sent to your email.</>
              )}
            </p>
          </div>
          <InputGroup
            type="text"
            label="Verification Code"
            className="[&_input]:py-[15px]"
            placeholder="Enter 6-digit code"
            name="otp"
            handleChange={handleChange}
            value={data.otp}
            required
            maxLength={6}
            pattern="[0-9]{6}"
          />
          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={sendOTP}
              disabled={sendingOTP}
              className="text-sm text-primary hover:underline dark:text-primary"
            >
              {sendingOTP ? "Sending..." : "Resend Code"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowOTP(false);
                setOtpSent(false);
                setData({ ...data, otp: "" });
                setError(null);
              }}
              className="text-sm text-gray-600 hover:underline dark:text-gray-400"
            >
              Use different account
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 dark:border-red-600/40 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </p>
      )}

      {!showOTP && (
        <div className="mb-6 flex items-center justify-between gap-2 py-2 font-medium">
          <Checkbox
            label="Remember me"
            name="remember"
            withIcon="check"
            minimal
            radius="md"
            onChange={(e) =>
              setData({
                ...data,
                remember: e.target.checked,
              })
            }
          />

          <Link
            href="/auth/forgot-password"
            className="hover:text-primary dark:text-white dark:hover:text-primary"
          >
            Forgot Password?
          </Link>
        </div>
      )}

      <div className="mb-4.5">
        <button
          type="submit"
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary p-4 font-medium text-white transition hover:bg-opacity-90"
          disabled={loading || sendingOTP}
        >
          {showOTP ? "Verify Code" : "Sign In"}
          {(loading || sendingOTP) && (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent dark:border-primary dark:border-t-transparent" />
          )}
        </button>
      </div>
    </form>
  );
}
