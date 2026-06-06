export default function InvoiceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-100 print:bg-white">
      <div className="print:hidden border-b border-neutral-200 bg-white px-4 py-3 text-center text-sm text-neutral-500">
        Nisha — Invoice
      </div>
      {children}
    </div>
  );
}
