import { UserProfile } from "@/types";
import * as fs from "fs/promises";
import * as path from "path";

const DB_DIR = path.join(process.cwd(), ".data");
const PROFILES_FILE = path.join(DB_DIR, "profiles.json");

const userProfiles = new Map<string, UserProfile>();
let isInitialized = false;

async function ensureDbDir() {
  try {
    await fs.mkdir(DB_DIR, { recursive: true });
  } catch (error) {
    console.error('[DB] Failed to create data directory:', error);
  }
}

async function loadProfiles() {
  if (isInitialized) return;
  
  try {
    await ensureDbDir();
    const data = await fs.readFile(PROFILES_FILE, 'utf-8');
    const profiles = JSON.parse(data) as Record<string, UserProfile>;
    Object.entries(profiles).forEach(([userId, profile]) => {
      userProfiles.set(userId, profile);
    });
    console.log('[DB] Loaded', userProfiles.size, 'profiles from disk');
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      console.error('[DB] Failed to load profiles:', error);
    }
  }
  isInitialized = true;
}

async function saveProfilesToDisk() {
  try {
    await ensureDbDir();
    const profiles: Record<string, UserProfile> = {};
    userProfiles.forEach((profile, userId) => {
      profiles[userId] = profile;
    });
    await fs.writeFile(PROFILES_FILE, JSON.stringify(profiles, null, 2));
  } catch (error) {
    console.error('[DB] Failed to save profiles to disk:', error);
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  await loadProfiles();
  
  const profile = userProfiles.get(userId);
  if (!profile) {
    return {
      causes: [],
      searchHistory: [],
    };
  }
  return profile;
}

export async function saveUserProfile(userId: string, profile: UserProfile): Promise<void> {
  await loadProfiles();
  
  userProfiles.set(userId, profile);
  console.log('[DB] Saved profile for user:', userId, 'with', profile.causes.length, 'causes');
  
  await saveProfilesToDisk();
}
