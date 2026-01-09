import { useState, useCallback, useEffect } from 'react';
import type { Question, QuestionBank } from '../types';
import sampleQuestionBank from '../data/sample_question_bank.json';

interface UseQuestionBankReturn {
  questionBank: QuestionBank | null;
  questions: Question[];
  currentQuestion: Question | null;
  currentIndex: number;
  loadQuestionBank: (data: QuestionBank) => void;
  loadFromJSON: (json: string) => boolean;
  selectQuestion: (index: number) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  shuffleQuestions: () => void;
  resetToStart: () => void;
  clearQuestionBank: () => void;
  repeatQuestion: () => void;
  isLoaded: boolean;
  error: string | null;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
}

export function useQuestionBank(): UseQuestionBankReturn {
  const [questionBank, setQuestionBank] = useState<QuestionBank | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Auto-load sample question bank on mount
  useEffect(() => {
    try {
      const data = sampleQuestionBank as QuestionBank;
      if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        setQuestionBank(data);
        setQuestions(data.questions);
        setCurrentIndex(0);
        setError(null);
      }
    } catch (err) {
      setError('Failed to load default question bank');
    }
  }, []);

  const loadQuestionBank = useCallback((data: QuestionBank) => {
    try {
      // Validate structure
      if (!data.questions || !Array.isArray(data.questions)) {
        throw new Error('Invalid question bank: missing questions array');
      }

      if (data.questions.length === 0) {
        throw new Error('Question bank is empty');
      }

      // Validate each question
      for (let i = 0; i < data.questions.length; i++) {
        const q = data.questions[i];
        if (!q.id || !q.scenarioPrompt || !q.expectedAnswer) {
          throw new Error(`Invalid question at index ${i}: missing required fields`);
        }
      }

      setQuestionBank(data);
      setQuestions(data.questions);
      setCurrentIndex(0);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load question bank');
    }
  }, []);

  const loadFromJSON = useCallback((json: string): boolean => {
    try {
      const data = JSON.parse(json) as QuestionBank;
      loadQuestionBank(data);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON');
      return false;
    }
  }, [loadQuestionBank]);

  const selectQuestion = useCallback((index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index);
    }
  }, [questions.length]);

  const nextQuestion = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Wrap around to first question
      setCurrentIndex(0);
    }
  }, [currentIndex, questions.length]);

  const previousQuestion = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      // Wrap around to last question
      setCurrentIndex(questions.length - 1);
    }
  }, [currentIndex, questions.length]);

  const shuffleQuestions = useCallback(() => {
    if (questions.length > 1) {
      const shuffled = [...questions];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      setQuestions(shuffled);
      setCurrentIndex(0);
    }
  }, [questions]);

  const resetToStart = useCallback(() => {
    if (questionBank) {
      setQuestions(questionBank.questions);
      setCurrentIndex(0);
    }
  }, [questionBank]);

  const clearQuestionBank = useCallback(() => {
    setQuestionBank(null);
    setQuestions([]);
    setCurrentIndex(0);
    setError(null);
  }, []);

  // Repeat/Refresh current question - useful for re-attempting
  const repeatQuestion = useCallback(() => {
    // This is mainly for UI feedback - triggers a re-render
    setCurrentIndex(prev => prev);
  }, []);

  return {
    questionBank,
    questions,
    currentQuestion: questions[currentIndex] || null,
    currentIndex,
    loadQuestionBank,
    loadFromJSON,
    selectQuestion,
    nextQuestion,
    previousQuestion,
    shuffleQuestions,
    resetToStart,
    clearQuestionBank,
    repeatQuestion,
    isLoaded: questionBank !== null,
    error,
    isFirstQuestion: currentIndex === 0,
    isLastQuestion: currentIndex === questions.length - 1
  };
}
