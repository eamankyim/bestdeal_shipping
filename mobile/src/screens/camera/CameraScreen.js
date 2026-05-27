import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Button, Text, Card, ActivityIndicator } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { jobService } from '../../services/jobService';

export default function CameraScreen({ route, navigation }) {
  const { jobId, type, onComplete } = route.params;
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef(null);
  
  React.useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  const takePicture = async () => {
    if (cameraRef.current && permission?.granted) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });
        setPhoto(photo.uri);
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!photo) {
      Alert.alert('Error', 'Please take or select a photo');
      return;
    }

    setLoading(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('photo', {
        uri: photo,
        type: 'image/jpeg',
        name: 'proof.jpg',
      });

      // Update job status with proof
      const newStatus =
        type === 'collection' ? 'Collected' : 'Delivered';
      const response = await jobService.updateJobStatus(jobId, newStatus, {
        proofPhoto: photo,
      });

      if (response.success) {
        Alert.alert('Success', 'Status updated successfully!', [
          {
            text: 'OK',
            onPress: () => {
              if (onComplete) onComplete();
              navigation.goBack();
            },
          },
        ]);
      } else {
        Alert.alert('Error', 'Failed to update status');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload proof');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ff9800" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Card style={styles.card} elevation={0}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.errorText}>
              Camera permission is required
            </Text>
            <Text variant="bodyMedium" style={styles.errorSubtext}>
              Please grant camera permission to capture proof photos
            </Text>
            <Button
              mode="contained"
              onPress={requestPermission}
              style={styles.button}
            >
              Grant Permission
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {photo ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: photo }} style={styles.preview} />
          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={() => setPhoto(null)}
              style={styles.button}
            >
              Retake
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              Submit
            </Button>
          </View>
        </View>
      ) : (
        <>
          <CameraView ref={cameraRef} style={styles.camera} facing="back">
            <View style={styles.cameraControls}>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={takePicture}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          </CameraView>
          <Card style={styles.optionsCard} elevation={0}>
            <Card.Content>
              <Button
                mode="outlined"
                onPress={pickImage}
                icon="image"
                style={styles.button}
              >
                Choose from Gallery
              </Button>
            </Card.Content>
          </Card>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingBottom: 40,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ff9800', // Orange
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  preview: {
    flex: 1,
    resizeMode: 'contain',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#000',
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  optionsCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  card: {
    margin: 20,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#8c8c8c',
  },
});

