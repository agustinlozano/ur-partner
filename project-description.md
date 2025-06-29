## Describe Your Partner 🤍

This app allows you to enter into a online room with your special someone and upload nine (9) categorized images that represent their personality.

Categories:

- an animal,
- a place,
- a plant,
- a character,
- a season,
- a hobby,
- a food,
- a colour,
- a drink.

## Complete Application Flow

1. **Home Page** (`/`) - Choose to create or join a room with beautiful UI and animations
2. **Create Room** (`/room`) - Enter name, emoji, select role (girlfriend/boyfriend) → creates room
3. **Join Room** (`/join` or `/join/[roomId]`) - Enter room ID, name, emoji → joins existing room
4. **Room Detail** (`/room/[roomId]`) - Wait for both partners, shows real-time status and connection
5. **Personality Form** (`/room/[roomId]/personality`) - Upload 9 category images with drag & drop
6. **Reveal Page** (`/room/[roomId]/reveal`) - View partner's personality gallery with multiple viewing modes

## How to route the app

- `/` -> Home page (create or join room options)
- `/room` -> Create room page
- `/join` -> Join existing room page
- `/join/[roomId]` -> Join specific room with pre-filled ID
- `/room/[roomId]` -> Room detail page (waiting for both partners + status tracking)
- `/room/[roomId]/personality` -> Personality form for uploading images
- `/room/[roomId]/reveal` -> Final reveal page showing both galleries

## API Endpoints

### Room Management

- `POST /api/rooms` - Create new room
- `GET /api/room-info/[roomId]` - Get room information
- `POST /api/room/[roomId]/leave` - Leave room

### Image Upload & Progress

- `POST /api/room/[roomId]/upload-images` - Upload personality images to S3
- `POST /api/room/[roomId]/update-progress` - Update user progress
- `POST /api/room/[roomId]/update-ready` - Mark user as ready

### Partner Interaction

- `GET /api/room/[roomId]/partner-status` - Get partner's status and progress
- `GET /api/room/[roomId]/partner-images` - Get partner's uploaded images
- `POST /api/room/[roomId]/reveal` - Initialize reveal process

### Debug & Development

- `/api/debug/rate-limit` - Rate limiting testing
- `/api/get-image` - Image retrieval utility

## State Management

### Client-side Storage

- **Zustand Store**: Personality images with sessionStorage persistence
- **localStorage**: Active room and user data
- **React State**: Component-specific UI state

### Key Storage Keys

- `activeRoom`: Current user's room data and role
- `personality-images-storage`: Zustand persistence key for images by room

### State Structure

```typescript
// localStorage.activeRoom
{
  room_id: string,
  role: "girlfriend" | "boyfriend",
  name: string,
  emoji: string
}

// Zustand store structure
{
  imagesByRoom: {
    "[roomId]_[userRole]": {
      animal: string,
      place: string,
      // ... other categories
      character: string[] // Multiple images for character category
    }
  }
}
```

## How to store the data

[Current implementation]
Using DynamoDB from AWS.

The data structure is like so:

