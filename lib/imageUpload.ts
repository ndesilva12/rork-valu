import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/firebase';
import { Alert, Platform } from 'react-native';

export interface ImageUploadResult {
  uri: string;
  success: boolean;
}

/**
 * Helper function to fetch with timeout
 */
async function fetchWithTimeout(uri: string, timeout = 30000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(uri, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Pick an image from the device gallery
 */
export async function pickImage(): Promise<ImagePicker.ImagePickerResult | null> {
  // Request permission
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (status !== 'granted') {
    Alert.alert(
      'Permission Required',
      'Please allow access to your photos to upload a profile image.'
    );
    return null;
  }

  // Launch image picker
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1], // Square aspect ratio for profile images
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
    console.log('[ImageUpload] Starting upload for URI:', uri);
    console.log('[ImageUpload] Platform:', Platform.OS);
    console.log('[ImageUpload] Storage path:', path);

    // Fetch the image from the URI and convert to blob with timeout
    console.log('[ImageUpload] Fetching image from URI...');
    const response = await fetchWithTimeout(uri, 30000); // 30 second timeout
    console.log('[ImageUpload] Fetch completed, status:', response.status);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    console.log('[ImageUpload] Converting to blob...');
    const blob = await response.blob();
    console.log('[ImageUpload] Blob created, size:', blob.size, 'type:', blob.type);

    if (blob.size === 0) {
      throw new Error('Image blob is empty - the image file may be corrupted or inaccessible');
    }

    // Ensure blob has correct mime type
    const mimeType = blob.type || 'image/jpeg';
    const finalBlob = blob.type ? blob : new Blob([blob], { type: mimeType });
    console.log('[ImageUpload] Final blob type:', finalBlob.type);

    // Create a reference to the storage location
    const storageRef = ref(storage, path);
    console.log('[ImageUpload] Storage ref created for path:', path);

    // Upload the file to Firebase Storage
    console.log('[ImageUpload] Starting upload to Firebase Storage...');
    await uploadBytes(storageRef, finalBlob);
    console.log('[ImageUpload] Upload completed successfully');

    // Get the download URL
    console.log('[ImageUpload] Getting download URL...');
    const downloadURL = await getDownloadURL(storageRef);
    console.log('[ImageUpload] Download URL obtained:', downloadURL);

    return downloadURL;
  } catch (error: any) {
    console.error('[ImageUpload] Error uploading image:', error);
    console.error('[ImageUpload] Error message:', error?.message);
    console.error('[ImageUpload] Error code:', error?.code);

    // Provide more specific error messages
    if (error?.name === 'AbortError') {
      throw new Error('Upload timed out. Please check your internet connection and try again.');
    } else if (error?.code === 'storage/unauthorized') {
      throw new Error('Permission denied. Please contact support.');
    } else if (error?.code === 'storage/canceled') {
      throw new Error('Upload was cancelled.');
    } else if (error?.message?.includes('fetch')) {
      throw new Error('Failed to read image file. Please try selecting a different image.');
    }

    throw error;
  }
}

/**
 * Complete flow: Pick and upload an image
 * @param userId - User ID for creating unique file path
 * @param imageType - Type of image ('profile' or 'business')
 * @returns Download URL of the uploaded image or null if canceled/failed
 */
export async function pickAndUploadImage(
  userId: string,
  imageType: 'profile' | 'business'
): Promise<string | null> {
  try {
    console.log('[pickAndUploadImage] Starting image picker for type:', imageType);
    console.log('[pickAndUploadImage] User ID:', userId);

    // Pick image
    const result = await pickImage();

    if (!result) {
      console.log('[pickAndUploadImage] No result from image picker');
      return null;
    }

    if (result.canceled) {
      console.log('[pickAndUploadImage] User cancelled image picker');
      return null;
    }

    if (!result.assets || result.assets.length === 0) {
      console.error('[pickAndUploadImage] No assets in result');
      throw new Error('No image was selected');
    }

    const imageUri = result.assets[0].uri;
    console.log('[pickAndUploadImage] Image selected, URI:', imageUri);
    console.log('[pickAndUploadImage] Image dimensions:', result.assets[0].width, 'x', result.assets[0].height);

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const extension = imageUri.split('.').pop() || 'jpg';
    const filename = `${imageType}-${userId}-${timestamp}.${extension}`;
    const storagePath = `${imageType}-images/${filename}`;
    console.log('[pickAndUploadImage] Generated storage path:', storagePath);

    // Upload to Firebase Storage
    console.log('[pickAndUploadImage] Starting upload to Firebase...');
    const downloadURL = await uploadImageToFirebase(imageUri, storagePath);
    console.log('[pickAndUploadImage] Upload successful, URL:', downloadURL);

    return downloadURL;
  } catch (error: any) {
    console.error('[pickAndUploadImage] Error:', error);
    console.error('[pickAndUploadImage] Error message:', error?.message);
    console.error('[pickAndUploadImage] Error stack:', error?.stack);

    // Show user-friendly error message
    const errorMessage = error?.message || 'Failed to upload image. Please try again.';
    Alert.alert('Upload Error', errorMessage);
    return null;
  }
}
