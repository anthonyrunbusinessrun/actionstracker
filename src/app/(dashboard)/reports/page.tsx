import { Header } from "@/components/layout/header";
import { ReportsContent } from "@/components/reports/reports-content";

export const metadata = { title: "Reports" };

export default function ReportsPage() {
  return (
    <>
      <Header title="Reports" subtitle="Analytics & exports" />
      <div className="flex-1 p-6">
        <ReportsContent />
      </div>
    </>
  );
}
