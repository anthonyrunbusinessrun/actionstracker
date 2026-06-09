import { Header } from "@/components/layout/header";
import { ProjectsContent } from "@/components/projects/projects-content";

export const metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <>
      <Header title="Projects" subtitle="Folios & work packages" />
      <div className="flex-1 p-6">
        <ProjectsContent />
      </div>
    </>
  );
}
