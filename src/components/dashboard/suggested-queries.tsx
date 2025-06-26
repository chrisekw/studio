'use client';

import { useEffect, useState } from 'react';
import { Wand2, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { suggestAlternateQueries } from '@/ai/flows/suggest-alternate-queries';
import { Skeleton } from '../ui/skeleton';

interface SuggestedQueriesProps {
  query: string;
}

export function SuggestedQueries({ query }: SuggestedQueriesProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) return;

    const fetchSuggestions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await suggestAlternateQueries({ query });
        setSuggestions(result);
      } catch (err) {
        setError('Could not fetch suggestions.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [query]);

  return (
    <div className="mt-6 rounded-lg border border-dashed border-accent/50 bg-accent/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Wand2 className="h-5 w-5 text-accent" />
        <h3 className="font-headline text-lg text-accent">AI Suggestions</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Try these semantically similar queries to broaden your search:
      </p>
      <div className="flex flex-wrap gap-2">
        {isLoading ? (
          <>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-7 w-52" />
          </>
        ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
        ) : (
          suggestions.map((suggestion, index) => (
            <Badge
              key={index}
              variant="outline"
              className="cursor-pointer border-accent/80 bg-background text-accent-foreground/80 hover:bg-accent/10 py-1 px-3 text-sm"
            >
              <Zap className="mr-2 h-3 w-3" />
              {suggestion}
            </Badge>
          ))
        )}
      </div>
    </div>
  );
}
