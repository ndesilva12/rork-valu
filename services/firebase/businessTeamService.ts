/**
 * Business Team Service
 * Handles team member management for business accounts (Phase 0)
 */
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { BusinessTeamMember, BusinessMembership } from '@/types';

// Generate unique invite code
function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Create a team member invitation
 * @param businessId - The business ID (owner's user ID)
 * @param email - Email of person to invite
 * @param invitedBy - User ID of person creating invite
 * @param businessName - Name of the business
 * @returns The created team member record
 */
export async function createTeamInvitation(
  businessId: string,
  email: string,
  invitedBy: string,
  businessName: string
): Promise<BusinessTeamMember> {
  const inviteCode = generateInviteCode();
  const teamMemberId = `team_${inviteCode}`;

  const teamMember: BusinessTeamMember = {
    id: teamMemberId, // Temporary ID until they join
    businessId,
    email: email.toLowerCase().trim(),
    name: email.split('@')[0], // Temporary name
    role: 'team',
    inviteCode,
    status: 'pending',
    invitedBy,
    createdAt: new Date().toISOString(),
  };

  const teamMemberRef = doc(db, 'businessTeamMembers', teamMemberId);
  await setDoc(teamMemberRef, {
    ...teamMember,
    createdAt: serverTimestamp(),
  });

  console.log('[BusinessTeamService] ✅ Created team invitation:', teamMemberId);
  return teamMember;
}

/**
 * Get team member by invite code
 * @param inviteCode - The invite code from the URL
 * @returns Team member record or null
 */
export async function getTeamMemberByInviteCode(inviteCode: string): Promise<BusinessTeamMember | null> {
  try {
    const teamMembersRef = collection(db, 'businessTeamMembers');
    const q = query(teamMembersRef, where('inviteCode', '==', inviteCode));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('[BusinessTeamService] ⚠️ No team member found for invite code:', inviteCode);
      return null;
    }

    const doc = querySnapshot.docs[0];
    return { ...doc.data(), id: doc.id } as BusinessTeamMember;
  } catch (error) {
    console.error('[BusinessTeamService] ❌ Error getting team member by invite code:', error);
    return null;
  }
}

/**
 * Accept team invitation and link user account
 * @param inviteCode - The invite code
 * @param userId - Clerk user ID of person accepting
 * @param userName - User's name
 * @param userEmail - User's email
 * @returns Business membership info
 */
export async function acceptTeamInvitation(
  inviteCode: string,
  userId: string,
  userName: string,
  userEmail: string
): Promise<BusinessMembership | null> {
  try {
    // Find the invitation
    const teamMember = await getTeamMemberByInviteCode(inviteCode);
    if (!teamMember) {
      console.error('[BusinessTeamService] ❌ Invalid invite code');
      return null;
    }

    if (teamMember.status === 'active') {
      console.error('[BusinessTeamService] ❌ Invite already used');
      return null;
    }

    // Check email matches (optional - can remove for more flexibility)
    if (teamMember.email.toLowerCase() !== userEmail.toLowerCase()) {
      console.warn('[BusinessTeamService] ⚠️ Email mismatch on invitation');
      // Allow it anyway - just log warning
    }

    // Get business info to get business name
    const businessDoc = await getDoc(doc(db, 'users', teamMember.businessId));
    const businessData = businessDoc.data();
    const businessName = businessData?.businessInfo?.name || 'Unknown Business';

    // Update team member with actual user info
    const newTeamMemberId = userId; // Use actual Clerk user ID
    const teamMemberRef = doc(db, 'businessTeamMembers', newTeamMemberId);

    await setDoc(teamMemberRef, {
      ...teamMember,
      id: userId,
      name: userName,
      email: userEmail,
      status: 'active',
      joinedAt: serverTimestamp(),
    });

    // Delete the temporary pending record
    if (teamMember.id.startsWith('team_')) {
      await deleteDoc(doc(db, 'businessTeamMembers', teamMember.id));
    }

    // Update user profile to include business membership
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      businessMembership: {
        businessId: teamMember.businessId,
        role: teamMember.role,
        businessName,
      },
    });

    console.log('[BusinessTeamService] ✅ Team member accepted invitation:', userId);

    return {
      businessId: teamMember.businessId,
      role: teamMember.role,
      businessName,
    };
  } catch (error) {
    console.error('[BusinessTeamService] ❌ Error accepting team invitation:', error);
    return null;
  }
}

/**
 * Get all team members for a business
 * @param businessId - The business ID (owner's user ID)
 * @returns Array of team members
 */
