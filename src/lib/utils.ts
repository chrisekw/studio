import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { UserProfile } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateReferralCode(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const PLAN_LIMITS = {
  Free: 5, // Daily
  Starter: 200, // Monthly
  Pro: 1000, // Monthly
  Agency: 5000, // Monthly
};

export function calculateRemainingLeads(userProfile: UserProfile | null) {
  if (!userProfile) {
    return {
      remainingLeads: 0,
      remainingPlanLeads: 0,
      leadPoints: 0,
      addonCredits: 0,
      remainingLeadsText: 'Login to see your quota.',
    };
  }

  const isFreePlan = userProfile.plan === 'Free';
  const planLimit = PLAN_LIMITS[userProfile.plan] || 0;
  const addonCredits = userProfile.addonCredits ?? 0;
  const leadPoints = userProfile.leadPoints ?? 0;

  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().toISOString().slice(0, 7);

  const leadsUsedToday =
    isFreePlan && userProfile.lastLeadGenerationDate === today
      ? userProfile.leadsGeneratedToday ?? 0
      : 0;
  const leadsUsedThisMonth =
    !isFreePlan && userProfile.lastLeadGenerationMonth === currentMonth
      ? userProfile.leadsGeneratedThisMonth ?? 0
      : 0;

  const remainingPlanLeads = isFreePlan
    ? planLimit - leadsUsedToday
    : planLimit - leadsUsedThisMonth;
  
  const remainingLeads = remainingPlanLeads + addonCredits + leadPoints;

  const parts = [];
  if (isFreePlan) {
    parts.push(`${Math.max(0, remainingPlanLeads)} daily`);
  } else {
    parts.push(`${Math.max(0, remainingPlanLeads).toLocaleString()} monthly`);
  }
  if (leadPoints > 0) parts.push(`${leadPoints.toLocaleString()} points`);
  if (addonCredits > 0) parts.push(`${addonCredits.toLocaleString()} add-ons`);
  const remainingLeadsText = `You have ${parts.join(' + ')} leads remaining.`;

  return {
    remainingLeads,
    remainingPlanLeads,
    leadPoints,
    addonCredits,
    remainingLeadsText,
  };
}
