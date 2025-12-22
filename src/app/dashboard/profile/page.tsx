"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

export default function Page() {
  const { data: session, status } = useSession();
  const [is2FAEnabled, setIs2FAEnabled] = useState<boolean>(false);
  const [loading2FA, setLoading2FA] = useState(false);
  const [fetching2FA, setFetching2FA] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isLoading = status === "loading";
  const user = session?.user;

  // Fetch current 2FA status
  useEffect(() => {
    const fetch2FAStatus = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch("/api/auth/2fa/status");
        if (response.ok) {
          const data = await response.json();
          setIs2FAEnabled(data.is_twofactor || false); // API returns is_twofactor in response
        }
      } catch (err) {
        console.error("Error fetching 2FA status:", err);
      } finally {
        setFetching2FA(false);
      }
    };

    if (user?.id) {
      fetch2FAStatus();
    }
  }, [user?.id]);

  const handle2FAToggle = async () => {
    const newValue = !is2FAEnabled;
    setLoading2FA(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/2fa/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ istwofactor: newValue }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to update 2FA settings");
        return;
      }

      setIs2FAEnabled(newValue);
    } catch (err) {
      console.error("Error toggling 2FA:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading2FA(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[970px]">
      <Breadcrumb pageName="Profile" />

      <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="px-6 py-8 sm:px-10">
          <div className="space-y-6">
            <div>
              <h2 className="text-heading-5 font-bold text-dark dark:text-white">
                Account Overview
              </h2>
              <p className="text-sm text-gray-500 dark:text-dark-6">
                Review your profile details pulled from the authenticated session.
              </p>
            </div>

            <dl className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-dark-2">
                <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-dark-5">
                  Name
                </dt>
                <dd className="mt-1 text-base font-medium text-dark dark:text-white">
                  {isLoading ? "Loading..." : user?.name ?? "Not available"}
                </dd>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-dark-2">
                <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-dark-5">
                  Email
                </dt>
                <dd className="mt-1 text-base font-medium text-dark dark:text-white">
                  {isLoading ? "Loading..." : user?.email ?? "Not available"}
                </dd>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-dark-2">
                <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-dark-5">
                  Role
                </dt>
                <dd className="mt-1 text-base font-medium text-dark dark:text-white">
                  {isLoading ? "Loading..." : user?.role ?? "Not assigned"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="px-6 py-8 sm:px-10">
          <div className="space-y-6">
            <div>
              <h2 className="text-heading-5 font-bold text-dark dark:text-white">
                Security
              </h2>
              <p className="text-sm text-gray-500 dark:text-dark-6">
                Manage your account security settings and two-factor authentication.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-dark-2">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-dark dark:text-white">
                    Two-Factor Authentication (Email)
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-dark-6">
                    Add an extra layer of security to your account by requiring a verification code sent to your email in addition to your password.
                  </p>
                  {user?.email && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-dark-5">
                      Verification codes will be sent to: <span className="font-medium text-gray-700 dark:text-dark-6">{user.email}</span>
                    </p>
                  )}
                </div>
                <div className="ml-6">
                  <label
                    htmlFor="2fa-toggle"
                    className={`flex cursor-pointer select-none items-center ${loading2FA || fetching2FA ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="relative">
                      <input
                        type="checkbox"
                        id="2fa-toggle"
                        className="sr-only"
                        checked={is2FAEnabled}
                        onChange={handle2FAToggle}
                        disabled={loading2FA || fetching2FA}
                      />
                      <div className="block h-8 w-14 rounded-full bg-gray-3 dark:bg-[#5A616B]"></div>
                      <div
                        className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-switch-1 transition ${
                          is2FAEnabled && "!right-1 !translate-x-full !bg-primary dark:!bg-white"
                        }`}
                      ></div>
                    </div>
                  </label>
                </div>
              </div>
              {error && (
                <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-600/40 dark:bg-red-900/20">
                  <p className="text-sm text-red-600 dark:text-red-200">{error}</p>
                </div>
              )}
              {is2FAEnabled && (
                <div className="mt-4 rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>2FA Enabled:</strong> A verification code will be sent to your email address each time you sign in. Make sure you have access to {user?.email ?? "your email"} to complete login.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
