/**
 * Business Claim Service
 *
 * Handles business ownership claims for Google Places businesses
 */

import { db } from '@/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';

export type ClaimStatus = 'pending' | 'approved' | 'rejected';

export interface BusinessClaim {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  placeId: string;
  placeName: string;
  placeAddress: string;
  placeCategory: string;
  status: ClaimStatus;
  submittedAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
  reviewNotes?: string;
  // Additional verification info
  verificationDetails?: string;
  businessRole?: string; // owner, manager, etc.
  businessPhone?: string;
  businessEmail?: string;
}

/**
 * Submit a new business claim
 */
export const submitBusinessClaim = async (claim: {
  userId: string;
  userEmail: string;
  userName: string;
  placeId: string;
  placeName: string;
  placeAddress: string;
  placeCategory: string;
  verificationDetails?: string;
  businessRole?: string;
  businessPhone?: string;
  businessEmail?: string;
}): Promise<string> => {
  try {
    // Check if user already has a pending claim for this place
    const existingClaim = await getClaimByUserAndPlace(claim.userId, claim.placeId);
    if (existingClaim && existingClaim.status === 'pending') {
      throw new Error('You already have a pending claim for this business');
    }

    // Check if place is already claimed by someone else
    const approvedClaim = await getApprovedClaimForPlace(claim.placeId);
    if (approvedClaim) {
      throw new Error('This business has already been claimed by another user');
    }

    const claimsRef = collection(db, 'businessClaims');
    const docRef = await addDoc(claimsRef, {
      ...claim,
      status: 'pending',
      submittedAt: Timestamp.now(),
    });

    console.log('[BusinessClaimService] Claim submitted:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[BusinessClaimService] Error submitting claim:', error);
    throw error;
  }
};

/**
 * Get all pending claims (for admin)
 */
export const getPendingClaims = async (): Promise<BusinessClaim[]> => {
  try {
    const claimsRef = collection(db, 'businessClaims');
    const q = query(
      claimsRef,
      where('status', '==', 'pending'),
      orderBy('submittedAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as BusinessClaim[];
  } catch (error) {
    console.error('[BusinessClaimService] Error getting pending claims:', error);
    return [];
  }
};

/**
 * Get all claims (for admin)
 */
export const getAllClaims = async (): Promise<BusinessClaim[]> => {
  try {
    const claimsRef = collection(db, 'businessClaims');
    const q = query(claimsRef, orderBy('submittedAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as BusinessClaim[];
  } catch (error) {
    console.error('[BusinessClaimService] Error getting all claims:', error);
    return [];
  }
};

/**
 * Get claims by user
 */
export const getClaimsByUser = async (userId: string): Promise<BusinessClaim[]> => {
  try {
    const claimsRef = collection(db, 'businessClaims');
    const q = query(
      claimsRef,
      where('userId', '==', userId),
      orderBy('submittedAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as BusinessClaim[];
  } catch (error) {
    console.error('[BusinessClaimService] Error getting user claims:', error);
    return [];
  }
};

/**
 * Get a specific claim by user and place
 */
export const getClaimByUserAndPlace = async (
  userId: string,
  placeId: string
): Promise<BusinessClaim | null> => {
  try {
    const claimsRef = collection(db, 'businessClaims');
    const q = query(
      claimsRef,
      where('userId', '==', userId),
      where('placeId', '==', placeId)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;
    return {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data(),
    } as BusinessClaim;
  } catch (error) {
    console.error('[BusinessClaimService] Error getting claim:', error);
    return null;
  }
};

/**
 * Get approved claim for a place
 */
export const getApprovedClaimForPlace = async (
  placeId: string
): Promise<BusinessClaim | null> => {
  try {
    const claimsRef = collection(db, 'businessClaims');
    const q = query(
      claimsRef,
      where('placeId', '==', placeId),
      where('status', '==', 'approved')
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;
    return {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data(),
    } as BusinessClaim;
  } catch (error) {
    console.error('[BusinessClaimService] Error getting approved claim:', error);
    return null;
  }
};

/**
 * Approve a business claim (admin only)
 */
export const approveClaim = async (
  claimId: string,
  reviewedBy: string,
  reviewNotes?: string
): Promise<void> => {
  try {
    const claimRef = doc(db, 'businessClaims', claimId);
    await updateDoc(claimRef, {
      status: 'approved',
      reviewedAt: Timestamp.now(),
      reviewedBy,
      reviewNotes: reviewNotes || '',
    });

    console.log('[BusinessClaimService] Claim approved:', claimId);
  } catch (error) {
    console.error('[BusinessClaimService] Error approving claim:', error);
    throw error;
  }
};

/**
 * Reject a business claim (admin only)
 */
export const rejectClaim = async (
  claimId: string,
  reviewedBy: string,
  reviewNotes: string
): Promise<void> => {
  try {
    const claimRef = doc(db, 'businessClaims', claimId);
    await updateDoc(claimRef, {
      status: 'rejected',
      reviewedAt: Timestamp.now(),
      reviewedBy,
      reviewNotes,
    });

    console.log('[BusinessClaimService] Claim rejected:', claimId);
  } catch (error) {
    console.error('[BusinessClaimService] Error rejecting claim:', error);
    throw error;
  }
};

/**
 * Get a claim by ID
 */
export const getClaimById = async (claimId: string): Promise<BusinessClaim | null> => {
  try {
    const claimRef = doc(db, 'businessClaims', claimId);
    const claimDoc = await getDoc(claimRef);

    if (!claimDoc.exists()) return null;
    return {
      id: claimDoc.id,
      ...claimDoc.data(),
    } as BusinessClaim;
  } catch (error) {
    console.error('[BusinessClaimService] Error getting claim:', error);
    return null;
  }
};

/**
 * Delete a claim (for user cancellation or admin cleanup)
 */
export const deleteClaim = async (claimId: string): Promise<void> => {
  try {
    const claimRef = doc(db, 'businessClaims', claimId);
    await deleteDoc(claimRef);
    console.log('[BusinessClaimService] Claim deleted:', claimId);
  } catch (error) {
    console.error('[BusinessClaimService] Error deleting claim:', error);
    throw error;
  }
};