| Field                  | Type    | Description                                     |
| ---------------------- | ------- | ----------------------------------------------- |
| `room_id`              | string  | Partition Key - Unique room identifier          |
| `girlfriend_name`      | string  | Name of the girlfriend                          |
| `boyfriend_name`       | string  | Name of the boyfriend                           |
| `girlfriend_emoji`     | string  | Girlfriend's selected avatar emoji              |
| `boyfriend_emoji`      | string  | Boyfriend's selected avatar emoji               |
| `animal_girlfriend`    | string  | Girlfriend's animal image URL                   |
| `animal_boyfriend`     | string  | Boyfriend's animal image URL                    |
| `place_girlfriend`     | string  | Girlfriend's place image URL                    |
| `place_boyfriend`      | string  | Boyfriend's place image URL                     |
| `plant_girlfriend`     | string  | Girlfriend's plant image URL                    |
| `plant_boyfriend`      | string  | Boyfriend's plant image URL                     |
| `character_girlfriend` | string  | Girlfriend's character image URLs (JSON string) |
| `character_boyfriend`  | string  | Boyfriend's character image URLs (JSON string)  |
| `season_girlfriend`    | string  | Girlfriend's season image URL                   |
| `season_boyfriend`     | string  | Boyfriend's season image URL                    |
| `hobby_girlfriend`     | string  | Girlfriend's hobby image URL                    |
| `hobby_boyfriend`      | string  | Boyfriend's hobby image URL                     |
| `food_girlfriend`      | string  | Girlfriend's food image URL                     |
| `food_boyfriend`       | string  | Boyfriend's food image URL                      |
| `colour_girlfriend`    | string  | Girlfriend's colour image URL                   |
| `colour_boyfriend`     | string  | Boyfriend's colour image URL                    |
| `drink_girlfriend`     | string  | Girlfriend's drink image URL                    |
| `drink_boyfriend`      | string  | Boyfriend's drink image URL                     |
| `girlfriend_ready`     | boolean | Whether girlfriend has submitted all images     |
| `boyfriend_ready`      | boolean | Whether boyfriend has submitted all images      |
| `created_at`           | string  | ISO timestamp when room was created             |
| `updated_at`           | string  | ISO timestamp when room was last updated        |
| `ttl`                  | number  | Unix timestamp for automatic deletion (3 hours) |

### TypeScript Interface

```typescript
interface Room {
  room_id: string; // Partition Key
  girlfriend_name?: string;
  boyfriend_name?: string;
  girlfriend_emoji?: string;
  boyfriend_emoji?: string;

  animal_girlfriend?: string;
  animal_boyfriend?: string;
  place_girlfriend?: string;
  place_boyfriend?: string;
  plant_girlfriend?: string;
  plant_boyfriend?: string;
  character_girlfriend?: string; // JSON string for arrays
  character_boyfriend?: string;
  season_girlfriend?: string;
  season_boyfriend?: string;
  hobby_girlfriend?: string;
  hobby_boyfriend?: string;
  food_girlfriend?: string;
  food_boyfriend?: string;
  colour_girlfriend?: string;
  colour_boyfriend?: string;
  drink_girlfriend?: string;
  drink_boyfriend?: string;

  girlfriend_ready?: boolean;
  boyfriend_ready?: boolean;
  created_at: string;
  updated_at: string;
  ttl?: number;
}
```

## Technical Features & User Experience

### Real-time Synchronization

- **Polling System**: Every 5 seconds for room status updates (not exponential backoff as initially planned)
- **Partner Tracking**: Real-time progress tracking with live updates
- **Automatic Transitions**: Redirect when both partners ready for reveal

### Advanced UI/UX Features

- **Mobile-Responsive Design**: Adaptive components with mobile-specific behaviors
- **Theme System**: Dark/light mode support with theme toggle
- **Drag & Drop**: Image upload with paste functionality (Cmd+V)
- **Multiple View Modes**: Reveal page supports marquee, hover, and gallery views
- **Copy Room ID**: Easy sharing functionality
- **Progress Tracking**: Visual progress bars and completion indicators
- **Partner Tracker Component**: Real-time drawer showing partner's progress

### Image Handling

- **Multiple Upload Methods**: Drag & drop, click to upload, paste (Cmd+V)
- **Character Category Special**: Supports up to 5 images (others support 1)
- **Image Compression**: Client-side optimization before upload
- **Blob URL Management**: Proper cleanup to prevent memory leaks
- **S3 Storage**: Organized folder structure `{roomId}/{userRole}/{categoryId}/`

### Development Features

- **Demo Images**: Predefined images for testing (development mode only)
- **Audio System**: Configurable audio feedback (currently commented out)
- **Diagnostics**: Built-in debugging and monitoring tools
- **Testing Suite**: Comprehensive tests with Vitest and Playwright
- **Error Handling**: Graceful error states and user feedback

