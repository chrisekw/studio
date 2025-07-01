
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTheme } from 'next-themes';
import { doc, updateDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Monitor, Moon, Sun } from 'lucide-react';
import Link from 'next/link';

const settingsFormSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  defaultIncludeAddress: z.boolean(),
  defaultIncludeLinkedIn: z.boolean(),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export default function SettingsPage() {
  const { user, userProfile } = useAuth();
  const { setTheme, theme } = useTheme();
  const { toast } = useToast();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      theme: 'system',
      defaultIncludeAddress: true,
      defaultIncludeLinkedIn: true,
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({
        theme: (theme as 'light' | 'dark' | 'system') || 'system',
        defaultIncludeAddress: userProfile.defaultIncludeAddress ?? true,
        defaultIncludeLinkedIn: userProfile.defaultIncludeLinkedIn ?? true,
      });
    }
  }, [userProfile, theme, form]);

  async function onSubmit(data: SettingsFormValues) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to save settings.' });
      return;
    }

    try {
      setTheme(data.theme);
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        defaultIncludeAddress: data.defaultIncludeAddress,
        defaultIncludeLinkedIn: data.defaultIncludeLinkedIn,
      });
      toast({ title: 'Settings saved', description: 'Your preferences have been updated.' });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save settings.' });
    }
  }

  const handleTestUpgrade = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        plan: 'Agency',
        leadsGeneratedThisMonth: 0,
        lastLeadGenerationMonth: new Date().toISOString().slice(0, 7),
      });
      toast({ title: 'Test Upgrade Successful', description: 'Your account has been upgraded to the Agency plan.' });
    } catch (error) {
      console.error('Error performing test upgrade:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not perform test upgrade.' });
    }
  };

  if (!userProfile) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application preferences.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the look and feel of the application.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="theme"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Theme</FormLabel>
                    <FormDescription>Select the theme for the dashboard.</FormDescription>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid max-w-md grid-cols-1 pt-2 sm:grid-cols-3 gap-8"
                    >
                      <FormItem>
                        <FormLabel className="[&:has([data-state=checked])>div]:border-primary cursor-pointer">
                          <FormControl>
                            <RadioGroupItem value="light" className="sr-only" />
                          </FormControl>
                          <div className="items-center rounded-md border-2 border-muted p-1 hover:border-accent">
                            <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
                              <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                                <div className="h-2 w-[80px] rounded-lg bg-[#ecedef]" />
                                <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                              </div>
                              <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                                <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                                <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                              </div>
                            </div>
                          </div>
                          <span className="block w-full p-2 text-center font-normal">Light</span>
                        </FormLabel>
                      </FormItem>
                      <FormItem>
                        <FormLabel className="[&:has([data-state=checked])>div]:border-primary cursor-pointer">
                          <FormControl>
                            <RadioGroupItem value="dark" className="sr-only" />
                          </FormControl>
                          <div className="items-center rounded-md border-2 border-muted bg-popover p-1 hover:border-accent">
                            <div className="space-y-2 rounded-sm bg-slate-950 p-2">
                              <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
                                <div className="h-2 w-[80px] rounded-lg bg-slate-400" />
                                <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                              </div>
                              <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                                <div className="h-4 w-4 rounded-full bg-slate-400" />
                                <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                              </div>
                            </div>
                          </div>
                          <span className="block w-full p-2 text-center font-normal">Dark</span>
                        </FormLabel>
                      </FormItem>
                       <FormItem>
                        <FormLabel className="[&:has([data-state=checked])>div]:border-primary cursor-pointer">
                          <FormControl>
                            <RadioGroupItem value="system" className="sr-only" />
                          </FormControl>
                           <div className="flex items-center justify-center rounded-md border-2 border-muted p-1 hover:border-accent min-h-[118px]">
                             <div className="space-x-2">
                                <Sun className="h-6 w-6 text-foreground inline-block" />
                                <Moon className="h-6 w-6 text-foreground inline-block" />
                             </div>
                          </div>
                          <span className="block w-full p-2 text-center font-normal">System</span>
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lead Generation</CardTitle>
              <CardDescription>Set your default preferences for generating new leads.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="defaultIncludeAddress"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Include Address</FormLabel>
                      <FormDescription>Always include a physical address in lead results by default.</FormDescription>
                    </div>
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="defaultIncludeLinkedIn"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Include LinkedIn</FormLabel>
                      <FormDescription>Always include a LinkedIn profile URL in lead results by default.</FormDescription>
                    </div>
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

           <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Manage your subscription and account details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                     <div className="space-y-0.5">
                      <FormLabel className="text-base">Email</FormLabel>
                      <FormDescription>{userProfile.email}</FormDescription>
                    </div>
                </div>
                 <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                     <div className="space-y-0.5">
                      <FormLabel className="text-base">Subscription Plan</FormLabel>
                      <FormDescription>You are currently on the <span className="font-bold text-primary">{userProfile.plan}</span> plan.</FormDescription>
                    </div>
                    <Button asChild variant="outline">
                        <Link href="/pricing">Manage Plan</Link>
                    </Button>
                </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={form.formState.isSubmitting}>
               {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>

      {userProfile.email === 'ekwchristian@gmail.com' && (
        <Card className="border-accent/50 mt-8">
          <CardHeader>
            <CardTitle className="text-accent">Developer Tools</CardTitle>
            <CardDescription>
              This section is for testing features and is only visible to you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={handleTestUpgrade}>
              Upgrade my account to Agency
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
