/**
 * Brand Request Service
 * Handles user submissions for new brands/businesses they want added to the app
 */

import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase';

export interface BrandRequest {
  id?: string;
  brandName: string;
  userId: string;
  userName: string;
  userEmail?: string;
  status: 'pending' | 'reviewed' | 'added' | 'rejected';
  notes?: string;
  createdAt: Date;
  reviewedAt?: Date;
}

const COLLECTION_NAME = 'brandRequests';

/**
 * Submit a new brand request
 */
export async function submitBrandRequest(
  brandName: string,
  userId: string,
  userName: string,
  userEmail?: string
): Promise<string> {
  try {
    const requestData = {
      brandName: brandName.trim(),
      userId,
      userName,
      userEmail: userEmail || '',
      status: 'pending',
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), requestData);
    console.log('[BrandRequest] Submitted request:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[BrandRequest] Error submitting request:', error);
    throw error;
  }
}

/**
 * Get all brand requests (for admin panel)
 */
export async function getAllBrandRequests(): Promise<BrandRequest[]> {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        brandName: data.brandName,
        userId: data.userId,
        userName: data.userName,
        userEmail: data.userEmail,
        status: data.status,
        notes: data.notes,
        createdAt: data.createdAt?.toDate() || new Date(),
        reviewedAt: data.reviewedAt?.toDate(),
      };
    });
  } catch (error) {
    console.error('[BrandRequest] Error fetching requests:', error);
    throw error;
  }
}

/**
 * Update brand request status
 */
export async function updateBrandRequestStatus(
  requestId: string,
  status: BrandRequest['status'],
  notes?: string
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, requestId);
    await updateDoc(docRef, {
      status,
      notes: notes || '',
      reviewedAt: Timestamp.now(),
    });
    console.log('[BrandRequest] Updated request status:', requestId, status);
  } catch (error) {
    console.error('[BrandRequest] Error updating request:', error);
    throw error;
  }
}

/**
 * Delete a brand request
 */
export async function deleteBrandRequest(requestId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, requestId);
    await deleteDoc(docRef);
    console.log('[BrandRequest] Deleted request:', requestId);
  } catch (error) {
    console.error('[BrandRequest] Error deleting request:', error);
    throw error;
  }
}
