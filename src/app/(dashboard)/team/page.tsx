import { Header } from "@/components/layout/header";
import { TeamContent } from "@/components/team/team-content";

export const metadata = { title: "Team" };

export default function TeamPage() {
  return (
    <>
      <Header title="Team" subtitle="Workload & assignments" />
      <div className="flex-1 p-6">
        <TeamContent />
      </div>
    </>
  );
}
