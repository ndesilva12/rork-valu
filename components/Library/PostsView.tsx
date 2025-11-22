/**
 * PostsView Component
 * Displays posts for a user with comment functionality
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Image } from 'expo-image';
import { Heart, MessageCircle, X, Send, Trash2, Edit, MoreVertical } from 'lucide-react-native';
import { Alert } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { lightColors, darkColors } from '@/constants/colors';
import {
  Post,
  PostComment,
  getUserPosts,
  getPostComments,
  addPostComment,
  likePost,
  unlikePost,
  hasLikedPost,
  deletePost,
  deletePostComment,
} from '@/services/firebase/postService';

interface PostsViewProps {
  userId: string;
  currentUserId?: string;
  currentUserName?: string;
  currentUserImage?: string;
  isDarkMode?: boolean;
}

export default function PostsView({
  userId,
  currentUserId,
  currentUserName,
  currentUserImage,
  isDarkMode,
}: PostsViewProps) {
  // Ensure colors is always defined with fallback
  const colors = (isDarkMode === true ? darkColors : lightColors) || lightColors;

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Edit/Delete post state
  const [showPostMenu, setShowPostMenu] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editPostContent, setEditPostContent] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Load posts
  useEffect(() => {
    loadPosts();
  }, [userId]);

  const loadPosts = async () => {
    if (!userId) {
      setIsLoading(false);
      setError('No user ID provided');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const userPosts = await getUserPosts(userId);
      setPosts(userPosts);

      // Check which posts are liked by current user
      if (currentUserId && userPosts.length > 0) {
        const likedSet = new Set<string>();
        for (const post of userPosts) {
          try {
            const isLiked = await hasLikedPost(post.id, currentUserId);
            if (isLiked) likedSet.add(post.id);
          } catch (e) {
            // Ignore individual like check errors
          }
        }
        setLikedPosts(likedSet);
      }
    } catch (err) {
      console.error('[PostsView] Error loading posts:', err);
      setError('Failed to load posts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load comments for selected post
  const loadComments = async (postId: string) => {
    setIsLoadingComments(true);
    try {
      const postComments = await getPostComments(postId);
      setComments(postComments);
    } catch (error) {
      console.error('[PostsView] Error loading comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  // Handle post selection
  const handlePostPress = async (post: Post) => {
    setSelectedPost(post);
    await loadComments(post.id);
  };

  // Handle like/unlike
  const handleLike = async (postId: string) => {
    if (!currentUserId) return;

    try {
      const isLiked = likedPosts.has(postId);
      if (isLiked) {
        await unlikePost(postId, currentUserId);
        setLikedPosts((prev) => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, likesCount: Math.max(0, p.likesCount - 1) } : p
          )
        );
      } else {
        await likePost(postId, currentUserId);
        setLikedPosts((prev) => new Set(prev).add(postId));
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, likesCount: p.likesCount + 1 } : p
          )
        );
      }
    } catch (error) {
      console.error('[PostsView] Error toggling like:', error);
    }
  };

  // Handle add comment
  const handleAddComment = async () => {
    if (!currentUserId || !currentUserName || !selectedPost || !newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      await addPostComment(
        selectedPost.id,
        currentUserId,
        currentUserName,
        currentUserImage,
        newComment.trim()
      );
      setNewComment('');
      await loadComments(selectedPost.id);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === selectedPost.id ? { ...p, commentsCount: p.commentsCount + 1 } : p
        )
      );
    } catch (error) {
      console.error('[PostsView] Error adding comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Handle delete comment
  const handleDeleteComment = async (comment: PostComment) => {
    if (!currentUserId || comment.authorId !== currentUserId || !selectedPost) return;

    try {
      await deletePostComment(comment.id, selectedPost.id, currentUserId);
      await loadComments(selectedPost.id);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === selectedPost.id ? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) } : p
        )
      );
    } catch (error) {
      console.error('[PostsView] Error deleting comment:', error);
    }
  };

  // Handle edit post
  const handleStartEditPost = (post: Post) => {
    setEditingPost(post);
    setEditPostContent(post.content || '');
    setShowPostMenu(null);
    setSelectedPost(null);
  };

  // Handle save edited post
  const handleSaveEditedPost = async () => {
    if (!editingPost || !currentUserId || editingPost.authorId !== currentUserId) return;

    setIsSavingEdit(true);
    try {
      const postRef = doc(db, 'posts', editingPost.id);
      await updateDoc(postRef, {
        content: editPostContent.trim(),
        updatedAt: new Date(),
      });

      // Update local state
      setPosts((prev) =>
        prev.map((p) =>
          p.id === editingPost.id ? { ...p, content: editPostContent.trim(), updatedAt: new Date() } : p
        )
      );

      setEditingPost(null);
      setEditPostContent('');

      if (Platform.OS === 'web') {
        window.alert('Post updated successfully');
      } else {
        Alert.alert('Success', 'Post updated successfully');
      }
    } catch (error) {
      console.error('[PostsView] Error updating post:', error);
      if (Platform.OS === 'web') {
        window.alert('Failed to update post');
      } else {
        Alert.alert('Error', 'Failed to update post');
      }
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle delete post
  const handleDeleteUserPost = async (post: Post) => {
    if (!currentUserId || post.authorId !== currentUserId) return;

    const confirmDelete = Platform.OS === 'web'
      ? window.confirm('Are you sure you want to delete this post? This action cannot be undone.')
      : await new Promise((resolve) => {
          Alert.alert(
            'Delete Post',
            'Are you sure you want to delete this post? This action cannot be undone.',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        });

    if (!confirmDelete) return;

    try {
      await deletePost(post.id, currentUserId);
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
      setShowPostMenu(null);
      setSelectedPost(null);

      if (Platform.OS === 'web') {
        window.alert('Post deleted successfully');
      } else {
        Alert.alert('Success', 'Post deleted successfully');
      }
    } catch (error) {
      console.error('[PostsView] Error deleting post:', error);
      if (Platform.OS === 'web') {
        window.alert('Failed to delete post');
      } else {
        Alert.alert('Error', 'Failed to delete post');
      }
    }
  };

  // Format date
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // Render post card
  const renderPostCard = (post: Post) => {
    const hasImage = post.linkedEntityImage;
    const isLiked = likedPosts.has(post.id);
    const isAuthor = currentUserId === post.authorId;
    const showMenu = showPostMenu === post.id;

    return (
      <TouchableOpacity
        key={post.id}
        style={[styles.postCard, { backgroundColor: colors?.backgroundSecondary || '#F3F4F6', borderColor: colors?.border || '#E5E7EB' }]}
        onPress={() => handlePostPress(post)}
        activeOpacity={0.7}
      >
        <View style={styles.postCardContent}>
          {/* Image on left if exists */}
          {hasImage && (
            <View style={styles.postImageContainer}>
              <Image
                source={{ uri: post.linkedEntityImage }}
                style={styles.postImage}
                contentFit="cover"
                transition={200}
              />
            </View>
          )}

          {/* Text content */}
          <View style={[styles.postTextContainer, !hasImage && styles.postTextContainerFull]}>
            {/* Author info with menu */}
            <View style={styles.postAuthorRow}>
              {post.authorImage && (
                <Image
                  source={{ uri: post.authorImage }}
                  style={styles.authorAvatar}
                  contentFit="cover"
                />
              )}
              <View style={[styles.authorInfo, { flex: 1 }]}>
                <Text style={[styles.authorName, { color: colors?.text || '#111827' }]} numberOfLines={1}>
                  {post.authorName}
                </Text>
                <Text style={[styles.postTime, { color: colors?.textSecondary || '#6B7280' }]}>
                  {formatDate(post.createdAt)}
                </Text>
              </View>
              {/* Author menu button */}
              {isAuthor && (
                <View style={styles.postMenuContainer}>
                  <TouchableOpacity
                    style={styles.postMenuButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      setShowPostMenu(showMenu ? null : post.id);
                    }}
                    activeOpacity={0.7}
                  >
                    <MoreVertical size={18} color={colors?.textSecondary || '#6B7280'} strokeWidth={2} />
                  </TouchableOpacity>
                  {showMenu && (
                    <View style={[styles.postMenuDropdown, { backgroundColor: colors?.background || '#FFFFFF', borderColor: colors?.border || '#E5E7EB' }]}>
                      <TouchableOpacity
                        style={styles.postMenuItem}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleStartEditPost(post);
                        }}
                        activeOpacity={0.7}
                      >
                        <Edit size={16} color={colors?.text || '#111827'} strokeWidth={2} />
                        <Text style={[styles.postMenuItemText, { color: colors?.text || '#111827' }]}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.postMenuItem}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDeleteUserPost(post);
                        }}
                        activeOpacity={0.7}
                      >
                        <Trash2 size={16} color={colors?.danger || '#EF4444'} strokeWidth={2} />
                        <Text style={[styles.postMenuItemText, { color: colors?.danger || '#EF4444' }]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Post content */}
            <Text
              style={[
                styles.postContent,
                { color: colors?.text || '#111827' },
                !hasImage && styles.postContentLarge,
              ]}
              numberOfLines={hasImage ? 3 : 5}
            >
              {post.content}
            </Text>

            {/* Engagement row */}
            <View style={styles.engagementRow}>
              <TouchableOpacity
                style={styles.engagementButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleLike(post.id);
                }}
                activeOpacity={0.7}
              >
                <Heart
                  size={18}
                  color={isLiked ? (colors?.danger || '#EF4444') : (colors?.textSecondary || '#6B7280')}
                  fill={isLiked ? (colors?.danger || '#EF4444') : 'transparent'}
                  strokeWidth={2}
                />
                <Text style={[styles.engagementText, { color: colors?.textSecondary || '#6B7280' }]}>
                  {post.likesCount}
                </Text>
              </TouchableOpacity>

              <View style={styles.engagementButton}>
                <MessageCircle size={18} color={colors?.textSecondary || '#6B7280'} strokeWidth={2} />
                <Text style={[styles.engagementText, { color: colors?.textSecondary || '#6B7280' }]}>
                  {post.commentsCount}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render comment
  const renderComment = (comment: PostComment) => {
    const canDelete = currentUserId === comment.authorId;

    return (
      <View key={comment.id} style={[styles.commentCard, { borderBottomColor: colors?.border || '#E5E7EB' }]}>
        <View style={styles.commentHeader}>
          {comment.authorImage && (
            <Image
              source={{ uri: comment.authorImage }}
              style={styles.commentAvatar}
              contentFit="cover"
            />
          )}
          <View style={styles.commentAuthorInfo}>
            <Text style={[styles.commentAuthorName, { color: colors?.text || '#111827' }]}>
              {comment.authorName}
            </Text>
            <Text style={[styles.commentTime, { color: colors?.textSecondary || '#6B7280' }]}>
              {formatDate(comment.createdAt)}
            </Text>
          </View>
          {canDelete && (
            <TouchableOpacity
              style={styles.deleteCommentButton}
              onPress={() => handleDeleteComment(comment)}
              activeOpacity={0.7}
            >
              <Trash2 size={16} color={colors?.danger || '#EF4444'} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.commentContent, { color: colors?.text || '#111827' }]}>
          {comment.content}
        </Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors?.primary || '#3B82F6'} />
        <Text style={[styles.loadingText, { color: colors?.textSecondary || '#6B7280' }]}>Loading posts...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.emptyContainer}>
        <MessageCircle size={48} color={colors?.textSecondary || '#6B7280'} strokeWidth={1.5} />
        <Text style={[styles.emptyText, { color: colors?.textSecondary || '#6B7280' }]}>{error}</Text>
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MessageCircle size={48} color={colors?.textSecondary || '#6B7280'} strokeWidth={1.5} />
        <Text style={[styles.emptyText, { color: colors?.textSecondary || '#6B7280' }]}>No posts yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Posts list */}
      <View style={styles.postsList}>
        {posts.map((post) => renderPostCard(post))}
      </View>

      {/* Edit post modal */}
      <Modal
        visible={editingPost !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setEditingPost(null);
          setEditPostContent('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.editModalContainer, { backgroundColor: colors?.background || '#FFFFFF' }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors?.border || '#E5E7EB' }]}>
              <Text style={[styles.modalTitle, { color: colors?.text || '#111827' }]}>Edit Post</Text>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: colors?.backgroundSecondary || '#F3F4F6' }]}
                onPress={() => {
                  setEditingPost(null);
                  setEditPostContent('');
                }}
                activeOpacity={0.7}
              >
                <X size={24} color={colors?.text || '#111827'} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.editModalContent}>
              <Text style={[styles.editLabel, { color: colors?.text || '#111827' }]}>Caption / Text</Text>
              <TextInput
                style={[styles.editTextInput, {
                  color: colors?.text || '#111827',
                  backgroundColor: colors?.backgroundSecondary || '#F3F4F6',
                  borderColor: colors?.border || '#E5E7EB'
                }]}
                placeholder="Write something..."
                placeholderTextColor={colors?.textSecondary || '#6B7280'}
                value={editPostContent}
                onChangeText={setEditPostContent}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />

              <View style={styles.editModalActions}>
                <TouchableOpacity
                  style={[styles.editCancelButton, { borderColor: colors?.border || '#E5E7EB' }]}
                  onPress={() => {
                    setEditingPost(null);
                    setEditPostContent('');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.editCancelButtonText, { color: colors?.text || '#111827' }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editSaveButton, { backgroundColor: colors?.primary || '#3B82F6' }]}
                  onPress={handleSaveEditedPost}
                  disabled={isSavingEdit}
                  activeOpacity={0.7}
                >
                  {isSavingEdit ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.editSaveButtonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Post detail modal */}
      <Modal
        visible={selectedPost !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedPost(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContainer, { backgroundColor: colors?.background || '#FFFFFF' }]}>
            {/* Modal header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors?.border || '#E5E7EB' }]}>
              <Text style={[styles.modalTitle, { color: colors?.text || '#111827' }]}>Post</Text>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: colors?.backgroundSecondary || '#F3F4F6' }]}
                onPress={() => setSelectedPost(null)}
                activeOpacity={0.7}
              >
                <X size={24} color={colors?.text || '#111827'} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {selectedPost && (
                <>
                  {/* Full post content */}
                  <View style={styles.fullPostContainer}>
                    {/* Author row */}
                    <View style={styles.postAuthorRow}>
                      {selectedPost.authorImage && (
                        <Image
                          source={{ uri: selectedPost.authorImage }}
                          style={styles.authorAvatarLarge}
                          contentFit="cover"
                        />
                      )}
                      <View style={styles.authorInfo}>
                        <Text style={[styles.authorNameLarge, { color: colors?.text || '#111827' }]}>
                          {selectedPost.authorName}
                        </Text>
                        <Text style={[styles.postTime, { color: colors?.textSecondary || '#6B7280' }]}>
                          {formatDate(selectedPost.createdAt)}
                        </Text>
                      </View>
                    </View>

                    {/* Post image if exists */}
                    {selectedPost.linkedEntityImage && (
                      <Image
                        source={{ uri: selectedPost.linkedEntityImage }}
                        style={styles.fullPostImage}
                        contentFit="cover"
                        transition={200}
                      />
                    )}

                    {/* Post content */}
                    <Text style={[styles.fullPostContent, { color: colors?.text || '#111827' }]}>
                      {selectedPost.content}
                    </Text>

                    {/* Engagement row */}
                    <View style={[styles.fullEngagementRow, { borderTopColor: colors?.border || '#E5E7EB', borderBottomColor: colors?.border || '#E5E7EB' }]}>
                      <TouchableOpacity
                        style={styles.engagementButton}
                        onPress={() => handleLike(selectedPost.id)}
                        activeOpacity={0.7}
                      >
                        <Heart
                          size={22}
                          color={likedPosts.has(selectedPost.id) ? (colors?.danger || '#EF4444') : (colors?.textSecondary || '#6B7280')}
                          fill={likedPosts.has(selectedPost.id) ? (colors?.danger || '#EF4444') : 'transparent'}
                          strokeWidth={2}
                        />
                        <Text style={[styles.engagementText, { color: colors?.textSecondary || '#6B7280' }]}>
                          {selectedPost.likesCount} likes
                        </Text>
                      </TouchableOpacity>

                      <View style={styles.engagementButton}>
                        <MessageCircle size={22} color={colors?.textSecondary || '#6B7280'} strokeWidth={2} />
                        <Text style={[styles.engagementText, { color: colors?.textSecondary || '#6B7280' }]}>
                          {selectedPost.commentsCount} comments
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Comments section */}
                  <View style={styles.commentsSection}>
                    <Text style={[styles.commentsSectionTitle, { color: colors?.text || '#111827' }]}>
                      Comments
                    </Text>

                    {isLoadingComments ? (
                      <ActivityIndicator size="small" color={colors?.primary || '#3B82F6'} style={{ marginVertical: 20 }} />
                    ) : comments.length === 0 ? (
                      <Text style={[styles.noCommentsText, { color: colors?.textSecondary || '#6B7280' }]}>
                        No comments yet. Be the first to comment!
                      </Text>
                    ) : (
                      comments.map((comment) => renderComment(comment))
                    )}
                  </View>
                </>
              )}
            </ScrollView>

            {/* Comment input */}
            {currentUserId && (
              <View style={[styles.commentInputContainer, { backgroundColor: colors?.backgroundSecondary || '#F3F4F6', borderTopColor: colors?.border || '#E5E7EB' }]}>
                <TextInput
                  style={[styles.commentInput, { color: colors?.text || '#111827', backgroundColor: colors?.background || '#FFFFFF', borderColor: colors?.border || '#E5E7EB' }]}
                  placeholder="Write a comment..."
                  placeholderTextColor={colors?.textSecondary || '#6B7280'}
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    { backgroundColor: newComment.trim() ? (colors?.primary || '#3B82F6') : (colors?.backgroundSecondary || '#F3F4F6') }
                  ]}
                  onPress={handleAddComment}
                  disabled={!newComment.trim() || isSubmittingComment}
                  activeOpacity={0.7}
                >
                  {isSubmittingComment ? (
                    <ActivityIndicator size="small" color={colors?.white || '#FFFFFF'} />
                  ) : (
                    <Send size={20} color={newComment.trim() ? (colors?.white || '#FFFFFF') : (colors?.textSecondary || '#6B7280')} strokeWidth={2} />
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
  postsList: {
    gap: 12,
    paddingHorizontal: 4,
  },
  postCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  postCardContent: {
    flexDirection: 'row',
  },
  postImageContainer: {
    width: 120,
    height: 140,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  postTextContainer: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  postTextContainerFull: {
    padding: 16,
  },
  postAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  authorAvatarLarge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  authorNameLarge: {
    fontSize: 16,
    fontWeight: '700',
  },
  postTime: {
    fontSize: 12,
    marginTop: 2,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  postContentLarge: {
    fontSize: 16,
    lineHeight: 24,
  },
  engagementRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 'auto',
  },
  engagementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  engagementText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
  },
  fullPostContainer: {
    padding: 16,
  },
  fullPostImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginVertical: 12,
  },
  fullPostContent: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
  },
  fullEngagementRow: {
    flexDirection: 'row',
    gap: 24,
    paddingVertical: 12,
    marginTop: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  // Comments section
  commentsSection: {
    padding: 16,
  },
  commentsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  noCommentsText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  commentCard: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  commentAuthorInfo: {
    flex: 1,
  },
  commentAuthorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentTime: {
    fontSize: 11,
    marginTop: 1,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
    paddingLeft: 36,
  },
  deleteCommentButton: {
    padding: 8,
  },
  // Comment input
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
  },
  commentInput: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Post menu styles
  postMenuContainer: {
    position: 'relative',
  },
  postMenuButton: {
    padding: 4,
  },
  postMenuDropdown: {
    position: 'absolute',
    top: 28,
    right: 0,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 120,
    zIndex: 100,
  },
  postMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  postMenuItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Edit modal styles
  editModalContainer: {
    borderRadius: 16,
    maxWidth: 500,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  editModalContent: {
    padding: 16,
  },
  editLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  editTextInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  editModalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  editCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  editCancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  editSaveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
