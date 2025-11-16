export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || (
    import.meta.env.PROD
      ? 'https://teams-api-i5zh3.ondigitalocean.app'
      : 'http://localhost:3000'
  ),
};