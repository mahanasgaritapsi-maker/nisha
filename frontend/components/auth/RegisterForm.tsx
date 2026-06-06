"use client";

import { useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

type RegisterFormProps = {
  onSubmit: (data: {
    email: string;
    password: string;
    full_name: string;
  }) => Promise<void>;
  footer?: React.ReactNode;
};

export function RegisterForm({ onSubmit, footer }: RegisterFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit({ email, password, full_name: fullName });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>Create seller account</CardTitle>
        <p className="mt-1 text-sm text-neutral-600">
          Start selling with your own online store.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <Input
            label="Full name"
            name="full_name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            hint="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" className="w-full" loading={loading}>
            Create account
          </Button>
        </form>
        {footer && <div className="mt-6 text-center text-sm text-neutral-600">{footer}</div>}
      </CardContent>
    </Card>
  );
}
