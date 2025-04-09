// src/game/scenes/Game.ts
import Phaser, { Scene } from "phaser";
import EventBus from "../EventBus"; // Import EventBus to LISTEN for DPad

// Define an interface for Flower data
interface FlowerData {
    type: "red" | "blue";
    hasPollen: boolean;
    isPollinated: boolean;
}

// Define ArcadePhysicsCallback type alias
type ArcadePhysicsCallback = (
    object1:
        | Phaser.Types.Physics.Arcade.GameObjectWithBody
        | Phaser.Tilemaps.Tile
        | Phaser.Physics.Arcade.Body
        | Phaser.Physics.Arcade.StaticBody,
    object2:
        | Phaser.Types.Physics.Arcade.GameObjectWithBody
        | Phaser.Tilemaps.Tile
        | Phaser.Physics.Arcade.Body
        | Phaser.Physics.Arcade.StaticBody
) => void;

export class Game extends Scene {
    private bee!: Phaser.Physics.Arcade.Sprite;
    private flowers!: Phaser.Physics.Arcade.StaticGroup;
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private score: number = 0;
    private facts: string[] = [
        /* Fact strings... */
        "Bees are responsible for pollinating about 1/3 of the food we eat!",
        "Some flowers only open at night for nocturnal pollinators like moths and bats.",
        "Honeybees communicate flower locations using a 'waggle dance'.",
        "Not all bees make honey! Many bee species are solitary.",
        "Pollinators include bees, butterflies, moths, beetles, flies, birds, and bats.",
        "Without pollination, many plants cannot produce fruits or seeds.",
        "Some plants trick insects into pollinating them without offering nectar.",
        "Wind and water can also be pollinators for certain plants like grasses and oaks.",
        "Climate change can disrupt the timing between flower blooming and pollinator activity.",
        "Planting native flowers helps support local pollinator populations.",
        "A single bee colony can pollinate 300 million flowers each day.",
        "Flowers have specific colors and scents to attract their preferred pollinators.",
    ];
    private carryingPollen: { type: "red" | "blue" | null } = { type: null };
    private pollenIndicator!: Phaser.GameObjects.Sprite | null;

    // Add DPad state
    private dpadState = {
        up: false,
        down: false,
        left: false,
        right: false,
    };

    constructor() {
        super("Game");
    }

