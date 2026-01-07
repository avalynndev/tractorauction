# How to Update Social Media Links

## Quick Guide

All social media links are now centralized in one file for easy updates.

## File Location

**`lib/social-media.ts`** - This is the only file you need to edit to update all social media links across the entire website.

## Current Configuration

```typescript
export const socialMediaLinks = {
  whatsapp: "https://wa.me/917801094747", // ✅ Already working
  facebook: "#", // ⚠️ Replace with your Facebook URL
  instagram: "#", // ⚠️ Replace with your Instagram URL
  youtube: "#", // ⚠️ Replace with your YouTube URL
  twitter: "#", // ⚠️ Replace with your Twitter/X URL
};
```

## How to Update

1. Open the file: `lib/social-media.ts`
2. Replace the `#` placeholders with your actual social media URLs
3. Save the file
4. All icons across the website will automatically use the new links!

## URL Format Examples

### Facebook
```
https://www.facebook.com/yourpagename
```
Example: `https://www.facebook.com/tractorauction`

### Instagram
```
https://www.instagram.com/yourusername
```
Example: `https://www.instagram.com/tractorauction`

### YouTube
```
https://www.youtube.com/@yourchannel
```
OR
```
https://www.youtube.com/c/yourchannel
```
Example: `https://www.youtube.com/@tractorauction`

### Twitter/X
```
https://twitter.com/yourusername
```
OR
```
https://x.com/yourusername
```
Example: `https://twitter.com/tractorauction`

### WhatsApp
```
https://wa.me/917801094747
```
(Already configured - no change needed)

## Where Links Appear

Once you update the links in `lib/social-media.ts`, they will automatically appear in:

1. **Header** (top bar) - Next to "Call Us: 7801094747"
2. **Contact Us Page** - In the "Contact Us: Social Media" section
3. **Footer** - In the social media section

## Testing

After updating the links:

1. Save the file
2. Refresh your browser
3. Click on each social media icon
4. Verify they open the correct social media pages

## Notes

- All links open in a new tab (`target="_blank"`)
- All links have security attributes (`rel="noopener noreferrer"`)
- WhatsApp link is already working and doesn't need to be changed
- If you don't have a social media account yet, leave it as `#` - the icon will still display but won't link anywhere





























