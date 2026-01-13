import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Card, Text, Button, ActivityIndicator } from 'react-native-paper';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { jobService } from '../../services/jobService';
import { standardStyles } from '../../theme/theme';

// Note: React Native Maps has limited support in Expo Go
// For full map features, create a development build

export default function MapScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [location, setLocation] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState({
    latitude: 51.5074,
    longitude: -0.1278,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    requestLocationPermission();
    loadJobs();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to show your location on the map'
        );
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);
      setRegion({
        ...region,
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const loadJobs = async () => {
    try {
      setLoading(true);
      const filters = getUserFilters();
      const response = await jobService.getJobs(filters);
      
      if (response.success) {
        setJobs(response.data || []);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserFilters = () => {
    const role = user?.role;
    if (role === 'driver') {
      return { assignedDriverId: user.id, status: 'Assigned' };
    } else if (role === 'delivery_agent') {
      return { status: 'Out for Delivery' };
    }
    return {};
  };

  // Note: This is a simplified version. In production, you'd need to geocode addresses
  // or store coordinates when creating jobs. For now, we'll use placeholder coordinates.
  const getJobCoordinates = (job, index) => {
    // Placeholder: In production, use geocoding service
    return {
      latitude: region.latitude + (index * 0.01),
      longitude: region.longitude + (index * 0.01),
    };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff9800" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={!!location}
        showsMyLocationButton
      >
        {jobs.map((job, index) => {
          const coords = getJobCoordinates(job, index);
          return (
            <Marker
              key={job.id}
              coordinate={coords}
              title={job.trackingId}
              description={job.pickupAddress || job.deliveryAddress}
            />
          );
        })}
      </MapView>

      <Card style={styles.jobsCard} elevation={0}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.jobsTitle}>
            {jobs.length} Job{jobs.length !== 1 ? 's' : ''} on Map
          </Text>
          <Button
            mode="contained"
            onPress={loadJobs}
            style={styles.refreshButton}
          >
            Refresh
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex: 1,
  },
  jobsCard: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    ...standardStyles,
  },
  jobsTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  refreshButton: {
    marginTop: 8,
  },
});

