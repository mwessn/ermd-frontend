export type UiMessageType = "error" | "success" | "warning";

export interface UiMessage {
  id: string,
  text: string,
  type: UiMessageType
}
