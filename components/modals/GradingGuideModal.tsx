import { BuyerColors } from "@/constants/theme";
import React from "react";
import {
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X } from "lucide-react-native";

export type FruitTypeId = "mango_tjc" | "banana" | "pineapple";

interface GradeRequirement {
  grade: "A" | "B" | "C";
  title: string;
  requirements: string[];
  /** Optional image for this grade (e.g. require() for local asset). */
  image?: number;
}

interface FruitGradingGuide {
  id: FruitTypeId;
  label: string;
  grades: GradeRequirement[];
}

const GRADING_GUIDE: FruitGradingGuide[] = [
  {
    id: "mango_tjc",
    label: "Mango (TJC)",
    grades: [
      {
        grade: "A",
        title: "Grade A",
        image: require("../../assets/images/grade_A_mango.jpg"),
        requirements: [
          "Premium quality; uniform colour.",
          "Free from blemishes, scars and disease.",
          "Minimum 85% maturity; firm, typical aroma.",
          "Suitable for export and premium retail.",
        ],
      },
      {
        grade: "B",
        title: "Grade B",
        image: require("../../assets/images/grade_B_mango.jpg"),
        requirements: [
          "Good quality; minor skin defects allowed.",
          "Minimum 75% maturity; suitable for retail.",
          "May have small / medium surface marks only.",
          "Minor blemishes acceptable.",
        ],
      },
      {
        grade: "C",
        title: "Grade C",
        image: require("../../assets/images/grade_C_mango.jpg"),
        requirements: [
          "Standard quality; some defects allowed.",
          "Minimum 65% maturity.",
          "Suitable for processing or bulk use.",
          "May have medium / large surface marks only.",
        ],
      },
    ],
  },
  {
    id: "banana",
    label: "Banana",
    grades: [
      {
        grade: "A",
        title: "Grade A",
        requirements: [
          "Premium; uniform bunch and finger size.",
          "Colour as per specification (green to yellow).",
          "No bruises, cuts or disease.",
          "Minimum 85% maturity; firm, clean hands.",
        ],
      },
      {
        grade: "B",
        title: "Grade B",
        requirements: [
          "Good quality; minor defects allowed.",
          "Slight variation in size and colour.",
          "Minimum 75% maturity.",
          "Suitable for retail and ripening.",
        ],
      },
      {
        grade: "C",
        title: "Grade C",
        requirements: [
          "Standard; more defects and variation allowed.",
          "Minimum 65% maturity.",
          "Suitable for ripening or processing.",
          "Bruises and small scars acceptable.",
        ],
      },
    ],
  },
  {
    id: "pineapple",
    label: "Pineapple",
    grades: [
      {
        grade: "A",
        title: "Grade A",
        requirements: [
          "Premium; uniform shape and size.",
          "Golden colour; no sunburn or internal browning.",
          "Minimum 85% maturity; sweet, firm flesh.",
          "Crown intact; suitable for fresh cut.",
        ],
      },
      {
        grade: "B",
        title: "Grade B",
        requirements: [
          "Good quality; minor external defects allowed.",
          "Slight size variation acceptable.",
          "Minimum 75% maturity.",
          "Suitable for retail and food service.",
        ],
      },
      {
        grade: "C",
        title: "Grade C",
        requirements: [
          "Standard; some defects allowed.",
          "Minimum 65% maturity.",
          "Suitable for juice or processing.",
          "Size and shape variation acceptable.",
        ],
      },
    ],
  },
];

const GRADE_COLORS: Record<string, { bg: string; text: string }> = {
  A: { bg: "#E8F5E9", text: BuyerColors.primaryGreen },
  B: { bg: "#FFF8E1", text: "#F57C00" },
  C: { bg: "#FBE9E7", text: "#D84315" },
};

function mapFruitNameToGuideId(fruitName: string | null): FruitTypeId | null {
  if (!fruitName || typeof fruitName !== "string") return null;
  const lower = fruitName.toLowerCase();
  if (lower.includes("mango")) return "mango_tjc";
  if (lower.includes("banana")) return "banana";
  if (lower.includes("pineapple")) return "pineapple";
  return null;
}

interface GradingGuideModalProps {
  visible: boolean;
  onClose: () => void;
  selectedFruitType: string | null;
}

export default function GradingGuideModal({
  visible,
  onClose,
  selectedFruitType,
}: GradingGuideModalProps) {
  const guideId = mapFruitNameToGuideId(selectedFruitType);
  const current = guideId
    ? GRADING_GUIDE.find((f) => f.id === guideId)
    : null;

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <SafeAreaView style={styles.safe} edges={["top"]}>
            <View style={styles.header}>
              <Text style={styles.title}>
                Grading Guide{current ? ` — ${current.label}` : ""}
              </Text>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <X size={24} color={BuyerColors.textBlack} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {current ? current.grades.map((g) => {
                const colors = GRADE_COLORS[g.grade] || GRADE_COLORS.A;
                return (
                  <View key={g.grade} style={styles.gradeCard}>
                    <View
                      style={[
                        styles.gradeBadge,
                        { backgroundColor: colors.bg },
                      ]}
                    >
                      <Text style={[styles.gradeBadgeText, { color: colors.text }]}>
                        {g.title}
                      </Text>
                    </View>
                    {g.image != null ? (
                      <View style={styles.gradeImageWrap}>
                        <Image
                          source={g.image}
                          style={styles.gradeImage}
                          resizeMode="cover"
                          accessibilityLabel={`${g.title} example`}
                        />
                      </View>
                    ) : null}
                    <View style={styles.requirementsList}>
                      {g.requirements.map((req, idx) => (
                        <View key={idx} style={styles.requirementRow}>
                          <View style={[styles.bullet, { backgroundColor: colors.text }]} />
                          <Text style={styles.requirementText}>{req}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              }) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    Select a fruit type above to view its grading guide.
                  </Text>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: SCREEN_HEIGHT * 0.85,
  },
  safe: { flex: 1, minHeight: 0 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: BuyerColors.textBlack,
  },
  closeBtn: { padding: 4 },
  scroll: { flex: 1, minHeight: 0 },
  scrollContent: { padding: 20, paddingBottom: 32 },
  emptyState: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    fontSize: 15,
    color: BuyerColors.textGray,
    textAlign: "center",
  },
  gradeCard: {
    marginBottom: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#eee",
    overflow: "hidden",
    backgroundColor: "#fafafa",
  },
  gradeImageWrap: {
    paddingHorizontal: 14,
    paddingTop: 8,
    alignItems: "center",
  },
  gradeImage: {
    width: "100%",
    maxWidth: 280,
    height: 160,
    borderRadius: 10,
    backgroundColor: "#eee",
  },
  gradeBadge: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  gradeBadgeText: {
    fontSize: 16,
    fontWeight: "800",
  },
  requirementsList: { padding: 14, paddingTop: 8 },
  requirementRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
    marginTop: 6,
  },
  requirementText: {
    flex: 1,
    fontSize: 14,
    color: BuyerColors.textGray,
    lineHeight: 20,
  },
});
