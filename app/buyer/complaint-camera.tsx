import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  ActivityIndicator,
  Animated,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { BACKEND_URL } from "../../config";

const TOTAL_IMAGES = 5;

export default function ComplaintCamera() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [flashlightEnabled, setFlashlightEnabled] = useState(false);
  const [gridEnabled, setGridEnabled] = useState(false);
  const [showSettingsTray, setShowSettingsTray] = useState(false);
  const [showVerifyingPopup, setShowVerifyingPopup] = useState(false);
  const trayAnimation = useRef(new Animated.Value(0)).current;
  const scanAnimation = useRef(new Animated.Value(0)).current;
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userJson = await AsyncStorage.getItem("user");
        if (!userJson) {
          router.replace("/login");
          return;
        }
        const user = JSON.parse(userJson);
        if (user.role !== "buyer") {
          router.replace("/buyer");
          return;
        }
        setIsAuthenticated(true);
      } catch (e) {
        router.replace("/login");
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, [router]);

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

  const takePicture = async () => {
    if (!cameraRef.current || capturedImages.length >= TOTAL_IMAGES) return;

    try {
      if (!soundEnabled) {
        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (e) {}
      }

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
        skipProcessing: false,
      });

      if (photo?.uri) {
        setCapturedImages([...capturedImages, photo.uri]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to capture image");
    }
  };

  const removeImage = (index: number) => {
    const newImages = capturedImages.filter((_, i) => i !== index);
    setCapturedImages(newImages);
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

    try {
      // Simulate verification
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setShowVerifyingPopup(false);

      // Navigate to final complaint received page
      router.push({
        pathname: "/buyer/complaint-received",
        params: {
          orderId: params.orderId as string,
          reason: params.reason as string,
          description: params.description as string,
          date: params.date as string,
          images: JSON.stringify(capturedImages),
        },
      });
    } catch (error) {
      console.error("Verification error:", error);
      setShowVerifyingPopup(false);
      Alert.alert("Error", "Failed to verify images. Please try again.");
    }
  };

  const toggleSound = async () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
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
            Capture {TOTAL_IMAGES} images - {capturedImages.length}/{TOTAL_IMAGES}
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
            <Text style={styles.verifyButtonText}>Verify</Text>
          </TouchableOpacity>
        </View>
      </View>

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
            <Text style={styles.verifyingText}>Verifying images…</Text>
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
    borderTopRightRadius: 22,
    borderBottomLeftRadius: 22,
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
    minWidth: 280,
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
});

