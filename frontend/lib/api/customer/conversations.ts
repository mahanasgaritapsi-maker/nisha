import { customerApiGet, customerApiPost } from "@/lib/api/customer-client";
import type {
  ConversationCreate,
  ConversationDetail,
  ConversationListItem,
  Message,
  MessageCreate,
} from "@/types/chat";

export function createConversation(
  body: ConversationCreate,
): Promise<ConversationListItem> {
  return customerApiPost<ConversationListItem>("/api/v1/customer/conversations", body);
}

export function listConversations(): Promise<ConversationListItem[]> {
  return customerApiGet<ConversationListItem[]>("/api/v1/customer/conversations");
}

export function getConversation(id: number): Promise<ConversationDetail> {
  return customerApiGet<ConversationDetail>(`/api/v1/customer/conversations/${id}`);
}

export function sendMessage(conversationId: number, body: MessageCreate): Promise<Message> {
  return customerApiPost<Message>(
    `/api/v1/customer/conversations/${conversationId}/messages`,
    body,
  );
}
