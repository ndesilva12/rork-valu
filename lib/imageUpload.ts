import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/firebase';
import { Alert } from 'react-native';

export interface ImageUploadResult {
  uri: string;
  success: boolean;
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
    // Fetch the image from the URI
    const response = await fetch(uri);
    const blob = await response.blob();

    // Create a reference to the storage location
    const storageRef = ref(storage, path);

    // Upload the file
    await uploadBytes(storageRef, blob);

    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
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
    // Pick image
    const result = await pickImage();
    if (!result || result.canceled) {
      return null;
    }

    const imageUri = result.assets[0].uri;

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const extension = imageUri.split('.').pop() || 'jpg';
    const filename = `${imageType}-${userId}-${timestamp}.${extension}`;
    const storagePath = `${imageType}-images/${filename}`;

    // Upload to Firebase Storage
    const downloadURL = await uploadImageToFirebase(imageUri, storagePath);

    return downloadURL;
  } catch (error) {
    console.error('Error in pickAndUploadImage:', error);
    Alert.alert('Upload Error', 'Failed to upload image. Please try again.');
    return null;
  }
}
