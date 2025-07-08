import { LoginForm } from '@/components/auth/login-form';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <>
      <div className="grid gap-2 text-center">
        <h1 className="text-3xl font-bold font-headline">Login</h1>
        <p className="text-balance text-muted-foreground">
          Enter your credentials to access your dashboard
        </p>
      </div>
      <LoginForm />
      <div className="mt-4 text-center text-sm">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="underline text-primary">
          Sign up
        </Link>
      </div>
    </>
  );
}
