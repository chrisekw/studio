'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, X } from 'lucide-react';
import Link from 'next/link';

interface UpgradeBannerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeBanner({ isOpen, onClose }: UpgradeBannerProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6 animate-in slide-in-from-bottom-10 fade-in-50">
        <Card className="relative max-w-4xl mx-auto border-accent/30 bg-background/50 backdrop-blur-lg shadow-2xl shadow-primary/10">
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 h-7 w-7"
                onClick={onClose}
            >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
            </Button>
            <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl font-headline text-accent">
                    <Zap className="h-7 w-7"/>
                    You've Reached Your Limit!
                </CardTitle>
                <CardDescription className="text-base pt-1">
                    You're doing great work! You've used all your available leads for this period. To continue discovering new opportunities without interruption, upgrade your plan.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex-grow space-y-1">
                        <h4 className="font-semibold">Unlock Your Full Potential</h4>
                        <p className="text-sm text-muted-foreground">
                            Gain access to more leads, advanced filters, bulk uploads, and priority support.
                        </p>
                    </div>
                    <Button asChild size="lg" className="w-full sm:w-auto shadow-lg shadow-primary/30">
                        <Link href="/pricing">
                            Upgrade Your Plan
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
