export type UserPlan = 'Free' | 'Starter' | 'Pro' | 'Agency';

export interface UserProfile {
  plan: UserPlan;
  email?: string | null;
  defaultIncludeAddress?: boolean;
  defaultIncludeLinkedIn?: boolean;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  website: string;
  address?: string;
  linkedin?: string;
  tags?: string[];
}
