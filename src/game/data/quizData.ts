// src/game/data/quizData.ts
import { z } from 'zod';
import FLOWERS from "./flowerTypes";

// Zod schemas for validation
export const QuestionTypeSchema = z.enum(["multipleChoice", "trueFalse"]);

export const QuizQuestionSchema = z.object({
    id: z.string(),
    type: QuestionTypeSchema,
    question: z.string(),
    correctAnswer: z.union([z.string(), z.boolean()]),
    options: z.array(z.string()).optional(),
    explanation: z.string(),
    difficulty: z.enum(["easy", "medium", "hard"]),
    category: z.enum(["pollination", "flowers", "environment"]),
});

// Keep enum for backward compatibility
export enum QuestionType {
    MultipleChoice = "multipleChoice",
    TrueFalse = "trueFalse",
}

export const QuizStatsSchema = z.object({
    totalQuizzesTaken: z.number(),
    correctAnswers: z.number(),
    totalQuestions: z.number(),
    lastQuizDate: z.date().nullable(),
    gamesPlayedSinceLastQuiz: z.number(),
});

// Type exports
export type QuestionTypeValue = z.infer<typeof QuestionTypeSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type QuizStats = z.infer<typeof QuizStatsSchema>;

// Core quiz questions database
export const QUIZ_QUESTIONS: QuizQuestion[] = [
    // Basic pollination questions
    {
        id: "pollination_bees_food_percentage",
        type: "multipleChoice",
        question: "What percentage of the food we eat is pollinated by bees?",
        correctAnswer: "1/3",
        options: ["1/10", "1/3", "1/2", "3/4"],
        explanation: "Bees are responsible for pollinating about 1/3 of the food we eat!",
        difficulty: "easy",
        category: "pollination",
    },
    {
        id: "pollination_honey_bees_only",
        type: "trueFalse",
        question: "All bees make honey.",
        correctAnswer: false,
        explanation: "Not all bees make honey! Many bee species are solitary.",
        difficulty: "easy",
        category: "pollination",
    },
    {
        id: "pollination_non_pollinator",
        type: "multipleChoice",
        question: "Which of these is NOT a pollinator?",
        correctAnswer: "Sharks",
        options: ["Bats", "Moths", "Sharks", "Beetles"],
        explanation: "Pollinators include bees, butterflies, moths, beetles, flies, birds, and bats, but not sharks.",
        difficulty: "medium",
        category: "pollination",
    },
    {
        id: "pollination_waggle_dance",
        type: "multipleChoice",
        question: "How do honeybees communicate flower locations?",
        correctAnswer: "Waggle dance",
        options: ["Waggle dance", "Chemical trails", "Buzzing sounds", "Color patterns"],
        explanation: 'Honeybees communicate flower locations using a "waggle dance".',
        difficulty: "medium",
        category: "pollination",
    },
    {
        id: "pollination_wind_water",
        type: "trueFalse",
        question: "Plants can only be pollinated by animals.",
        correctAnswer: false,
        explanation: "Wind and water can also be pollinators for certain plants like grasses and oaks.",
        difficulty: "medium",
        category: "pollination",
    },
    {
        id: "pollination_economic_value",
        type: "multipleChoice",
        question: "How much are pollination services worth to the global economy?",
        correctAnswer: "Over $3 trillion",
        options: ["$100 million", "$500 million", "$1 billion", "Over $3 trillion"],
        explanation: "Global pollination services are worth over $3 trillion.",
        difficulty: "hard",
        category: "pollination",
    },
    {
        id: "pollination_species_count",
        type: "multipleChoice",
        question: "Approximately how many species of pollinators exist worldwide?",
        correctAnswer: "Over 200,000",
        options: ["About 1,000", "About 10,000", "About 50,000", "Over 200,000"],
        explanation: "There are over 200,000 species of pollinators worldwide.",
        difficulty: "hard",
        category: "pollination",
    },
    {
        id: "pollination_climate_change",
        type: "trueFalse",
        question: "Climate change can disrupt the timing between flower blooming and pollinator activity.",
        correctAnswer: true,
        explanation: "Climate change can disrupt the timing between flower blooming and pollinator activity.",
        difficulty: "medium",
        category: "environment",
    },
    {
        id: "pollination_crop_percentage",
        type: "multipleChoice",
        question: "What percentage of crop plants require animal pollination?",
        correctAnswer: "80%",
        options: ["20%", "40%", "60%", "80%"],
        explanation: "80% of the world's 1,400 crop plants require animal pollination.",
        difficulty: "medium",
        category: "pollination",
    },
    {
        id: "pollination_tree_frog",
        type: "multipleChoice",
        question: "Which animal is known to accidentally pollinate flowers while consuming them?",
        correctAnswer: "Brazilian Tree Frog",
        options: ["Red Fox", "Brazilian Tree Frog", "Tasmanian Devil", "Mountain Goat"],
        explanation: "The Brazilian Tree Frog accidentally pollinates flowers it consumes.",
        difficulty: "hard",
        category: "pollination",
    },
    // Additional expanded questions
    {
        id: "pollination_nocturnal_flowers",
        type: "trueFalse",
        question: "Some flowers only open at night for nocturnal pollinators like moths and bats.",
        correctAnswer: true,
        explanation: "Some flowers only open at night for nocturnal pollinators like moths and bats.",
        difficulty: "easy",
        category: "pollination",
    },
    {
        id: "pollination_honeybee_benefits",
        type: "trueFalse",
        question: "Honeybees provide between $235 and $577 billion in benefits to global food production.",
        correctAnswer: true,
        explanation: "Honeybees provide between $235 and $577 billion in benefits to global food production.",
        difficulty: "hard",
        category: "pollination",
    },
    {
        id: "pollination_wild_bees_count",
        type: "multipleChoice",
        question: "How many species of wild bees are there worldwide?",
        correctAnswer: "20,000",
        options: ["1,000", "5,000", "10,000", "20,000"],
        explanation: "There are 20,000 species of wild bees worldwide.",
        difficulty: "hard",
        category: "pollination",
    },
    {
        id: "pollination_continent_coverage",
        type: "trueFalse",
        question: "Pollinators are found on every continent except Antarctica.",
        correctAnswer: true,
        explanation: "Pollinators are found on every continent except Antarctica.",
        difficulty: "medium",
        category: "pollination",
    },
    {
        id: "pollination_us_value",
        type: "multipleChoice",
        question: "What is the annual value of pollination of US agricultural crops?",
        correctAnswer: "$10 billion",
        options: ["$1 billion", "$5 billion", "$10 billion", "$20 billion"],
        explanation: "Pollination of US agricultural crops is valued at $10 billion annually.",
        difficulty: "hard",
        category: "pollination",
    },
    {
        id: "pollination_dinosaur_era",
        type: "trueFalse",
        question: "Insect pollination dates back to the dinosaur era.",
        correctAnswer: true,
        explanation: "Insect pollination dates back to the dinosaur era.",
        difficulty: "hard",
        category: "pollination",
    },
    {
        id: "pollination_us_food_crops",
        type: "multipleChoice",
        question: "How many US food crops depend on pollinators?",
        correctAnswer: "Over 150",
        options: ["Over 50", "Over 100", "Over 150", "Over 200"],
        explanation: "Over 150 US food crops, including most fruits and grains, depend on pollinators.",
        difficulty: "medium",
        category: "pollination",
    },
    {
        id: "pollination_bumblebee_buzz",
        type: "trueFalse",
        question: "Bumblebees buzz at a middle C tone to release pollen from tomatoes and blueberries.",
        correctAnswer: true,
        explanation: "Bumblebees buzz at a middle C tone to release pollen from tomatoes and blueberries in under a second.",
        difficulty: "medium",
        category: "pollination",
    },
    {
        id: "pollination_solitary_bees_percentage",
        type: "multipleChoice",
        question: "What percentage of bee species are solitary and ground-nesting?",
        correctAnswer: "Over 70%",
        options: ["Over 30%", "Over 50%", "Over 70%", "Over 90%"],
        explanation: "Over 70% of bee species are solitary and ground-nesting, forming aggregations that can last up to 60 years.",
        difficulty: "hard",
        category: "pollination",
    },
    {
        id: "pollination_social_bee_hives",
        type: "trueFalse",
        question: "Social bees build hives with 20,000 to 80,000 bees.",
        correctAnswer: true,
        explanation: "Social bees build hives with 20,000 to 80,000 bees, while bumble bees often nest underground.",
        difficulty: "medium",
        category: "pollination",
    },
    {
        id: "pollination_biotic_percentage",
        type: "multipleChoice",
        question: "What percentage of pollination is biotic (animals)?",
        correctAnswer: "80%",
        options: ["50%", "60%", "70%", "80%"],
        explanation: "About 80% of pollination is biotic (animals), while 20% is abiotic (98% wind, 2% water).",
        difficulty: "medium",
        category: "pollination",
    },
    {
        id: "pollination_nocturnal_bats",
        type: "trueFalse",
        question: "Nocturnal pollinators like bats are crucial for plants like agave and cactus.",
        correctAnswer: true,
        explanation: "Nocturnal pollinators like bats are crucial for plants like agave and cactus in arid regions.",
        difficulty: "medium",
        category: "pollination",
    },
    {
        id: "pollination_bee_daily_flowers",
        type: "multipleChoice",
        question: "How many flowers can a single honeybee visit in a day?",
        correctAnswer: "Up to 5,000",
        options: ["Up to 500", "Up to 1,000", "Up to 2,500", "Up to 5,000"],
        explanation: "A single honeybee can visit up to 5,000 flowers in a day.",
        difficulty: "medium",
        category: "pollination",
    },
    {
        id: "pollination_bee_face_recognition",
        type: "trueFalse",
        question: "Bees can recognize human faces.",
        correctAnswer: true,
        explanation: "Bees can recognize human faces, suggesting advanced cognitive abilities.",
        difficulty: "easy",
        category: "pollination",
    },
    {
        id: "pollination_bat_fruit_species",
        type: "multipleChoice",
        question: "How many species of fruit-bearing plants do bats pollinate?",
        correctAnswer: "Over 300",
        options: ["Over 100", "Over 200", "Over 300", "Over 400"],
        explanation: "Bats pollinate over 300 species of fruit-bearing plants, including mangoes and bananas.",
        difficulty: "hard",
        category: "pollination",
    },
    {
        id: "pollination_pesticides_ccd",
        type: "trueFalse",
        question: "Pesticides like neonicotinoids are linked to bee colony collapse disorder.",
        correctAnswer: true,
        explanation: "Pesticides like neonicotinoids are linked to bee colony collapse disorder.",
        difficulty: "medium",
        category: "environment",
    },
    {
        id: "pollination_food_crop_percentage",
        type: "multipleChoice",
        question: "What percentage of the world's food crops do pollinators help produce?",
        correctAnswer: "35%",
        options: ["15%", "25%", "35%", "45%"],
        explanation: "Pollinators help produce 35% of the world's food crops, according to the FAO.",
        difficulty: "medium",
        category: "pollination",
    },
    {
        id: "pollination_triggered_pollen",
        type: "trueFalse",
        question: "Some plants release pollen only when triggered by a pollinator's specific touch.",
        correctAnswer: true,
        explanation: "Some plants release pollen only when triggered by a pollinator’s specific touch.",
        difficulty: "medium",
        category: "pollination",
    },
    {
        id: "pollination_bee_aggregation_duration",
        type: "multipleChoice",
        question: "How many years can solitary bee aggregations last?",
        correctAnswer: "Up to 60 years",
        options: ["Up to 10 years", "Up to 20 years", "Up to 40 years", "Up to 60 years"],
        explanation: "Over 70% of bee species are solitary and ground-nesting, forming aggregations that can last up to 60 years.",
        difficulty: "hard",
        category: "pollination",
    },
    {
        id: "pollination_tropical_forest_bees",
        type: "trueFalse",
        question: "In tropical forests, bees pollinate canopy trees critical for carbon storage.",
        correctAnswer: true,
        explanation: "In tropical forests, bees pollinate canopy trees critical for carbon storage.",
        difficulty: "medium",
        category: "pollination",
    },
    {
        id: "pollination_native_insect_savings",
        type: "multipleChoice",
        question: "What is the annual savings from native insect pollination in the US?",
        correctAnswer: "$3.1 billion",
        options: ["$1 billion", "$2 billion", "$3.1 billion", "$5 billion"],
        explanation: "Native insect pollination saves $3.1 billion annually in the US.",
        difficulty: "hard",
        category: "pollination",
    },
    {
        id: "pollination_monarch_migration",
        type: "trueFalse",
        question: "The monarch butterfly's migration relies on nectar from pollinated flowers.",
        correctAnswer: true,
        explanation: "The monarch butterfly's migration relies on nectar from pollinated flowers.",
        difficulty: "easy",
        category: "pollination",
    },
    {
        id: "pollination_bee_colony_daily_flowers",
        type: "multipleChoice",
        question: "How many million flowers can a single bee colony pollinate each day?",
        correctAnswer: "300 million",
        options: ["100 million", "200 million", "300 million", "400 million"],
        explanation: "A single bee colony can pollinate 300 million flowers each day.",
        difficulty: "hard",
        category: "pollination",
    },
    {
        id: "pollination_flower_colors_scents",
        type: "trueFalse",
        question: "Flowers have specific colors and scents to attract their preferred pollinators.",
        correctAnswer: true,
        explanation: "Flowers have specific colors and scents to attract their preferred pollinators.",
        difficulty: "easy",
        category: "pollination",
    },
    {
        id: "pollination_global_economic_value",
        type: "multipleChoice",
        question: "What is the global economic value added by pollinators?",
        correctAnswer: "$233 billion",
        options: ["$100 billion", "$150 billion", "$200 billion", "$233 billion"],
        explanation: "Pollinators add $233 billion to the global economy.",
        difficulty: "hard",
        category: "pollination",
    },
    {
        id: "pollination_orchid_intoxication",
        type: "trueFalse",
        question: "Some orchid species intoxicate bees during visits.",
        correctAnswer: true,
        explanation: "Some orchid species intoxicate bees during visits, lasting up to 90 minutes.",
        difficulty: "medium",
        category: "pollination",
    },
    {
        id: "pollination_animal_species_count",
        type: "multipleChoice",
        question: "How many animal species act as pollinators for 250,000 flowering plants?",
        correctAnswer: "Between 100,000 and 200,000",
        options: ["Between 50,000 and 100,000", "Between 100,000 and 200,000", "Between 200,000 and 300,000", "Over 300,000"],
        explanation: "Between 100,000 and 200,000 animal species act as pollinators for 250,000 flowering plants.",
        difficulty: "hard",
        category: "pollination",
    },
    {
        id: "pollination_underwater_crustaceans",
        type: "trueFalse",
        question: "Underwater crustaceans like Idotea balthica pollinate algae.",
        correctAnswer: true,
        explanation: "Underwater crustaceans like Idotea balthica pollinate algae like Gracilaria gracilis.",
        difficulty: "hard",
        category: "pollination",
    },
    {
        id: "pollination_angiosperms_biotic",
        type: "multipleChoice",
        question: "What percentage of angiosperms rely on biotic pollination?",
        correctAnswer: "80%",
        options: ["60%", "70%", "80%", "90%"],
        explanation: "80% of angiosperms rely on biotic pollination.",
        difficulty: "medium",
        category: "pollination",
    },
    {
        id: "pollination_coevolution",
        type: "trueFalse",
        question: "Plants have co-evolved with pollinators over millions of years.",
        correctAnswer: true,
        explanation: "Plants have co-evolved with pollinators over millions of years.",
        difficulty: "medium",
        category: "pollination",
    },
    {
        id: "pollination_native_products_value",
        type: "multipleChoice",
        question: "How much do native insect pollination produce in products annually in the US?",
        correctAnswer: "$40 billion",
        options: ["$20 billion", "$30 billion", "$40 billion", "$50 billion"],
        explanation: "Native insect pollination produces $40 billion worth of products annually in the US.",
        difficulty: "hard",
        category: "pollination",
    },
];

