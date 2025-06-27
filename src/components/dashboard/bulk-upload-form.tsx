'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { generateLeads } from '@/ai/flows/generate-leads-flow';
import type { Lead, UserProfile } from '@/lib/types';
import { Loader2, UploadCloud } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface BulkUploadFormProps {
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const formSchema = z.object({
  file: z.instanceof(FileList).refine((files) => files?.length === 1, 'A CSV file is required.'),
  numLeadsPerQuery: z.coerce
    .number()
    .min(1, 'Must be at least 1.')
    .max(50, 'Cannot exceed 50 leads per query in bulk mode.'),
});

const PLAN_LIMITS = {
  Free: 5,
  Starter: 200,
  Pro: 1000,
  Agency: 5000,
};

export function BulkUploadForm({ setLeads, setIsLoading }: BulkUploadFormProps) {
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numLeadsPerQuery: 10,
    },
  });

  const fileRef = form.register('file');

  const canBulkUpload = userProfile?.plan === 'Agency';
  if (!userProfile || !canBulkUpload) {
    return null;
  }

  const currentMonth = new Date().toISOString().slice(0, 7);
  const leadsUsedThisMonth = (userProfile.lastLeadGenerationMonth === currentMonth) ? userProfile.leadsGeneratedThisMonth ?? 0 : 0;
  const addonCredits = userProfile.addonCredits ?? 0;
  const planLimit = PLAN_LIMITS.Agency;
  
  const remainingMonthly = planLimit - leadsUsedThisMonth;
  const remainingLeads = remainingMonthly + addonCredits;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const file = values.file[0];
    if (!file || !user || !userProfile) return;

    setIsProcessing(true);
    setIsLoading(true);
    setLeads([]);
    setProgressMessage('Parsing CSV file...');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const queries = results.data
          .map((row: any) => row.query)
          .filter(Boolean);

        if (queries.length === 0) {
          toast({
            variant: 'destructive',
            title: 'CSV Error',
            description: "No queries found. Ensure your CSV has a 'query' column with data.",
          });
          setIsProcessing(false);
          setIsLoading(false);
          return;
        }

        const totalLeadsToGenerate = queries.length * values.numLeadsPerQuery;
        if (totalLeadsToGenerate > remainingLeads) {
            toast({
                variant: 'destructive',
                title: 'Quota Exceeded',
                description: `This bulk job requires ${totalLeadsToGenerate.toLocaleString()} leads, but you have ${remainingLeads.toLocaleString()} remaining.`,
            });
            setIsProcessing(false);
            setIsLoading(false);
            return;
        }

        let allNewLeads: Lead[] = [];
        let leadsGeneratedCount = 0;

        for (let i = 0; i < queries.length; i++) {
          const query = queries[i];
          setProgressMessage(`Processing query ${i + 1} of ${queries.length}: "${query}"`);
          try {
            const result = await generateLeads({
              query: query,
              numLeads: values.numLeadsPerQuery,
              extractContactInfo: true, 
              includeAddress: userProfile.defaultIncludeAddress,
              includeLinkedIn: userProfile.defaultIncludeLinkedIn,
            });

            const newLeads = result.map((lead, index) => ({
              ...lead,
              id: `${Date.now()}-${i}-${index}`,
            }));
            
            allNewLeads = [...allNewLeads, ...newLeads];
            leadsGeneratedCount += newLeads.length;
            setLeads(allNewLeads); // Update table incrementally

          } catch (error: any) {
            toast({
              variant: 'destructive',
              title: `Error processing query: "${query}"`,
              description: error.message || 'An unknown error occurred.',
            });
            // Continue to next query
          }
        }
        
        // Final quota update
        const userDocRef = doc(db, 'users', user.uid);
        
        let leadsToDeduct = leadsGeneratedCount;
        
        const fromMonthly = Math.min(leadsToDeduct, remainingMonthly);
        leadsToDeduct -= fromMonthly;
        
        const fromAddons = leadsToDeduct > 0 ? Math.min(leadsToDeduct, addonCredits) : 0;

        await updateDoc(userDocRef, {
            leadsGeneratedThisMonth: increment(fromMonthly),
            addonCredits: increment(-fromAddons),
            lastLeadGenerationMonth: currentMonth,
        });

        toast({
          title: 'Bulk Upload Complete',
          description: `Successfully generated ${leadsGeneratedCount} leads from ${queries.length} queries.`,
        });

        setIsProcessing(false);
        setIsLoading(false);
        setProgressMessage('');
      },
      error: (error) => {
        toast({
            variant: 'destructive',
            title: 'CSV Parsing Error',
            description: error.message,
        });
        setIsProcessing(false);
        setIsLoading(false);
      }
    });
  }

  return (
    <Card className="border-primary/20 bg-background/30 backdrop-blur-lg">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2 text-2xl">
          <UploadCloud className="text-primary"/>
          Bulk Prompt Upload
        </CardTitle>
        <CardDescription>
          For Agency plans. Upload a CSV with a &quot;query&quot; column to generate leads in bulk.
          You have {remainingMonthly.toLocaleString()} monthly + {addonCredits.toLocaleString()} add-on leads remaining.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-3 md:items-end">
            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem className="md:col-span-1">
                  <FormLabel>CSV File</FormLabel>
                  <FormControl>
                    <Input type="file" accept=".csv" {...fileRef} disabled={isProcessing} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="numLeadsPerQuery"
              render={({ field }) => (
                <FormItem className="md:col-span-1">
                  <FormLabel>Leads per Prompt</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} disabled={isProcessing} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isProcessing || remainingLeads <=0} className="md:col-span-1 shadow-lg shadow-primary/30">
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
              {isProcessing ? 'Processing...' : 'Upload and Generate'}
            </Button>
          </form>
        </Form>
        {isProcessing && progressMessage && (
            <div className="mt-4 text-sm text-muted-foreground flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                {progressMessage}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
