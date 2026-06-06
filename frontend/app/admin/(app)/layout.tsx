import { AdminAuthGuard } from "@/components/auth/AdminAuthGuard";
import { AdminSidebar } from "@/components/layout/AdminSidebar";

export default function AdminAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthGuard>
      <div className="flex min-h-screen flex-col lg:flex-row">
        <AdminSidebar />
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </AdminAuthGuard>
  );
}
