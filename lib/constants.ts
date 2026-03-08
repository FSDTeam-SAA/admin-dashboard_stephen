export const APP_NAME = "Stephen Admin";
export const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ??
  process.env.NEXTPUBLICBASEURL ??
  "http://localhost:5000/api/v1";

export const QUERY_STALE_TIME = 1000 * 30;

export const PROJECT_CATEGORIES = [
  { label: "Construction", value: "construction" },
  { label: "Interior", value: "interior" },
] as const;

