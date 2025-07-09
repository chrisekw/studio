
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { generateLeads } from '@/ai/flows/generate-leads-flow';
import type { Lead } from '@/lib/types';
import { Loader2, UploadCloud, Info } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { calculateRemainingLeads } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface BulkUploadFormProps {
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  remainingLeads: number;
  remainingLeadsText: string;
  setShowUpgradeBanner: React.Dispatch<React.SetStateAction<boolean>>;
  onComplete?: () => void;
}

const formSchema = z.object({
  file: z.instanceof(FileList).refine((files) => files?.length === 1, 'A CSV file is required.'),
  numLeadsPerQuery: z.coerce
    .number()
    .min(1, 'Must be at least 1.')
    .max(50, 'Cannot exceed 50 leads per query in bulk mode.'),
});

export function BulkUploadForm({ setLeads, setIsLoading, remainingLeads, remainingLeadsText, setShowUpgradeBanner, onComplete }: BulkUploadFormProps) {
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

  const { remainingPlanLeads, leadPoints, addonCredits } = calculateRemainingLeads(userProfile);
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    const file = values.file[0];
    if (!file || !user || !userProfile) return;

    if (remainingLeads <= 0) {
      setShowUpgradeBanner(true);
      onComplete?.();
      return;
    }

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
          onComplete?.();
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
            onComplete?.();
            return;
        }

        let allNewLeads: Lead[] = [];
        let leadsGeneratedCount = 0;
        const isProOrAgency = userProfile.plan === 'Pro' || userProfile.plan === 'Agency';

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
              includeDescription: true,
              scoreLeads: isProOrAgency,
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
        if (leadsGeneratedCount > 0) {
            const userDocRef = doc(db, 'users', user.uid);
            let leadsToDeduct = leadsGeneratedCount;
            const updatePayload: any = {};
            const currentMonth = new Date().toISOString().slice(0, 7);

            // 1. Deduct from plan quota
            const planLeadsToUse = Math.min(leadsToDeduct, Math.max(0, remainingPlanLeads));
            if (planLeadsToUse > 0) {
              if (userProfile.lastLeadGenerationMonth === currentMonth) {
                updatePayload.leadsGeneratedThisMonth = increment(planLeadsToUse);
              } else {
                updatePayload.leadsGeneratedThisMonth = planLeadsToUse;
              }
              updatePayload.lastLeadGenerationMonth = currentMonth;
              leadsToDeduct -= planLeadsToUse;
            }
            
            // 2. Deduct from lead points
            if (leadsToDeduct > 0) {
              const pointsToUse = Math.min(leadsToDeduct, Math.max(0, leadPoints));
              if (pointsToUse > 0) {
                updatePayload.leadPoints = increment(-pointsToUse);
                leadsToDeduct -= pointsToUse;
              }
            }
            
            // 3. Deduct from add-on credits
            if (leadsToDeduct > 0) {
              const addonsToUse = Math.min(leadsToDeduct, Math.max(0, addonCredits));
              if (addonsToUse > 0) {
                updatePayload.addonCredits = increment(-addonsToUse);
                leadsToDeduct -= addonsToUse;
              }
            }

            if (Object.keys(updatePayload).length > 0) {
                await updateDoc(userDocRef, updatePayload);
            }
        }

        toast({
          title: 'Bulk Upload Complete',
          description: `Successfully generated ${leadsGeneratedCount} leads from ${queries.length} queries.`,
        });

        setIsProcessing(false);
        setIsLoading(false);
        setProgressMessage('');
        form.reset();
        onComplete?.();
      },
      error: (error) => {
        toast({
            variant: 'destructive',
            title: 'CSV Parsing Error',
            description: error.message,
        });
        setIsProcessing(false);
        setIsLoading(false);
        onComplete?.();
      }
    });
  }

  return (
    <div className="pt-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 md:items-end">
            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem className="md:col-span-1">
                  <FormLabel>CSV File</FormLabel>
                  <FormControl>
                    <Input type="file" accept=".csv" {...fileRef} disabled={isProcessing} className="file:text-primary file:font-semibold" />
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
          </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle className="font-semibold">How to Use</AlertTitle>
              <AlertDescription>
                  <ol className="list-decimal list-inside space-y-1 mt-2">
                      <li>Create a CSV file with a single column header: <code className="bg-muted px-1.5 py-0.5 rounded-md font-mono text-xs">query</code></li>
                      <li>Add your list of search prompts under that column.</li>
                      <li>Upload the file, set leads per prompt, and generate.</li>
                  </ol>
              </AlertDescription>
          </Alert>
          <Button type="submit" disabled={isProcessing} className="w-full shadow-lg shadow-primary/30">
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
    </div>
  );
}