    create() {
        // --- Environment, Bee, Flowers, Cursors setup ... (as before) ---
        this.add.image(400, 300, "background_generated");
        this.bee = this.physics.add.sprite(
            100,
            this.cameras.main.height / 2,
            "bee_generated"
        );
        this.bee.setCollideWorldBounds(true).setBounce(0.1).setDepth(10);
        this.bee
            .setBodySize(this.bee.width * 0.8, this.bee.height * 0.8)
            .setOrigin(0.5, 0.5);
        this.flowers = this.physics.add.staticGroup();
        this.spawnFlowers(6, "red");
        this.spawnFlowers(6, "blue");
        this.assignInitialPollen();
        if (this.input && this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        } else {
            console.error("Keyboard input plugin not found.");
        }
        this.physics.add.overlap(
            this.bee,
            this.flowers,
            this.handleBeeFlowerCollision as ArcadePhysicsCallback,
            undefined,
            this
        );

        // --- Reset Game State ... (as before) ---
        this.score = 0;
        this.carryingPollen.type = null;
        if (this.pollenIndicator) this.pollenIndicator.destroy();
        this.pollenIndicator = null;

        // --- Emit initial state via INTERNAL scene events ---
        this.events.emit("game:update-score", this.score);
        this.events.emit(
            "game:show-fact",
            "Fly to a glowing flower (yellow tint) to collect pollen!"
        );

        // --- Listen for DPad events from EventBus ---
        EventBus.on("dpad", this.handleDpadInput, this);

        // --- Cleanup listener on scene shutdown ---
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            // console.log("Game scene shutdown: Removing DPad listener."); // Keep off unless debugging
            EventBus.off("dpad", this.handleDpadInput, this);
        });

        // Emit scene readiness
        this.events.emit("scene-ready", this);
        // console.log("Game scene emitted scene-ready"); // Keep off unless debugging
    }

    // Handler for DPad events
    private handleDpadInput(data: {
        direction: "up" | "down" | "left" | "right";
        active: boolean;
    }) {
        if (data.direction in this.dpadState) {
            this.dpadState[data.direction] = data.active;
        }
    }

    update(time: number, delta: number) {
        this.handlePlayerMovement(delta);
        this.updatePollenIndicatorPosition();
    }

    // Modified handlePlayerMovement
    handlePlayerMovement(delta: number) {
        if (!this.bee?.body) return;

        const speed = 250;
        this.bee.setVelocity(0);

        let moveX = 0;
        let moveY = 0;

        // Check Cursors OR DPad State
        const leftPressed = this.cursors?.left.isDown || this.dpadState.left;
        const rightPressed = this.cursors?.right.isDown || this.dpadState.right;
        const upPressed = this.cursors?.up.isDown || this.dpadState.up;
        const downPressed = this.cursors?.down.isDown || this.dpadState.down;

        if (leftPressed) moveX = -1;
        else if (rightPressed) moveX = 1;
        if (upPressed) moveY = -1;
        else if (downPressed) moveY = 1;

        // Normalize and apply velocity
        const moveVector = new Phaser.Math.Vector2(moveX, moveY);
        if (moveVector.length() > 0) moveVector.normalize();
        this.bee.setVelocity(moveVector.x * speed, moveVector.y * speed);
        if (moveX < 0) this.bee.setFlipX(true);
        else if (moveX > 0) this.bee.setFlipX(false);
    }

    // --- assignInitialPollen Method ---
    assignInitialPollen() {
        const flowerChildren =
            this.flowers.getChildren() as Phaser.Physics.Arcade.Sprite[];
        Phaser.Utils.Array.Shuffle(flowerChildren);
        let pollenCount = 0;
        const maxPollen = Math.ceil(flowerChildren.length / 2);
        for (const flower of flowerChildren) {
            if (pollenCount >= maxPollen) break;
            const data = flower?.getData("flowerData") as
                | FlowerData
                | undefined;
            if (flower && data && !data.isPollinated && !data.hasPollen) {
                data.hasPollen = true;
                flower.setTint(0xffff00); // Bright Yellow
                pollenCount++;
            }
        }
    }

    // --- spawnFlowers Method ---
    spawnFlowers(count: number, type: "red" | "blue") {
        const texture = `flower_${type}_generated`;
        const margin = 60,
            spacing = 80,
            maxAttempts = 20;
        for (let i = 0; i < count; i++) {
            let x: number | undefined,
                y: number | undefined,
                validPosition,
                attempts = 0;
            do {
                validPosition = true;
                x = Phaser.Math.Between(
                    margin,
                    this.cameras.main.width - margin
                );
                y = Phaser.Math.Between(
                    margin + 60,
                    this.cameras.main.height - margin
                );
                this.flowers.children.iterate((existingFlower) => {
                    if (!existingFlower) return true;
                    const sprite =
                        existingFlower as Phaser.Physics.Arcade.Sprite;
                    if (
                        Phaser.Math.Distance.Between(
                            x!,
                            y!,
                            sprite.x,
                            sprite.y
                        ) < spacing
                    ) {
                        validPosition = false;
                        return false;
                    }
                    return true;
                });
                attempts++;
                if (attempts > maxAttempts) break;
            } while (!validPosition);

            if (validPosition) {
                const flower = this.flowers.create(x, y, texture);
                if (flower) {
                    flower.setData("flowerData", {
                        type: type,
                        hasPollen: false,
                        isPollinated: false,
                    } as FlowerData);
                    const bodyRadius = flower.width * 0.35;
                    flower
                        .setCircle(bodyRadius)
                        .setOffset(
                            flower.width / 2 - bodyRadius,
                            flower.height / 2 - bodyRadius
                        )
                        .refreshBody();
                }
            }
        }
    }

    // --- handleBeeFlowerCollision Method ---
    handleBeeFlowerCollision(
        beeGO:
            | Phaser.Types.Physics.Arcade.GameObjectWithBody
            | Phaser.Tilemaps.Tile,
        flowerGO:
            | Phaser.Types.Physics.Arcade.GameObjectWithBody
            | Phaser.Tilemaps.Tile
    ) {
        if (
            !(beeGO instanceof Phaser.Physics.Arcade.Sprite) ||
            !(flowerGO instanceof Phaser.Physics.Arcade.Sprite)
        )
            return;
        const bee = beeGO as Phaser.Physics.Arcade.Sprite,
            flower = flowerGO as Phaser.Physics.Arcade.Sprite;
        const data = flower.getData("flowerData") as FlowerData | undefined;
        if (!data) return;

        // Collection
        if (!this.carryingPollen.type && data.hasPollen && !data.isPollinated) {
            this.carryingPollen.type = data.type;
            data.hasPollen = false;
            flower.clearTint();
            if (this.pollenIndicator) this.pollenIndicator.destroy();
            this.pollenIndicator = this.add
                .sprite(
                    this.bee.x,
                    this.bee.y - 25,
                    "pollen_particle_generated"
                )
                .setScale(2.5)
                .setDepth(11)
                .setTint(data.type === "red" ? 0xffaaaa : 0xaaaaff);
            this.createParticles(
                flower.x,
                flower.y,
                "pollen_particle_generated",
                0xffff00,
                15
            );
            this.events.emit(
                "game:show-fact",
                `Collected ${data.type} pollen! Find another ${data.type} flower.`
            );
        }
        // Delivery
        else if (
            this.carryingPollen.type &&
            data.type === this.carryingPollen.type &&
            !data.isPollinated &&
            !data.hasPollen
        ) {
            data.isPollinated = true;
            flower.setTint(0x90ee90);
            this.score += 10;
            this.events.emit("game:update-score", this.score);
            const randomFact = Phaser.Math.RND.pick(this.facts);
            this.events.emit("game:show-fact", `Pollinated! ${randomFact}`);
            if (this.pollenIndicator) {
                this.pollenIndicator.destroy();
                this.pollenIndicator = null;
            }
            this.carryingPollen.type = null;
            this.createParticles(
                flower.x,
                flower.y,
                "pollen_particle_generated",
                0x90ee90,
                25
            );
            if (this.checkAllPollinated()) {
                this.events.emit(
                    "game:show-fact",
                    `All flowers pollinated! Great job!`
                );
                this.time.delayedCall(1500, () => {
                    this.scene.start("GameOver", { score: this.score });
                });
            } else {
                this.assignMorePollenIfNeeded();
            }
        }
    }

    // --- assignMorePollenIfNeeded Method ---
    assignMorePollenIfNeeded() {
        let pollenAvailable = false;
        this.flowers.children.iterate((child) => {
            if (!child) return true;
            const flower = child as Phaser.Physics.Arcade.Sprite;
            const data = flower.getData("flowerData") as FlowerData | undefined;
            if (data?.hasPollen && !data.isPollinated) {
                pollenAvailable = true;
                return false;
            }
            return true;
        });
        if (!pollenAvailable) {
            const unpollinatedFlowers = (
                this.flowers.getChildren() as Phaser.Physics.Arcade.Sprite[]
            ).filter((f) => {
                const data = f?.getData("flowerData") as FlowerData | undefined;
                return data && !data.isPollinated && !data.hasPollen;
            });
            if (unpollinatedFlowers.length > 0) {
                const flowerToAddPollen =
                    Phaser.Math.RND.pick(unpollinatedFlowers);
                const data = flowerToAddPollen?.getData("flowerData") as
                    | FlowerData
                    | undefined;
                if (data && flowerToAddPollen) {
                    data.hasPollen = true;
                    flowerToAddPollen.setTint(0xffff00);
                    this.createParticles(
                        flowerToAddPollen.x,
                        flowerToAddPollen.y,
                        "pollen_particle_generated",
                        0xffff00,
                        10
                    );
                    this.events.emit(
                        "game:show-fact",
                        "More pollen has appeared!"
                    );
                }
            }
        }
    }

    // --- updatePollenIndicatorPosition Method ---
    updatePollenIndicatorPosition() {
        if (this.pollenIndicator && this.bee?.body) {
            this.pollenIndicator.setPosition(this.bee.x, this.bee.y - 25);
        }
    }

    // --- createParticles Method ---
    createParticles(
        x: number,
        y: number,
        texture: string,
        tint: number,
        count: number = 10
    ) {
        if (!this.textures.exists(texture)) return;
        const particles = this.add.particles(x, y, texture, {
            speed: { min: 50, max: 150 },
            angle: { min: 0, max: 360 },
            scale: { start: 1.5, end: 0 },
            lifespan: { min: 300, max: 600 },
            gravityY: 80,
            blendMode: "ADD",
            tint: tint,
            emitting: false,
        });
        if (particles) {
            particles.explode(count);
            this.time.delayedCall(1500, () => {
                if (particles.active) particles.destroy();
            });
        }
    }

    // --- checkAllPollinated Method ---
    checkAllPollinated(): boolean {
        let allDone = true;
        this.flowers.children.iterate((child) => {
            if (!child) return true;
            const flower = child as Phaser.Physics.Arcade.Sprite;
            const data = flower.getData("flowerData") as FlowerData | undefined;
            if (!data || !data.isPollinated) {
                allDone = false;
                return false;
            }
            return true;
        });
        return allDone;
    }
}

