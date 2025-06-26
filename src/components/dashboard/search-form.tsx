'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState, type Dispatch, type SetStateAction, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Loader2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateLeads } from '@/ai/flows/generate-leads-flow';
import type { Lead } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/context/auth-context';

interface SearchFormProps {
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setLeads: Dispatch<SetStateAction<Lead[]>>;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  setShowSuggestions: Dispatch<SetStateAction<boolean>>;
  selectedSuggestion: string;
}

export function SearchForm({ setIsLoading, setLeads, setSearchQuery, setShowSuggestions, selectedSuggestion }: SearchFormProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const { user, userProfile } = useAuth();

  const formSchema = useMemo(() => {
    const planLimits = { Free: 5, Starter: 20, Pro: 50, Agency: 100 };
    const planName = userProfile?.plan || 'Free';
    const maxLeads = planLimits[planName as keyof typeof planLimits];
    
    return z.object({
      keyword: z.string().min(3, { message: 'Keyword must be at least 3 characters.' }),
      industry: z.string().optional(),
      numLeads: z.coerce
        .number({ invalid_type_error: 'Please enter a valid number.' })
        .min(1, { message: 'Please generate at least 1 lead.' })
        .max(maxLeads, { message: `Your ${planName} plan allows up to ${maxLeads} leads per search.` }),
      radius: z.enum(['local', 'broad']),
      includeAddress: z.boolean().default(false).optional(),
      includeLinkedIn: z.boolean().default(false).optional(),
    });
  }, [userProfile]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      keyword: 'Marketing agencies in London',
      radius: 'broad',
      numLeads: 5,
      includeAddress: true,
      includeLinkedIn: true,
    },
  });

  useEffect(() => {
    if (selectedSuggestion) {
      form.setValue('keyword', selectedSuggestion);
    }
  }, [selectedSuggestion, form]);
  
  useEffect(() => {
    // Reset numLeads if it exceeds the new limit when the plan changes
    const planLimits = { Free: 5, Starter: 20, Pro: 50, Agency: 100 };
    const planName = userProfile?.plan || 'Free';
    const maxLeads = planLimits[planName as keyof typeof planLimits];
    if (form.getValues('numLeads') > maxLeads) {
      form.setValue('numLeads', maxLeads);
    }
  }, [userProfile, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to generate leads.',
      });
      return;
    }
    
    setIsGenerating(true);
    setIsLoading(true);
    setLeads([]);
    setShowSuggestions(false);
    setSearchQuery(values.keyword);
    
    try {
      const fullQuery = values.industry ? `${values.keyword} in the ${values.industry} industry` : values.keyword;
      const result = await generateLeads({
        query: fullQuery,
        numLeads: values.numLeads,
        includeAddress: values.includeAddress,
        includeLinkedIn: values.includeLinkedIn,
        userId: user.uid,
      });

      const newLeads = result.map((lead, index) => ({
        ...lead,
        id: `${Date.now()}-${index}`,
      }));

      setLeads(newLeads);
      
      toast({
        title: 'Search Complete',
        description: `We've found ${newLeads.length} potential leads for "${values.keyword}".`,
      });
    } catch (error: any) {
       console.error('Failed to generate leads:', error);
       toast({
        variant: 'destructive',
        title: 'An Error Occurred',
        description: error.message || 'Failed to generate leads. Please try again.',
      });
    } finally {
      setIsGenerating(false);
      setIsLoading(false);
      setShowSuggestions(true);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Generate New Leads</CardTitle>
        <CardDescription>
          Enter a keyword and select options to start scraping for potential business leads.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
            <div className="grid md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="keyword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Keyword or Company Type</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 'SaaS companies in New York'" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry / Category (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an industry" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="real-estate">Real Estate</SelectItem>
                        <SelectItem value="ecommerce">E-commerce</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="numLeads"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Leads</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="5" {...field} onChange={event => field.onChange(+event.target.value)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="radius"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Search Radius</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="broad" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Broad Geography (Recommended)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="local" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Local Focus
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />
            <div>
              <FormLabel>Additional Information</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <FormField
                  control={form.control}
                  name="includeAddress"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="includeAddress"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <label htmlFor="includeAddress" className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Include Address
                        </label>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="includeLinkedIn"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="includeLinkedIn"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <label htmlFor="includeLinkedIn" className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Include LinkedIn
                        </label>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isGenerating}>
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Generate Leads
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
