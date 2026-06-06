"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { GuestOnly } from "@/components/auth/GuestOnly";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api/errors";
import { paths } from "@/lib/auth/paths";

export default function AdminLoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  async function handleLogin(email: string, password: string) {
    const user = await login({ email, password });
    if (user.role !== "ADMIN") {
      throw new ApiError(
        403,
        "Admin access only. Use seller login for store accounts.",
      );
    }
    router.replace(paths.admin.dashboard);
  }

  return (
    <GuestOnly role="ADMIN">
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
        <LoginForm
          title="Admin login"
          subtitle="Platform administration"
          onSubmit={handleLogin}
          footer={
            <Link href={paths.home} className="text-indigo-600 hover:underline">
              Back to homepage
            </Link>
          }
        />
      </div>
    </GuestOnly>
  );
}
