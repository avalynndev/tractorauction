# Video Streaming Implementation

This document describes the video streaming features implemented in the Tractor Auction platform.

## Features

### 1. Video Upload for Vehicles
- Sellers can upload videos of their vehicles during listing
- Videos are stored on Cloudinary
- Supports MP4, WebM, QuickTime, and AVI formats
- Maximum file size: 500MB
- Automatic thumbnail generation

### 2. Live Streaming for Auctions
- Admins can start live streams for active auctions
- Uses HLS (HTTP Live Streaming) protocol
- Real-time streaming via Cloudinary
- Live indicator badge
- Stream status tracking

### 3. Video Player Component
- Custom video player with controls
- Support for both regular videos and live streams
- HLS.js integration for cross-browser compatibility
- Responsive design
- Fullscreen support

## Database Schema

### Vehicle Model
```prisma
videoUrl            String?  // Cloudinary video URL
videoThumbnail      String?  // Video thumbnail URL
liveStreamUrl       String?  // Live stream URL (HLS/DASH)
liveStreamKey       String?  // Live stream key for broadcasting
```

### Auction Model
```prisma
isLiveStreaming      Boolean   @default(false)
liveStreamUrl        String?   // HLS/DASH stream URL
liveStreamKey        String?   // Stream key for broadcaster
liveStreamStatus     String?   // "idle" | "starting" | "live" | "ended"
```

## API Endpoints

### Upload Video
**POST** `/api/videos/upload`
- **Auth**: Required (Bearer token)
- **Body**: FormData with `vehicleId` and `video` file
- **Response**: Video URL and thumbnail

### Start Live Stream
**POST** `/api/auctions/[id]/live-stream`
- **Auth**: Required (Admin only)
- **Response**: Stream URL, stream key, and HLS URL

### Get Live Stream Status
**GET** `/api/auctions/[id]/live-stream`
- **Response**: Stream status and URLs

### Stop Live Stream
**DELETE** `/api/auctions/[id]/live-stream`
- **Auth**: Required (Admin only)

## Usage

### Uploading a Video

1. **Via API**:
```javascript
const formData = new FormData();
formData.append('vehicleId', 'vehicle-id');
formData.append('video', videoFile);

const response = await fetch('/api/videos/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

2. **In Vehicle Upload Form** (to be implemented):
- Add video file input
- Upload video after vehicle creation
- Display video on vehicle detail page

### Starting a Live Stream

```javascript
const response = await fetch(`/api/auctions/${auctionId}/live-stream`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});

const { streamUrl, streamKey, hlsUrl } = await response.json();
```

### Displaying Videos

```tsx
import VideoPlayer from '@/components/video/VideoPlayer';

// Regular video
<VideoPlayer
  src={vehicle.videoUrl}
  thumbnail={vehicle.videoThumbnail}
  className="w-full aspect-video"
  controls={true}
/>

// Live stream
<VideoPlayer
  src=""
  hlsUrl={auction.liveStreamUrl}
  isLive={true}
  className="w-full aspect-video"
  controls={true}
/>
```

## Cloudinary Configuration

### Video Upload Settings
- **Resource Type**: `video`
- **Chunk Size**: 6MB (for better reliability)
- **Thumbnail Generation**: Automatic (1280x720)
- **Folder**: `vehicles/videos`

### Live Streaming
- **Protocol**: RTMP for broadcasting
- **Playback**: HLS for viewing
- **Streaming Profile**: Created automatically per auction

## Dependencies

- **hls.js**: For HLS playback support in browsers
- **Cloudinary**: For video storage and streaming
- **lucide-react**: For video player icons

## Browser Support

- **HLS Playback**: 
  - Safari: Native support
  - Chrome/Firefox/Edge: Via hls.js
- **Video Formats**: MP4, WebM, QuickTime, AVI
- **Live Streaming**: HLS protocol (widely supported)

## Future Enhancements

1. **Video Upload in Vehicle Form**: Add video upload field to seller upload form
2. **Video Compression**: Client-side compression before upload
3. **Multiple Videos**: Support for multiple videos per vehicle
4. **Video Analytics**: Track video views and engagement
5. **Video Comments**: Allow users to comment on videos
6. **Video Quality Selection**: Adaptive bitrate streaming
7. **Recording**: Record live streams for later playback

## Setup Instructions

1. **Install Dependencies**:
```bash
npm install hls.js --legacy-peer-deps
```

2. **Update Database Schema**:
```bash
npx prisma generate
npx prisma db push
```

3. **Configure Cloudinary**:
Ensure these environment variables are set:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

4. **Test Video Upload**:
- Create a vehicle listing
- Upload a video via API
- Verify video appears on vehicle detail page

5. **Test Live Streaming**:
- Create an auction
- Start live stream as admin
- Use streaming software (OBS, etc.) with provided stream key
- Verify live stream appears on auction page

## Troubleshooting

### Video Not Playing
- Check browser console for errors
- Verify video URL is accessible
- Ensure hls.js is loaded for live streams

### Upload Fails
- Check file size (max 500MB)
- Verify file format is supported
- Check Cloudinary credentials

### Live Stream Not Working
- Verify stream key is correct
- Check broadcaster is connected
- Ensure Cloudinary streaming is enabled

