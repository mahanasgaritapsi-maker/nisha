import { PublicHeader } from "@/components/layout/PublicHeader";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        {children}
      </main>
      <footer className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-neutral-500 sm:px-6">
          Nisha platform
        </div>
      </footer>
    </div>
  );
}
