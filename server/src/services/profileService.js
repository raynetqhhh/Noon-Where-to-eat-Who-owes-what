import { ProfileModel } from '../models/profileModel.js';

// Profiles are created by a database trigger on sign-up. This is a safety
// net for accounts created before the trigger existed.
export async function ensureProfile(user) {
  const existing = await ProfileModel.findById(user.id);
  if (existing) return existing;
  const fallbackName = (user.email?.split('@')[0] || 'Friend').slice(0, 40);
  return ProfileModel.create({ id: user.id, display_name: fallbackName });
}
