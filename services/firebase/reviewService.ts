import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  Timestamp,
  orderBy,
  updateDoc,
  increment
} from 'firebase/firestore';
import { db } from '@/firebase';

export interface Review {
  id: string;
  entityId: string; // brand or business ID
  entityType: 'brand' | 'business';
  authorId: string;
  authorName: string;
  authorImage?: string;
  rating: number; // 1-5
  text: string;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewLike {
  id: string;
  reviewId: string;
  userId: string;
  createdAt: Date;
}

/**
 * Create a new review
 */
export async function createReview(
  entityId: string,
  entityType: 'brand' | 'business',
  authorId: string,
  authorName: string,
  authorImage: string | undefined,
  rating: number,
  text: string
): Promise<string> {
  if (!entityId || !authorId || !text.trim()) {
    throw new Error('Entity ID, author ID, and text are required');
  }

  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  try {
    // Check if user already reviewed this entity
    const existingReview = await getUserReviewForEntity(entityId, authorId);
    if (existingReview) {
      throw new Error('You have already reviewed this ' + entityType);
    }

    const reviewsRef = collection(db, 'reviews');
    const docRef = await addDoc(reviewsRef, {
      entityId,
      entityType,
      authorId,
      authorName,
      authorImage: authorImage || null,
      rating: Math.max(1, Math.min(5, rating)),
      text: text.trim(),
      likes: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    console.log(`[reviewService] Successfully created review ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('[reviewService] Error creating review:', error);
    throw error;
  }
}

/**
 * Get reviews for an entity (brand or business)
 */
export async function getEntityReviews(
  entityId: string,
  entityType: 'brand' | 'business'
): Promise<Review[]> {
  if (!entityId) return [];

  try {
    const reviewsRef = collection(db, 'reviews');
    const q = query(
      reviewsRef,
      where('entityId', '==', entityId),
      where('entityType', '==', entityType),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const reviews: Review[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      reviews.push({
        id: doc.id,
        entityId: data.entityId,
        entityType: data.entityType,
        authorId: data.authorId,
        authorName: data.authorName,
        authorImage: data.authorImage,
        rating: data.rating,
        text: data.text,
        likes: data.likes || 0,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      });
    });

    return reviews;
  } catch (error) {
    console.error('[reviewService] Error getting entity reviews:', error);
    return [];
  }
}

/**
 * Get a user's review for a specific entity
 */
export async function getUserReviewForEntity(
  entityId: string,
  userId: string
): Promise<Review | null> {
  if (!entityId || !userId) return null;

  try {
    const reviewsRef = collection(db, 'reviews');
    const q = query(
      reviewsRef,
      where('entityId', '==', entityId),
      where('authorId', '==', userId)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data();

    return {
      id: doc.id,
      entityId: data.entityId,
      entityType: data.entityType,
      authorId: data.authorId,
      authorName: data.authorName,
      authorImage: data.authorImage,
      rating: data.rating,
      text: data.text,
      likes: data.likes || 0,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error('[reviewService] Error getting user review:', error);
    return null;
  }
}

/**
 * Delete a review
 */
export async function deleteReview(reviewId: string, authorId: string): Promise<void> {
  if (!reviewId || !authorId) {
    throw new Error('Review ID and author ID are required');
  }

  try {
    const reviewRef = doc(db, 'reviews', reviewId);
    const reviewDoc = await getDoc(reviewRef);

    if (!reviewDoc.exists()) {
      throw new Error('Review not found');
    }

    if (reviewDoc.data().authorId !== authorId) {
      throw new Error('You can only delete your own reviews');
    }

    await deleteDoc(reviewRef);
    console.log(`[reviewService] Successfully deleted review ${reviewId}`);
  } catch (error) {
    console.error('[reviewService] Error deleting review:', error);
    throw error;
  }
}

/**
 * Like a review
 */
export async function likeReview(reviewId: string, userId: string): Promise<void> {
  if (!reviewId || !userId) {
    throw new Error('Review ID and user ID are required');
  }

  try {
    // Check if already liked
    const alreadyLiked = await hasLikedReview(reviewId, userId);
    if (alreadyLiked) {
      console.log('[reviewService] Already liked this review');
      return;
    }

    // Add like record
    const likesRef = collection(db, 'reviewLikes');
    await addDoc(likesRef, {
      reviewId,
      userId,
      createdAt: Timestamp.now(),
    });

    // Increment likes count
    const reviewRef = doc(db, 'reviews', reviewId);
    await updateDoc(reviewRef, {
      likes: increment(1),
    });

    console.log(`[reviewService] Successfully liked review ${reviewId}`);
  } catch (error) {
    console.error('[reviewService] Error liking review:', error);
    throw error;
  }
}

/**
 * Unlike a review
 */
export async function unlikeReview(reviewId: string, userId: string): Promise<void> {
  if (!reviewId || !userId) {
    throw new Error('Review ID and user ID are required');
  }

  try {
    // Find the like record
    const likesRef = collection(db, 'reviewLikes');
    const q = query(
      likesRef,
      where('reviewId', '==', reviewId),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('[reviewService] No like record found to delete');
      return;
    }

    // Delete like record
    querySnapshot.forEach(async (docSnap) => {
      await deleteDoc(docSnap.ref);
    });

    // Decrement likes count
    const reviewRef = doc(db, 'reviews', reviewId);
    await updateDoc(reviewRef, {
      likes: increment(-1),
    });

    console.log(`[reviewService] Successfully unliked review ${reviewId}`);
  } catch (error) {
    console.error('[reviewService] Error unliking review:', error);
    throw error;
  }
}

/**
 * Check if user has liked a review
 */
export async function hasLikedReview(reviewId: string, userId: string): Promise<boolean> {
  if (!reviewId || !userId) return false;

  try {
    const likesRef = collection(db, 'reviewLikes');
    const q = query(
      likesRef,
      where('reviewId', '==', reviewId),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('[reviewService] Error checking like status:', error);
    return false;
  }
}

/**
 * Get average rating for an entity
 */
export async function getAverageRating(
  entityId: string,
  entityType: 'brand' | 'business'
): Promise<{ average: number; count: number }> {
  if (!entityId) return { average: 0, count: 0 };

  try {
    const reviews = await getEntityReviews(entityId, entityType);

    if (reviews.length === 0) {
      return { average: 0, count: 0 };
    }

    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    const average = sum / reviews.length;

    return {
      average: Math.round(average * 10) / 10, // Round to 1 decimal place
      count: reviews.length,
    };
  } catch (error) {
    console.error('[reviewService] Error getting average rating:', error);
    return { average: 0, count: 0 };
  }
}

/**
 * Get user's liked review IDs for an entity
 */
export async function getUserLikedReviewIds(
  entityId: string,
  userId: string
): Promise<Set<string>> {
  if (!entityId || !userId) return new Set();

  try {
    // First get all review IDs for this entity
    const reviews = await getEntityReviews(entityId, 'brand');
    const reviewIds = reviews.map(r => r.id);

    if (reviewIds.length === 0) return new Set();

    // Check likes for each review
    const likedIds = new Set<string>();
    for (const reviewId of reviewIds) {
      const liked = await hasLikedReview(reviewId, userId);
      if (liked) {
        likedIds.add(reviewId);
      }
    }

    return likedIds;
  } catch (error) {
    console.error('[reviewService] Error getting user liked reviews:', error);
    return new Set();
  }
}
