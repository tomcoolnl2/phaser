/**
 * Generic DTO wrapper for all server-to-client socket responses.
 * If ok is true, dto is required. If ok is false, dto is optional.
 */
export type SocketResponseDTOSuccess<TDTO> = { ok: true; status?: number; message?: string; dto: TDTO };

export type SocketResponseDTOFailure<TDTO> = { ok: false; status?: number; message?: string; dto?: TDTO };

export type SocketResponseDTO<TDTO> = SocketResponseDTOSuccess<TDTO> | SocketResponseDTOFailure<TDTO>;