// Generate flower-based questions dynamically
const generateFlowerQuestions = (): QuizQuestion[] => {
    const flowerQuestions: QuizQuestion[] = [];

    FLOWERS.forEach((flower, index) => {
        if (index < 10) { // Limit to 10 flower questions to keep quiz manageable
            flowerQuestions.push({
                id: `flower_scientific_name_${flower.id}`,
                type: "multipleChoice",
                question: `What is the scientific name of the ${flower.name}?`,
                correctAnswer: flower.scientificName,
                options: [
                    flower.scientificName,
                    FLOWERS[(index + 1) % FLOWERS.length].scientificName,
                    FLOWERS[(index + 2) % FLOWERS.length].scientificName,
                    FLOWERS[(index + 3) % FLOWERS.length].scientificName,
                ].sort(() => Math.random() - 0.5), // Shuffle options
                explanation: `The ${flower.name}'s scientific name is ${flower.scientificName}.`,
                difficulty: "hard",
                category: "flowers",
            });
        }
    });

    return flowerQuestions;
};

// Combine all questions
export const ALL_QUIZ_QUESTIONS: QuizQuestion[] = [
    ...QUIZ_QUESTIONS,
    ...generateFlowerQuestions(),
];

// Validate all questions at runtime
QUIZ_QUESTIONS.forEach((question, index) => {
    try {
        QuizQuestionSchema.parse(question);
    } catch (error) {
        console.error(`Invalid question at index ${index}:`, error);
    }
});

