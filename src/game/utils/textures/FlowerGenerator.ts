// src/game/utils/textures/FlowerGenerator.ts
import { BaseGenerator } from "./BaseGenerator";
import { FlowerType } from "./types";
import * as Phaser from "phaser";
import { getFlowerById } from "@/game/data/flowerTypes";

export class FlowerGenerator extends BaseGenerator {
    generate(): void {
        this.generateFlowers();
    }
    
    private generateFlowers(): void {
        // Draw flowers with realistic colors based on actual flowers
        this.drawFlower("flower_red_generated", 0xE63946, "poppy"); // Red poppy
        this.drawFlower("flower_blue_generated", 0x4361EE, "cornflower"); // Blue cornflower
    }
    
    private drawFlower(key: string, petalColor: number, flowerId: string = "generic"): void {
        const flowerSize = 48;
        const petalRadius = flowerSize * 0.35;
        const centerRadius = flowerSize * 0.15;
        const numPetals = 6;
        
        // Get flower data if it exists
        const flowerData = getFlowerById(flowerId);
        
        // Default values
        let centerColor = 0xffd700; // Default golden center
        let centerOutlineColor = 0x333333; // Default outline
        let currentNumPetals = numPetals;
        let petalLength = petalRadius * 1.3;
        let petalWidth = petalRadius * 0.8;
        
        // Type assertion to match our local interface definition
        const flowerWithParams = flowerData as unknown as FlowerType;
        
        // If flower data exists, use its parameters
        if (flowerWithParams?.imageParams) {
            if (flowerWithParams.imageParams.petalLength) {
                petalLength = petalRadius * flowerWithParams.imageParams.petalLength;
            }
            if (flowerWithParams.imageParams.petalWidth) {
                petalWidth = petalRadius * flowerWithParams.imageParams.petalWidth;
            }
            if (flowerWithParams.imageParams.numPetals) {
                currentNumPetals = flowerWithParams.imageParams.numPetals;
            }
            if (flowerWithParams.imageParams.centerColor) {
                centerColor = flowerWithParams.imageParams.centerColor;
            }
        } else {
            // Fallback behavior based on flower type category
            if (flowerId === "poppy" || flowerId === "rose" || flowerId === "tulip") {
                centerColor = 0x4d3319; // Dark brown center for red flowers
                centerOutlineColor = 0x231709; // Darker outline
            } else if (
                flowerId === "cornflower" || 
                flowerId === "bluebell" ||
                flowerId === "delphinium"
            ) {
                centerColor = 0xffde59; // Yellow-gold center for blue flowers
                centerOutlineColor = 0x8c7800; // Darker yellow outline
            }
            
            // Legacy petal shape adjustments for backward compatibility
            if (flowerId === "poppy") {
                petalLength = petalRadius * 1.5; // Longer petals for poppies
                petalWidth = petalRadius * 0.9; // Wider petals
                currentNumPetals = 4; // Poppies typically have 4 petals
            } else if (flowerId === "rose") {
                petalLength = petalRadius * 1.2; // Shorter, more compact petals
                petalWidth = petalRadius * 1.0; // Wider, rounder petals
                currentNumPetals = 8; // More petals for roses
            } else if (flowerId === "cornflower") {
                petalLength = petalRadius * 1.4; // Elongated petals
                petalWidth = petalRadius * 0.7; // Thinner petals
                currentNumPetals = 8; // Cornflowers have many petals
            } else if (flowerId === "bluebell") {
                petalLength = petalRadius * 1.3; // Adjustments for bluebells
                petalWidth = petalRadius * 0.75; // Narrower petals
                currentNumPetals = 6; // Bluebells have 6 petals
            }
        }
        
        // Draw flower center with a subtle gradient effect
        this.graphics.fillStyle(centerColor, 1);
        this.graphics.fillCircle(flowerSize / 2, flowerSize / 2, centerRadius);
        
        // Center decoration (add texture to center)
        const innerRadius = centerRadius * 0.7;
        this.graphics.fillStyle(centerColor === 0xffd700 ? 0xffea00 : 0x59421f, 0.6);
        this.graphics.fillCircle(flowerSize / 2, flowerSize / 2, innerRadius);
        
        // Center outline
        this.graphics.lineStyle(1, centerOutlineColor, 0.8);
        this.graphics.strokeCircle(flowerSize / 2, flowerSize / 2, centerRadius);
        
        // Petal main color and outline
        this.graphics.fillStyle(petalColor, 1);
        this.graphics.lineStyle(1, 0x000000, 0.5); // Slightly more transparent outline

        const numSegments = 16; // Controls smoothness of petal curve

        for (let i = 0; i < currentNumPetals; i++) {
            const angle = Phaser.Math.DegToRad((360 / currentNumPetals) * i);
            const petalDist = petalRadius * 0.95; // Distance from center to petal center
            const petalCenterX = flowerSize / 2 + Math.cos(angle) * petalDist;
            const petalCenterY = flowerSize / 2 + Math.sin(angle) * petalDist;
            
            const rotationAngle = angle + Math.PI / 2; // Rotate petal to point outwards

            // Draw petal using segmented ellipse approximation
            this.graphics.beginPath();
            for (let seg = 0; seg <= numSegments; seg++) {
                const theta = (Math.PI * 2 * seg) / numSegments; // Angle along ellipse
                // Calculate point on ellipse centered at (0,0)
                const baseX = (petalLength / 2) * Math.cos(theta);
                const baseY = (petalWidth / 2) * Math.sin(theta);
                // Rotate the point
                const rotatedX = baseX * Math.cos(rotationAngle) - baseY * Math.sin(rotationAngle);
                const rotatedY = baseX * Math.sin(rotationAngle) + baseY * Math.cos(rotationAngle);
                // Translate to petal's final position
                const finalX = petalCenterX + rotatedX;
                const finalY = petalCenterY + rotatedY;
                if (seg === 0) this.graphics.moveTo(finalX, finalY);
                else this.graphics.lineTo(finalX, finalY);
            }
            this.graphics.closePath();
            this.graphics.fillPath();
            this.graphics.strokePath();
            
            // Add vein/highlight to petal for more detail and realism
            if (flowerId !== "generic") {
                this.graphics.lineStyle(1, flowerId.includes("blue") ? 0x3a86ff : 0xffd6a5, 0.3);
                const veinStart = {
                    x: flowerSize / 2 + Math.cos(angle) * (centerRadius * 0.9),
                    y: flowerSize / 2 + Math.sin(angle) * (centerRadius * 0.9)
                };
                const veinEnd = {
                    x: petalCenterX + Math.cos(angle) * petalLength * 0.65,
                    y: petalCenterY + Math.sin(angle) * petalLength * 0.65
                };
                this.graphics.beginPath();
                this.graphics.moveTo(veinStart.x, veinStart.y);
                this.graphics.lineTo(veinEnd.x, veinEnd.y);
                this.graphics.strokePath();
            }
        }
        
        // Generate the texture
        this.graphics.generateTexture(key, flowerSize, flowerSize);
        this.graphics.clear();
        if (this.updateProgress) this.updateProgress();
    }
}