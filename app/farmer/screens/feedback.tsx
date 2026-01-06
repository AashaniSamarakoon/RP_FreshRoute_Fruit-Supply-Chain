import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { BACKEND_URL } from "../../../config";
import { useTranslation } from "../../../hooks/farmer/useTranslation";

const PRIMARY_GREEN = "#2E7D32";
const LIGHT_GREEN = "#e8f4f0";
const LIGHT_GRAY = "#f5f5f5";

interface FeedbackItem {
  id: number;
  body: string;
  rating?: number | null;
  created_at?: string;
  user_id?: string;
  status?: string;
}

export default function FeedbackScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState<"Recent" | "Top" | "My Feedback">("Recent");
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadFeedbacks();
  }, [selectedTab]);

  const loadFeedbacks = async () => {
    console.log("[FEEDBACK] Loading feedback...");
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.log("[FEEDBACK] No token found");
        setFeedbacks([]);
        return;
      }

      const sort = selectedTab === "Top" ? "top" : "recent";
      const res = await fetch(`${BACKEND_URL}/api/farmer/feedback?sort=${sort}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        console.log("[FEEDBACK] Error:", data.message);
        setFeedbacks([]);
        return;
      }

      setFeedbacks(data.feedback || []);
    } catch (err) {
      console.error("[FEEDBACK] Unexpected error", err);
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async () => {
    if (!feedbackText.trim()) {
      return;
    }
    console.log("[FEEDBACK] Submitting feedback...");
    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.log("[FEEDBACK] No token found");
        return;
      }

      const res = await fetch(`${BACKEND_URL}/api/farmer/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ body: feedbackText.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.log("[FEEDBACK] Submit error:", data.message);
        return;
      }

      setFeedbackText("");
      setFeedbacks((prev) => [data.feedback, ...prev]);
    } catch (err) {
      console.error("[FEEDBACK] Submit unexpected error", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("feedback.headerTitle")}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Feedback Title */}
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>{t("feedback.mainTitle")}</Text>
          </View>

          {/* Feedback Input */}
          <View style={styles.feedbackInputSection}>
            <View style={styles.avatarSmall}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
            <TextInput
              style={styles.feedbackInput}
              placeholder={t("feedback.placeholder")}
              placeholderTextColor="#999"
              multiline
              maxLength={200}
              value={feedbackText}
              onChangeText={setFeedbackText}
            />
            <TouchableOpacity style={styles.submitButton} onPress={submitFeedback} disabled={submitting}>
              <Text style={styles.submitButtonText}>{submitting ? "..." : t("feedback.submit")}</Text>
            </TouchableOpacity>
          </View>

          {/* Filter Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, selectedTab === "Recent" && styles.tabActive]}
              onPress={() => setSelectedTab("Recent")}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === "Recent" && styles.tabTextActive,
                ]}
              >
                {t("feedback.tabs.recent")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, selectedTab === "Top" && styles.tabActive]}
              onPress={() => setSelectedTab("Top")}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === "Top" && styles.tabTextActive,
                ]}
              >
                {t("feedback.tabs.top")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, selectedTab === "My Feedback" && styles.tabActive]}
              onPress={() => setSelectedTab("My Feedback")}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === "My Feedback" && styles.tabTextActive,
                ]}
              >
                {t("feedback.tabs.mine")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Feedback List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={PRIMARY_GREEN} />
              <Text style={styles.loadingText}>Loading feedback...</Text>
            </View>
          ) : feedbacks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No feedback yet</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadFeedbacks}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.feedbackList}>
              {feedbacks.map((feedback) => (
                <View key={feedback.id} style={styles.feedbackCard}>
                  <View style={styles.feedbackHeader}>
                    <View style={styles.authorInfo}>
                      <View style={styles.authorAvatar}>
                        <Text style={styles.avatarText}>👤</Text>
                      </View>
                      <View>
                        <Text style={styles.authorName}>{feedback.user_id || "Farmer"}</Text>
                        <Text style={styles.timeAgo}>
                          {feedback.created_at ? new Date(feedback.created_at).toLocaleString() : t("feedback.time.justNow")}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity>
                      <Ionicons name="ellipsis-vertical" size={16} color="#ccc" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.feedbackText}>{feedback.body}</Text>

                  <View style={styles.feedbackActions}>
                    <TouchableOpacity style={styles.actionButton}>
                      <Ionicons name="thumbs-up-outline" size={16} color={PRIMARY_GREEN} />
                      <Text style={styles.actionCount}>{feedback.rating ?? 0}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                      <Ionicons name="chatbubble-outline" size={16} color="#ccc" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 30 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  scrollView: {
    flex: 1,
  },
  titleSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  feedbackInputSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: LIGHT_GRAY,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 20,
  },
  feedbackInput: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
    paddingHorizontal: 12,
    paddingVertical: 10,
    maxHeight: 80,
    fontSize: 13,
    color: "#000",
  },
  submitButton: {
    backgroundColor: PRIMARY_GREEN,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    justifyContent: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: LIGHT_GRAY,
  },
  tabActive: {
    backgroundColor: PRIMARY_GREEN,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666",
  },
  tabTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  feedbackList: {
    paddingHorizontal: 16,
  },
  feedbackCard: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: LIGHT_GRAY,
  },
  feedbackHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  authorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },
  authorName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000",
  },
  timeAgo: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
  },
  feedbackText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 19,
    marginBottom: 10,
  },
  feedbackActions: {
    flexDirection: "row",
    gap: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionCount: {
    fontSize: 11,
    color: "#666",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    color: "#666",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
});