export async function getTeamMembers(businessId: string): Promise<BusinessTeamMember[]> {
  try {
    const teamMembersRef = collection(db, 'businessTeamMembers');
    const q = query(teamMembersRef, where('businessId', '==', businessId));
    const querySnapshot = await getDocs(q);

    const teamMembers: BusinessTeamMember[] = [];
    querySnapshot.forEach((doc) => {
      teamMembers.push({ ...doc.data(), id: doc.id } as BusinessTeamMember);
    });

    console.log('[BusinessTeamService] 📋 Found', teamMembers.length, 'team members for business:', businessId);
    return teamMembers;
  } catch (error) {
    console.error('[BusinessTeamService] ❌ Error getting team members:', error);
    return [];
  }
}

/**
 * Remove a team member
 * @param teamMemberId - The team member's user ID
 * @param businessId - The business ID (for verification)
 */
export async function removeTeamMember(teamMemberId: string, businessId: string): Promise<boolean> {
  try {
    const teamMemberRef = doc(db, 'businessTeamMembers', teamMemberId);
    const teamMemberDoc = await getDoc(teamMemberRef);

    if (!teamMemberDoc.exists()) {
      console.error('[BusinessTeamService] ❌ Team member not found:', teamMemberId);
      return false;
    }

    const teamMemberData = teamMemberDoc.data() as BusinessTeamMember;

    // Verify business ID matches
    if (teamMemberData.businessId !== businessId) {
      console.error('[BusinessTeamService] ❌ Business ID mismatch');
      return false;
    }

    // Cannot remove owner
    if (teamMemberData.role === 'owner') {
      console.error('[BusinessTeamService] ❌ Cannot remove owner');
      return false;
    }

    // Delete team member record
    await deleteDoc(teamMemberRef);

    // Remove business membership from user profile (if user has joined)
    if (!teamMemberId.startsWith('team_')) {
      const userRef = doc(db, 'users', teamMemberId);
      await updateDoc(userRef, {
        businessMembership: null,
      });
    }

    console.log('[BusinessTeamService] ✅ Removed team member:', teamMemberId);
    return true;
  } catch (error) {
    console.error('[BusinessTeamService] ❌ Error removing team member:', error);
    return false;
  }
}

/**
 * Initialize owner as team member when business account is created
 * @param userId - Owner's user ID
 * @param businessName - Business name
 */
export async function initializeBusinessOwner(userId: string, businessName: string, email: string): Promise<void> {
  try {
    const teamMemberRef = doc(db, 'businessTeamMembers', userId);

    await setDoc(teamMemberRef, {
      id: userId,
      businessId: userId, // Owner's business ID is their own user ID
      email,
      name: email.split('@')[0],
      role: 'owner',
      inviteCode: generateInviteCode(), // For consistency, though not used
      status: 'active',
      invitedBy: userId,
      joinedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });

    console.log('[BusinessTeamService] ✅ Initialized business owner:', userId);
  } catch (error) {
    console.error('[BusinessTeamService] ❌ Error initializing business owner:', error);
  }
}

/**
 * Get business info for a team member
 * @param userId - The user's Clerk ID
 * @returns BusinessMembership or null
 */
export async function getBusinessMembership(userId: string): Promise<BusinessMembership | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return null;
    }

    const userData = userDoc.data();
    return userData.businessMembership || null;
  } catch (error) {
    console.error('[BusinessTeamService] ❌ Error getting business membership:', error);
    return null;
  }
}

/**
 * Check if user has permission (Phase 0 - simple check)
 * @param userId - User ID
 * @param permission - Permission to check
 * @returns true if user has permission
 */
export async function hasPermission(userId: string, permission: 'viewData' | 'editMoney' | 'confirmTransactions'): Promise<boolean> {
  try {
    const teamMemberRef = doc(db, 'businessTeamMembers', userId);
    const teamMemberDoc = await getDoc(teamMemberRef);

    if (!teamMemberDoc.exists()) {
      return false;
    }

    const teamMember = teamMemberDoc.data() as BusinessTeamMember;

    // Phase 0 simple rules:
    // - Owners can do everything
    // - Team members can only confirm transactions
    if (teamMember.role === 'owner') {
      return true;
    }

    if (teamMember.role === 'team') {
      return permission === 'confirmTransactions';
    }

    return false;
  } catch (error) {
    console.error('[BusinessTeamService] ❌ Error checking permission:', error);
    return false;
  }
}
