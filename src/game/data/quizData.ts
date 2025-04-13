// src/game/data/quizData.ts
import FLOWERS, { FlowerType } from './flowerTypes';

// Define quiz question types
export enum QuestionType {
    MultipleChoice = 'multipleChoice',
    TrueFalse = 'trueFalse'
}

// Define interfaces for quiz questions and answers
export interface QuizQuestion {
    id: string;
    type: QuestionType;
    question: string;
    correctAnswer: string | boolean;
    options?: string[]; // For multiple choice questions
    explanation: string;
    difficulty: 'easy' | 'medium' | 'hard';
    category: 'pollination' | 'flowers' | 'environment';
}

// Track user's quiz stats
export interface QuizStats {
    totalQuizzesTaken: number;
    correctAnswers: number;
    totalQuestions: number;
    lastQuizDate: Date | null;
    gamesPlayedSinceLastQuiz: number;
}

// Initialize quiz stats
const initialQuizStats: QuizStats = {
    totalQuizzesTaken: 0,
    correctAnswers: 0,
    totalQuestions: 0,
    lastQuizDate: null,
    gamesPlayedSinceLastQuiz: 0
};

// Quiz data generation
// Multiple choice questions about pollination generated from facts
export const generatePollinationQuizQuestions = (): QuizQuestion[] => {
    const questions: QuizQuestion[] = [
        {
            id: 'pollination_1',
            type: QuestionType.MultipleChoice,
            question: 'What percentage of the food we eat is pollinated by bees?',
            correctAnswer: '1/3',
            options: ['1/10', '1/3', '1/2', '3/4'],
            explanation: 'Bees are responsible for pollinating about 1/3 of the food we eat!',
            difficulty: 'easy',
            category: 'pollination'
        },
        {
            id: 'pollination_2',
            type: QuestionType.TrueFalse,
            question: 'All bees make honey.',
            correctAnswer: false,
            explanation: 'Not all bees make honey! Many bee species are solitary.',
            difficulty: 'easy',
            category: 'pollination'
        },
        {
            id: 'pollination_3',
            type: QuestionType.MultipleChoice,
            question: 'Which of these is NOT a pollinator?',
            correctAnswer: 'Sharks',
            options: ['Bats', 'Moths', 'Sharks', 'Beetles'],
            explanation: 'Pollinators include bees, butterflies, moths, beetles, flies, birds, and bats, but not sharks.',
            difficulty: 'medium',
            category: 'pollination'
        },
        {
            id: 'pollination_4',
            type: QuestionType.MultipleChoice,
            question: 'How do honeybees communicate flower locations?',
            correctAnswer: 'Waggle dance',
            options: ['Waggle dance', 'Chemical trails', 'Buzzing sounds', 'Color patterns'],
            explanation: 'Honeybees communicate flower locations using a "waggle dance".',
            difficulty: 'medium',
            category: 'pollination'
        },
        {
            id: 'pollination_5',
            type: QuestionType.TrueFalse,
            question: 'Plants can only be pollinated by animals.',
            correctAnswer: false,
            explanation: 'Wind and water can also be pollinators for certain plants like grasses and oaks.',
            difficulty: 'medium',
            category: 'pollination'
        },
        {
            id: 'pollination_6',
            type: QuestionType.MultipleChoice,
            question: 'How much are pollination services worth to the global economy?',
            correctAnswer: 'Over $3 trillion',
            options: ['$100 million', '$500 million', '$1 billion', 'Over $3 trillion'],
            explanation: 'Global pollination services are worth over $3 trillion.',
            difficulty: 'hard',
            category: 'pollination'
        },
        {
            id: 'pollination_7',
            type: QuestionType.MultipleChoice,
            question: 'Approximately how many species of pollinators exist worldwide?',
            correctAnswer: 'Over 200,000',
            options: ['About 1,000', 'About 10,000', 'About 50,000', 'Over 200,000'],
            explanation: 'There are over 200,000 species of pollinators worldwide.',
            difficulty: 'hard',
            category: 'pollination'
        },
        {
            id: 'pollination_8',
            type: QuestionType.TrueFalse,
            question: 'Climate change can disrupt the timing between flower blooming and pollinator activity.',
            correctAnswer: true,
            explanation: 'Climate change can disrupt the timing between flower blooming and pollinator activity.',
            difficulty: 'medium',
            category: 'environment'
        },
        {
            id: 'pollination_9',
            type: QuestionType.MultipleChoice,
            question: 'What percentage of crop plants require animal pollination?',
            correctAnswer: '80%',
            options: ['20%', '40%', '60%', '80%'],
            explanation: "80% of the world's 1,400 crop plants require animal pollination.",
            difficulty: 'medium',
            category: 'pollination'
        },
        {
            id: 'pollination_10',
            type: QuestionType.MultipleChoice,
            question: 'Which animal is known to accidentally pollinate flowers while consuming them?',
            correctAnswer: 'Brazilian Tree Frog',
            options: ['Red Fox', 'Brazilian Tree Frog', 'Tasmanian Devil', 'Mountain Goat'],
            explanation: 'The Brazilian Tree Frog accidentally pollinates flowers it consumes.',
            difficulty: 'hard',
            category: 'pollination'
        }
    ];
    
    // Generate more questions from flower data
    FLOWERS.forEach((flower, index) => {
        if (index < 5) { // Limit to 5 flower questions
            questions.push({
                id: `flower_${flower.id}`,
                type: QuestionType.MultipleChoice,
                question: `What is the scientific name of the ${flower.name}?`,
                correctAnswer: flower.scientificName,
                options: [
                    flower.scientificName,
                    FLOWERS[(index + 1) % FLOWERS.length].scientificName,
                    FLOWERS[(index + 2) % FLOWERS.length].scientificName,
                    FLOWERS[(index + 3) % FLOWERS.length].scientificName
                ].sort(() => Math.random() - 0.5), // Shuffle options
                explanation: `The ${flower.name}'s scientific name is ${flower.scientificName}.`,
                difficulty: 'hard',
                category: 'flowers'
            });
        }
    });
    
    return questions;
};

// Quiz Service methods
export class QuizService {
    private static instance: QuizService;
    private quizStats: QuizStats = {...initialQuizStats};
    private quizQuestions: QuizQuestion[] = [];
    private storageKey = 'pollination_quiz_stats';
    
    private constructor() {
        this.loadStats();
        this.quizQuestions = generatePollinationQuizQuestions();
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
                this.quizStats = parsedStats;
            }
        } catch (error) {
            console.error('Error loading quiz stats:', error);
        }
    }
    
    private saveStats(): void {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.quizStats));
        } catch (error) {
            console.error('Error saving quiz stats:', error);
        }
    }
    
    /**
     * Get random quiz questions for a quiz session
     * @param count Number of questions to retrieve
     * @returns Array of quiz questions
     */
    public getRandomQuizQuestions(count: number = 5): QuizQuestion[] {
        // Shuffle the questions array and return requested count
        return [...this.quizQuestions]
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.min(count, this.quizQuestions.length));
    }
    
    /**
     * Record the results of a completed quiz
     * @param correctAnswers Number of correct answers
     * @param totalQuestions Total number of questions in the quiz
     */
    public recordQuizResults(correctAnswers: number, totalQuestions: number): void {
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
        return {...this.quizStats};
    }
}

// Export singleton instance
export const quizService = QuizService.getInstance();