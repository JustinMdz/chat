import {ChatConnectionState, ChatMessage, ChatUser, WsEvent} from "@/model/chat.types";

export type EventHandlerWs = (event:WsEvent) => void;
export type StatusHandlerWs = () => void;

export interface ChatContextValue {
    currentUser:ChatUser|null;
    token:string|null
    isLoadingSession:boolean

    connectionState:ChatConnectionState

    onlineUsers:ChatUser[]
    groupMessages:ChatMessage[]
    directMessages:Record<string, ChatMessage[]>

    typingUsers:Record<string, string>
    readReceipts:Record<string, {seen_by:string; seen_at:string}[]>

    joinChat:(nickName:string)=>Promise<void>
    leaveChat:()=>void
    sendGroupMessage:(content:string)=>void
    sendDirectMessage:(userId:string, content:string) => void
    loadDirectMessages:(userId:string) => Promise<void>
    sendTyping:()=>void
    sendStopTyping:()=>void
    sendMarkRead:(messageId:string)=>void
}