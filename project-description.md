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

1. An interface to create a room. Generate a unique room id. Ask your role in the relationship (girlfriend/boyfriend). Finally create the room by adding `room_id` and `girlfriend_name` | `boyfriend_name` to the Google Sheet as a new row.
2. An interface to join an existing room. Ask for the `room_id` and then according to the missing field we assume the role. Finally ask for her/his name and complete the missed field with the name of the person in the existing room (google sheet row).
3. Room: An interface to upload images based on `@personality-form.tsx` component.
4. Room: A button to submit the images (both should be `ready` to show what your partner has uploaded according your personality).

## How to route the app

- `/` -> Home page
- `/room` -> Room page (to create a room)
- `/join` -> Join room page (to join an existing room)
- `/room/:room_id` -> Room page

## How to store the data

Data are stored in a Google Sheet. Basic columns are:

- `room_id`
- `girlfriend_name`
- `boyfriend_name`
- `animal`
- `place`
- `plant`
- `character`
- `season`
- `hobby`
- `food`
- `colour`
- `drink`
- `girlfriend_ready`
- `boyfriend_ready`
- `created_at`
- `updated_at`

## How to upload the images

We don't know how to handle images yet. We just know that we have to share em between the two partners when they both are ready.

We should avoid to use a websocket, is there any other way to listen the `ready` fields and show the images when both are ready?
