
/**
 * Generic DTO wrapper for all client-to-server socket requests.
 * Allows for type-safe, validated payloads and optional error messaging.
 */
export interface SocketRequestDTO<T = unknown> {
  dto: T | T[];
  message?: string;
}
