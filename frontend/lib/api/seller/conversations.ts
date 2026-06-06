import { apiGet, apiPost } from "@/lib/api/client";
import type {
  ConversationDetail,
  ConversationListItem,
  Message,
  MessageCreate,
} from "@/types/chat";

export function listConversations(): Promise<ConversationListItem[]> {
  return apiGet<ConversationListItem[]>("/api/v1/seller/conversations");
}

export function getConversation(id: number): Promise<ConversationDetail> {
  return apiGet<ConversationDetail>(`/api/v1/seller/conversations/${id}`);
}

export function sendMessage(conversationId: number, body: MessageCreate): Promise<Message> {
  return apiPost<Message>(`/api/v1/seller/conversations/${conversationId}/messages`, body);
}
