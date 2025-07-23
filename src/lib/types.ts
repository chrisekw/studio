
import { Timestamp } from "firebase/firestore";

export type UserPlan = 'Free' | 'Starter' | 'Pro' | 'Agency';

export interface UserProfile {
  plan: UserPlan;
  email?: string | null;
  isAdmin?: boolean;
  isSalesMember?: boolean;
  defaultIncludeAddress?: boolean;
  defaultIncludeLinkedIn?: boolean;
  leadsGeneratedToday?: number;
  lastLeadGenerationDate?: string;
  leadsGeneratedThisMonth?: number;
  lastLeadGenerationMonth?: string;
  monthlyLeadsGenerated?: number; // New field for free plan monthly tracking
  addonCredits?: number;
  savedLeadsCount?: number;
  referralCode?: string;
  referredBy?: string; 
  referrals?: string[];
  leadPoints?: number;
}

export interface Lead {
  id: string;
  name: string;
  description?: string;
  email: string;
  phone: string;
  website: string;
  address?: string;
  linkedin?: string;
  facebook?: string;
  x?: string;
  tags?: string[];
  mock?: boolean;
}

export interface LeadGenerationEvent {
    id: string;
    userId: string;
    query: string;
    leadsGenerated: number;
    timestamp: Timestamp;
    userPlan: UserPlan;
}
