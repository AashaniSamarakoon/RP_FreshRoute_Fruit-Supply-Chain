import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BACKEND_URL } from "../../config";
import {
  openGoogleMapsToLocation,
  verifyLocation,
} from "../../utils/locationVerification";

const TOTAL_IMAGES = 5;

export default function FruitGrading() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const jobId = params.job_id as string;
  const orderId = params.order_id as string;
  const pickupLat = params.pickup_lat ? parseFloat(params.pickup_lat as string) : null;
  const pickupLng = params.pickup_lng ? parseFloat(params.pickup_lng as string) : null;
  
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [capturedImagesBase64, setCapturedImagesBase64] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [flashlightEnabled, setFlashlightEnabled] = useState(false);
  const [gridEnabled, setGridEnabled] = useState(false);
  const [showSettingsTray, setShowSettingsTray] = useState(false);
  const [showVerifyingPopup, setShowVerifyingPopup] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [farmerDeclaredGrade, setFarmerDeclaredGrade] = useState<string>("Grade A");
  
  // Location verification state
  const [showLocationVerification, setShowLocationVerification] = useState(false);
  const [isVerifyingLocation, setIsVerifyingLocation] = useState(false);
  const [locationVerified, setLocationVerified] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationDistance, setLocationDistance] = useState<number | null>(null);
  const locationScanAnimation = useRef(new Animated.Value(0)).current;
  
  const trayAnimation = useRef(new Animated.Value(0)).current;
  const scanAnimation = useRef(new Animated.Value(0)).current;
  const cameraRef = useRef<CameraView>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userJson = await AsyncStorage.getItem("user");
        if (!userJson) {
          router.replace("/login");
          return;
        }
        const user = JSON.parse(userJson);
        if (user.role !== "transporter") {
          Alert.alert("Access Denied", "This page is only for transporters");
          router.back();
          return;
        }
        setIsAuthenticated(true);
        
        // Get farmer's declared grade (mock for now - in real app, fetch from order data)
        // TODO: Fetch from order data using orderId
        setFarmerDeclaredGrade("Grade A");
        
        // Start location verification if pickup location is provided
        if (pickupLat !== null && pickupLng !== null) {
          setShowLocationVerification(true);
          handleVerifyLocation();
        } else {
          // If no pickup location, allow capture (for testing)
          setLocationVerified(true);
        }
      } catch (e) {
        router.replace("/login");
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, [router, pickupLat, pickupLng]);

  useEffect(() => {
    Animated.spring(trayAnimation, {
      toValue: showSettingsTray ? 1 : 0,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, [showSettingsTray, trayAnimation]);

  useEffect(() => {
    if (showVerifyingPopup) {
      // Start scanning animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnimation, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scanAnimation.setValue(0);
    }
  }, [showVerifyingPopup, scanAnimation]);

  useEffect(() => {
    if (isVerifyingLocation) {
      // Start location scanning animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(locationScanAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(locationScanAnimation, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      locationScanAnimation.setValue(0);
    }
  }, [isVerifyingLocation, locationScanAnimation]);

  useEffect(() => {
    const setAudioMode = async () => {
      try {
        if (soundEnabled) {
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            shouldDuckAndroid: false,
          });
        } else {
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: false,
            shouldDuckAndroid: true,
          });
        }
      } catch (error) {
        console.log("Audio mode setting error:", error);
      }
    };
    setAudioMode();
  }, [soundEnabled]);

  const handleVerifyLocation = async () => {
    if (pickupLat === null || pickupLng === null) {
      setLocationVerified(true);
      setShowLocationVerification(false);
      return;
    }

    setIsVerifyingLocation(true);
    setLocationError(null);

    // Use utility function to verify location
    const result = await verifyLocation(pickupLat, pickupLng, 100);

    setLocationDistance(result.distance);

    if (result.success) {
      // Location matches
      setLocationVerified(true);
      setLocationError(null);
      setIsVerifyingLocation(false);
      // Close popup after short delay
      setTimeout(() => {
        setShowLocationVerification(false);
      }, 1000);
    } else {
      // Location doesn't match or error occurred
      setLocationError(result.error || "Location verification failed.");
      setIsVerifyingLocation(false);
    }
  };

  const handleOpenGoogleMaps = () => {
    openGoogleMapsToLocation(pickupLat, pickupLng);
  };

  const takePicture = async () => {
    if (!cameraRef.current || capturedImages.length >= TOTAL_IMAGES) return;
    
    // Prevent capture if location not verified
    if (!locationVerified) {
      Alert.alert("Location Not Verified", "Please verify your location first before capturing images.");
      return;
    }

    try {
      // Provide haptic feedback when sound is muted
      if (!soundEnabled) {
        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (e) {
          // Silent fail if haptics not available
        }
      }

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
        skipProcessing: false,
      });

      if (photo?.uri) {
        setCapturedImages([...capturedImages, photo.uri]);
        // Store base64 for later use
        if (photo.base64) {
          setCapturedImagesBase64([...capturedImagesBase64, photo.base64]);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to capture image");
    }
  };

  const toggleSound = async () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    
    // Update audio mode immediately
    try {
      if (newValue) {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          shouldDuckAndroid: false,
        });
      } else {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: false,
          shouldDuckAndroid: true,
        });
      }
    } catch (error) {
      console.log("Audio mode update error:", error);
    }
    
    // Note: Camera shutter sound is typically controlled by device system settings
    // This toggle provides haptic feedback when muted as an alternative
  };

  const toggleFlashlight = () => {
    setFlashlightEnabled(!flashlightEnabled);
  };

  const toggleGrid = () => {
    setGridEnabled(!gridEnabled);
  };

  const toggleSettingsTray = () => {
    setShowSettingsTray(!showSettingsTray);
  };

  const removeImage = (index: number) => {
    const newImages = capturedImages.filter((_, i) => i !== index);
    const newBase64Images = capturedImagesBase64.filter((_, i) => i !== index);
    setCapturedImages(newImages);
    setCapturedImagesBase64(newBase64Images);
  };

  const handleVerify = async () => {
    if (capturedImages.length !== TOTAL_IMAGES) {
      Alert.alert(
        "Incomplete",
        `Please capture all ${TOTAL_IMAGES} images before verifying.`
      );
      return;
    }

    setShowVerifyingPopup(true);
    setIsVerifying(true);

    // Set a timeout to prevent infinite waiting (30 seconds max)
    timeoutRef.current = setTimeout(() => {
      console.error("⏱️ Verification timeout - taking too long");
      setIsVerifying(false);
      setShowVerifyingPopup(false);
      Alert.alert(
        "Timeout",
        "Verification is taking too long. Please try again."
      );
    }, 30000);

    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      // Use farmer's declared grade from state (set in useEffect)

      // Prepare FormData for backend API call
      const formData = new FormData();
      capturedImages.forEach((uri: string, index: number) => {
        formData.append("images", {
          uri,
          type: "image/jpeg",
          name: `fruit_${index + 1}.jpg`,
        } as any);
      });

      // Call the fruit grading API endpoint
      console.log("📤 Sending request to:", `${BACKEND_URL}/api/fruit-grading/predict`);
      console.log("📤 Number of images:", capturedImages.length);

      const response = await fetch(`${BACKEND_URL}/api/fruit-grading/predict`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      console.log("📥 Response status:", response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ API Error Response:", errorData);
        throw new Error(
          errorData.message || `API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("✅ Backend Response:", JSON.stringify(data, null, 2));
      console.log("✅ Predictions count:", data.predictions?.length || 0);

      if (!data.success || !data.predictions) {
        console.error("❌ Invalid response structure:", data);
        throw new Error("Invalid response from server");
      }

      // Map backend response to frontend format
      const results = capturedImages.map((uri: string, index: number) => {
        const prediction = data.predictions[index];
        console.log(`📊 Prediction ${index + 1}:`, {
          predictedClass: prediction?.predictedClass,
          confidence: prediction?.confidence,
        });
        // Normalize grade format: "Grade_A" -> "Grade A"
        const detectedGrade =
          prediction?.predictedClass?.replace(/_/g, " ") || "Grade A";
        return {
          imageUri: uri,
          detectedGrade,
          confidence: prediction?.confidence || 0,
        };
      });

      console.log("✅ Mapped Results:", JSON.stringify(results, null, 2));

      // Clear timeout since we got a response
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Close popup first
      setIsVerifying(false);
      setShowVerifyingPopup(false);

      // Small delay to ensure popup closes before navigation
      await new Promise((resolve) => setTimeout(resolve, 100));

      try {
        // Pass image URIs instead of base64 to avoid storage issues
        // URIs are small strings (file paths), base64 will be generated when saving
        const params: Record<string, string> = {
          results: JSON.stringify(results),
          farmerGrade: farmerDeclaredGrade || "Grade A",
          job_id: jobId || "",
          order_id: orderId || "",
          imageUris: JSON.stringify(capturedImages), // Pass file URIs instead of base64
        };

        console.log("🚀 Navigating to verification results...");
        
        // Navigate to results page
        router.push({
          pathname: "/transporter/verification-results",
          params,
        });
      } catch (navError) {
        console.error("❌ Navigation error:", navError);
        Alert.alert(
          "Navigation Error",
          "Failed to navigate to results page. Please try again."
        );
      }
    } catch (error) {
      console.error("Verification error:", error);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsVerifying(false);
      setShowVerifyingPopup(false);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to verify images. Please try again."
      );
    }
  };

  if (checkingAuth) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.message}>We need your permission to use the camera</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          enableTorch={flashlightEnabled}
        >
          <View style={styles.overlay}>
            {showSettingsTray && (
              <TouchableOpacity
                style={styles.trayBackdrop}
                activeOpacity={1}
                onPress={() => setShowSettingsTray(false)}
              />
            )}
            <View style={styles.topBar}>
              <View style={styles.settingsContainer}>
                <TouchableOpacity
                  style={styles.settingsButton}
                  onPress={toggleSettingsTray}
                >
                  <MaterialIcons name="settings" size={24} color="#fff" />
                </TouchableOpacity>

                <Animated.View
                  style={[
                    styles.settingsTray,
                    {
                      opacity: trayAnimation,
                      transform: [
                        {
                          scaleX: trayAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 1],
                          }),
                        },
                        {
                          translateX: trayAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-20, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.trayIconButton,
                      soundEnabled && styles.trayIconButtonActive,
                    ]}
                    onPress={toggleSound}
                  >
                    <MaterialIcons
                      name={soundEnabled ? "volume-up" : "volume-off"}
                      size={24}
                      color={soundEnabled ? "#fff" : "#ccc"}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.trayIconButton,
                      flashlightEnabled && styles.trayIconButtonActive,
                    ]}
                    onPress={toggleFlashlight}
                  >
                    <MaterialIcons
                      name={flashlightEnabled ? "flash-on" : "flash-off"}
                      size={24}
                      color={flashlightEnabled ? "#fff" : "#ccc"}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.trayIconButton,
                      gridEnabled && styles.trayIconButtonActive,
                    ]}
                    onPress={toggleGrid}
                  >
                    <MaterialIcons
                      name="grid-on"
                      size={24}
                      color={gridEnabled ? "#fff" : "#ccc"}
                    />
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>

            {gridEnabled && (
              <View style={styles.gridOverlay}>
                <View style={styles.gridLineVertical1} />
                <View style={styles.gridLineVertical2} />
                <View style={styles.gridLineHorizontal1} />
                <View style={styles.gridLineHorizontal2} />
              </View>
            )}
          </View>
        </CameraView>
      </View>

      <View
        style={[
          styles.progressContainerBottom,
          {
            paddingBottom: capturedImages.length > 0 ? 276 : 180,
          },
        ]}
      >
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Capture {TOTAL_IMAGES} fruit images - {capturedImages.length}/{TOTAL_IMAGES}
          </Text>
        </View>
      </View>

      <View style={styles.bottomSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.thumbnailContainer}
        >
          {capturedImages.map((uri, index) => (
            <View key={index} style={styles.thumbnailWrapper}>
              <Image source={{ uri }} style={styles.thumbnail} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeImage(index)}
              >
                <Text style={styles.removeButtonText}>×</Text>
              </TouchableOpacity>
              <Text style={styles.thumbnailLabel}>{index + 1}/{TOTAL_IMAGES}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.captureButton,
              capturedImages.length >= TOTAL_IMAGES && styles.captureButtonDisabled,
            ]}
            onPress={takePicture}
            disabled={capturedImages.length >= TOTAL_IMAGES}
          >
            <Text style={styles.captureButtonText}>
              {capturedImages.length >= TOTAL_IMAGES
                ? "All Images Captured"
                : "Capture Image"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.verifyButton,
              capturedImages.length !== TOTAL_IMAGES && styles.verifyButtonDisabled,
            ]}
            onPress={handleVerify}
            disabled={capturedImages.length !== TOTAL_IMAGES}
          >
            <Text style={styles.verifyButtonText}>Verify Quality</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Location Verification Popup */}
      {showLocationVerification && (
        <View style={styles.verifyingOverlay}>
          <View style={styles.verifyingPopup}>
            {isVerifyingLocation ? (
              <>
                <View style={styles.scanningContainer}>
                  <View style={styles.scanningFrame}>
                    <Animated.View
                      style={[
                        styles.scanningBeam,
                        {
                          opacity: locationScanAnimation.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: [0.4, 1, 0.4],
                          }),
                          transform: [
                            {
                              translateY: locationScanAnimation.interpolate({
                                inputRange: [0, 1],
                                outputRange: [-50, 50],
                              }),
                            },
                          ],
                        },
                      ]}
                    />
                    <Animated.View
                      style={[
                        styles.scanningCircle,
                        {
                          transform: [
                            {
                              rotate: locationScanAnimation.interpolate({
                                inputRange: [0, 1],
                                outputRange: ["0deg", "360deg"],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <MaterialIcons name="location-on" size={40} color="#2f855a" />
                    </Animated.View>
                  </View>
                </View>
                <Text style={styles.verifyingText}>Verifying location…</Text>
              </>
            ) : locationError ? (
              <>
                <MaterialIcons name="location-off" size={64} color="#e53e3e" />
                <Text style={styles.verifyingText}>Location Not Matching</Text>
                <Text style={styles.locationErrorText}>{locationError}</Text>
                {locationDistance !== null && (
                  <Text style={styles.distanceText}>
                    Distance: {locationDistance < 1000 
                      ? `${locationDistance.toFixed(0)}m` 
                      : `${(locationDistance / 1000).toFixed(2)} km`}
                  </Text>
                )}
                <View style={styles.locationButtonContainer}>
                  <TouchableOpacity
                    style={styles.goToLocationButton}
                    onPress={handleOpenGoogleMaps}
                  >
                    <View style={styles.goToLocationButtonContent}>
                      <Text style={styles.buttonText}>Go to Correct Location</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={handleVerifyLocation}
                  >
                    <View style={styles.retryButtonContent}>
                      <Text style={styles.buttonText}>Retry</Text>
                    </View>
                  </TouchableOpacity>
                </View>
                {/* Cancel button for testing */}
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowLocationVerification(false);
                    setLocationVerified(true); // Bypass for testing
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel (Testing)</Text>
                </TouchableOpacity>
              </>
            ) : locationVerified ? (
              <>
                <MaterialIcons name="check-circle" size={64} color="#2f855a" />
                <Text style={styles.verifyingText}>Location Verified</Text>
              </>
            ) : null}
          </View>
        </View>
      )}

      {/* Verifying Popup */}
      {showVerifyingPopup && (
        <View style={styles.verifyingOverlay}>
          <View style={styles.verifyingPopup}>
            <View style={styles.scanningContainer}>
              <View style={styles.scanningFrame}>
                <Animated.View
                  style={[
                    styles.scanningBeam,
                    {
                      opacity: scanAnimation.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.4, 1, 0.4],
                      }),
                      transform: [
                        {
                          translateY: scanAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-50, 50],
                          }),
                        },
                      ],
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.scanningCircle,
                    {
                      transform: [
                        {
                          rotate: scanAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["0deg", "360deg"],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <MaterialIcons name="image-search" size={40} color="#2f855a" />
                </Animated.View>
              </View>
            </View>
            <Text style={styles.verifyingText}>Verifying fruit grade…</Text>
            {isVerifying && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = null;
                  }
                  setIsVerifying(false);
                  setShowVerifyingPopup(false);
                  Alert.alert("Cancelled", "Verification cancelled.");
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  trayBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    zIndex: 5,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-start",
    paddingTop: 10,
    paddingRight: 20,
    position: "relative",
  },
  progressContainerBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingBottom: 180,
    zIndex: 1,
    pointerEvents: "none",
  },
  progressContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
    pointerEvents: "none",
  },
  settingsContainer: {
    position: "relative",
    zIndex: 20,
    alignItems: "center",
  },
  settingsButton: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  settingsTray: {
    position: "absolute",
    top: 0,
    right: 54,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderTopLeftRadius: 22,
    borderBottomLeftRadius: 22,
    borderTopRightRadius: 22,
    borderBottomRightRadius: 22,
    padding: 8,
    flexDirection: "row",
    gap: 8,
    height: 44,
    alignItems: "center",
    overflow: "hidden",
  },
  trayIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  trayIconButtonActive: {
    backgroundColor: "#2f855a",
  },
  gridOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
  },
  gridLineVertical1: {
    position: "absolute",
    left: "33.33%",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  gridLineVertical2: {
    position: "absolute",
    left: "66.66%",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  gridLineHorizontal1: {
    position: "absolute",
    top: "33.33%",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  gridLineHorizontal2: {
    position: "absolute",
    top: "66.66%",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  progressText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  bottomSection: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  thumbnailContainer: {
    marginBottom: 16,
  },
  thumbnailWrapper: {
    marginRight: 12,
    position: "relative",
    paddingTop: 4,
    paddingRight: 4,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#2f855a",
  },
  removeButton: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#e53e3e",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  removeButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    lineHeight: 20,
  },
  thumbnailLabel: {
    marginTop: 4,
    fontSize: 12,
    textAlign: "center",
    color: "#666",
  },
  buttonContainer: {
    gap: 12,
  },
  captureButton: {
    backgroundColor: "#2f855a",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  captureButtonDisabled: {
    backgroundColor: "#ccc",
  },
  captureButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  verifyButton: {
    backgroundColor: "#2f855a",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  verifyButtonDisabled: {
    backgroundColor: "#ccc",
  },
  verifyButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#2f855a",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    width: "100%",
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  verifyingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  verifyingPopup: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    minWidth: 240,
    maxWidth: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  scanningContainer: {
    width: 140,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    position: "relative",
  },
  scanningFrame: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#2f855a",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
    backgroundColor: "rgba(47, 133, 90, 0.05)",
  },
  scanningBeam: {
    position: "absolute",
    width: "100%",
    height: 3,
    backgroundColor: "#2f855a",
    shadowColor: "#2f855a",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  scanningCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(47, 133, 90, 0.1)",
  },
  verifyingText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#11181C",
    textAlign: "center",
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#e53e3e",
    borderRadius: 8,
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  locationErrorText: {
    marginTop: 12,
    marginBottom: 8,
    fontSize: 14,
    color: "#e53e3e",
    textAlign: "center",
    paddingHorizontal: 16,
  },
  distanceText: {
    marginBottom: 20,
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    textAlign: "center",
  },
  locationButtonContainer: {
    width: "100%",
    gap: 12,
  },
  goToLocationButton: {
    backgroundColor: "#2f855a",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    minHeight: 52,
  },
  goToLocationButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  retryButton: {
    backgroundColor: "#3182ce",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    minHeight: 52,
  },
  retryButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
});

