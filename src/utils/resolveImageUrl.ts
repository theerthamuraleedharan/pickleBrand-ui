const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://localhost:8080/api";

export function resolveImageUrl(
  imageUrl: string | null
): string | null {
  if (!imageUrl) {
    return null;
  }

  // Already a complete URL
  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://")
  ) {
    return imageUrl;
  }

  // Remove "/api" from
  // http://localhost:8080/api
  const backendOrigin =
    API_BASE_URL.replace(/\/api\/?$/, "");

  return backendOrigin + imageUrl;
}