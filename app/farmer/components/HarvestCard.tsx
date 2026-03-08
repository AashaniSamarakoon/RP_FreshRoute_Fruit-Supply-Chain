import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getFruitMeta, parseImageUrls } from "./cardHelpers";

export interface Harvest {
  id: string;
  fruit_type: string;
  variant: string;
  quantity: number;
  grade: string;
  estimated_harvest_date: string;
  status: string;
  created_at: string;
  price_per_kg: number;
  image_url?: any;
}

interface Props {
  harvest: Harvest;
  proposals: Array<{ status: string }>;
  onPress: () => void;
  onImagePress: (urls: string[]) => void;
  // --- NEW: Props for Order Actions ---
  activeOrderStatus?: string; 
  processing?: boolean;
  onStartPacking?: () => void;
  onMarkReady?: () => void;
}

const PRIMARY_GREEN = "#2E7D32";

const HarvestCard: React.FC<Props> = ({ 
  harvest, 
  proposals, 
  onPress, 
  onImagePress,
  activeOrderStatus,
  processing = false,
  onStartPacking,
  onMarkReady
}) => {
  const fruit = getFruitMeta(harvest.fruit_type);
  const pendingCount = useMemo(
    () => proposals.filter((p) => p.status === "PENDING_FARMER").length,
    [proposals],
  );

  const images = parseImageUrls(harvest.image_url);

  return (
    <View style={styles.card}>
      {/* Pending Notification Badge */}
      {pendingCount > 0 && (
        <View style={styles.cardCountBadge}>
          <Text style={styles.cardCountBadgeText}>{pendingCount}</Text>
        </View>
      )}
      
      {/* Top Section: Clickable to go to details */}
      <TouchableOpacity style={styles.cardStretchContainer} activeOpacity={0.85} onPress={onPress}>
        <TouchableOpacity
          style={styles.imageWrapper}
          activeOpacity={0.8}
          onPress={() => images.length > 0 && onImagePress(images)}
          disabled={images.length === 0}
        >
          {images.length > 0 ? (
            <>
              <Image source={{ uri: images[0] }} style={styles.productImage} />
              {images.length > 1 && (
                <View style={styles.imageCountBadge}>
                  <Ionicons name="image-outline" size={10} color="#fff" style={{ marginRight: 2 }} />
                  <Text style={styles.imageCountText}>+{images.length - 1}</Text>
                </View>
              )}
            </>
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: fruit.bg }]}> 
              <Text style={styles.avatarEmoji}>{fruit.emoji}</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.cardRightColumn}>
          <View style={styles.cardBody}>
            <View style={styles.titleRow}>
              <Text style={styles.cardTitle}>{harvest.fruit_type}</Text>
            </View>
            <Text style={styles.cardSubtitle}>{harvest.variant} · Grade {harvest.grade}</Text>
            <View style={styles.metricsRow}>
              <Text style={styles.metricText}>{harvest.quantity} kg</Text>
            </View>
          </View>
          <View style={styles.chevronPadding}>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </View>
        </View>
      </TouchableOpacity>

      {/* Bottom Section: Action Buttons (Only visible in Processing phases) */}
      {(activeOrderStatus === "AUTHORIZED_PAYMENT" || activeOrderStatus === "PACKING") && (
        <View style={styles.activeOrderFooter}>
          {activeOrderStatus === "AUTHORIZED_PAYMENT" && (
            <TouchableOpacity 
              style={styles.fullWidthBtn} 
              onPress={onStartPacking} 
              disabled={processing}
              activeOpacity={0.8}
            >
              {processing ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="cube-outline" size={18} color="#fff" />
                  <Text style={styles.fullWidthBtnText}>Start Packing</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          
          {activeOrderStatus === "PACKING" && (
            <TouchableOpacity 
              style={styles.fullWidthBtn} 
              onPress={onMarkReady} 
              disabled={processing}
              activeOpacity={0.8}
            >
              {processing ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="checkmark-done-outline" size={18} color="#fff" />
                  <Text style={styles.fullWidthBtnText}>Mark Ready for Pickup</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
    marginBottom: 16,
    overflow: "hidden",
  },
  cardCountBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 22,
    height: 30,
    borderRadius: 11,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    zIndex: 10,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    elevation: 4,
  },
  cardCountBadgeText: { fontSize: 11, fontWeight: "800", color: "#FFFFFF" },

  cardStretchContainer: {
    flexDirection: "row",
    alignItems: "stretch", 
    minHeight: 110,        
  },
  imageWrapper: {
    width: 110,
    backgroundColor: "#F9FAFB",
    borderRightWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  productImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageCountBadge: {
    position: "absolute",
    bottom: 8, 
    right: 8,
    backgroundColor: "rgba(17, 24, 39, 0.75)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  imageCountText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  
  avatarFallback: { 
    ...StyleSheet.absoluteFillObject, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  avatarEmoji: { fontSize: 38 }, 

  cardRightColumn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20, 
    paddingLeft: 16,
  },
  cardBody: { flex: 1 },
  chevronPadding: { paddingRight: 16 },

  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" },
  cardTitle: { fontSize: 17, fontWeight: "800", color: "#111827" },
  cardSubtitle: { fontSize: 14, color: "#6B7280", fontWeight: "500", marginTop: 4, marginBottom: 10 },
  metricsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  metricText: { fontSize: 13, fontWeight: "600", color: "#4B5563" },

  // ─── NEW: Footer & Action Button Styles ───
  activeOrderFooter: {
    padding: 12,
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  fullWidthBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY_GREEN,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  fullWidthBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});

export default React.memo(HarvestCard);