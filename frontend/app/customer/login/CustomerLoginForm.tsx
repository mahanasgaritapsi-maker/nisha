"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { paths } from "@/lib/auth/paths";
import { ApiError } from "@/lib/api/errors";

export default function CustomerLoginForm() {
  const { login, customer, isLoading } = useCustomerAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? paths.customer.conversations;
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && customer) {
      router.replace(redirect);
    }
  }, [isLoading, customer, redirect, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login({ login: loginId, password });
      router.replace(redirect);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-neutral-900">Customer login</h1>
        <p className="mt-1 text-sm text-neutral-600">Sign in to message sellers and keep chat history</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            label="Email or phone"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={submitting}>
            Sign in
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-neutral-600">
          No account?{" "}
          <Link href={paths.customer.register} className="font-medium text-indigo-600 hover:underline">
            Register
          </Link>
        </p>
        <p className="mt-2 text-center text-sm">
          <Link href={paths.home} className="text-neutral-500 hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
