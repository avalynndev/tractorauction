/**
 * Authentication API
 * 
 * All authentication-related API calls
 */

import apiClient from './client';
import { API_ENDPOINTS } from '../constants/api';

export interface RegisterData {
  registrationType: 'INDIVIDUAL' | 'FIRM';
  fullName: string;
  phoneNumber: string;
  whatsappNumber: string;
  email?: string;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  role: 'BUYER' | 'SELLER' | 'DEALER';
  gstNumber?: string;
}

export interface LoginData {
  phoneNumber: string;
  method?: 'otp' | 'password';
  password?: string;
}

export interface VerifyOTPData {
  phoneNumber: string;
  otp: string;
}

export interface AuthResponse {
  message: string;
  token?: string;
  requiresOtpVerification?: boolean;
  user?: any;
}

export const authAPI = {
  /**
   * Register a new user
   */
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, data);
    return response.data;
  },

  /**
   * Login - Send OTP or authenticate with password
   */
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, data);
    return response.data;
  },

  /**
   * Verify OTP and get JWT token
   */
  verifyOTP: async (data: VerifyOTPData): Promise<AuthResponse> => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.VERIFY_OTP, data);
    return response.data;
  },

  /**
   * Resend OTP
   */
  resendOTP: async (phoneNumber: string): Promise<{ message: string }> => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.RESEND_OTP, {
      phoneNumber,
    });
    return response.data;
  },
};

