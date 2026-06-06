"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { paths } from "@/lib/auth/paths";
import { ApiError } from "@/lib/api/errors";

export default function CustomerRegisterPage() {
  const { register } = useCustomerAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await register({
        full_name: fullName,
        email: email || undefined,
        phone: phone || undefined,
        password,
      });
      router.replace(paths.customer.conversations);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-neutral-900">Create customer account</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Optional — guest checkout still works without an account
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Optional if phone provided"
          />
          <Input
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Optional if email provided"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={submitting}>
            Register
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-neutral-600">
          Already have an account?{" "}
          <Link href={paths.customer.login} className="font-medium text-indigo-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
