import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const PRIMARY_GREEN = "#2f855a";
const LIGHT_GREEN = "#e8f4f0";
const LIGHT_GRAY = "#f5f5f5";

interface FeedbackItem {
  id: number;
  author: string;
  avatar: string;
  timeAgo: string;
  category: "Recent" | "Top" | "My Feedback";
  feedback: string;
  likes: number;
  dislikes: number;
}

const mockFeedbacks: FeedbackItem[] = [
  {
    id: 1,
    author: "John D.",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop",
    timeAgo: "2 days ago",
    category: "Recent",
    feedback:
      "It would be great to have a wonder-level forecast for organic avocados prices. The current model seems to focus only on conventional produce.",
    likes: 4,
    dislikes: 0,
  },
  {
    id: 2,
    author: "Sarah L.",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop",
    timeAgo: "5 days ago",
    category: "Recent",
    feedback:
      "Love the app! Can you add a feature to integrate with different local grocery stores? That would be a game changer for my weekly shopping!",
    likes: 12,
    dislikes: 1,
  },
  {
    id: 3,
    author: "Mike P.",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop",
    timeAgo: "1 week ago",
    category: "Top",
    feedback:
      "The UI is very clean, but I'm getting inconsistent data on the weekends at bit off from last month. Was there something changed?",
    likes: 8,
    dislikes: 0,
  },
];

export const options = {
  headerShown: false,
};

export default function FeedbackScreen() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = React.useState<
    "Recent" | "Top" | "My Feedback"
  >("Recent");
  const [feedbackText, setFeedbackText] = React.useState("");

  const filteredFeedbacks = mockFeedbacks.filter(
    (f) => f.category === selectedTab || selectedTab === "Recent"
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Feedback</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Feedback Title */}
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>Help us improve FreshRoute!</Text>
          </View>

          {/* Feedback Input */}
          <View style={styles.feedbackInputSection}>
            <View style={styles.avatarSmall}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
            <TextInput
              style={styles.feedbackInput}
              placeholder="Share your thoughts or ideas..."
              placeholderTextColor="#999"
              multiline
              maxLength={200}
              value={feedbackText}
              onChangeText={setFeedbackText}
            />
            <TouchableOpacity style={styles.submitButton}>
              <Text style={styles.submitButtonText}>Submit</Text>
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
                Recent
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
                Top
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                selectedTab === "My Feedback" && styles.tabActive,
              ]}
              onPress={() => setSelectedTab("My Feedback")}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === "My Feedback" && styles.tabTextActive,
                ]}
              >
                My Feedback
              </Text>
            </TouchableOpacity>
          </View>

          {/* Feedback List */}
          <View style={styles.feedbackList}>
            {filteredFeedbacks.map((feedback) => (
              <View key={feedback.id} style={styles.feedbackCard}>
                <View style={styles.feedbackHeader}>
                  <View style={styles.authorInfo}>
                    <View style={styles.authorAvatar}>
                      <Text style={styles.avatarText}>
                        {feedback.author[0]}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.authorName}>{feedback.author}</Text>
                      <Text style={styles.timeAgo}>{feedback.timeAgo}</Text>
                    </View>
                  </View>
                  <TouchableOpacity>
                    <Ionicons name="ellipsis-vertical" size={16} color="#ccc" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.feedbackText}>{feedback.feedback}</Text>

                <View style={styles.feedbackActions}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons
                      name="thumbs-up-outline"
                      size={16}
                      color={PRIMARY_GREEN}
                    />
                    <Text style={styles.actionCount}>{feedback.likes}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons
                      name="thumbs-down-outline"
                      size={16}
                      color="#ccc"
                    />
                    <Text style={styles.actionCount}>{feedback.dislikes}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons
                      name="chatbubble-outline"
                      size={16}
                      color="#ccc"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

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
});