## Component Architecture

### Key Components

- `PersonalityForm`: Main image upload interface
- `RevealContent`: Final reveal experience with multiple view modes
- `PartnerTracker`: Real-time partner progress monitoring
- `CategoryMarquee`: Animated image display
- `CategoryHoverReveal`: Interactive hover-based reveal
- `CategoryExpandableGallery`: Grid-based expandable gallery
- `ActiveRoomSaver`: Persistent room state management
- `GradientBackground`: Consistent theming across pages

### Custom Hooks

- `usePersonalityForm`: Image upload and form state management
- `useAudioPlayer`: Audio feedback system
- `useIsMobile`: Responsive design detection
- `useActiveRoom`: Room state persistence

## Image Upload System Design

Our image upload system is designed with a client-server architecture that handles real-time synchronization without WebSockets:

### 1. **Client-Side Image Management** (`personality-form.tsx`)

- Users upload images through drag-and-drop, file selection, or paste (Cmd+V)
- Images are stored as base64 strings in sessionStorage via Zustand store
- Real-time progress tracking with visual feedback and animations
- Form validation ensures all 9 categories are completed before marking as "ready"
- Character category supports multiple images (up to 5) with grid layout

### 2. **Server-Side Upload Process** (`api/room/[roomId]/upload-images/route.ts`)

The upload process uses a **multi-lambda architecture** for security and scalability:

#### **Step 1: Rate Limiting Check**

- Next.js API route extracts client IP from headers (`x-forwarded-for`, `x-real-ip`)
- Calls **Rate Limit Lambda** with DynamoDB backend to check upload limits
- Service ID: `"upload-images"` with configurable limits per user tier
- Returns user-friendly messages with retry timeouts if limit exceeded

#### **Step 2: Lambda Upload Process**

- If rate limit passes, forwards request to **Upload Lambda**
- Upload Lambda handles:
  - Image processing and optimization
  - S3 upload with organized folder structure: `{roomId}/{userRole}/{categoryId}/`
  - Character category supports multiple images (stored as JSON arrays)
  - Room data updates with new image URLs
  - Automatic cleanup and error handling for failed uploads

#### **Architecture Flow**

```
Client → Next.js API Route → Rate Limit Lambda (DynamoDB) → Upload Lambda (S3) → DynamoDB (room data)
```

#### **Environment Configuration**

- `RATE_LIMIT_ENDPOINT`: Rate limiting lambda endpoint
- `LAMBDA_UPLOAD_ENDPOINT`: Image upload lambda endpoint
- Graceful fallback if rate limiting service is unavailable

### 3. **State Management** (`personality-images-store.ts`)

- Zustand store with persistence to sessionStorage
- Room-specific image storage using keys: `{roomId}_{userRole}`
- Automatic quota management with cleanup of old data
- Cross-tab synchronization through sessionStorage
- Blob URL management for memory optimization

### 4. **Real-Time Partner Detection**

Instead of WebSockets, we use **consistent polling**:

- Client polls the room status every 5 seconds (fixed interval, not exponential backoff)
- When both partners are ready (`girlfriend_ready` && `boyfriend_ready` = true)
- System automatically triggers image sharing between partners
- Polling stops when room is complete (both partners joined)
- Partner progress tracking shows real-time category completion

### 5. **Image Sharing & Reveal Flow**

1. Partner A completes gallery → `{userRole}_ready` = true
2. Partner B completes gallery → `{userRole}_ready` = true
3. System detects both ready → Enables reveal functionality
4. Partners can access `/room/[roomId]/reveal` to view combined galleries
5. Multiple viewing modes: Marquee (animated), Hover (interactive), Gallery (grid)
6. Image caching and optimization for smooth reveal experience

This approach provides real-time-like experience without WebSocket complexity while maintaining scalability and reliability through efficient polling and state management.
