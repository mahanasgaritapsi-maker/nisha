"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { GuestOnly } from "@/components/auth/GuestOnly";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api/errors";
import { paths } from "@/lib/auth/paths";

export default function SellerLoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  async function handleLogin(email: string, password: string) {
    const user = await login({ email, password });
    if (user.role !== "SELLER") {
      throw new ApiError(
        403,
        "This login is for sellers only. Use the admin login for platform administrators.",
      );
    }
    router.replace(paths.seller.dashboard);
  }

  return (
    <GuestOnly role="SELLER">
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
        <LoginForm
          title="Seller login"
          subtitle="Sign in to manage your store"
          onSubmit={handleLogin}
          footer={
            <>
              Don&apos;t have an account?{" "}
              <Link href={paths.seller.register} className="font-medium text-indigo-600 hover:underline">
                Register
              </Link>
            </>
          }
        />
      </div>
    </GuestOnly>
  );
}
