import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    name: 'Starter',
    price: '$29',
    pricePeriod: '/month',
    description: 'Perfect for individuals and small teams starting out.',
    features: [
      '500 leads per month',
      'Basic search filters',
      'Email support',
      'CSV export',
    ],
    buttonText: 'Choose Starter',
    paymentLink: 'https://flutterwave.com/pay/prospectiq-starter',
  },
  {
    name: 'Pro',
    price: '$79',
    pricePeriod: '/month',
    description: 'Ideal for growing businesses that need more power.',
    features: [
      '5,000 leads per month',
      'Advanced search filters',
      'Priority email support',
      'LinkedIn & Address details',
      'API access (coming soon)',
    ],
    buttonText: 'Choose Pro',
    paymentLink: 'https://flutterwave.com/pay/prospectiq-pro',
    isFeatured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    pricePeriod: '',
    description: 'Tailored solutions for large-scale operations.',
    features: [
      'Unlimited leads',
      'Custom integrations',
      'Dedicated account manager',
      'On-premise deployment option',
      '24/7 priority support',
    ],
    buttonText: 'Contact Sales',
    paymentLink: 'mailto:sales@prospectiq.com',
  },
];

export default function PricingPage() {
  return (
    <div className="py-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-headline font-bold">Find the perfect plan</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Start generating leads today with a plan that fits your needs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                  <li key={feature} className="flex items-center">
                    <Check className="h-5 w-5 text-accent mr-3 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" variant={plan.isFeatured ? 'default' : 'outline'}>
                <Link href={plan.paymentLink} target={plan.name !== 'Enterprise' ? '_blank' : '_self'}>
                  {plan.buttonText}
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
