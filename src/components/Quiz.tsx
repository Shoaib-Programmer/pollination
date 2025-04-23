// src/components/Quiz.tsx
import React, { useState, useEffect } from "react";
import styles from "../styles/Quiz.module.css";
import { QuizQuestion, QuizService, QuestionType } from "../game/data";

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
        return <div className={styles.loading}>Loading quiz questions...</div>;
    }

    if (isQuizComplete) {
        return (
            <div className={styles.quizContainer}>
                <div className={styles.quizHeader}>
                    <h2>Quiz Complete!</h2>
                    <p className={styles.scoreDisplay}>
                        Your score: {score} out of {questions.length}
                    </p>
                    <p>Thank you for testing your pollination knowledge!</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.quizContainer}>
            <div className={styles.quizHeader}>
                <h2>Pollination Quiz</h2>
                <p className={styles.progress}>
                    Question {currentQuestionIndex + 1} of {questions.length}
                </p>
            </div>

            {isCompulsory && (
                <div className={styles.compulsoryNote}>
                    Complete this quiz to continue playing!
                </div>
            )}

            <div className={styles.questionCard}>
                <div className={styles.question}>
                    <h3>{currentQuestion.text}</h3>
                </div>

                <div className={styles.options}>
                    {currentQuestion.options.map((option, index) => (
                        <button
                            key={index}
                            className={getOptionClassName(option, index)}
                            onClick={() => handleOptionSelect(index)}
                            disabled={isAnswerSubmitted}
                        >
                            {option.text}
                        </button>
                    ))}
                </div>

                {isAnswerSubmitted && currentQuestion.explanation && (
                    <div className={styles.explanation}>
                        <p>
                            <strong>Explanation:</strong>{" "}
                            {currentQuestion.explanation}
                        </p>
                    </div>
                )}
            </div>

            <div className={styles.controls}>
                {!isAnswerSubmitted ? (
                    <>
                        <button
                            className={styles.submitButton}
                            onClick={handleSubmitAnswer}
                            disabled={selectedOptionIndex === null}
                        >
                            Submit Answer
                        </button>

                        {!isCompulsory && (
                            <button
                                className={styles.skipButton}
                                onClick={handleSkipQuiz}
                            >
                                Skip Quiz
                            </button>
                        )}
                    </>
                ) : (
                    <button
                        className={styles.nextButton}
                        onClick={handleNextQuestion}
                    >
                        {currentQuestionIndex < questions.length - 1
                            ? "Next Question"
                            : "Finish Quiz"}
                    </button>
                )}
            </div>
        </div>
    );
};

export default Quiz;
