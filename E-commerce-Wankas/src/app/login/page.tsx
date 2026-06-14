import { LoginForm } from '@/components/auth/login-form';
import { Suspense } from 'react';

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center py-12">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[300px]">
          Cargando...
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
