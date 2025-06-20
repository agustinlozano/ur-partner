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

[deprecated module]
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
