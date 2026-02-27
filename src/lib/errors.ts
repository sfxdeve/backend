export type ErrorCode =
  | "NOT_FOUND"
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "UNPROCESSABLE"
  | "TOO_MANY_REQUESTS"
  | "INTERNAL_SERVER_ERROR";

const statusByCode: Record<ErrorCode, number> = {
  NOT_FOUND: 404,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
};

export class AppError extends Error {
  code: ErrorCode;
  status: number;
  details?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>,
    status?: number,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status ?? statusByCode[code] ?? 500;
    this.details = details;
  }
}

export function toErrorEnvelope(input: {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  traceId?: string;
}) {
  return {
    code: input.code,
    message: input.message,
    details: input.details,
    traceId: input.traceId,
  };
}

export function asAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  return new AppError("INTERNAL_SERVER_ERROR", "Unexpected server error");
}
