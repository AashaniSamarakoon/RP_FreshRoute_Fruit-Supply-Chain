import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Animated,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";

interface Message {
  id: string;
  text: string;
  sender: "user" | "agent";
  timestamp: Date;
}

interface ChatThread {
  id: string;
  complaintId: string;
  complaintTitle: string;
  lastMessage: string;
  lastMessageTime: Date;
  messages: Message[];
}

export default function Chat() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [currentChatId, setCurrentChatId] = useState<string | null>(
    (params.complaintId as string) || null
  );
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const sidePanelAnimation = useRef(new Animated.Value(-300)).current;
  const scrollViewRef = useRef<ScrollView>(null);

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
    // Load mock chat threads
    const mockChats: ChatThread[] = [
      {
        id: "1",
        complaintId: params.complaintId as string || "1",
        complaintTitle: "Order ORD-001",
        lastMessage: "Thank you for your complaint. We are looking into it.",
        lastMessageTime: new Date(),
        messages: [
          {
            id: "1",
            text: "Hello! Thank you for contacting us regarding your complaint. How can I assist you today?",
            sender: "agent",
            timestamp: new Date(Date.now() - 3600000),
          },
        ],
      },
    ];
    setChats(mockChats);

    // Load messages for current chat
    if (currentChatId) {
      const chat = mockChats.find((c) => c.complaintId === currentChatId);
      if (chat) {
        setMessages(chat.messages);
      } else {
        // Initial sample message
        setMessages([
          {
            id: "1",
            text: "Hello! Thank you for contacting us regarding your complaint. How can I assist you today?",
            sender: "agent",
            timestamp: new Date(),
          },
        ]);
      }
    }
  }, [currentChatId, params.complaintId]);

  useEffect(() => {
    Animated.timing(sidePanelAnimation, {
      toValue: showSidePanel ? 0 : -300,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showSidePanel, sidePanelAnimation]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const handleSend = () => {
    if (!messageText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: messageText.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setMessageText("");

    // Simulate agent response
    setTimeout(() => {
      const agentResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "Thank you for your message. We will get back to you shortly.",
        sender: "agent",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, agentResponse]);
    }, 1000);
  };

  const handleChatSelect = (chat: ChatThread) => {
    setCurrentChatId(chat.complaintId);
    setMessages(chat.messages);
    setShowSidePanel(false);
  };

  const handleDeleteChat = (chatId: string) => {
    Alert.alert(
      "Delete Chat",
      "Are you sure you want to delete this chat thread?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setChats((prev) => prev.filter((c) => c.id !== chatId));
            if (currentChatId === chats.find((c) => c.id === chatId)?.complaintId) {
              setCurrentChatId(null);
              setMessages([]);
            }
          },
        },
      ]
    );
  };

  if (checkingAuth || !isAuthenticated) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setShowSidePanel(true)}
        >
          <MaterialIcons name="menu" size={28} color="#11181C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complaint Chat Agent</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Side Panel */}
      {showSidePanel && (
        <TouchableOpacity
          style={styles.sidePanelBackdrop}
          activeOpacity={1}
          onPress={() => setShowSidePanel(false)}
        />
      )}
      <Animated.View
        style={[
          styles.sidePanel,
          {
            transform: [{ translateX: sidePanelAnimation }],
          },
        ]}
      >
        <View style={styles.sidePanelHeader}>
          <Text style={styles.sidePanelTitle}>Recent Chats</Text>
          <TouchableOpacity
            onPress={() => setShowSidePanel(false)}
            style={styles.sidePanelClose}
          >
            <Ionicons name="close" size={24} color="#11181C" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.chatList}>
          {chats.map((chat) => (
            <View key={chat.id} style={styles.chatListItem}>
              <TouchableOpacity
                style={styles.chatItemContent}
                onPress={() => handleChatSelect(chat)}
              >
                <View style={styles.chatItemAvatar}>
                  <Ionicons name="chatbubble" size={24} color="#2f855a" />
                </View>
                <View style={styles.chatItemInfo}>
                  <Text style={styles.chatItemTitle}>{chat.complaintTitle}</Text>
                  <Text style={styles.chatItemPreview} numberOfLines={1}>
                    {chat.lastMessage}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteChat(chat.id)}
              >
                <Ionicons name="trash-outline" size={20} color="#e53e3e" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </Animated.View>

      <View style={styles.chatWrapper}>
        {/* Chat Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={[
            styles.messagesContainer,
            { paddingBottom: keyboardHeight > 0 ? 80 : 0 },
          ]}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.sender === "user"
                  ? styles.userMessageContainer
                  : styles.agentMessageContainer,
              ]}
            >
              {message.sender === "agent" && (
                <View style={styles.agentAvatar}>
                  <MaterialIcons name="support-agent" size={20} color="#fff" />
                </View>
              )}
              <View
                style={[
                  styles.messageBubble,
                  message.sender === "user"
                    ? styles.userMessageBubble
                    : styles.agentMessageBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.sender === "user"
                      ? styles.userMessageText
                      : styles.agentMessageText,
                  ]}
                >
                  {message.text}
                </Text>
              </View>
              {message.sender === "user" && (
                <View style={styles.userAvatar}>
                  <Ionicons name="person" size={20} color="#fff" />
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Message Input */}
      <View
        style={[
          styles.inputContainer,
          {
            bottom: keyboardHeight > 0 ? keyboardHeight : 0,
          },
        ]}
      >
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !messageText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!messageText.trim()}
          >
            <MaterialIcons
              name="send"
              size={24}
              color={messageText.trim() ? "#fff" : "#ccc"}
            />
          </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  chatWrapper: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    backgroundColor: "#fff",
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    color: "#11181C",
  },
  headerSpacer: {
    width: 40,
  },
  sidePanelBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 998,
  },
  sidePanel: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 300,
    backgroundColor: "#fff",
    zIndex: 999,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 10,
  },
  sidePanelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  sidePanelTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#11181C",
  },
  sidePanelClose: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  chatList: {
    flex: 1,
  },
  chatListItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  chatItemContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  chatItemAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e5f3ed",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  chatItemInfo: {
    flex: 1,
  },
  chatItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#11181C",
    marginBottom: 4,
  },
  chatItemPreview: {
    fontSize: 14,
    color: "#666",
  },
  deleteButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-end",
  },
  userMessageContainer: {
    justifyContent: "flex-end",
  },
  agentMessageContainer: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 16,
  },
  userMessageBubble: {
    backgroundColor: "#2f855a",
    borderBottomRightRadius: 4,
  },
  agentMessageBubble: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userMessageText: {
    color: "#fff",
  },
  agentMessageText: {
    color: "#11181C",
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2f855a",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  agentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#666",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    paddingBottom: Platform.OS === "ios" ? 12 : 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    alignItems: "flex-end",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2f855a",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#e5e5e5",
  },
});

