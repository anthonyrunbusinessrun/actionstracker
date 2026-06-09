import { Header } from "@/components/layout/header";
import { ActionsView } from "@/components/actions/actions-view";

export const metadata = { title: "Actions" };

export default function ActionsPage() {
  return (
    <>
      <Header title="Actions" subtitle="BOSS → Actions" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <ActionsView />
      </div>
    </>
  );
}
