import { SellerAuthGuard } from "@/components/auth/SellerAuthGuard";
import { SellerSidebar } from "@/components/layout/SellerSidebar";

export default function SellerAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SellerAuthGuard>
      <div className="flex min-h-screen flex-col lg:flex-row">
        <SellerSidebar />
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </SellerAuthGuard>
  );
}
