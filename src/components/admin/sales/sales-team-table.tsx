
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { UserProfile } from "@/lib/types";

interface UserWithId extends UserProfile {
    id: string;
}

interface SalesMember extends UserWithId {
    referredUsers: UserWithId[];
}

interface SalesTeamTableProps {
  members: SalesMember[];
}

export function SalesTeamTable({ members }: SalesTeamTableProps) {

  if (members.length === 0) {
    return (
      <div className="text-center h-48 flex items-center justify-center text-muted-foreground border rounded-lg">
        No sales team members found. A user becomes a sales member once they refer someone.
      </div>
    );
  }

  const calculateEarnings = (member: SalesMember): number => {
    // Placeholder for earning calculation logic
    // Example: $10 for each referred user on a paid plan
    const paidReferrals = member.referredUsers.filter(u => u.plan !== 'Free').length;
    return paidReferrals * 10;
  }

  const getHostname = (url: string | undefined | null) => {
    if (!url) return '';
    try {
      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }
      return new URL(url).hostname;
    } catch (e) {
      return '';
    }
  };

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
                  <h4 className="font-semibold mb-2 text-sm">Referred Users:</h4>
                  <div className="rounded-md border bg-background">
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Status</TableHead>
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
                                </TableRow>
                            ))}
                        </TableBody>
                     </Table>
                  </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
