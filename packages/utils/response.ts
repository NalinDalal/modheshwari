// packages/utils/response.ts
type ResponseStatus = "success" | "error";

interface ApiResponseOptions<T> {
  status?: ResponseStatus;
  message?: string;
  data?: T | null;
  error?: string | null;
  statusCode?: number;
}

/**
 * Performs create response operation.
 * @param {ApiResponseOptions<T>} {
 *   status = "success",
 *   message = "OK",
 *   data = null,
 *   error = null,
 *   statusCode,
 * } - Description of {
 *   status = "success",
 *   message = "OK",
 *   data = null,
 *   error = null,
 *   statusCode,
 * }
 * @returns {Response} Description of return value
 */
export function createResponse<T>({
  status = "success",
  message = "OK",
  data = null,
  error = null,
  statusCode,
}: ApiResponseOptions<T>): Response {
  const body = {
    status,
    message,
    data,
    error,
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(body, null, 2), {
    status: statusCode ?? (status === "success" ? 200 : 400),
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Shortcut for success response.
 */
export function success<T>(
  message: string,
  data?: T,
  statusCode = 200,
): Response {
  return createResponse({ status: "success", message, data, statusCode });
}

/**
 * Shortcut for failure/error response.
 */
export function failure(
  message: string,
  error: string | null = null,
  statusCode = 400,
): Response {
  return createResponse({ status: "error", message, error, statusCode });
}
