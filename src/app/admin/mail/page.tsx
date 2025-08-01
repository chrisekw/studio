
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { collection, onSnapshot, query, where, getDocs, writeBatch, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { composeEmail } from '@/ai/flows/compose-email-flow';
import { Loader2, Wand2, Send, Users, UserMinus, UserCheck } from 'lucide-react';

type UserCategory = 'All Users' | 'Free Users' | 'Paid Subscribers';

// Define the form schema directly on the client side
const mailFormSchema = z.object({
  audience: z.enum(['All Users', 'Free Users', 'Paid Subscribers'], {
    required_error: 'You need to select an audience.',
  }),
  goal: z.string().min(10, { message: 'Please describe the goal in at least 10 characters.' }),
  subject: z.string().min(1, 'Subject is required.'),
  body: z.string().min(1, 'Email body is required.'),
});

type MailFormValues = z.infer<typeof mailFormSchema>;

// Define the input type for the AI flow here as well to ensure type safety.
// This should match the expected input of the `composeEmail` function.
type ComposeEmailInput = {
  audience: 'All Users' | 'Free Users' | 'Paid Subscribers';
  goal: string;
};


export default function AdminMailPage() {
  const [userCounts, setUserCounts] = useState({ 'All Users': 0, 'Free Users': 0, 'Paid Subscribers': 0 });
  const [isLoadingCounts, setIsLoadingCounts] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const form = useForm<MailFormValues>({
    resolver: zodResolver(mailFormSchema),
    defaultValues: {
      audience: 'All Users',
      goal: '',
      subject: '',
      body: '',
    },
  });

  useEffect(() => {
    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const users = snapshot.docs.map(doc => doc.data() as UserProfile);
      const freeUsers = users.filter(u => u.plan === 'Free').length;
      const paidUsers = users.length - freeUsers;
      setUserCounts({
        'All Users': users.length,
        'Free Users': freeUsers,
        'Paid Subscribers': paidUsers,
      });
      setIsLoadingCounts(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGenerateEmail = async () => {
    const { audience, goal } = form.getValues();
    if (!goal) {
      form.setError('goal', { type: 'manual', message: 'Please provide a goal for the email.' });
      return;
    }
    setIsGenerating(true);
    try {
      // The AI flow only needs the audience and goal
      const result = await composeEmail({ audience, goal });
      form.setValue('subject', result.subject, { shouldValidate: true });
      form.setValue('body', result.body, { shouldValidate: true });
      toast({
        variant: 'success',
        title: 'Email Content Generated!',
        description: 'The subject and body have been filled in for you.',
      });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Generation Failed', description: error.message });
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async (data: MailFormValues) => {
    setIsSending(true);
    try {
        const usersRef = collection(db, 'users');
        let usersQuery;

        if (data.audience === 'Free Users') {
            usersQuery = query(usersRef, where('plan', '==', 'Free'));
        } else if (data.audience === 'Paid Subscribers') {
            usersQuery = query(usersRef, where('plan', '!=', 'Free'));
        } else {
            usersQuery = query(usersRef);
        }

        const querySnapshot = await getDocs(usersQuery);
        const recipients = querySnapshot.docs.map(doc => doc.data().email).filter(Boolean);

        if (recipients.length === 0) {
            toast({ variant: 'destructive', title: 'No Recipients Found', description: 'There are no users in the selected audience.' });
            setIsSending(false);
            return;
        }

        const mailCollectionRef = collection(db, 'mail');
        const emailPromises = recipients.map(email => {
            return addDoc(mailCollectionRef, {
                to: email,
                message: {
                    subject: data.subject,
                    html: data.body.replace(/\n/g, '<br>'), // Basic markdown to HTML
                },
            });
        });

        await Promise.all(emailPromises);

        toast({
            variant: 'success',
            title: 'Emails Queued!',
            description: `${recipients.length} emails have been queued for sending. Note: The Firebase "Trigger Email" extension must be installed for delivery.`,
        });
        form.reset();

    } catch (error: any) {
        console.error('Error queuing emails:', error);
        toast({
            variant: 'destructive',
            title: 'Error Queuing Emails',
            description: error.message || 'An unexpected error occurred.',
        });
    } finally {
        setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Mailer</h1>
        <p className="text-muted-foreground">
          Compose and send emails to different segments of your user base.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">All Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoadingCounts ? <Loader2 className="h-6 w-6 animate-spin" /> : userCounts['All Users'].toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Free Users</CardTitle>
            <UserMinus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoadingCounts ? <Loader2 className="h-6 w-6 animate-spin" /> : userCounts['Free Users'].toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Subscribers</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoadingCounts ? <Loader2 className="h-6 w-6 animate-spin" /> : userCounts['Paid Subscribers'].toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compose Email</CardTitle>
          <CardDescription>
            Select your audience, define a goal, and let AI help you draft the perfect message.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid gap-6 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="audience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Audience</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an audience" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(Object.keys(userCounts) as UserCategory[]).map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat} ({userCounts[cat]})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="goal"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Goal / Topic of Email</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="e.g., Offer a 20% discount on Pro plan" {...field} />
                        </FormControl>
                        <Button type="button" variant="outline" onClick={handleGenerateEmail} disabled={isGenerating || isSending}>
                          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                          <span className="ml-2 hidden sm:inline">Generate</span>
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="Your email subject line" {...field} disabled={isSending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Body</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Your email content will appear here. Use Markdown for formatting."
                        className="min-h-[300px]"
                        {...field}
                        disabled={isSending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={isSending || isGenerating}>
                  {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Send Email to {userCounts[form.watch('audience')]} users
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
