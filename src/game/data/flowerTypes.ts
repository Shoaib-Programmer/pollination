// src/game/data/flowerTypes.ts
// Flower type definitions for the collection system

import flowerCollectionService from "@/services/FlowerCollectionService";

// Define a color object type with hex values
type FlowerColor = {
    name: string; // Color name
    hex: number; // Hexadecimal color value for Phaser tinting
};

// Define available flower colors with their hex values
export const FLOWER_COLORS: { [key: string]: FlowerColor } = {
    red: { name: "Red", hex: 0xff0000 },
    blue: { name: "Blue", hex: 0x0000ff },
    yellow: { name: "Yellow", hex: 0xffff00 },
    purple: { name: "Purple", hex: 0x800080 },
    pink: { name: "Pink", hex: 0xff69b4 },
    orange: { name: "Orange", hex: 0xffa500 },
    white: { name: "White", hex: 0xffffff },
};

// Define the flower type interface
export interface FlowerType {
    id: string;
    name: string;
    scientificName: string;
    colorType: string; // Key from FLOWER_COLORS
    color: number; // Hex color for tinting
    family: string;
    regions: string[];
    facts: string[];
    discovered: boolean;
    collectionCount: number;
}

// Define the complete flower database
const FLOWERS: FlowerType[] = [
    {
        id: "red_rose",
        name: "Red Rose",
        scientificName: "Rosa gallica",
        colorType: "red",
        color: FLOWER_COLORS.red.hex,
        family: "Rosaceae",
        regions: ["Europe", "Western Asia"],
        facts: [
            "Roses have been cultivated for over 5,000 years",
            "There are over 300 species of roses",
            "The rose is the national flower of England and the United States",
        ],
        discovered: false,
        collectionCount: 0,
    },
    {
        id: "blue_cornflower",
        name: "Blue Cornflower",
        scientificName: "Centaurea cyanus",
        colorType: "blue",
        color: FLOWER_COLORS.blue.hex,
        family: "Asteraceae",
        regions: ["Europe", "North America"],
        facts: [
            "Also known as Bachelor's button",
            "Was used in traditional folk medicine",
            "Is the national flower of Estonia",
        ],
        discovered: false,
        collectionCount: 0,
    },
    {
        id: "yellow_daffodil",
        name: "Daffodil",
        scientificName: "Narcissus pseudonarcissus",
        colorType: "yellow",
        color: FLOWER_COLORS.yellow.hex,
        family: "Amaryllidaceae",
        regions: ["Western Europe", "Mediterranean"],
        facts: [
            "The daffodil is the national flower of Wales",
            "Contains lycorine, which can cause vomiting if eaten",
            "Symbolizes rebirth and new beginnings",
        ],
        discovered: false,
        collectionCount: 0,
    },
    {
        id: "purple_lilac",
        name: "Lilac",
        scientificName: "Syringa vulgaris",
        colorType: "purple",
        color: FLOWER_COLORS.purple.hex,
        family: "Oleaceae",
        regions: ["Balkan Peninsula", "Eastern Europe"],
        facts: [
            "Lilacs typically bloom for only 2 weeks each spring",
            "The wood is very hard and has been used for engraving",
            "In the language of flowers, lilacs symbolize first love",
        ],
        discovered: false,
        collectionCount: 0,
    },
    {
        id: "pink_cherry_blossom",
        name: "Cherry Blossom",
        scientificName: "Prunus serrulata",
        colorType: "pink",
        color: FLOWER_COLORS.pink.hex,
        family: "Rosaceae",
        regions: ["Japan", "China", "Korea"],
        facts: [
            "Cherry blossoms are Japan's national flower",
            "The Japanese tradition of viewing cherry blossoms is called 'Hanami'",
            "Most cherry trees only bloom for 1-2 weeks per year",
        ],
        discovered: false,
        collectionCount: 0,
    },
    {
        id: "orange_marigold",
        name: "Marigold",
        scientificName: "Tagetes patula",
        colorType: "orange",
        color: FLOWER_COLORS.orange.hex,
        family: "Asteraceae",
        regions: ["Mexico", "Central America"],
        facts: [
            "Marigolds are often used in Day of the Dead celebrations in Mexico",
            "They have a distinctive, strong scent that can repel some insects",
            "Their petals are sometimes used as a natural food coloring",
        ],
        discovered: false,
        collectionCount: 0,
    },
    {
        id: "white_daisy",
        name: "Daisy",
        scientificName: "Bellis perennis",
        colorType: "white",
        color: FLOWER_COLORS.white.hex,
        family: "Asteraceae",
        regions: ["Europe", "Asia", "North America"],
        facts: [
            "The name 'daisy' comes from 'day's eye' because they open at dawn",
            "They are actually composed of two types of flowers - disk and ray",
            "Daisies are a symbol of innocence and purity",
        ],
        discovered: false,
        collectionCount: 0,
    },
    {
        id: "red_tulip",
        name: "Red Tulip",
        scientificName: "Tulipa gesneriana",
        colorType: "red",
        color: FLOWER_COLORS.red.hex,
        family: "Liliaceae",
        regions: ["Turkey", "Netherlands"],
        facts: [
            "Tulips were once so valuable in Holland that they caused the first economic bubble",
            "There are over 3,000 registered varieties of tulips",
            "Tulip bulbs can be substituted for onions in cooking (though not recommended)",
        ],
        discovered: false,
        collectionCount: 0,
    },
];

export default FLOWERS;

// Helper function to get only discovered flowers
export function getDiscoveredFlowers(): FlowerType[] {
    return FLOWERS.filter((flower) => flower.discovered);
}

// Helper function to find a flower by its ID
export function getFlowerById(id: string): FlowerType | undefined {
    return FLOWERS.find((flower) => flower.id === id);
}

// Helper function to find a flower by color type
export function getFlowersByColor(colorType: string): FlowerType[] {
    return FLOWERS.filter((flower) => flower.colorType === colorType);
}

// Helper function to get random flower
export function getRandomFlower(): FlowerType {
    const index = Math.floor(Math.random() * FLOWERS.length);
    return FLOWERS[index];
}
