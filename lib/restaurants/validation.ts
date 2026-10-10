import { z } from "zod";
import { RestaurantError } from "@/lib/restaurants/errors";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function toHhMm(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.slice(0, 5);
}

function blankToUndefined(max: number) {
  return z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined));
}

const hoursDaySchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    isClosed: z.boolean(),
    openTime: z
      .union([z.string(), z.null()])
      .optional()
      .transform((value) => toHhMm(value ?? null))
      .refine((value) => value === null || TIME_RE.test(value), "Use 24-hour time, e.g. 11:00."),
    closeTime: z
      .union([z.string(), z.null()])
      .optional()
      .transform((value) => toHhMm(value ?? null))
      .refine((value) => value === null || TIME_RE.test(value), "Use 24-hour time, e.g. 23:00."),
  })
  .superRefine((day, ctx) => {
    if (day.isClosed) return;
    if (!day.openTime || !day.closeTime) {
      ctx.addIssue({
        code: "custom",
        message: "Open and close times are required when the day is open.",
      });
    }
  });

export const createRestaurantSchema = z.object({
  name: z.string().trim().min(2, "Restaurant name is required.").max(80),
  description: blankToUndefined(600),
  phone: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || /^\+?[\d\s\-().]{7,20}$/.test(value),
      "Please enter a valid phone number."
    )
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .optional()
    .refine(
      (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      "Please enter a valid email address."
    )
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  website: blankToUndefined(200),
  coverUrl: blankToUndefined(400),
  address: blankToUndefined(160),
  city: blankToUndefined(80),
  country: blankToUndefined(80),
  postalCode: blankToUndefined(20),
  currency: z.string().trim().min(3).max(3).toUpperCase().default("TND"),
  timezone: z.string().trim().min(3).max(60).default("Africa/Tunis"),
  hours: z.array(hoursDaySchema).length(7, "Provide hours for all 7 days."),
  floor: z.object({
    name: z.string().trim().min(1, "Floor name is required.").max(60),
    width: z.number().min(400).max(4000),
    height: z.number().min(400).max(4000),
  }),
});

export type CreateRestaurantBody = z.infer<typeof createRestaurantSchema>;

export async function parseRestaurantBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  let raw: unknown;

  try {
    raw = await request.json();
  } catch {
    throw new RestaurantError("VALIDATION_ERROR", "Request body must be valid JSON.");
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    throw new RestaurantError(
      "VALIDATION_ERROR",
      firstIssue?.message ?? "Invalid request data."
    );
  }

  return result.data;
}
