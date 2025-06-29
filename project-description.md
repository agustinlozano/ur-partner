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

## Flow

1. An interface to create a room. Generate a unique room id. Ask your role in the relationship (girlfriend/boyfriend). Finally create the room by adding `room_id` and `girlfriend_name` | `boyfriend_name` to the DynamoDB as a new row.
2. An interface to join an existing room. Ask for the `room_id` and then according to the missing field we assume the role. Finally ask for her/his name and complete the missed field with the name of the person in the existing room (DynamoDB row).
3. Room: An interface to upload images based on `@personality-form.tsx` component.
4. Room: A button to submit the images (both should be `ready` to show what your partner has uploaded according your personality).

## How to route the app

- `/` -> Home page
- `/room` -> Room page (to create a room)
- `/join` -> Join room page (to join an existing room)
- `/room/:room_id` -> Room page

## How to store the data

[current way]
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

## How to upload the images

## Image Upload System Design

Our image upload system is designed with a client-server architecture that handles real-time synchronization without WebSockets:

### 1. **Client-Side Image Management** (`personality-form.tsx`)

- Users upload images through drag-and-drop or file selection
- Images are stored as base64 strings in sessionStorage via Zustand store
- Real-time progress tracking with visual feedback
- Form validation ensures all 9 categories are completed before marking as "ready"

### 2. **Server-Side Upload Process** (`route.ts`)

- Images are uploaded to AWS S3 with organized folder structure: `{roomId}/{userRole}/{categoryId}/`
- Character category supports multiple images (up to 5) stored as JSON arrays
- Duplicate upload prevention by checking existing URLs in DynamoDB
- Automatic cleanup and error handling for failed uploads

### 3. **State Management** (`personality-images-store.ts`)

- Zustand store with persistence to sessionStorage
- Room-specific image storage using keys: `{roomId}_{userRole}`
- Automatic quota management with cleanup of old data
- Cross-tab synchronization through sessionStorage

### 4. **Real-Time Partner Detection**

Instead of WebSockets, we use **polling with exponential backoff**:

- Client polls the room status every 2-5 seconds
- When both partners are ready (`girlfriend_ready` && `boyfriend_ready` = true)
- System automatically triggers image sharing between partners
- Polling frequency increases during active uploads, decreases during idle periods

### 5. **Image Sharing Flow**

1. Partner A completes gallery → `{userRole}_ready` = true
2. Partner B completes gallery → `{userRole}_ready` = true
3. System detects both ready → Fetches partner's images from S3 URLs
4. Displays combined personality gallery to both partners
5. Partners can view each other's personality insights

This approach provides real-time-like experience without WebSocket complexity while maintaining scalability and reliability.
