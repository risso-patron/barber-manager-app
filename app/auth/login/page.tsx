import { LoginForm } from "@/components/auth/login-form"
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUser } from '@/lib/useUser'; // tu hook personalizado

export default function DashboardRedirect() {
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;

    switch (user.role) {
      case 'admin':
        router.push('/admin');
        break;
      case 'employee':
        router.push('/employee');
        break;
      case 'client':
        router.push('/client');
        break;
      default:
        router.push('/');
    }
  }, [user, router]);

  return <p>Redirigiendo según tu rol...</p>;
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <LoginForm />
    </div>
  )
}
