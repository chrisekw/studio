
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState, type Dispatch, type SetStateAction, useEffect } from 'react';
import { Loader2, Send } from 'lucide-react';
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';

import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { generateLeads } from '@/ai/flows/generate-leads-flow';
import type { Lead, UserProfile } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { calculateRemainingLeads } from '@/lib/utils';
import { db } from '@/lib/firebase';

interface SearchFormProps {
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setLeads: Dispatch<SetStateAction<Lead[]>>;
  setShowUpgradeBanner: Dispatch<SetStateAction<boolean>>;
  setProgress: Dispatch<SetStateAction<number>>;
  setProgressMessage: Dispatch<SetStateAction<string>>;
}

const formSchema = z.object({
  query: z.string().min(5, { message: 'Please enter a more detailed query.' }),
});

export function SearchForm({
  setIsLoading,
  setLeads,
  setShowUpgradeBanner,
  setProgress,
  setProgressMessage,
}: SearchFormProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const { remainingLeads } = calculateRemainingLeads(userProfile);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      query: '',
    },
  });

  const updateQuotaAndLogEvent = async (leadsGeneratedCount: number, query: string) => {
    if (!user || !userProfile || leadsGeneratedCount <= 0) return;

    // Log the generation event
    const eventsCollectionRef = collection(db, "events");
    await addDoc(eventsCollectionRef, {
      userId: user.uid,
      query: query,
      leadsGenerated: leadsGeneratedCount,
      timestamp: serverTimestamp(),
      userPlan: userProfile.plan,
    });
    
    // Update user's personal quota
    const { remainingPlanLeads, leadPoints, addonCredits } = calculateRemainingLeads(userProfile);
    let leadsToDeduct = leadsGeneratedCount;
    const updatePayload: any = {};
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().toISOString().slice(0, 7);
    const isFreePlan = userProfile.plan === 'Free';

    const planLeadsToUse = Math.min(leadsToDeduct, Math.max(0, remainingPlanLeads));
    if (planLeadsToUse > 0) {
      if (userProfile.lastLeadGenerationMonth !== currentMonth) {
        updatePayload.leadsGeneratedThisMonth = 0;
        updatePayload.monthlyLeadsGenerated = 0;
      }
      if (isFreePlan) {
        updatePayload.lastLeadGenerationDate = today;
        updatePayload.lastLeadGenerationMonth = currentMonth;
        updatePayload.leadsGeneratedToday = increment(planLeadsToUse);
        updatePayload.monthlyLeadsGenerated = increment(planLeadsToUse);
      } else {
        updatePayload.lastLeadGenerationMonth = currentMonth;
        updatePayload.leadsGeneratedThisMonth = increment(planLeadsToUse);
      }
      leadsToDeduct -= planLeadsToUse;
    }

    if (leadsToDeduct > 0) {
      const pointsToUse = Math.min(leadsToDeduct, Math.max(0, leadPoints));
      if (pointsToUse > 0) {
        updatePayload.leadPoints = increment(-pointsToUse);
        leadsToDeduct -= pointsToUse;
      }
    }

    if (leadsToDeduct > 0) {
      const addonsToUse = Math.min(leadsToDeduct, Math.max(0, addonCredits));
      if (addonsToUse > 0) {
        updatePayload.addonCredits = increment(-addonsToUse);
        leadsToDeduct -= addonsToUse;
      }
    }

    if (Object.keys(updatePayload).length > 0) {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, updatePayload);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !userProfile) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to generate leads.',
      });
      return;
    }
    
    const parts = values.query.split(',');
    const numLeadsStr = parts.length > 1 ? parts[1].trim() : '10';
    const numLeads = parseInt(numLeadsStr, 10);
    
    if (isNaN(numLeads) || numLeads <= 0) {
        toast({ variant: 'destructive', title: 'Invalid Query', description: 'Please specify a valid number of leads in your query. E.g., "SaaS companies, 25, USA"' });
        return;
    }

    if (remainingLeads < numLeads) {
      setShowUpgradeBanner(true);
      toast({ variant: 'destructive', title: 'Quota Exceeded', description: `You need ${numLeads} leads, but only have ${remainingLeads} left.` });
      return;
    }

    setIsGenerating(true);
    setIsLoading(true);
    setLeads([]);
    form.reset();

    try {
      setProgress(10);
      setProgressMessage('Initializing...');
      await new Promise(resolve => setTimeout(resolve, 500));

      setProgress(30);
      setProgressMessage('Analyzing your request...');
      
      const result = await generateLeads({
        query: values.query,
      });

      setProgress(70);
      setProgressMessage('Searching the web for matching leads...');

      const newLeads = result.map((lead, index) => ({
        ...lead,
        id: `${Date.now()}-${index}`,
      }));

      await updateQuotaAndLogEvent(newLeads.length, values.query);

      setLeads(newLeads);

      setProgress(100);
      setProgressMessage(`Success! Found ${newLeads.length.toLocaleString()} leads.`);

      toast({
        variant: 'success',
        title: 'Search Complete',
        description: `We've found and processed ${newLeads.length.toLocaleString()} potential leads.`,
      });
    } catch (error: any) {
      setProgress(100);
      setProgressMessage('An error occurred.');
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsGenerating(false);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
        setProgressMessage('');
      }, 2000);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="relative">
        <FormField
          control={form.control}
          name="query"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder="e.g., SaaS companies in California, 25, USA"
                  {...field}
                  className="pr-20 min-h-[52px] shadow-lg"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      form.handleSubmit(onSubmit)();
                    }
                  }}
                />
              </FormControl>
              <FormMessage className="pl-2"/>
            </FormItem>
          )}
        />
        <Button
          type="submit"
          size="icon"
          disabled={isGenerating}
          className="absolute right-3 top-[calc(50%-1.25rem)] -translate-y-px h-8 w-8"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          <span className="sr-only">Generate Leads</span>
        </Button>
      </form>
    </Form>
  );
}
