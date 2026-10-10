import { ApiError } from "@/lib/auth/client";
import type { CreateRestaurantBody } from "./validation";
import type { PublicRestaurant } from "./serialize";

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      (json as { code?: string }).code ?? "UNKNOWN_ERROR",
      (json as { message?: string }).message ?? "An unexpected error occurred.",
      res.status
    );
  }
  return json as T;
}

export async function apiListRestaurants(
  accessToken: string
): Promise<PublicRestaurant[]> {
  const res = await fetch("/api/restaurants", {
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: "include",
  });
  const json = await handleResponse<{ restaurants: PublicRestaurant[] }>(res);
  return json.restaurants;
}

export async function apiCreateRestaurant(
  accessToken: string,
  input: CreateRestaurantBody
): Promise<PublicRestaurant> {
  const res = await fetch("/api/restaurants", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: "include",
    body: JSON.stringify(input),
  });
  const json = await handleResponse<{ restaurant: PublicRestaurant }>(res);
  return json.restaurant;
}
