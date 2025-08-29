// src/components/Quiz.tsx
import React, { useState, useEffect } from "react";
import styles from "../styles/Quiz.module.css"; // Gradual migration; new utilities below
import { QuizQuestion, QuizService, QuestionType } from "../game/data/quizData";

// Define internal interfaces that match the structure needed by the component
export interface IOption {
    text: string;
    isCorrect: boolean;
}

export interface IQuestion {
    text: string;
    options: IOption[];
    explanation?: string;
}

interface QuizProps {
    isCompulsory?: boolean;
    onComplete: (score: number, totalQuestions: number) => void;
    onSkip?: () => void;
}

// Convert QuizQuestion from the service to the format expected by the component
const convertQuizQuestion = (question: QuizQuestion): IQuestion => {
    if (question.type === QuestionType.MultipleChoice && question.options) {
        // For multiple choice questions
        return {
            text: question.question,
            explanation: question.explanation,
            options: question.options.map((option) => ({
                text: option,
                isCorrect: option === question.correctAnswer,
            })),
        };
    } else {
        // For true/false questions
        return {
            text: question.question,
            explanation: question.explanation,
            options: [
                { text: "True", isCorrect: question.correctAnswer === true },
                { text: "False", isCorrect: question.correctAnswer === false },
            ],
        };
    }
};

const Quiz: React.FC<QuizProps> = ({
    isCompulsory = false,
    onComplete,
    onSkip,
}) => {
    const [questions, setQuestions] = useState<IQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOptionIndex, setSelectedOptionIndex] = useState<
        number | null
    >(null);
    const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [isQuizComplete, setIsQuizComplete] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Initialize quiz questions
        const quizService = QuizService.getInstance();
        const quizQuestions = quizService.getRandomQuizQuestions(5); // Get 5 random questions

        // Convert questions to the format expected by the component
        const formattedQuestions = quizQuestions.map((q) =>
            convertQuizQuestion(q),
        );

        setQuestions(formattedQuestions);
        setIsLoading(false);
    }, []);

    const currentQuestion = questions[currentQuestionIndex];

    const handleOptionSelect = (index: number) => {
        if (!isAnswerSubmitted) {
            setSelectedOptionIndex(index);
        }
    };

    const handleSubmitAnswer = () => {
        if (selectedOptionIndex === null) return;

        setIsAnswerSubmitted(true);

        // Check if answer is correct
        if (currentQuestion.options[selectedOptionIndex].isCorrect) {
            setScore(score + 1);
        }
    };

    const handleNextQuestion = () => {
        setSelectedOptionIndex(null);
        setIsAnswerSubmitted(false);

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            setIsQuizComplete(true);
            // Update QuizService stats
            const quizService = QuizService.getInstance();
            quizService.recordQuizResults(score, questions.length);
            onComplete(score, questions.length);
        }
    };

    const handleSkipQuiz = () => {
        if (onSkip) {
            onSkip();
        }
    };

    const getOptionClassName = (option: IOption, index: number) => {
        let className = styles.option;

        if (!isAnswerSubmitted && selectedOptionIndex === index) {
            className += ` ${styles.selected}`;
        }

        if (isAnswerSubmitted) {
            if (option.isCorrect) {
                className += ` ${styles.correct}`;
            } else if (selectedOptionIndex === index) {
                className += ` ${styles.incorrect}`;
            }
        }

        return className;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center w-full h-full text-neutral-300 text-lg">
                Loading quiz questions...
            </div>
        );
    }

    if (isQuizComplete) {
        return (
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="card w-full max-w-xl animate-fadeIn">
                    <div className="text-center mb-4">
                        <h2 className="text-2xl font-bold heading-gradient mb-2">
                            Quiz Complete!
                        </h2>
                        <p className="text-lg font-medium text-accent mb-1">
                            Your score: {score} / {questions.length}
                        </p>
                        <p className="text-neutral-300">
                            Thank you for testing your pollination knowledge!
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 overflow-y-auto p-4 flex items-start justify-center">
            <div className="card w-full max-w-3xl animate-fadeIn">
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold heading-gradient mb-1">
                        Pollination Quiz
                    </h2>
                    <p className="text-sm text-neutral-400 tracking-wide uppercase">
                        Question {currentQuestionIndex + 1} of{" "}
                        {questions.length}
                    </p>
                </div>
                {isCompulsory && (
                    <div className="mb-4 rounded-md bg-warning/15 border border-warning/30 px-3 py-2 text-warning text-sm text-center font-medium">
                        Complete this quiz to continue playing!
                    </div>
                )}
                <div className="mb-6">
                    <div className="mb-4">
                        <h3 className="text-xl font-semibold text-neutral-100 leading-snug">
                            {currentQuestion.text}
                        </h3>
                    </div>
                    <div className="flex flex-col gap-3">
                        {currentQuestion.options.map((option, index) => {
                            const selected = selectedOptionIndex === index;
                            const correct =
                                isAnswerSubmitted && option.isCorrect;
                            const incorrect =
                                isAnswerSubmitted &&
                                selected &&
                                !option.isCorrect;
                            return (
                                <button
                                    key={index}
                                    onClick={() => handleOptionSelect(index)}
                                    disabled={isAnswerSubmitted}
                                    className={[
                                        "text-left rounded-md border px-4 py-3 transition-colors focus-ring",
                                        "bg-neutral-900/40 backdrop-blur-sm border-white/10 text-neutral-200 hover:bg-neutral-800/60",
                                        selected && !isAnswerSubmitted
                                            ? "ring-2 ring-info/60 border-info/50 bg-info/10"
                                            : "",
                                        correct
                                            ? "border-success/60 bg-success/15 text-success font-medium"
                                            : "",
                                        incorrect
                                            ? "border-danger/60 bg-danger/15 text-danger"
                                            : "",
                                    ].join(" ")}
                                >
                                    {option.text}
                                </button>
                            );
                        })}
                    </div>
                    {isAnswerSubmitted && currentQuestion.explanation && (
                        <div className="mt-5 rounded-md border border-info/40 bg-info/10 p-4 text-sm text-info">
                            <p>
                                <strong>Explanation:</strong>{" "}
                                {currentQuestion.explanation}
                            </p>
                        </div>
                    )}
                </div>
                <div className="flex justify-between items-center gap-4">
                    {!isAnswerSubmitted ? (
                        <>
                            <button
                                onClick={handleSubmitAnswer}
                                disabled={selectedOptionIndex === null}
                                className="btn-primary disabled:opacity-50"
                            >
                                Submit Answer
                            </button>
                            {!isCompulsory && (
                                <button
                                    onClick={handleSkipQuiz}
                                    className="btn-secondary"
                                >
                                    Skip Quiz
                                </button>
                            )}
                        </>
                    ) : (
                        <button
                            onClick={handleNextQuestion}
                            className="btn-primary"
                        >
                            {currentQuestionIndex < questions.length - 1
                                ? "Next Question"
                                : "Finish Quiz"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Quiz;
