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
  limit,
  startAfter,
  updateDoc,
  increment,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/firebase';

export type PostType = 'text' | 'recommendation' | 'review';

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorImage?: string;
  authorType: 'user' | 'business';
  type: PostType;
  content: string;
  // For recommendations/reviews
  linkedEntityId?: string;
  linkedEntityType?: 'brand' | 'business' | 'value';
  linkedEntityName?: string;
  linkedEntityImage?: string;
  // For reviews
  rating?: number; // 1-5 stars
  // Engagement
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorImage?: string;
  content: string;
  createdAt: Date;
}

export interface PostLike {
  id: string;
  postId: string;
  userId: string;
  createdAt: Date;
}

/**
 * Create a new post
 */
export async function createPost(
  authorId: string,
  authorName: string,
  authorImage: string | undefined,
  authorType: 'user' | 'business',
  content: string,
  type: PostType = 'text',
  linkedEntity?: {
    id: string;
    type: 'brand' | 'business' | 'value';
    name: string;
    image?: string;
  },
  rating?: number
): Promise<string> {
  // Allow posts with either content OR an image (linkedEntity with image)
  const hasContent = content && content.trim().length > 0;
  const hasImage = linkedEntity?.image;

  if (!authorId) {
    throw new Error('Author ID is required');
  }

  if (!hasContent && !hasImage) {
    throw new Error('Post must have either content or an image');
  }

  try {
    const postsRef = collection(db, 'posts');
    const postData: any = {
      authorId,
      authorName,
      authorImage: authorImage || null,
      authorType,
      type,
      content: content?.trim() || '',
      likesCount: 0,
      commentsCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    if (linkedEntity) {
      postData.linkedEntityId = linkedEntity.id;
      postData.linkedEntityType = linkedEntity.type;
      postData.linkedEntityName = linkedEntity.name;
      postData.linkedEntityImage = linkedEntity.image || null;
    }

    if (rating !== undefined && type === 'review') {
      postData.rating = Math.max(1, Math.min(5, rating));
    }

    const docRef = await addDoc(postsRef, postData);
    console.log(`[postService] Successfully created post ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('[postService] Error creating post:', error);
    throw error;
  }
}

/**
 * Get all posts (feed)
 */
export async function getPosts(
  limitCount: number = 20,
  lastDoc?: DocumentSnapshot
): Promise<{ posts: Post[]; lastDoc: DocumentSnapshot | null }> {
  try {
    const postsRef = collection(db, 'posts');
    let q = query(
      postsRef,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    if (lastDoc) {
      q = query(
        postsRef,
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(limitCount)
      );
    }

    const querySnapshot = await getDocs(q);
    const posts: Post[] = [];
    let newLastDoc: DocumentSnapshot | null = null;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        authorId: data.authorId,
        authorName: data.authorName,
        authorImage: data.authorImage,
        authorType: data.authorType,
        type: data.type,
        content: data.content,
        linkedEntityId: data.linkedEntityId,
        linkedEntityType: data.linkedEntityType,
        linkedEntityName: data.linkedEntityName,
        linkedEntityImage: data.linkedEntityImage,
        rating: data.rating,
        likesCount: data.likesCount || 0,
        commentsCount: data.commentsCount || 0,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      });
      newLastDoc = doc;
    });

    return { posts, lastDoc: newLastDoc };
  } catch (error) {
    console.error('[postService] Error getting posts:', error);
    return { posts: [], lastDoc: null };
  }
}

/**
 * Get posts by a specific user
 */
export async function getUserPosts(userId: string): Promise<Post[]> {
  if (!userId) return [];

  try {
    const postsRef = collection(db, 'posts');
    const q = query(
      postsRef,
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const posts: Post[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        authorId: data.authorId,
        authorName: data.authorName,
        authorImage: data.authorImage,
        authorType: data.authorType,
        type: data.type,
        content: data.content,
        linkedEntityId: data.linkedEntityId,
        linkedEntityType: data.linkedEntityType,
        linkedEntityName: data.linkedEntityName,
        linkedEntityImage: data.linkedEntityImage,
        rating: data.rating,
        likesCount: data.likesCount || 0,
        commentsCount: data.commentsCount || 0,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      });
    });

    return posts;
  } catch (error) {
    console.error('[postService] Error getting user posts:', error);
    return [];
  }
}

/**
 * Delete a post
 */
export async function deletePost(postId: string, authorId: string): Promise<void> {
  if (!postId || !authorId) {
    throw new Error('Post ID and author ID are required');
  }

  try {
    const postRef = doc(db, 'posts', postId);
    const postDoc = await getDoc(postRef);

    if (!postDoc.exists()) {
      throw new Error('Post not found');
    }

    if (postDoc.data().authorId !== authorId) {
      throw new Error('You can only delete your own posts');
    }

    await deleteDoc(postRef);
    console.log(`[postService] Successfully deleted post ${postId}`);
  } catch (error) {
    console.error('[postService] Error deleting post:', error);
    throw error;
  }
}

/**
 * Like a post
 */
export async function likePost(postId: string, userId: string): Promise<void> {
  if (!postId || !userId) {
    throw new Error('Post ID and user ID are required');
  }

  try {
    // Check if already liked
    const alreadyLiked = await hasLikedPost(postId, userId);
    if (alreadyLiked) {
      console.log('[postService] Already liked this post');
      return;
    }

    // Add like record
    const likesRef = collection(db, 'postLikes');
    await addDoc(likesRef, {
      postId,
      userId,
      createdAt: Timestamp.now(),
    });

    // Increment likes count
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      likesCount: increment(1),
    });

    console.log(`[postService] Successfully liked post ${postId}`);
  } catch (error) {
    console.error('[postService] Error liking post:', error);
    throw error;
  }
}

/**
 * Unlike a post
 */
export async function unlikePost(postId: string, userId: string): Promise<void> {
  if (!postId || !userId) {
    throw new Error('Post ID and user ID are required');
  }

  try {
    // Find the like record
    const likesRef = collection(db, 'postLikes');
    const q = query(
      likesRef,
      where('postId', '==', postId),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('[postService] No like record found to delete');
      return;
    }

    // Delete like record
    querySnapshot.forEach(async (docSnap) => {
      await deleteDoc(docSnap.ref);
    });

    // Decrement likes count
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      likesCount: increment(-1),
    });

    console.log(`[postService] Successfully unliked post ${postId}`);
  } catch (error) {
    console.error('[postService] Error unliking post:', error);
    throw error;
  }
}

/**
 * Check if user has liked a post
 */
export async function hasLikedPost(postId: string, userId: string): Promise<boolean> {
  if (!postId || !userId) return false;

  try {
    const likesRef = collection(db, 'postLikes');
    const q = query(
      likesRef,
      where('postId', '==', postId),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('[postService] Error checking like status:', error);
    return false;
  }
}

/**
 * Add a comment to a post
 */
export async function addPostComment(
  postId: string,
  authorId: string,
  authorName: string,
  authorImage: string | undefined,
  content: string
): Promise<string> {
  if (!postId || !authorId || !content.trim()) {
    throw new Error('Post ID, author ID, and content are required');
  }

  try {
    const commentsRef = collection(db, 'postComments');
    const docRef = await addDoc(commentsRef, {
      postId,
      authorId,
      authorName,
      authorImage: authorImage || null,
      content: content.trim(),
      createdAt: Timestamp.now(),
    });

    // Increment comments count
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      commentsCount: increment(1),
    });

    console.log(`[postService] Successfully added comment to post ${postId}`);
    return docRef.id;
  } catch (error) {
    console.error('[postService] Error adding comment:', error);
    throw error;
  }
}

/**
 * Get comments for a post
 */
export async function getPostComments(postId: string): Promise<PostComment[]> {
  if (!postId) return [];

  try {
    const commentsRef = collection(db, 'postComments');
    const q = query(
      commentsRef,
      where('postId', '==', postId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const comments: PostComment[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      comments.push({
        id: doc.id,
        postId: data.postId,
        authorId: data.authorId,
        authorName: data.authorName,
        authorImage: data.authorImage,
        content: data.content,
        createdAt: data.createdAt?.toDate() || new Date(),
      });
    });

    return comments;
  } catch (error) {
    console.error('[postService] Error getting comments:', error);
    return [];
  }
}

/**
 * Delete a comment
 */
export async function deletePostComment(
  commentId: string,
  postId: string,
  authorId: string
): Promise<void> {
  if (!commentId || !postId || !authorId) {
    throw new Error('Comment ID, post ID, and author ID are required');
  }

  try {
    const commentRef = doc(db, 'postComments', commentId);
    const commentDoc = await getDoc(commentRef);

    if (!commentDoc.exists()) {
      throw new Error('Comment not found');
    }

    if (commentDoc.data().authorId !== authorId) {
      throw new Error('You can only delete your own comments');
    }

    await deleteDoc(commentRef);

    // Decrement comments count
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      commentsCount: increment(-1),
    });

    console.log(`[postService] Successfully deleted comment ${commentId}`);
  } catch (error) {
    console.error('[postService] Error deleting comment:', error);
    throw error;
  }
}
