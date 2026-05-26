import { ChatMessage, ChatUser } from "@/model/chat.types";

const BASE_URL = process.env.EXPO_PUBLIC_CHAT_APP ?? "";

class ChatService {
  private async request<T>(
    path: string,
    options: RequestInit = {},
    token?: string,
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["X-User-Token"] = token;
    }

    if (!BASE_URL) {
      throw new Error("No se ha definido la URL base.");
    }

    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let error = `Error ${response.status}`;

      try {
        const body = (await response.json()) as {
          detail?: { message?: string } | string;
        };

        if (typeof body.detail == "string") {
          error = body.detail;
        } else if (body.detail?.message) {
          error = body.detail.message;
        }
      } catch {}

      throw new Error(error);
    }
    return response.json() as Promise<T>;
  }

  async join(nickname: string): Promise<{ user: ChatUser; token: string }> {
    return this.request<{ user: ChatUser; token: string }>("/api/chat/join", {
      method: "POST",
      body: JSON.stringify({ nickname }),
    });
  }

  async getOnlineUsers(): Promise<ChatUser[]> {
    return this.request<ChatUser[]>("/api/chat/users");
  }

  async getGroupMessages(limit = 50): Promise<ChatMessage[]> {
    return this.request<ChatMessage[]>("/api/chat/messages?limit=${limit}");
  }

  async getDMHistory(userId: string, token: string): Promise<ChatMessage[]> {
    return this.request<ChatMessage[]>(
      "/api/chat/messages/dm/${userId}",
      {},
      token,
    );
  }
}

export const ChatApiService = new ChatService();
