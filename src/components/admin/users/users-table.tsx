
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal
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
import type { UserProfile, UserPlan } from "@/lib/types";
import { MoreHorizontal, Edit, Trash2, ArrowUpDown } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";


interface UserWithId extends UserProfile {
    id: string;
}

interface UsersTableProps {
  users: UserWithId[];
}

const PLANS: UserPlan[] = ['Free', 'Starter', 'Pro', 'Agency'];

const PLAN_BADGE_VARIANTS: { [key in UserPlan]: BadgeProps['variant'] } = {
    Free: 'secondary',
    Starter: 'default',
    Pro: 'accent',
    Agency: 'destructive',
};

type SortKey = 'email' | 'plan' | 'totalLeadsGenerated';

export function UsersTable({ users }: UsersTableProps) {
    const { toast } = useToast();
    const { userProfile: adminProfile } = useAuth();
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>(null);

    const isSuperAdmin = adminProfile?.email === 'ekwchristian@gmail.com';

    const handlePlanChange = async (userId: string, newPlan: UserPlan, userEmail: string | null | undefined) => {
        if (!isSuperAdmin) {
            toast({ variant: 'destructive', title: 'Permission Denied', description: 'Only the super admin can change user plans.' });
            return;
        }

        try {
            const userDocRef = doc(db, 'users', userId);
            await updateDoc(userDocRef, { 
                plan: newPlan,
                // Reset monthly usage when plan changes
                leadsGeneratedThisMonth: 0,
                lastLeadGenerationMonth: new Date().toISOString().slice(0, 7)
            });
            toast({
                variant: 'success',
                title: 'Plan Updated',
                description: `${userEmail}'s plan has been changed to ${newPlan}.`,
            });
        } catch (error: any) {
            console.error("Error updating user plan: ", error);
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: `Could not update plan for ${userEmail}. Error: ${error.message}`,
            });
        }
    };

    const handleDeleteUser = async (userId: string, userEmail: string | null | undefined) => {
        if (!isSuperAdmin) {
            toast({ variant: 'destructive', title: 'Permission Denied', description: 'You are not authorized to delete users.' });
            return;
        }

        try {
            const userDocRef = doc(db, 'users', userId);
            await deleteDoc(userDocRef);
            toast({
                variant: 'success',
                title: 'User Deleted',
                description: `The user profile for ${userEmail} has been deleted from Firestore.`,
            });
            // IMPORTANT: This only deletes the user's data from Firestore, not their authentication record.
            // For full user deletion, you must implement a secure Cloud Function that uses the Firebase Admin SDK
            // to call `admin.auth().deleteUser(uid)`.
        } catch (error: any) {
            console.error("Error deleting user document: ", error);
            toast({
                variant: 'destructive',
                title: 'Deletion Failed',
                description: `Could not delete user ${userEmail}. Error: ${error.message}`,
            });
        }
    };

    const sortedUsers = [...users].sort((a, b) => {
        if (sortConfig === null) {
            return 0;
        }
        
        const { key, direction } = sortConfig;
        let aValue: any;
        let bValue: any;

        switch (key) {
            case 'totalLeadsGenerated':
                aValue = a.totalLeadsGenerated ?? 0;
                bValue = b.totalLeadsGenerated ?? 0;
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

    const renderActions = (user: UserWithId) => (
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
                
                {isSuperAdmin && (
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit Plan</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                                <DropdownMenuLabel>Select a new plan</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {PLANS.map(plan => (
                                    <DropdownMenuItem 
                                        key={plan} 
                                        disabled={user.plan === plan}
                                        onClick={() => handlePlanChange(user.id, plan, user.email)}
                                    >
                                        {plan}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                )}
                
                {isSuperAdmin && (
                    <>
                        <DropdownMenuSeparator />
                        <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete User
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                    </>
                )}
                </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the user
                            <span className="font-medium text-foreground"> {user.email}</span>'s profile from the database. This does not delete their authentication record.
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
    );


  return (
    <div className="rounded-lg border">
        <div className="hidden md:block">
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
                <TableHead onClick={() => requestSort('totalLeadsGenerated')}>
                    <div className="flex items-center cursor-pointer">
                        Total Leads {getSortIcon('totalLeadsGenerated')}
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
                    <TableCell>{(user.totalLeadsGenerated ?? 0).toLocaleString()}</TableCell>
                    <TableCell>
                        {renderActions(user)}
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </div>
        <div className="block md:hidden">
            <div className="space-y-4 p-4">
                {sortedUsers.map(user => (
                    <div key={user.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                             <div className="space-y-1">
                                <p className="font-medium text-sm truncate">{user.email}</p>
                                <Badge variant={PLAN_BADGE_VARIANTS[user.plan]}>{user.plan}</Badge>
                            </div>
                            {renderActions(user)}
                        </div>
                       
                        <div className="text-xs text-muted-foreground">
                            Total Leads: {(user.totalLeadsGenerated ?? 0).toLocaleString()}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
}
