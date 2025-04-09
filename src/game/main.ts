// src/game/main.ts
import Phaser from 'phaser';
import { Boot } from './scenes/Boot';
import { Preloader } from './scenes/Preloader';
import { MainMenu } from './scenes/MainMenu';
import { Game } from './scenes/Game';
import { GameOver } from './scenes/GameOver';
// import { UIScene } from './scenes/UIScene'; // Remove UIScene import

// Define the configuration for the game
const config: {
    type: number;
    width: number;
    height: number;
    parent: string;
    backgroundColor: string;
    physics: { default: string; arcade: { gravity: { y: number }; debug: boolean } };
    scene: (Boot | Preloader | MainMenu | Game | GameOver)[]
} = { // You can simplify the type annotation
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#028cd1',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [
        Boot,
        Preloader,
        MainMenu,
        Game,
        // UIScene, // Remove UIScene from the scene list
        GameOver
    ]
};

// Create a new Phaser game instance via the exported function
const StartGame = (parent: string) => {
    console.log("Starting Phaser game instance...");
    return new Phaser.Game({ ...config, parent: parent });
}

export default StartGame;