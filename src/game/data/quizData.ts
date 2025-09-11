// src/game/data/quizData.ts
import { z } from "zod";
import FLOWERS from "./flowerTypes";
import quizQuestionsData from "./quizQuestions.json";

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
export const QUIZ_QUESTIONS: QuizQuestion[] = quizQuestionsData.map((q) =>
    QuizQuestionSchema.parse(q),
);

// Generate flower-based questions dynamically
const generateFlowerQuestions = (): QuizQuestion[] => {
    const flowerQuestions: QuizQuestion[] = [];

    FLOWERS.forEach((flower, index) => {
        if (index < 10) {
            // Limit to 10 flower questions to keep quiz manageable
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
                    parsedStats.lastQuizDate = new Date(
                        parsedStats.lastQuizDate,
                    );
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
    public getQuestionsByCategory(
        category: QuizQuestion["category"],
    ): QuizQuestion[] {
        return ALL_QUIZ_QUESTIONS.filter((q) => q.category === category);
    }

    /**
     * Get questions by difficulty
     * @param difficulty The difficulty level to filter by
     * @returns Questions of the specified difficulty
     */
    public getQuestionsByDifficulty(
        difficulty: QuizQuestion["difficulty"],
    ): QuizQuestion[] {
        return ALL_QUIZ_QUESTIONS.filter((q) => q.difficulty === difficulty);
    }
}

// Export singleton instance
export const quizService = QuizService.getInstance();
