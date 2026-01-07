# Logo & Branding Implementation

## Overview
This document outlines the branding implementation for Tractor Auction platform.

## Components Created

### 1. Logo Component (`components/branding/Logo.tsx`)
- Reusable logo component with multiple variants
- Supports different sizes (sm, md, lg)
- Includes SVG icon with tractor and auction hammer design
- Responsive text display
- Can be extended to use image logo when available

### 2. Brand Colors (`components/branding/BrandColors.ts`)
- Centralized color definitions
- Primary, secondary, and accent colors
- Typography and spacing constants
- Ready for future brand guideline updates

### 3. Site Manifest (`public/site.webmanifest`)
- PWA support
- App metadata
- Icon definitions

## Features Implemented

### Logo Display
- ✅ Header logo with brand name
- ✅ Footer logo with company info
- ✅ SVG-based logo (can be replaced with image)
- ✅ Responsive design (shows/hides text on mobile)
- ✅ Clickable logo (navigates to home or account)

### Branding Elements
- ✅ Consistent color scheme (Primary blue: #2563eb)
- ✅ Professional typography
- ✅ Brand name: "Tractor Auction"
- ✅ Tagline: "Buy & Sell Used Tractors"

### SEO & Metadata
- ✅ Enhanced meta tags
- ✅ Open Graph tags for social sharing
- ✅ Twitter Card support
- ✅ Structured metadata
- ✅ Keywords and descriptions

## Logo Variants

1. **Default**: Full logo with icon and text
2. **Compact**: Icon with short text
3. **Icon**: Icon only

## Logo Sizes

- **sm**: 32x32px (h-8 w-8)
- **md**: 40x40px (h-10 w-10) - Default
- **lg**: 48x48px (h-12 w-12)

## Usage Examples

```tsx
// Default logo
<Logo />

// Compact variant
<Logo variant="compact" />

// Icon only
<Logo variant="icon" showText={false} />

// Large size
<Logo size="lg" />
```

## Adding Custom Logo Image

1. Place logo image in `/public/logo.png`
2. Update `hasLogoImage` in `Logo.tsx` to `true`
3. The component will automatically use the image instead of SVG

## Brand Colors

- **Primary**: Blue (#2563eb) - Main brand color
- **Secondary**: Green (#16a34a) - Success/positive actions
- **Accent**: Gold, Diamond, Success, Warning, Error colors

## Next Steps

1. **Create Logo Image**: Design and add high-resolution logo images
   - `/public/logo.png` (main logo)
   - `/public/favicon-16x16.png`
   - `/public/favicon-32x32.png`
   - `/public/apple-touch-icon.png`
   - `/public/favicon-192x192.png`
   - `/public/favicon-512x512.png`

2. **Brand Guidelines**: Document brand guidelines including:
   - Logo usage rules
   - Color palette
   - Typography
   - Spacing and layout

3. **Email Branding**: Update email templates with logo and brand colors

4. **Social Media**: Ensure social media profiles match brand identity

## Files Modified

- `components/layout/Header.tsx` - Updated to use Logo component
- `components/layout/Footer.tsx` - Updated to use Logo component
- `app/layout.tsx` - Enhanced metadata and SEO tags
- `public/site.webmanifest` - PWA manifest file

## Files Created

- `components/branding/Logo.tsx` - Logo component
- `components/branding/BrandColors.ts` - Brand color definitions
- `public/site.webmanifest` - Web app manifest
- `BRANDING_IMPLEMENTATION.md` - This documentation


























