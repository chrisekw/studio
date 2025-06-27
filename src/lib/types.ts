export type UserPlan = 'Free' | 'Starter' | 'Pro' | 'Agency';

export interface UserProfile {
  plan: UserPlan;
  email?: string | null;
  defaultIncludeAddress?: boolean;
  defaultIncludeLinkedIn?: boolean;
  leadsGeneratedToday?: number;
  lastLeadGenerationDate?: string;
  leadsGeneratedThisMonth?: number;
  lastLeadGenerationMonth?: string;
  addonCredits?: number;
  savedLeadsCount?: number;
  // New referral fields
  referralCode?: string;
  referredBy?: string; // UID of the referrer
  referrals?: string[]; // Array of UIDs of referred users
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
  tags?: string[];
}
