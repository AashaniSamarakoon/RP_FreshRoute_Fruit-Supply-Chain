import Header from "@/components/Header";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Palette is now strictly monochrome
const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#6B7280";
const BORDER = "#E5E7EB";
const BG_SUBTLE = "#F9FAFB";
const BG_MAIN = "#F3F4F6";

// --- Rich Dummy Data Fallback ---
const RICH_DUMMY_DATA = {
  batchId: "f47304b9-ca94-49bb-b17b-b11993c41cba",
  currentLabel: "In Transit to Buyer",
  farm: {
    name: "Green Valley Organics",
    region: "No. 34 Main Street, Hanwella, WP",
  },
  harvest: {
    fruitType: "Banana",
    variant: "Ambul",
    grade: "A",
    quantityKg: 600,
    harvestDate: "2026-03-08T06:30:00.000Z",
    blockchainTxId: "d48b298c9cc1cd2b9697517dd7c0073740e6ceafc1e78356d458a59cb49a6400",
  },
  economics: {
    fairTradeCertified: true,
    farmerSharePercent: 97.5,
  },
  verification: {
    blockchainNetwork: "Hyperledger Fabric",
    channel: "freshroute-channel",
  },
  timeline: [
    {
      label: "In Transit",
      status: "ON SCHEDULE",
      timestamp: "2026-03-09T14:15:00.000Z",
      phase: "transport",
      txId: "f43e860da9d9006e6313df030519dd8205e40ad5ab3cbb49529163a56ee50719",
    },
    {
      label: "Quality Inspection Passed",
      status: "GRADE A VERIFIED",
      timestamp: "2026-03-09T10:00:00.000Z",
      phase: "quality",
      txId: "e98b298c9cc1cd2b9697517dd7c0073740e6ceafc1e78356d458a59cb49a6401",
    },
    {
      label: "Harvested & Packed",
      status: "FRESH",
      timestamp: "2026-03-08T06:30:00.000Z",
      phase: "harvest",
      txId: "d48b298c9cc1cd2b9697517dd7c0073740e6ceafc1e78356d458a59cb49a6400",
    },
    {
      label: "Order Secured",
      status: "SMART CONTRACT LOCKED",
      timestamp: "2026-03-07T18:20:00.000Z",
      phase: "order",
      txId: "a12b298c9cc1cd2b9697517dd7c0073740e6ceafc1e78356d458a59cb49a6499",
    },
  ],
};

// Helper to determine Timeline Icon and Color based on phase (Now Monochrome)
const getTimelineIcon = (phase: string, isActive: boolean) => {
  const color = isActive ? "#FFFFFF" : TEXT_SECONDARY;
  const containerBg = isActive ? TEXT_PRIMARY : BG_SUBTLE;
  switch (phase?.toLowerCase()) {
    case "transport": return { name: "car-outline", color, containerBg };
    case "quality": return { name: "shield-checkmark-outline", color, containerBg };
    case "harvest": return { name: "leaf-outline", color, containerBg };
    case "order": return { name: "document-text-outline", color, containerBg };
    case "delivery": return { name: "checkmark-done-circle-outline", color, containerBg };
    default: return { name: "link-outline", color, containerBg };
  }
};

