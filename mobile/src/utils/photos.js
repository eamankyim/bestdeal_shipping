import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

// The API refuses requests over 4.5MB, and a full-quality phone photo is bigger than that.
export const PHOTO_QUALITY = 0.4;

const toUpload = (result) => {
  const asset = !result.canceled && result.assets?.[0];
  if (!asset?.base64) return null;
  const type = asset.mimeType || 'image/jpeg';
  return {
    uri: asset.uri,
    name: asset.fileName || `photo_${Date.now()}.jpg`,
    type,
    fileData: `data:${type};base64,${asset.base64}`,
  };
};

const options = { mediaTypes: ['images'], quality: PHOTO_QUALITY, base64: true };

/** Returns { uri, name, type, fileData }, or null if the person backed out. */
export const takePhoto = async () => {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Camera permission needed', 'Allow camera access in your phone settings to take a photo.');
    return null;
  }
  return toUpload(await ImagePicker.launchCameraAsync(options));
};

export const choosePhoto = async () => toUpload(await ImagePicker.launchImageLibraryAsync(options));
