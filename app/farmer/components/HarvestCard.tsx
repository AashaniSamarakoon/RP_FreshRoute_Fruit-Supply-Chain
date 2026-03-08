import { formatCurrency } from "@/utils/formatters";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getFruitMeta, ORDER_STATUS_META, parseImageUrls } from "./cardHelpers";

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
  // --- Props for Order Actions ---
  activeOrderStatus?: string; 
  processing?: boolean;
  onStartPacking?: () => void;
  onMarkReady?: () => void;
  earning?: number | null;
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
  onMarkReady,
  earning,
}) => {
  const fruit = getFruitMeta(harvest.fruit_type);
  const pendingCount = useMemo(
    () => proposals.filter((p) => p.status === "PENDING_FARMER").length,
    [proposals],
  );

  const images = parseImageUrls(harvest.image_url);
  
  // Determine if it's an Active Order phase or just a standard Harvest
  const statusMeta = activeOrderStatus 
    ? ORDER_STATUS_META[activeOrderStatus] 
    : (harvest.status === "OPEN" ? { label: "OPEN", color: "#B45309", bg: "#FEF3C7" } : 
       harvest.status === "RESERVED" ? { label: "RESERVED", color: "#0F766E", bg: "#CCFBF1" } : null);

  const formattedDate = new Date(harvest.estimated_harvest_date).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric"
  });

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
            
            {/* Title & Status Badge cleanly aligned */}
            <View style={styles.titleRow}>
              <Text style={styles.cardTitle}>{harvest.fruit_type}</Text>
              {statusMeta && (
                <View style={[styles.statusPill, { backgroundColor: statusMeta.bg }]}>
                  <Text style={[styles.statusLabel, { color: statusMeta.color }]}>
                    {statusMeta.label}
                  </Text>
                </View>
              )}
            </View>
            
            <Text style={styles.cardSubtitle}>{harvest.variant} · Grade {harvest.grade}</Text>
            
            {/* Outline Box Chips restored exactly like the first image */}
            <View style={styles.metricsRow}>
              <View style={styles.metricChip}>
                <Ionicons name="scale-outline" size={12} color="#6B7280" />
                <Text style={styles.metricText}>{harvest.quantity} kg</Text>
              </View>
              <View style={styles.metricChip}>
                <Ionicons name="calendar-outline" size={12} color="#6B7280" />
                <Text style={styles.metricText}>{formattedDate}</Text>
              </View>
            </View>
            
            {/* Net Earning (Only displays in order tabs) */}
            {earning != null && (
              <View style={styles.earningRow}>
                <Text style={styles.earningLabel}>Earning</Text>
                <Text style={styles.earningValue}>Rs. {formatCurrency(earning)}</Text>
              </View>
            )}
          </View>
          <View style={styles.chevronPadding}>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </View>
        </View>
      </TouchableOpacity>

      {/* Bottom Section: Action Buttons (Only visible in Authorized / Packing phases) */}
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
                  <Text style={styles.fullWidthBtnText}>Make ready for pickup</Text>
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
    height: 22,
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

  // Restored fixed proportions so the image never blows up
  cardStretchContainer: {
    flexDirection: "row",
    alignItems: "stretch", 
    minHeight: 110,        
  },
  imageWrapper: {
    width: 120, // Slightly wider for a beautiful aesthetic
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
    paddingVertical: 16, 
    paddingLeft: 16,
  },
  cardBody: { flex: 1 },
  chevronPadding: { paddingRight: 16 },

  titleRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" },
  cardTitle: { fontSize: 17, fontWeight: "800", color: "#111827" },
  
  // Status Pill Inline Styles
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusLabel: { fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  
  cardSubtitle: { fontSize: 14, color: "#6B7280", fontWeight: "500", marginTop: 2, marginBottom: 12 },
  
  // Restored Gray Metric Chips
  metricsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metricChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  metricText: { fontSize: 12, fontWeight: "600", color: "#4B5563" },

  earningRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderStyle: "dashed",
    borderColor: "#E5E7EB",
  },
  earningLabel: { fontSize: 13, color: "#6B7280", fontWeight: "600" },
  earningValue: { fontSize: 14, color: "#111827", fontWeight: "800" },

  // ─── Footer Action Button Styles (Prevents Stretched Images) ───
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