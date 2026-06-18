import Navbar from "@/components/layout/Navbar";
import ProfileSettingsForm from "@/features/profile/components/ProfileSettingsForm";

export default function ProfileSettingsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-950">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12 flex flex-col items-center">
        <ProfileSettingsForm />
      </main>
    </div>
  );
}
