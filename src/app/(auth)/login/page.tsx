import LoginForm from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-screen px-4 bg-zinc-950 relative overflow-hidden">
      {/* Efecto de luces de fondo */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[350px] h-[350px] bg-blue-600/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <LoginForm />
    </div>
  );
}
