
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { UserPlan, UserProfile } from "@/lib/types";

interface UserWithId extends UserProfile {
    id: string;
}

interface SalesMember extends UserWithId {
    referredUsers: UserWithId[];
}

interface SalesTeamTableProps {
  members: SalesMember[];
  allUsers: UserWithId[];
}

const PLAN_PRICES: Record<UserPlan, number> = {
  'Free': 0,
  'Starter': 19,
  'Pro': 59,
  'Agency': 199,
};

const COMMISSION_RATES: Record<UserPlan, number> = {
  'Free': 0,
  'Starter': 0.15, // 15%
  'Pro': 0.20, // 20%
  'Agency': 0.30, // 30%
};


export function SalesTeamTable({ members, allUsers }: SalesTeamTableProps) {

  if (members.length === 0) {
    return (
      <div className="text-center h-48 flex items-center justify-center text-muted-foreground border rounded-lg">
        No sales team members found. Add a member to get started.
      </div>
    );
  }

  const calculateEarnings = (member: SalesMember): number => {
    return member.referredUsers.reduce((total, user) => {
        const planPrice = PLAN_PRICES[user.plan] || 0;
        const commissionRate = COMMISSION_RATES[user.plan] || 0;
        return total + (planPrice * commissionRate);
    }, 0);
  }

  const getCommissionForUser = (user: UserWithId): number => {
      const planPrice = PLAN_PRICES[user.plan] || 0;
      const commissionRate = COMMISSION_RATES[user.plan] || 0;
      return planPrice * commissionRate;
  }

  return (
    <div className="rounded-lg border">
      <Accordion type="single" collapsible className="w-full">
        {members.map((member) => (
          <AccordionItem value={member.id} key={member.id}>
            <AccordionTrigger className="px-4 hover:no-underline">
               <div className="flex-1 grid grid-cols-2 md:grid-cols-4 items-center text-left">
                  <span className="font-medium truncate col-span-2 md:col-span-1">{member.email}</span>
                  <div className="hidden md:flex items-center">
                    <Badge variant="secondary">{member.referredUsers.length} referrals</Badge>
                  </div>
                   <div className="hidden md:flex items-center">
                    <span className="font-semibold text-green-600">${calculateEarnings(member).toFixed(2)}</span>
                  </div>
                  <div className="text-right md:hidden">
                    <span className="text-xs text-muted-foreground">{member.referredUsers.length} referrals</span>
                  </div>
               </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="bg-muted/50 p-4">
                  <h4 className="font-semibold mb-2 text-sm">Referred Users & Commissions:</h4>
                  {member.referredUsers.length > 0 ? (
                    <div className="rounded-md border bg-background">
                        <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead>User</TableHead>
                                  <TableHead>Plan</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead className="text-right">Commission</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {member.referredUsers.map(referredUser => (
                                  <TableRow key={referredUser.id}>
                                      <TableCell className="font-medium">{referredUser.email}</TableCell>
                                      <TableCell><Badge variant="default">{referredUser.plan}</Badge></TableCell>
                                      <TableCell>
                                          <Badge variant={referredUser.plan !== 'Free' ? 'accent' : 'outline'}>
                                              {referredUser.plan !== 'Free' ? 'Subscribed' : 'Trial'}
                                          </Badge>
                                      </TableCell>
                                      <TableCell className="text-right font-medium">
                                        ${getCommissionForUser(referredUser).toFixed(2)}
                                      </TableCell>
                                  </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                    </div>
                  ) : (
                    <div className="text-center text-sm text-muted-foreground p-4 bg-background rounded-md">
                      This member hasn't referred any users yet.
                    </div>
                  )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
