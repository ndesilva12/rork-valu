import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/firebase';
import { Alert, Platform } from 'react-native';

export interface ImageUploadResult {
  uri: string;
  success: boolean;
}

/**
 * Convert local URI to Blob using XMLHttpRequest (more reliable than fetch in React Native)
 */
async function uriToBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.onload = function() {
      resolve(xhr.response);
    };

    xhr.onerror = function() {
      reject(new Error('Failed to read image file'));
    };

    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

/**
 * Pick an image from the device gallery
 * @param aspect - Aspect ratio [width, height]. Default [1, 1] for square
 */
export async function pickImage(aspect: [number, number] = [1, 1]): Promise<ImagePicker.ImagePickerResult | null> {
  // Request permission
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (status !== 'granted') {
    Alert.alert(
      'Permission Required',
      'Please allow access to your photos to upload an image.'
    );
    return null;
  }

  // Launch image picker
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: aspect,
    quality: 0.8,
  });

  if (!result.canceled) {
    return result;
  }

  return null;
}

/**
 * Upload an image to Firebase Storage
 * @param uri - Local URI of the image
 * @param path - Storage path (e.g., 'profile-images/user123.jpg')
 * @returns Download URL of the uploaded image
 */
export async function uploadImageToFirebase(uri: string, path: string): Promise<string> {
  try {
    console.log('[ImageUpload] Starting upload...');
    console.log('[ImageUpload] URI:', uri);
    console.log('[ImageUpload] Path:', path);
    console.log('[ImageUpload] Platform:', Platform.OS);

    // Convert URI to blob (using XMLHttpRequest for better React Native compatibility)
    console.log('[ImageUpload] Converting image to blob...');
    const blob = await uriToBlob(uri);
    console.log('[ImageUpload] Blob created - Size:', blob.size, 'Type:', blob.type);

    if (blob.size === 0) {
      throw new Error('Image file is empty or could not be read');
    }

    // Create Firebase Storage reference
    const storageRef = ref(storage, path);
    console.log('[ImageUpload] Uploading to Firebase Storage...');

    // Upload blob to Firebase
    await uploadBytes(storageRef, blob);
    console.log('[ImageUpload] Upload successful!');

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    console.log('[ImageUpload] Download URL:', downloadURL);

    return downloadURL;
  } catch (error: any) {
    console.error('[ImageUpload] Upload failed:', error);

    // Provide user-friendly error messages
    if (error?.code === 'storage/unauthorized') {
      throw new Error('Permission denied. Please check Firebase Storage rules.');
    } else if (error?.code === 'storage/canceled') {
      throw new Error('Upload was cancelled.');
    } else if (error?.code === 'storage/retry-limit-exceeded') {
      throw new Error('Upload failed after multiple retries. Please check your internet connection.');
    } else if (error?.message) {
      throw new Error(error.message);
    }

    throw new Error('Failed to upload image. Please try again.');
  }
}

/**
 * Complete flow: Pick and upload an image
 * @param userId - User ID for creating unique file path
 * @param imageType - Type of image ('profile', 'business', 'cover', or 'gallery')
 * @param aspect - Optional aspect ratio [width, height]. Default [1, 1] for square
 * @returns Download URL of the uploaded image or null if canceled/failed
 */
export async function pickAndUploadImage(
  userId: string,
  imageType: 'profile' | 'business' | 'cover' | 'gallery',
  aspect: [number, number] = [1, 1]
): Promise<string | null> {
  try {
    console.log('[pickAndUploadImage] Starting picker for', imageType, 'with aspect', aspect);

    // Pick image from gallery with specified aspect ratio
    const result = await pickImage(aspect);

    // Check if user cancelled or no result
    if (!result || result.canceled) {
      console.log('[pickAndUploadImage] User cancelled');
      return null;
    }

    // Validate we got an image
    if (!result.assets || result.assets.length === 0) {
      throw new Error('No image was selected');
    }

    const imageUri = result.assets[0].uri;
    console.log('[pickAndUploadImage] Image selected:', imageUri);

    // Create unique filename
    const timestamp = Date.now();

    // Extract extension properly (handle data URIs on web)
    let extension = 'jpg';
    if (imageUri.startsWith('data:')) {
      // Data URI format: data:image/jpeg;base64,...
      const mimeType = imageUri.split(';')[0].split(':')[1];
      extension = mimeType.split('/')[1] || 'jpg';
    } else {
      // Regular file URI
      extension = imageUri.split('.').pop() || 'jpg';
    }

    // Determine storage folder based on image type
    const folder = imageType === 'profile' ? 'profile-images'
                 : imageType === 'business' ? 'business-images'
                 : imageType === 'cover' ? 'business-cover-images'
                 : 'business-gallery-images';

    const filename = `${imageType}-${userId}-${timestamp}.${extension}`;
    const storagePath = `${folder}/${filename}`;

    // Upload to Firebase Storage
    console.log('[pickAndUploadImage] Uploading to:', storagePath);
    const downloadURL = await uploadImageToFirebase(imageUri, storagePath);
    console.log('[pickAndUploadImage] Success!', downloadURL);

    return downloadURL;
  } catch (error: any) {
    console.error('[pickAndUploadImage] Error:', error);

    // Show user-friendly error
    const errorMessage = error?.message || 'Failed to upload image. Please try again.';
    Alert.alert('Upload Failed', errorMessage);
    return null;
  }
}
