export interface ChatMessage {
  id: string;
  sender_id: string;
  sender_nickname: string;
  content: string;
  type: "group" | "dm";
  recipient_id: string | null;
  timestamp: string; // TimeStamp ISO 8601
}

export interface ChatUser {
  id: string;
  nickname: string;
  joined_at: string; // TimeStamp
  is_online: boolean;
}

// ── Eventos WebSocket (Servidor → Cliente) ────────────────────────────────────

export type WsEvent =
  | { type: "group_message"; message: ChatMessage }
  | { type: "dm"; message: ChatMessage }
  | { type: "user_joined"; user: ChatUser }
  | { type: "user_left"; user_id: string }
  | { type: "users_list"; users: ChatUser[] }
  | { type: "group_history"; messages: ChatMessage[] }
  | { type: "pong" }
  | { type: "error"; message: string };

// ── Mensajes WebSocket (Cliente → Servidor) ────────────────────────────────────

export type WsClientEvent =
  | { type: "group_message"; content: string }
  | { type: "dm"; to: string; content: string }
  | { type: "ping" };

// ── Estado del contexto ───────────────────────────────────────────────────────

export type ChatConnectionState =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected";
