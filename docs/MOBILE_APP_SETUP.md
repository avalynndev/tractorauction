# Native Mobile App Setup Guide

This guide will help you set up a React Native mobile app for iOS and Android that connects to your existing Next.js backend API.

## Overview

The mobile app will be built using React Native with TypeScript, allowing you to create native iOS and Android apps from a single codebase. The app will communicate with your existing backend API at your Next.js server.

## Prerequisites

Before starting, ensure you have:

1. **Node.js 18+** installed
2. **React Native development environment** set up:
   - For iOS: macOS with Xcode installed
   - For Android: Android Studio with Android SDK installed
3. **Backend API** running and accessible
4. **Expo CLI** (recommended for easier setup) or React Native CLI

## Step 1: Initialize React Native Project

### Option A: Using Expo (Recommended for beginners)

```bash
# Install Expo CLI globally
npm install -g expo-cli

# Create new Expo project
npx create-expo-app@latest tractor-auction-mobile --template

# Navigate to the project
cd tractor-auction-mobile

# Install dependencies
npm install
```

### Option B: Using React Native CLI (For native modules)

```bash
# Install React Native CLI globally
npm install -g react-native-cli

# Create new React Native project
npx react-native init TractorAuctionMobile --template react-native-template-typescript

# Navigate to the project
cd TractorAuctionMobile

# Install dependencies
npm install
```

## Step 2: Install Required Dependencies

```bash
# Navigation
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
npm install react-native-gesture-handler

# AsyncStorage for token storage
npm install @react-native-async-storage/async-storage

# HTTP client
npm install axios

# Forms and validation
npm install react-hook-form @hookform/resolvers zod

# UI Components
npm install react-native-paper  # or react-native-elements
npm install react-native-vector-icons

# Image handling
npm install react-native-image-picker

# Date handling
npm install date-fns

# Socket.io for real-time bidding
npm install socket.io-client

# Icons
npm install react-native-vector-icons
npm install @expo/vector-icons  # if using Expo

# For iOS (if using React Native CLI)
cd ios && pod install && cd ..
```

## Step 3: Project Structure

Create the following directory structure in your mobile app project:

```
tractor-auction-mobile/
├── src/
│   ├── api/              # API service layer
│   │   ├── client.ts     # Axios instance with auth
│   │   ├── auth.ts       # Authentication endpoints
│   │   ├── vehicles.ts   # Vehicle endpoints
│   │   ├── auctions.ts   # Auction endpoints
│   │   └── user.ts       # User endpoints
│   ├── screens/          # Screen components
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   └── VerifyOTPScreen.tsx
│   │   ├── home/
│   │   │   └── HomeScreen.tsx
│   │   ├── auctions/
│   │   │   ├── AuctionsListScreen.tsx
│   │   │   └── AuctionDetailScreen.tsx
│   │   ├── vehicles/
│   │   │   └── VehiclesListScreen.tsx
│   │   └── profile/
│   │       └── ProfileScreen.tsx
│   ├── components/       # Reusable components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── VehicleCard.tsx
│   │   └── AuctionCard.tsx
│   ├── navigation/       # Navigation setup
│   │   └── AppNavigator.tsx
│   ├── context/          # React Context
│   │   ├── AuthContext.tsx
│   │   └── AppContext.tsx
│   ├── hooks/            # Custom hooks
│   │   └── useAuth.ts
│   ├── types/            # TypeScript types
│   │   ├── auth.ts
│   │   ├── vehicle.ts
│   │   └── auction.ts
│   ├── utils/            # Utility functions
│   │   ├── storage.ts
│   │   └── format.ts
│   └── constants/        # App constants
│       └── api.ts
├── App.tsx               # Root component
└── package.json
```

## Step 4: API Configuration

Update your API base URL in the constants file. Replace `YOUR_API_URL` with your actual backend URL:

```typescript
// src/constants/api.ts
export const API_BASE_URL = __DEV__
  ? 'http://localhost:3000'  // Development
  : 'https://your-production-domain.com';  // Production

// For Android emulator, use: http://10.0.2.2:3000
// For iOS simulator, use: http://localhost:3000
// For physical device, use your computer's IP: http://192.168.x.x:3000
```

## Step 5: Key Features to Implement

### Authentication Flow
1. **Login Screen**: Phone number input → Send OTP
2. **OTP Verification**: Enter 6-digit OTP → Get JWT token
3. **Token Storage**: Store JWT in AsyncStorage
4. **Auto-login**: Check token on app start

### Main Features
1. **Auctions List**: View all live/upcoming auctions
2. **Auction Detail**: View auction details, place bids
3. **Vehicles List**: Browse pre-approved vehicles
4. **Vehicle Upload**: Seller can upload vehicles (with images)
5. **Profile/My Account**: View profile, bids, purchases
6. **Real-time Bidding**: WebSocket integration for live auctions

## Step 6: Building for Production

### iOS

```bash
# For Expo
eas build --platform ios

# For React Native CLI
cd ios
pod install
cd ..
npx react-native run-ios --configuration Release
```

### Android

```bash
# For Expo
eas build --platform android

# For React Native CLI
cd android
./gradlew assembleRelease
# APK will be in android/app/build/outputs/apk/release/
```

## Step 7: Environment Variables

Create a `.env` file in your mobile app root:

```env
API_BASE_URL=http://localhost:3000
# Add other environment-specific variables
```

Install `react-native-config` or `expo-constants` for environment variables.

## Integration with Existing Backend

Your mobile app will use the same API endpoints as your web app:

- `POST /api/auth/login` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP and get token
- `POST /api/auth/register` - Register new user
- `GET /api/user/me` - Get user profile (with Bearer token)
- `GET /api/auctions` - Get auctions list
- `GET /api/auctions/[id]` - Get auction details
- `POST /api/auctions/[id]/bids` - Place a bid
- `GET /api/vehicles/preapproved` - Get pre-approved vehicles
- `POST /api/vehicles/upload` - Upload vehicle (with FormData)

## Testing

1. **Start your backend server**: `npm run dev` (from your Next.js project)
2. **Start the mobile app**:
   - Expo: `npm start` or `expo start`
   - React Native CLI: `npx react-native run-ios` or `npx react-native run-android`

## Next Steps

1. Set up the API service layer
2. Implement authentication screens
3. Create navigation structure
4. Build main feature screens
5. Add real-time bidding with Socket.io
6. Test on both iOS and Android devices
7. Set up app icons and splash screens
8. Configure push notifications
9. Submit to App Store and Google Play

## Resources

- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)

## Support

For API-related issues, refer to your backend API documentation at `/api-docs` in your Next.js app.

