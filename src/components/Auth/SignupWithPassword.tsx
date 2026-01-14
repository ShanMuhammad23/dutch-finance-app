"use client";
import { EmailIcon, PasswordIcon } from "@/assets/icons";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React, { useState } from "react";
import InputGroup from "../FormElements/InputGroup";
import { Select } from "../FormElements/select";

type UserData = {
  full_name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type OrganizationData = {
  business_type: string;
  company_name: string;
  address_line?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  email?: string;
  attention_person?: string;
  vat_number?: string;
};

const BUSINESS_TYPES = [
  { value: "ApS", label: "ApS (Private Limited Company)" },
  { value: "A/S", label: "A/S (Public Limited Company)" },
  { value: "IVS", label: "IVS (Entrepreneur Company)" },
  { value: "I/S", label: "I/S (Partnership)" },
  { value: "K/S", label: "K/S (Limited Partnership)" },
  { value: "Enkeltmandsvirksomhed", label: "Sole Proprietorship" },
  { value: "Forening", label: "Association" },
  { value: "Fond", label: "Foundation" },
  { value: "Other", label: "Other" },
];

export default function SignupWithPassword() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData>({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [organizationData, setOrganizationData] = useState<OrganizationData>({
    business_type: "",
    company_name: "",
    address_line: "",
    postal_code: "",
    city: "",
    country: "Denmark",
    email: "",
    attention_person: "",
    vat_number: "",
  });

  const handleUserDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserData({
      ...userData,
      [e.target.name]: e.target.value,
    });
  };

  const handleOrganizationDataChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setOrganizationData({
      ...organizationData,
      [e.target.name]: e.target.value,
    });
  };

  const validateUserData = (): boolean => {
    if (!userData.full_name.trim()) {
      setError("Full name is required");
      return false;
    }
    if (!userData.email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!userData.email.includes("@")) {
      setError("Please enter a valid email address");
      return false;
    }
    if (!userData.password) {
      setError("Password is required");
      return false;
    }
    if (userData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return false;
    }
    // New validation for at least one number
    if (!/\d/.test(userData.password)) {
      setError("Password must contain at least one number");
      return false;
    }
    if (userData.password !== userData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
};

  const validateOrganizationData = (): boolean => {
    if (!organizationData.business_type) {
      setError("Business type is required");
      return false;
    }
    if (!organizationData.company_name.trim()) {
      setError("Company name is required");
      return false;
    }
    return true;
  };

  const handleStep1Submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!validateUserData()) {
      return;
    }

    // Just validate and move to step 2 - don't create user yet
    setStep(2);
  };

  const handleStep2Submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Validate both user and organization data
    if (!validateUserData()) {
      return;
    }

    if (!validateOrganizationData()) {
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create user first
      const userResponse = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: userData.full_name,
          email: userData.email,
          password: userData.password,
        }),
      });

      const userResult = await userResponse.json();

      if (!userResponse.ok) {
        setError(userResult.error || "Failed to create account");
        return;
      }

      const userId = userResult.user.id;

      // Step 2: Create organization with the newly created user ID
      const orgResponse = await fetch("/api/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          business_type: organizationData.business_type,
          company_name: organizationData.company_name,
          address_line: organizationData.address_line || undefined,
          postal_code: organizationData.postal_code || undefined,
          city: organizationData.city || undefined,
          country: organizationData.country || "Denmark",
          email: organizationData.email || undefined,
          attention_person: organizationData.attention_person || undefined,
          vat_number: organizationData.vat_number || undefined,
        }),
      });

      const orgResult = await orgResponse.json();

      if (!orgResponse.ok) {
        // If organization creation fails, we should ideally rollback user creation
        // For now, we'll just show an error - the user can try again
        setError(orgResult.error || "Failed to create organization. Please try again.");
        return;
      }

      // Success! Both user and organization created. Redirect to sign in page
      router.push("/auth/sign-in?signup=success");
    } catch (err: any) {
      console.error("Registration error", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="mb-2 text-2xl font-bold text-dark dark:text-white">
          {step === 1 ? "Create Account" : "Create Organization"}
        </h2>
        <p className="text-body-sm text-dark-6 dark:text-dark-6">
          {step === 1
            ? "Enter your personal information to get started"
            : "Set up your organization to complete registration"}
        </p>
      </div>

      {step === 1 ? (
        <form onSubmit={handleStep1Submit}>
          <InputGroup
            type="text"
            label="Full Name"
            className="mb-4 [&_input]:py-[15px]"
            placeholder="Enter your full name"
            name="full_name"
            handleChange={handleUserDataChange}
            value={userData.full_name}
            required
          />

          <InputGroup
            type="email"
            label="Email"
            className="mb-4 [&_input]:py-[15px]"
            placeholder="Enter your email"
            name="email"
            handleChange={handleUserDataChange}
            value={userData.email}
            icon={<EmailIcon />}
            required
          />

          <InputGroup
            type="password"
            label="Password"
            className="mb-4 [&_input]:py-[15px]"
            placeholder="Enter your password"
            name="password"
            handleChange={handleUserDataChange}
            value={userData.password}
            icon={<PasswordIcon />}
            required
          />

          <InputGroup
            type="password"
            label="Confirm Password"
            className="mb-5 [&_input]:py-[15px]"
            placeholder="Confirm your password"
            name="confirmPassword"
            handleChange={handleUserDataChange}
            value={userData.confirmPassword}
            icon={<PasswordIcon />}
            required
          />

          {error && (
            <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 dark:border-red-600/40 dark:bg-red-900/20 dark:text-red-200">
              {error}
            </p>
          )}

          <div className="mb-4.5">
            <button
              type="submit"
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary p-4 font-medium text-white transition hover:bg-opacity-90"
              disabled={loading}
            >
              Continue
              {loading && (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent dark:border-primary dark:border-t-transparent" />
              )}
            </button>
          </div>

          <p className="text-center text-body-sm text-dark-6 dark:text-dark-6">
            Already have an account?{" "}
            <Link
              href="/auth/sign-in"
              className="text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      ) : (
        <form onSubmit={handleStep2Submit}>
          <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-600/40 dark:bg-blue-900/20">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Complete Your Registration</strong>
              <br />
              Now let&apos;s set up your organization. This is required to complete your account creation.
            </p>
          </div>

          <Select
            label="Business Type"
            items={BUSINESS_TYPES}
            name="business_type"
            placeholder="Select business type"
            value={organizationData.business_type}
            onValueChange={(value) =>
              setOrganizationData({ ...organizationData, business_type: value })
            }
            required
            className="mb-4"
          />

          <InputGroup
            type="text"
            label="Company Name"
            className="mb-4 [&_input]:py-[15px]"
            placeholder="Enter company name"
            name="company_name"
            handleChange={handleOrganizationDataChange}
            value={organizationData.company_name}
            required
          />

          <InputGroup
            type="text"
            label="VAT Number (Optional)"
            className="mb-4 [&_input]:py-[15px]"
            placeholder="Enter VAT number"
            name="vat_number"
            handleChange={handleOrganizationDataChange}
            value={organizationData.vat_number}
          />

          <InputGroup
            type="text"
            label="Address Line (Optional)"
            className="mb-4 [&_input]:py-[15px]"
            placeholder="Enter address"
            name="address_line"
            handleChange={handleOrganizationDataChange}
            value={organizationData.address_line}
          />

          <div className="mb-4 grid grid-cols-2 gap-4">
            <InputGroup
              type="text"
              label="Postal Code (Optional)"
              className="[&_input]:py-[15px]"
              placeholder="Enter postal code"
              name="postal_code"
              handleChange={handleOrganizationDataChange}
              value={organizationData.postal_code}
            />

            <InputGroup
              type="text"
              label="City (Optional)"
              className="[&_input]:py-[15px]"
              placeholder="Enter city"
              name="city"
              handleChange={handleOrganizationDataChange}
              value={organizationData.city}
            />
          </div>

          <InputGroup
            type="text"
            label="Country"
            className="mb-4 [&_input]:py-[15px]"
            placeholder="Enter country"
            name="country"
            handleChange={handleOrganizationDataChange}
            value={organizationData.country}
          />

          <InputGroup
            type="email"
            label="Organization Email (Optional)"
            className="mb-4 [&_input]:py-[15px]"
            placeholder="Enter organization email"
            name="email"
            handleChange={handleOrganizationDataChange}
            value={organizationData.email}
            icon={<EmailIcon />}
          />

          <InputGroup
            type="text"
            label="Attention Person (Optional)"
            className="mb-5 [&_input]:py-[15px]"
            placeholder="Enter attention person"
            name="attention_person"
            handleChange={handleOrganizationDataChange}
            value={organizationData.attention_person}
          />

          {error && (
            <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 dark:border-red-600/40 dark:bg-red-900/20 dark:text-red-200">
              {error}
            </p>
          )}

          <div className="mb-4.5 flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-stroke bg-transparent p-4 font-medium text-dark transition hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2"
              disabled={loading}
            >
              Back
            </button>
            <button
              type="submit"
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary p-4 font-medium text-white transition hover:bg-opacity-90"
              disabled={loading}
            >
              Complete Registration
              {loading && (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent dark:border-primary dark:border-t-transparent" />
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

