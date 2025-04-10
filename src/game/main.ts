// src/game/main.ts
import Phaser from "phaser";
import { Boot } from "./scenes/Boot";
import { Preloader } from "./scenes/Preloader";
import { MainMenu } from "./scenes/MainMenu";
import { Game } from "./scenes/Game";
import { GameOver } from "./scenes/GameOver";

// Define the configuration for the game
const config: Phaser.Types.Core.GameConfig = {
    // Use Phaser's type for better safety
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: "game-container", // Ensure this matches the div ID in PhaserGame.tsx
    backgroundColor: "#028cd1", // A default background color
    physics: {
        default: "arcade",
        arcade: {
            gravity: { x: 0, y: 0 }, // Typically no gravity needed for top-down
            // Set debug: true here temporarily if you need to see physics bodies
            debug: false,
        },
    },
    scene: [
        Boot,
        Preloader,
        MainMenu,
        Game,
        GameOver,
        // No separate UI scene needed with React overlay
    ],
    // Improve pixel art rendering if using pixelated assets
    // render: {
    //     pixelArt: true,
    //     antialias: false
    // }
};

// Create a new Phaser game instance via the exported function
const StartGame = (parent: string): Phaser.Game => {
    // Use the spread operator to override the parent property from the config
    return new Phaser.Game({ ...config, parent });
};

export default StartGame;
