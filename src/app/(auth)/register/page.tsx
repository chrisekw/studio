import { RegisterForm } from '@/components/auth/register-form';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <>
       <div className="grid gap-2 text-center">
          <h1 className="text-3xl font-bold font-headline">Create an Account</h1>
          <p className="text-balance text-muted-foreground">
            Enter your information to create an account
          </p>
        </div>
      <RegisterForm />
      <div className="mt-4 text-center text-sm">
        Already have an account?{' '}
        <Link href="/login" className="underline text-primary">
          Log in
        </Link>
      </div>
    </>
  );
}
