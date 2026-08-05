import axios from "axios";

type ApiErrorResponse = {
  detail?: string;
  message?: string;
};

export function getApiErrorMessage(
  error: unknown,
  fallbackMessage = "An unexpected error occurred"
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | ApiErrorResponse
      | undefined;

    return (
      data?.detail ??
      data?.message ??
      fallbackMessage
    );
  }

  return fallbackMessage;
}
