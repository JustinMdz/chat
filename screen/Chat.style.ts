import {StyleSheet} from 'react-native';
export const chatStyles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    flex: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        marginRight: 12,
    },
    backButtonText: {
        fontSize: 18,
        fontWeight: "700",
        lineHeight: 18,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#14B8A6",
    },
    avatarText: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "700",
    },
    headerCopy: {
        marginLeft: 12,
        gap: 2,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
    },
    headerSubtitle: {
        fontSize: 13,
        fontWeight: "500",
    },
    messagesContent: {
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 24,
        gap: 14,
    },
    dayLabel: {
        alignSelf: "center",
        fontSize: 12,
        fontWeight: "600",
        letterSpacing: 0.6,
        textTransform: "uppercase",
        marginBottom: 4,
    },
    messageRow: {
        width: "100%",
        flexDirection: "row",
    },
    incomingRow: {
        justifyContent: "flex-start",
    },
    outgoingRow: {
        justifyContent: "flex-end",
    },
    bubble: {
        maxWidth: "82%",
        paddingHorizontal: 14,
        paddingTop: 12,
        paddingBottom: 10,
        borderRadius: 22,
    },
    incomingBubble: {
        borderBottomLeftRadius: 8,
    },
    outgoingBubble: {
        borderBottomRightRadius: 8,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    messageTime: {
        marginTop: 8,
        fontSize: 11,
        fontWeight: "600",
        textAlign: "right",
    },
    messageSenderName:{
        marginTop: 8,
        fontSize: 11,
        fontWeight: "600",
        textAlign: "left"
    },
    composerWrapper: {
        borderTopWidth: 1,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 16,
    },
    composer: {
        flexDirection: "row",
        alignItems: "center",
        minHeight: 58,
        borderWidth: 1,
        borderRadius: 999,
        paddingLeft: 18,
        paddingRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 15,
        paddingVertical: 12,
        paddingRight: 12,
        maxHeight:150
    },
    sendButton: {
        minWidth: 92,
        height: 42,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 18,
    },
    sendButtonText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "700",
    },
});

export function getStylesChatColors  (themeColor:(props: {light?: string, dark?: string},colorName: "text" | "background" | "icon" | "tint" | "tabIconDefault" | "tabIconSelected")=>string){
    const backgroundColor = themeColor({}, "background");
    const primaryTextColor = themeColor({}, "text");
    const secondaryTextColor = themeColor(
        { light: "#6B7280", dark: "#9CA3AF" },
        "icon"
    );
    const borderColor = themeColor(
        { light: "#E5E7EB", dark: "#2A2F36" },
        "icon"
    );
    const accentColor = themeColor(
        { light: "#0F766E", dark: "#22C55E" },
        "tint"
    );
    const incomingBubble = themeColor(
        { light: "#F3F4F6", dark: "#1F2937" },
        "background"
    );
    const outgoingBubble = themeColor(
        { light: "#D1FAE5", dark: "#14532D" },
        "background"
    );
    const composerColor = themeColor(
        { light: "#FFFFFF", dark: "#111827" },
        "background"
    );

    return {
        backgroundColor,
        primaryTextColor,
        secondaryTextColor,
        borderColor,
        accentColor,
        incomingBubble,
        outgoingBubble,
        composerColor,

    }
}