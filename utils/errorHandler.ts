/**
 * Error handling utilities
 */

interface ApiError {
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
    status?: number;
  };
  request?: any;
  message?: string;
}

/**
 * Handle API errors and return user-friendly messages
 * @param error - The error object from API call
 * @returns User-friendly error message
 */
export const handleApiError = (error: any): string => {
  const apiError = error as ApiError;

  if (apiError.response) {
    // Server responded with error
    const status = apiError.response.status;
    const message =
      apiError.response.data?.message || apiError.response.data?.error;

    if (status === 401) {
      return "Session expired. Please login again.";
    }

    if (status === 403) {
      return "You do not have permission to perform this action.";
    }

    if (status === 404) {
      return "The requested resource was not found.";
    }

    if (status === 422) {
      return message || "Invalid data provided.";
    }

    if (status >= 500) {
      return "Server error occurred. Please try again later.";
    }

    return message || "An error occurred. Please try again.";
  } else if (apiError.request) {
    // Request made but no response
    return "Network error. Please check your internet connection.";
  } else {
    // Something else happened
    return apiError.message || "An unexpected error occurred.";
  }
};

/**
 * Check if error is a network error
 * @param error - The error object
 * @returns True if network error
 */
export const isNetworkError = (error: any): boolean => {
  const apiError = error as ApiError;
  return !!apiError.request && !apiError.response;
};

/**
 * Check if error is an authentication error
 * @param error - The error object
 * @returns True if auth error
 */
export const isAuthError = (error: any): boolean => {
  const apiError = error as ApiError;
  return apiError.response?.status === 401;
};
