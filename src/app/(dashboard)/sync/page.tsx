import { Header } from "@/components/layout/header";
import { SyncContent } from "@/components/sync/sync-content";

export const metadata = { title: "Sync" };

export default function SyncPage() {
  return (
    <>
      <Header title="Sync" subtitle="Airtable ↔ Database" />
      <div className="flex-1 p-6">
        <SyncContent />
      </div>
    </>
  );
}
