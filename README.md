<p align="center">
  <img src="public/og-image.jpg" alt="UR Partner OG Image" width="600" />
</p>

# UR Partner

**UR Partner** is a modern, real-time web app designed to help you connect, collaborate, and share experiences with others in a fun and interactive way.

## Key Features

- **Instant Room Creation:** Start a new room with a single click and invite friends or colleagues instantly.
- **Real-Time Chat:** Communicate live with everyone in your room.
- **Personalized Experience:** Choose your personality, customize your profile, and make every session unique.
- **Fun Interactions:** Use emojis, reactions, and more to express yourself.
- **Mobile Friendly:** Enjoy a seamless experience on both desktop and mobile devices.
- **Unsplash Integration:** Access a vast library of images to enhance your conversations.

## Quick Start

1. **Create a Room:** Click "Create Room" and share the link with your friends.
2. **Join a Room:** Got a link? Just open it and jump right in!
3. **Collaborate:** Chat, share, and interact in real time.

## Technical Architecture

### API Overview

UR Partner is built on a modern serverless architecture using Next.js API routes and AWS services for scalability and real-time functionality.

#### Core API Endpoints

- **`POST /api/rooms`** - Create a new room with user details and personality
- **`GET /api/room-info/[roomId]`** - Get room information and current status
- **`POST /api/room/[roomId]/reveal`** - Trigger the reveal process when both users are ready
- **`POST /api/room/[roomId]/update-ready`** - Mark user as ready for reveal
- **`POST /api/room/[roomId]/upload-images`** - Handle personality image uploads
- **`POST /api/room/[roomId]/leave`** - Handle user leaving the room
- **`POST /api/room/[roomId]/partner-images`** - Get partner personality images
- **`POST /api/room/[roomId]/partner-status`** - Get partner status
- **`POST /api/room/[roomId]/update-progress`** - Update user progress based on the category

#### Real-Time Communication

The app uses **WebSocket connections** through AWS Lambda for instant messaging and status updates:

- WebSocket Gateway URL for real-time room communication
- Automatic reconnection handling for robust connections

##### WebSocket Message Events

All real-time interactions are handled via structured WebSocket messages. Here are the supported event types:

| Event Type           | Description                       |
| -------------------- | --------------------------------- |
| `category_fixed`     | A user fixed a category           |
| `category_completed` | A user completed a category       |
| `progress_updated`   | A user's progress was updated     |
| `image_uploaded`     | A user uploaded an image          |
| `is_ready`           | A user marked themselves as ready |
| `say`                | A user sent a chat message        |
| `ping`               | Keep-alive or connection check    |
| `leave`              | A user left the room              |

Each event includes the user's slot (`a` or `b`), and some include additional data (like `category`, `progress`, or `message`).

#### Data Storage

**Amazon DynamoDB** serves as the primary database with a flexible schema:

- **Room Management**: Stores room metadata, user slots (A/B), and session state
- **User Data**: Names, emojis, personality roles, and readiness status
- **Personality System**: Animal, place, and plant preferences for each user
- **Rate Limiting**: Built-in protection against abuse

#### Upload System

Multi-layer image upload architecture:

1. **Frontend** uploads through Next.js API routes
2. **Rate Limiting Lambda** checks upload permissions
3. **Upload Lambda** processes and stores images in S3
4. **DynamoDB** updates room data with image references

#### Key Technologies

- **Next.js 15** with App Router for modern React development
- **AWS SDK** for DynamoDB and S3 integration
- **Serverless Framework** for local WebSocket development
- **TypeScript** for type safety across the entire stack
- **Vercel Firewall** for rate limiting and security

---

<p align="center">
  <i>Ready to connect? <b>UR Partner</b> is here to make every session memorable!</i>
</p>
