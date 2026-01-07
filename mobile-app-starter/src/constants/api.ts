/**
 * API Configuration
 * 
 * Update the API_BASE_URL to match your backend server URL
 * 
 * For Android Emulator: http://10.0.2.2:3000
 * For iOS Simulator: http://localhost:3000
 * For Physical Device: http://YOUR_COMPUTER_IP:3000 (e.g., http://192.168.1.100:3000)
 */

export const API_BASE_URL = __DEV__
  ? 'http://localhost:3000'  // Development - Update this to your backend URL
  : 'https://your-production-domain.com';  // Production - Update this

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    VERIFY_OTP: '/api/auth/verify-otp',
    RESEND_OTP: '/api/auth/resend-otp',
  },
  // User
  USER: {
    ME: '/api/user/me',
    NOTIFICATION_PREFERENCES: '/api/user/notification-preferences',
  },
  // Vehicles
  VEHICLES: {
    PREAPPROVED: '/api/vehicles/preapproved',
    UPLOAD: '/api/vehicles/upload',
  },
  // Auctions
  AUCTIONS: {
    LIST: '/api/auctions',
    DETAIL: (id: string) => `/api/auctions/${id}`,
    BIDS: (id: string) => `/api/auctions/${id}/bids`,
    MY_BIDS: (id: string) => `/api/auctions/${id}/bids/my`,
    CALENDAR: '/api/auctions/calendar',
  },
  // Bids
  BIDS: {
    MY_BIDS: '/api/my-account/bids',
    ANALYTICS: '/api/my-account/bids/analytics',
  },
  // Seller Analytics
  SELLER_ANALYTICS: '/api/my-account/seller-analytics',
};

