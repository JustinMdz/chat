import { useThemeColor } from "@/hooks/use-theme-color";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { chatStyles, getStylesChatColors } from "@/screen/Chat.style";
import { useChatContext } from "@/provider/chatContext";
import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "@/model/chat.types";
import { DateUtil } from "@/utils/DateUtil";

export function Chat() {
  const {
    backgroundColor,
    primaryTextColor,
    secondaryTextColor,
    borderColor,
    composerColor,
    accentColor,
    outgoingBubble,
    incomingBubble,
  } = getStylesChatColors(useThemeColor);

  const {
    groupMessages,
    currentUser,
    onlineUsers,
    sendGroupMessage,
    sendTyping,
    sendStopTyping,
    sendMarkRead,
    typingUsers,
    readReceipts,
    joinChat,
    leaveChat,
    isLoadingSession,
  } = useChatContext();

  const [message, setMessage] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [joining, setJoining] = useState<boolean>(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const showModal = !isLoadingSession && !currentUser;

  const handleJoin = async () => {
    const trimmed = email.trim();
    const atIndex = trimmed.indexOf("@");
    if (atIndex <= 0 || atIndex === trimmed.length - 1) {
      setEmailError("Ingresa un correo válido");
      return;
    }
    const username = trimmed.split("@")[0];
    setEmailError("");
    setJoining(true);
    try {
      await joinChat(username);
    } catch {
      setEmailError("No se pudo conectar, intenta de nuevo");
    } finally {
      setJoining(false);
    }
  };

  const handleChangeText = (text: string) => {
    setMessage(text);
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendTyping();
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      sendStopTyping();
    }, 2000);
  };

  const sendMessage = () => {
    groupMessages.forEach((msg) => {
      if (msg.sender_id !== currentUser?.id) {
        sendMarkRead(msg.id);
      }
    });
    sendGroupMessage(message);
    setMessage("");
    isTypingRef.current = false;
    sendStopTyping();
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  const isMessageIncoming = (msg: ChatMessage) => {
    return msg.sender_id !== currentUser?.id;
  };

  return (
    <SafeAreaView style={[chatStyles.safeArea, { backgroundColor }]}>
      <Modal visible={showModal} transparent animationType="fade">
        <View style={emailStyles.overlay}>
          <View style={[emailStyles.card, { backgroundColor }]}>
            <Text style={[emailStyles.title, { color: primaryTextColor }]}>
              Ingresa tu correo
            </Text>
            <Text style={[emailStyles.subtitle, { color: secondaryTextColor }]}>
              Usaremos tu usuario para identificarte en el chat.
            </Text>

            <TextInput
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                setEmailError("");
              }}
              placeholder="correo@ejemplo.com"
              placeholderTextColor={secondaryTextColor}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={[
                emailStyles.input,
                { color: primaryTextColor, borderColor },
              ]}
            />

            {!!emailError && (
              <Text style={emailStyles.error}>{emailError}</Text>
            )}

            <Pressable
              onPress={handleJoin}
              disabled={joining}
              style={[
                emailStyles.button,
                { backgroundColor: accentColor, opacity: joining ? 0.6 : 1 },
              ]}
            >
              <Text style={emailStyles.buttonText}>
                {joining ? "Conectando..." : "Entrar al chat"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView
        style={chatStyles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[chatStyles.header, { borderBottomColor: borderColor }]}>
          <View style={chatStyles.avatar}>
            <Text style={chatStyles.avatarText}>A</Text>
          </View>

          <View style={chatStyles.headerCopy}>
            <Text style={[chatStyles.headerTitle, { color: primaryTextColor }]}>
              Grupo de Moviles
            </Text>
            <Text
              style={[chatStyles.headerSubtitle, { color: secondaryTextColor }]}
            >
              Usuarios conectados: {onlineUsers.length}
            </Text>
          </View>

          <Pressable
            onPress={leaveChat}
            style={[logoutStyles.button, { borderColor }]}
          >
            <Text style={[logoutStyles.buttonText, { color: secondaryTextColor }]}>
              Salir
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={chatStyles.flex}
          contentContainerStyle={chatStyles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[chatStyles.dayLabel, { color: secondaryTextColor }]}>
            Hoy
          </Text>

          {groupMessages.map((msg) => (
            <View
              key={msg.id}
              style={[
                chatStyles.messageRow,
                isMessageIncoming(msg)
                  ? chatStyles.incomingRow
                  : chatStyles.outgoingRow,
              ]}
            >
              <View
                style={[
                  chatStyles.bubble,
                  {
                    backgroundColor: isMessageIncoming(msg)
                      ? incomingBubble
                      : outgoingBubble,
                  },
                  isMessageIncoming(msg)
                    ? chatStyles.incomingBubble
                    : chatStyles.outgoingBubble,
                ]}
              >
                {isMessageIncoming(msg) && (
                  <Text style={[
                    chatStyles.messageSenderName,
                    {color: secondaryTextColor},
                  ]}>
                    {msg.sender_nickname}
                  </Text>
                )}
                <Text
                  style={[chatStyles.messageText, { color: primaryTextColor }]}
                >
                  {msg.content}
                </Text>
                <View style={chatStyles.messageFooter}>
                  <Text
                    style={[
                      chatStyles.messageTime,
                      { color: secondaryTextColor },
                    ]}
                  >
                    {DateUtil.getHour(msg.timestamp)}
                  </Text>
                  {!isMessageIncoming(msg) && (
                    <Text
                      style={[
                        chatStyles.readStatus,
                        { color: secondaryTextColor },
                      ]}
                    >
                      {readReceipts[msg.id]?.length ? "\u2713\u2713" : "\u2713"}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {Object.keys(typingUsers).length > 0 && (
          <View style={chatStyles.typingContainer}>
            <Text style={[chatStyles.typingText, { color: secondaryTextColor }]}>
              {Object.values(typingUsers).join(", ")} escribiendo...
            </Text>
          </View>
        )}

        <View
          style={[
            chatStyles.composerWrapper,
            { backgroundColor: composerColor, borderTopColor: borderColor },
          ]}
        >
          <View style={[chatStyles.composer, { borderColor }]}>
            <TextInput
              multiline={true}
              value={message}
              onChangeText={handleChangeText}
              scrollEnabled={true}
              placeholder="Escribe un mensaje"
              placeholderTextColor={secondaryTextColor}
              style={[chatStyles.input, { color: primaryTextColor }]}
            />

            <Pressable
              accessibilityRole="button"
              disabled={!message?.trim()}
              onPress={sendMessage}
              style={[chatStyles.sendButton, { backgroundColor: accentColor }]}
            >
              <Text style={chatStyles.sendButtonText}>Enviar</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const logoutStyles = StyleSheet.create({
  button: {
    marginLeft: "auto",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "600",
  },
});

const emailStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    borderRadius: 20,
    padding: 24,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    marginTop: 4,
  },
  error: {
    color: "#EF4444",
    fontSize: 13,
  },
  button: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
