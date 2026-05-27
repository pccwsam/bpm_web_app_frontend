/**
 * Global configuration settings for the frontend application.
 * Values are primarily loaded from environment variables (.env).
 */

export const config = {
  // API URLs
  apiUrl: import.meta.env.VITE_API_URL || '',
  awsApiUrl: import.meta.env.VITE_AWS_API_URL || '',

  // UI Polling Intervals
  // Default to 30000ms (30 seconds) if not specified in .env
  pollingIntervalMs: parseInt(import.meta.env.VITE_POLLING_INTERVAL_MS || '30000', 10),
};
