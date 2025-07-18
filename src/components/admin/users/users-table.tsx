'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { UserProfile } from "@/lib/types";
import { MoreHorizontal, Edit, Trash2, ArrowUpDown } from "lucide-react";
import { useState } from "react";
import { format, parseISO } from 'date-fns';

interface UserWithId extends UserProfile {
    id: string;
}

interface UsersTableProps {
  users: UserWithId[];
}

const PLAN_BADGE_VARIANTS: { [key: string]: BadgeProps['variant'] } = {
    Free: 'secondary',
    Starter: 'default',
    Pro: 'accent',
    Agency: 'destructive',
};

type SortKey = 'email' | 'plan' | 'signupDate' | 'leadsGeneratedThisMonth';

export function UsersTable({ users }: UsersTableProps) {
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>(null);

    const sortedUsers = [...users].sort((a, b) => {
        if (sortConfig === null) {
            return 0;
        }
        
        const { key, direction } = sortConfig;
        let aValue: any;
        let bValue: any;

        switch (key) {
            case 'signupDate':
                // Assuming signupDate is a string in user's id (from timestamp) or a dedicated field.
                // This example uses the id as a proxy for signup time.
                aValue = a.id;
                bValue = b.id;
                break;
            case 'leadsGeneratedThisMonth':
                aValue = a.leadsGeneratedThisMonth ?? 0;
                bValue = b.leadsGeneratedThisMonth ?? 0;
                break;
            default:
                aValue = a[key] ?? '';
                bValue = b[key] ?? '';
        }

        if (aValue < bValue) {
            return direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
            return direction === 'ascending' ? 1 : -1;
        }
        return 0;
    });

    const requestSort = (key: SortKey) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: SortKey) => {
        if (!sortConfig || sortConfig.key !== key) {
          return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
        }
        return sortConfig.direction === 'ascending' ? '▲' : '▼';
    };


  return (
    <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => requestSort('email')}>
                  <div className="flex items-center cursor-pointer">
                    Email {getSortIcon('email')}
                  </div>
              </TableHead>
              <TableHead onClick={() => requestSort('plan')}>
                  <div className="flex items-center cursor-pointer">
                    Plan {getSortIcon('plan')}
                  </div>
              </TableHead>
              <TableHead onClick={() => requestSort('leadsGeneratedThisMonth')}>
                 <div className="flex items-center cursor-pointer">
                    Usage {getSortIcon('leadsGeneratedThisMonth')}
                 </div>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.email}</TableCell>
                <TableCell>
                  <Badge variant={PLAN_BADGE_VARIANTS[user.plan]}>{user.plan}</Badge>
                </TableCell>
                <TableCell>{user.leadsGeneratedThisMonth ?? 0} / {user.addonCredits ?? 0}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>View Profile</DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Plan
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
    </div>
  );
}
