// src/game/utils/textures/types.ts
import { Scene } from "phaser";

export interface FlowerType {
    id: string;
    name: string;
    scientificName: string;
    family: string;
    color: number;
    discovered: boolean;
    collectionCount: number;
    facts: string[];
    regions: string[];
    imageParams?: {
        petalLength?: number;
        petalWidth?: number;
        numPetals?: number;
        centerColor?: number;
    };
}

export interface GeneratorOptions {
    scene: Scene;
    updateProgress?: () => void;
}