export default function JourneyScreen() {
  const params = useLocalSearchParams<{ journey?: string }>();

  const journeyData = useMemo(() => {
    if (params.journey) {
      try {
        return JSON.parse(params.journey as string);
      } catch {
        return RICH_DUMMY_DATA;
      }
    }
    return RICH_DUMMY_DATA;
  }, [params.journey]);

  const { 
    currentLabel, 
    farm, 
    harvest, 
    timeline, 
    economics, 
    verification 
  } = journeyData;

  const truncateHash = (hash: string) => {
    if (!hash) return "N/A";
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Order Journey" showBackButton />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Main Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Product Summary</Text>
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>{currentLabel || "READY"}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <Ionicons name="nutrition-outline" size={18} color={TEXT_SECONDARY} />
            </View>
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>Item</Text>
              <Text style={styles.detailValue}>
                {harvest.fruitType} {harvest.variant ? `(${harvest.variant})` : ""} • Grade {harvest.grade}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <Ionicons name="scale-outline" size={18} color={TEXT_SECONDARY} />
            </View>
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>Quantity</Text>
              <Text style={styles.detailValue}>{harvest.quantityKg.toLocaleString()} kg</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <Ionicons name="location-outline" size={18} color={TEXT_SECONDARY} />
            </View>
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>Origin Farm</Text>
              <Text style={styles.detailValue} numberOfLines={1}>{farm.name || farm.region}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <Ionicons name="calendar-outline" size={18} color={TEXT_SECONDARY} />
            </View>
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>Harvest Date</Text>
              <Text style={styles.detailValue}>
                {new Date(harvest.harvestDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </Text>
            </View>
          </View>
        </View>

        {/* Transparency Card */}
        {(economics || verification) && (
          <View style={styles.card}>
            <Text style={[styles.cardTitle, { marginBottom: 16 }]}>Verified Transparency</Text>
            
            {economics && (
              <View style={styles.ecoBlock}>
                <View style={styles.ecoIconWrapper}>
                  <Ionicons name="leaf" size={20} color={TEXT_PRIMARY} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ecoTitle}>
                    {economics.fairTradeCertified ? "Fair Trade Certified" : "Farmer Compensation"}
                  </Text>
                  <Text style={styles.ecoDesc}>
                    <Text style={{ fontWeight: '800', color: TEXT_PRIMARY }}>{economics.farmerSharePercent}%</Text> of the final value goes directly to the farmer.
                  </Text>
                </View>
              </View>
            )}

            {verification && (
              <View style={styles.blockchainBlock}>
                <View style={styles.blockchainHeader}>
                  <Ionicons name="link" size={18} color={TEXT_PRIMARY} />
                  <Text style={styles.blockchainTitle}>Secured by Blockchain</Text>
                </View>
                <View style={styles.hashRow}>
                  <Text style={styles.hashLabel}>Network</Text>
                  <Text style={styles.hashValue}>{verification.blockchainNetwork}</Text>
                </View>
                <View style={styles.hashRow}>
                  <Text style={styles.hashLabel}>Genesis Tx</Text>
                  <Text style={styles.hashValue}>{truncateHash(harvest.blockchainTxId)}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Enhanced Journey Timeline */}
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { marginBottom: 24 }]}>Journey Timeline</Text>
          
          {Array.isArray(timeline) && timeline.length > 0 ? (
            timeline.map((entry: any, idx: number) => {
              const isLast = idx === timeline.length - 1;
              const isFirst = idx === 0;
              const d = new Date(entry.timestamp);
              const iconMeta = getTimelineIcon(entry.phase, isFirst);

              return (
                <View key={idx} style={styles.timelineRow}>
                  {/* Left: Time */}
                  <View style={styles.timeCol}>
                    <Text style={[styles.timeText, isFirst && styles.activeText]}>
                      {d.toLocaleDateString("en-US", { day: 'numeric', month: 'short' })}
                    </Text>
                    <Text style={styles.timeSubText}>
                      {d.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </Text>
                  </View>

                  {/* Middle: Custom Icon & Line */}
                  <View style={styles.graphicCol}>
                    <View style={[styles.iconContainer, { backgroundColor: iconMeta.containerBg }]}>
                      <Ionicons name={iconMeta.name as any} size={16} color={iconMeta.color} />
                    </View>
                    {!isLast && <View style={[styles.timelineLine, isFirst && { backgroundColor: TEXT_PRIMARY }]} />}
                  </View>

                  {/* Right: Content */}
                  <View style={styles.contentCol}>
                    <Text style={[styles.entryLabel, isFirst && styles.activeText]}>{entry.label}</Text>
                    <Text style={styles.entryDetail}>{entry.status}</Text>
                    {entry.txId && (
                      <View style={styles.txIdBadge}>
                        <Ionicons name="finger-print-outline" size={12} color={TEXT_SECONDARY} />
                        <Text style={styles.entryTxId}>{truncateHash(entry.txId)}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No tracking history available yet.</Text>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: BG_MAIN, 
  },
  content: { 
    padding: 16,
    paddingBottom: 40,
  },

  // Cards
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: TEXT_PRIMARY,
    letterSpacing: 0.3,
  },
  
  statusPill: {
    backgroundColor: BG_SUBTLE,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER
  },
  statusText: {
    color: TEXT_PRIMARY,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Detail Rows with Icons
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  detailIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BG_SUBTLE,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  detailTextCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    fontWeight: "600",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    color: TEXT_PRIMARY,
    fontWeight: "700",
  },

  // Info Blocks (Monochrome boxes)
  ecoBlock: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  ecoIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BG_SUBTLE,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  ecoTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: TEXT_PRIMARY,
    marginBottom: 4,
  },
  ecoDesc: {
    fontSize: 14,
    color: TEXT_PRIMARY,
    lineHeight: 20,
  },
  
  blockchainBlock: {
    backgroundColor: BG_SUBTLE,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  blockchainHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  blockchainTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: TEXT_PRIMARY,
  },
  hashRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },
  hashLabel: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    fontWeight: "600",
  },
  hashValue: {
    fontSize: 13,
    color: TEXT_PRIMARY,
    fontWeight: "600",
    fontFamily: "monospace",
  },

  // Enhanced Timeline
  timelineRow: {
    flexDirection: "row",
    minHeight: 80,
  },
  timeCol: {
    width: 70,
    paddingRight: 16,
    alignItems: "flex-end",
    paddingTop: 4,
  },
  timeText: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT_SECONDARY,
  },
  timeSubText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
    marginTop: 2,
  },
  graphicCol: {
    width: 32,
    alignItems: "center",
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    borderWidth: 1,
    borderColor: BORDER,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: BORDER,
    marginTop: -4,
    marginBottom: -4,
    zIndex: 1,
  },
  contentCol: {
    flex: 1,
    paddingLeft: 16,
    paddingBottom: 28,
  },
  entryLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: TEXT_SECONDARY,
    marginBottom: 2,
  },
  activeText: {
    color: TEXT_PRIMARY,
    fontWeight: "800",
  },
  entryDetail: {
    fontSize: 13,
    color: TEXT_PRIMARY,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 4,
  },
  txIdBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BG_SUBTLE,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: BORDER,
  },
  entryTxId: {
    fontSize: 11,
    color: TEXT_SECONDARY,
    fontFamily: "monospace",
    fontWeight: "600",
  },
  emptyText: {
    color: TEXT_SECONDARY,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    paddingVertical: 10,
  }
});