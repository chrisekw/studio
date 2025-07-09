import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Bell } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pricing Plans',
  description: 'Choose the perfect oPilot plan for your business. From our free starter plan to powerful agency tools, find the right fit to start generating high-quality leads.',
}

const plans = [
  {
    name: 'Free',
    price: '$0',
    pricePeriod: '/month',
    description: 'Perfect for beginners and testers to get a feel for the platform.',
    features: [
      '5 leads per day',
      'Basic search functionality',
      'Limited search filters',
      'No export options',
    ],
    buttonText: 'Get Started',
    paymentLink: '#',
    isFeatured: false,
  },
  {
    name: 'Starter',
    price: '$19',
    pricePeriod: '/month',
    description: 'Ideal for freelancers and solo marketers ready to scale.',
    features: [
      'Everything in Free',
      '200 leads per month',
      'CSV export',
      'Save lead history',
      'AI-powered email & phone extraction',
    ],
    buttonText: 'Choose Starter',
    paymentLink: 'https://flutterwave.com/pay/ynsnxtinxodm',
    isFeatured: true,
  },
  {
    name: 'Pro',
    price: '$99',
    pricePeriod: '/month',
    description: 'The ultimate toolkit for agencies and growth-focused teams.',
    features: [
      'Everything in Starter',
      '1,000 leads per month',
      'AI-based lead scoring',
      'Social media profiles & websites',
      'Priority scraping queue',
    ],
    buttonText: 'Choose Pro',
    paymentLink: 'https://flutterwave.com/pay/2oaxhcai6ava',
    isFeatured: false,
  },
  {
    name: 'Agency',
    price: '$199',
    pricePeriod: '/month',
    description: 'Built for teams and resellers who need maximum power.',
    features: [
      'Everything in Pro',
      '5000 leads per month',
      'White-label reports',
      'Bulk prompt upload (CSV)',
      'Webhook & Zapier support',
    ],
    buttonText: 'Choose Agency',
    paymentLink: 'https://flutterwave.com/pay/fz56pnsdsp84',
    isFeatured: false,
  },
];

const addons = [
    { leads: 100, price: '$10', paymentLink: 'https://flutterwave.com/pay/zv88crtaygau' },
    { leads: 500, price: '$50', paymentLink: 'https://flutterwave.com/pay/aimxygwrocsa' },
    { leads: 2000, price: '$100', paymentLink: 'https://flutterwave.com/pay/cszswcfjeqjf' },
]

export default function PricingPage() {
  return (
    <div className="py-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-headline font-bold tracking-tight">Unlock Better Leads with Pro Tools</h1>
        <p className="text-muted-foreground mt-2 text-lg max-w-2xl mx-auto">
          Choose the plan that fits your business and start generating verified, high-converting leads with AI.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-12">
        {plans.map((plan) => (
          <Card key={plan.name} className={`flex flex-col ${plan.isFeatured ? 'border-primary shadow-primary/20 shadow-lg' : ''}`}>
            <CardHeader>
              <CardTitle className="font-headline text-2xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-6">
              <div className="flex items-baseline">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.pricePeriod && (
                  <span className="text-muted-foreground ml-1">{plan.pricePeriod}</span>
                )}
              </div>
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <Check className="h-5 w-5 text-accent mr-3 flex-shrink-0 mt-1" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" variant={plan.isFeatured ? 'default' : 'outline'}>
                <Link href={plan.paymentLink} target="_blank">
                  {plan.buttonText}
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle className="font-headline">Add-on Credits</CardTitle>
                <CardDescription>Need more leads this month? Buy extra credits anytime. Credits never expire and roll over.</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-4">
                    {addons.map(addon => (
                         <li key={addon.leads} className="flex items-center justify-between p-3 rounded-md border">
                            <div>
                                <p className="font-medium">{addon.leads.toLocaleString()} leads</p>
                            </div>
                            <Button asChild size="sm">
                                <Link href={addon.paymentLink} target="_blank">Buy for {addon.price}</Link>
                            </Button>
                         </li>
                    ))}
                </ul>
            </CardContent>
        </Card>

        <div className="space-y-6">
            <div className="rounded-lg border bg-card text-card-foreground p-6 space-y-3 text-sm text-muted-foreground">
                 <p>All payments are securely processed via Flutterwave .</p>
                 <p>Cancel anytime, no hidden fees.</p>
                 <p>7-day money-back guarantee on all paid plans.</p>
            </div>
             <div className="rounded-lg border border-accent/50 bg-accent/10 p-6">
                <div className="flex items-start gap-4">
                    <div className="bg-accent/20 text-accent p-2 rounded-full">
                        <Bell className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="font-headline font-semibold text-accent-foreground">Special Offer</h4>
                        <p className="text-sm text-accent-foreground/80 mt-1">Upgrade within 24 hours of signup and get <strong>20% off</strong> your first month!</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
