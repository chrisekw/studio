'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendEmailVerification } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  referralCode: z.string().optional(),
});

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      referralCode: '',
    },
  });

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      form.setValue('referralCode', refCode);
    }
  }, [searchParams, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    if (values.referralCode) {
      sessionStorage.setItem('referralCode', values.referralCode);
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      await sendEmailVerification(userCredential.user);
      
      toast({
        title: 'Account Created',
        description: "Please check your email to verify your account.",
      });
      router.push('/verify-email');
    } catch (error: any) {
      sessionStorage.removeItem('referralCode'); // Clean up on failure
      console.error('Registration error:', error);
      let description = error.message || 'An unexpected error occurred. Please try again.';

      switch (error.code) {
        case 'auth/email-already-in-use':
          description = 'This email is already associated with an account. Please log in or use a different email.';
          break;
        case 'auth/operation-not-allowed':
          description = 'Email/password sign-up is not enabled. Please check your Firebase console settings.';
          break;
        case 'auth/weak-password':
          description = 'The password is too weak. Please use a stronger password (at least 6 characters).';
          break;
      }
      
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: description,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    const referralCode = form.getValues('referralCode');
    if (referralCode) {
      sessionStorage.setItem('referralCode', referralCode);
    }
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast({
        title: 'Account Created',
        description: "Welcome to Leadgen! We're redirecting you to the dashboard.",
      });
      router.push('/dashboard');
    } catch (error: any) {
      sessionStorage.removeItem('referralCode'); // Clean up on failure
      console.error('Google Sign-Up error:', error);
      toast({
        variant: 'destructive',
        title: 'Google Sign-Up Failed',
        description: error.message || 'Could not sign up with Google. Please try again.',
      });
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="name@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="referralCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Referral Code (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Enter referral code" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
        </form>
      </Form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <Button
        variant="outline"
        className="w-full"
        onClick={handleGoogleSignIn}
        disabled={isLoading || isGoogleLoading}
      >
        {isGoogleLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.34 2.06-4.4 2.06-5.52 0-10-4.48-10-10s4.48-10 10-10c3.04 0 5.25 1.22 6.84 2.7l-2.43 2.43c-.85-.81-2-1.73-4.4-1.73-4.22 0-7.65 3.43-7.65 7.65s3.43 7.65 7.65 7.65c2.6 0 4.22-1.14 5.3-2.22.9-.9 1.4-2.34 1.6-4.02H12.48z"/></svg>
        )}
        Google
      </Button>
    </div>
  );
}
