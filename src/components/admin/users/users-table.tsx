
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { UserProfile } from "@/lib/types";
import { MoreHorizontal, Edit, Trash2, ArrowUpDown } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";


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

type SortKey = 'email' | 'plan' | 'leadsGeneratedThisMonth';

export function UsersTable({ users }: UsersTableProps) {
    const { toast } = useToast();
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>(null);

    const handleDeleteUser = (userId: string, userEmail: string | null | undefined) => {
        // NOTE: Securely deleting a user requires a backend Cloud Function.
        // This is a placeholder for the UI and client-side feedback.
        console.log(`Attempting to delete user: ${userId}`);
        toast({
            variant: 'destructive',
            title: 'Action Unavailable',
            description: `Secure user deletion for ${userEmail} must be handled by a backend function.`,
        });
    };

    const sortedUsers = [...users].sort((a, b) => {
        if (sortConfig === null) {
            return 0;
        }
        
        const { key, direction } = sortConfig;
        let aValue: any;
        let bValue: any;

        switch (key) {
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
                    Usage (Month) {getSortIcon('leadsGeneratedThisMonth')}
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
                <TableCell>{user.leadsGeneratedThisMonth ?? 0}</TableCell>
                <TableCell>
                    <AlertDialog>
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
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the user
                                    <span className="font-medium text-foreground"> {user.email}</span> and all their associated data from the database.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                    onClick={() => handleDeleteUser(user.id, user.email)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
    </div>
  );
}
