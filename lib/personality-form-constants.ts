import {
  Heart,
  MapPin,
  Leaf,
  User,
  Calendar,
  Gamepad2,
  UtensilsCrossed,
  Palette,
  Coffee,
} from "lucide-react";

export const categories = [
  {
    id: "animal",
    name: "Animal",
    icon: Heart,
    description: "Their spirit animal",
  },
  {
    id: "place",
    name: "Place",
    icon: MapPin,
    description: "Dream destination",
  },
  { id: "plant", name: "Plant", icon: Leaf, description: "Favorite flora" },
  {
    id: "character",
    name: "Character",
    icon: User,
    description: "Fictional inspiration (up to 5)",
  },
  {
    id: "season",
    name: "Season",
    icon: Calendar,
    description: "Beloved time of year",
  },
  {
    id: "hobby",
    name: "Hobby",
    icon: Gamepad2,
    description: "Passionate pursuit",
  },
  {
    id: "food",
    name: "Food",
    icon: UtensilsCrossed,
    description: "Comfort cuisine",
  },
  {
    id: "colour",
    name: "Colour",
    icon: Palette,
    description: "Signature shade",
  },
  { id: "drink", name: "Drink", icon: Coffee, description: "Go-to beverage" },
];

export const predefinedImages = {
  animal: "/cele-partner/animal.png",
  place: "/cele-partner/place.jpg",
  plant: "/cele-partner/plant.jpg",
  character: [
    "/cele-partner/character-blair.avif",
    "/cele-partner/character-dee-dee.webp",
    "/cele-partner/character-heidi.png",
    "/cele-partner/character-kelly.jpg",
    "/cele-partner/character-maddy copy.jpg",
  ],
  season: "/cele-partner/season.webp",
  hobby: "/cele-partner/hobby.jpg",
  food: "/cele-partner/food.png",
  colour: "/cele-partner/color.jpg",
  drink: "/cele-partner/drink.png",
};

export interface PersonalityFormProps {
  roomId: string;
  onBack: () => void;
}

export interface PartnerTrackerProps {
  roomId: string;
  isOpen: boolean;
}

export type UploadedImages = Record<string, string | string[]>;
