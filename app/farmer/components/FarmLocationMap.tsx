import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTranslationContext } from '../../../context/TranslationContext';

interface FarmLocationMapProps {
  latitude: number;
  longitude: number;
  address: string;
  farmName?: string;
}

export default function FarmLocationMap({
  latitude,
  longitude,
  address,
  farmName,
}: FarmLocationMapProps) {
  const { t } = useTranslationContext();

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('profile.farmLocation')}</Text>
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
        >
          <Marker
            coordinate={{ latitude, longitude }}
            title={farmName || 'Farm Location'}
            description={address}
          />
        </MapView>
      </View>
      <Text style={styles.locationAddress}>{address}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  mapContainer: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    marginBottom: 8,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  locationAddress: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
});
