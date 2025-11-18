/**
 * Generic DTO wrapper for all client-to-server socket requests.
 * Allows for type-safe, validated payloads and optional error messaging.
 */
export interface SocketRequestDTO<T = unknown> {
    ok: boolean;
    dto: T;
    message?: string;
}
