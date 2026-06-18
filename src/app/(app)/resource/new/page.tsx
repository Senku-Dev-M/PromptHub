import Navbar from "@/components/layout/Navbar";
import ResourceForm from "@/features/resources/components/ResourceForm";

export default function NewResourcePage() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-950">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-10 flex flex-col items-center">
        <ResourceForm />
      </main>
    </div>
  );
}