// Initialize quiz stats
const initialQuizStats: QuizStats = {
    totalQuizzesTaken: 0,
    correctAnswers: 0,
    totalQuestions: 0,
    lastQuizDate: null,
    gamesPlayedSinceLastQuiz: 0,
};

// Quiz Service class with validation
export class QuizService {
    private static instance: QuizService;
    private quizStats: QuizStats = { ...initialQuizStats };
    private readonly storageKey = "pollination_quiz_stats";

    private constructor() {
        this.loadStats();
    }

    public static getInstance(): QuizService {
        if (!QuizService.instance) {
            QuizService.instance = new QuizService();
        }
        return QuizService.instance;
    }

    private loadStats(): void {
        try {
            const savedStats = localStorage.getItem(this.storageKey);
            if (savedStats) {
                const parsedStats = JSON.parse(savedStats);
                // Convert lastQuizDate string back to Date object if it exists
                if (parsedStats.lastQuizDate) {
                    parsedStats.lastQuizDate = new Date(parsedStats.lastQuizDate);
                }
                // Validate the parsed stats
                const validatedStats = QuizStatsSchema.parse(parsedStats);
                this.quizStats = validatedStats;
            }
        } catch (error) {
            console.error("Error loading quiz stats:", error);
            // Reset to initial stats if validation fails
            this.quizStats = { ...initialQuizStats };
        }
    }

