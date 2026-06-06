"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { GuestOnly } from "@/components/auth/GuestOnly";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { useAuth } from "@/contexts/AuthContext";
import { paths } from "@/lib/auth/paths";

export default function SellerRegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  async function handleRegister(data: {
    email: string;
    password: string;
    full_name: string;
  }) {
    await register(data);
    router.replace(paths.seller.dashboard);
  }

  return (
    <GuestOnly role="SELLER">
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
        <RegisterForm
          onSubmit={handleRegister}
          footer={
            <>
              Already have an account?{" "}
              <Link href={paths.seller.login} className="font-medium text-indigo-600 hover:underline">
                Sign in
              </Link>
            </>
          }
        />
      </div>
    </GuestOnly>
  );
}
