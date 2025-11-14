
/**
 * Generic DTO wrapper for all server-to-client socket responses.
 * If ok is true, dto is required. If ok is false, dto is optional.
 */
export type SocketResponseDTO<T = unknown> =
    | ({ ok: true; status?: number; message?: string; dto: T | T[] })
    | ({ ok: false; status?: number; message?: string; dto?: T | T[] });