    private saveStats(): void {
        try {
            localStorage.setItem(
                this.storageKey,
                JSON.stringify(this.quizStats),
            );
        } catch (error) {
            console.error("Error saving quiz stats:", error);
        }
    }

    /**
     * Get random quiz questions for a quiz session
     * @param count Number of questions to retrieve
     * @returns Array of quiz questions
     */
    public getRandomQuizQuestions(count: number = 5): QuizQuestion[] {
        // Shuffle the questions array and return requested count
        return [...ALL_QUIZ_QUESTIONS]
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.min(count, ALL_QUIZ_QUESTIONS.length));
    }

    /**
     * Record the results of a completed quiz
     * @param correctAnswers Number of correct answers
     * @param totalQuestions Total number of questions in the quiz
     */
    public recordQuizResults(
        correctAnswers: number,
        totalQuestions: number,
    ): void {
        this.quizStats.totalQuizzesTaken += 1;
        this.quizStats.correctAnswers += correctAnswers;
        this.quizStats.totalQuestions += totalQuestions;
        this.quizStats.lastQuizDate = new Date();
        this.quizStats.gamesPlayedSinceLastQuiz = 0;
        this.saveStats();
    }

    /**
     * Record that a game has been played
     */
    public recordGamePlayed(): void {
        this.quizStats.gamesPlayedSinceLastQuiz += 1;
        this.saveStats();
    }

    /**
     * Check if a quiz is due (after 3 games)
     * @returns True if a quiz is due, false otherwise
     */
    public isQuizDue(): boolean {
        return this.quizStats.gamesPlayedSinceLastQuiz >= 3;
    }

    /**
     * Get quiz stats
     * @returns Current quiz stats
     */
    public getQuizStats(): QuizStats {
        return { ...this.quizStats };
    }

    /**
     * Get all available questions (for admin/debug purposes)
     * @returns All quiz questions
     */
    public getAllQuestions(): QuizQuestion[] {
        return [...ALL_QUIZ_QUESTIONS];
    }

    /**
     * Get questions by category
     * @param category The category to filter by
     * @returns Questions in the specified category
     */
    public getQuestionsByCategory(category: QuizQuestion["category"]): QuizQuestion[] {
        return ALL_QUIZ_QUESTIONS.filter(q => q.category === category);
    }

    /**
     * Get questions by difficulty
     * @param difficulty The difficulty level to filter by
     * @returns Questions of the specified difficulty
     */
    public getQuestionsByDifficulty(difficulty: QuizQuestion["difficulty"]): QuizQuestion[] {
        return ALL_QUIZ_QUESTIONS.filter(q => q.difficulty === difficulty);
    }
}

// Export singleton instance
export const quizService = QuizService.getInstance();
