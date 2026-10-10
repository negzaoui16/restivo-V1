/**
 * Typed restaurant-domain errors. Same JSON shape as auth errors so the
 * shared client `ApiError` parser keeps working.
 */
import { AuthError, toErrorResponse } from "@/lib/auth/errors";

export const RESTAURANT_ERROR_CODES = {
  VALIDATION_ERROR: {
    status: 422,
    message: "The request body contains invalid data.",
  },
  SLUG_TAKEN: {
    status: 409,
    message: "A restaurant with this name already exists. Try a different name.",
  },
  NOT_FOUND: {
    status: 404,
    message: "The requested resource was not found.",
  },
  CONFLICT: {
    status: 409,
    message: "This resource already exists.",
  },
  INTERNAL_ERROR: {
    status: 500,
    message: "An unexpected error occurred. Please try again later.",
  },
} as const;

export type RestaurantErrorCode = keyof typeof RESTAURANT_ERROR_CODES;

export class RestaurantError extends Error {
  readonly code: RestaurantErrorCode;
  readonly httpStatus: number;

  constructor(code: RestaurantErrorCode, detailOverride?: string) {
    const entry = RESTAURANT_ERROR_CODES[code];
    super(detailOverride ?? entry.message);
    this.name = "RestaurantError";
    this.code = code;
    this.httpStatus = entry.status;
  }
}

export function toRestaurantErrorResponse(err: unknown): Response {
  if (err instanceof AuthError) return toErrorResponse(err);
  if (err instanceof RestaurantError) {
    return Response.json(
      { ok: false, code: err.code, message: err.message },
      { status: err.httpStatus }
    );
  }

  console.error("[restaurants] Unhandled error:", err);
  return Response.json(
    {
      ok: false,
      code: "INTERNAL_ERROR",
      message: RESTAURANT_ERROR_CODES.INTERNAL_ERROR.message,
    },
    { status: 500 }
  );
}
