"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import type { LearnQuizQuestion } from "@/types/learn";

function QuizQuestion({
  question,
  index,
  onAnswered,
}: {
  question: LearnQuizQuestion;
  index: number;
  onAnswered: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;
  const isCorrect = selected === question.correctIndex;

  const choose = (optionIndex: number) => {
    if (answered) return;
    setSelected(optionIndex);
    onAnswered(optionIndex === question.correctIndex);
  };

  return (
    <div className="learn-quiz-question">
      <p className="learn-quiz-question-text">
        <span className="learn-quiz-number">{index + 1}.</span> {question.question}
      </p>
      <div className="learn-quiz-options">
        {question.options.map((option, i) => {
          let state = "";
          if (answered) {
            if (i === question.correctIndex) state = "learn-quiz-option--correct";
            else if (i === selected) state = "learn-quiz-option--wrong";
            else state = "learn-quiz-option--dim";
          } else if (selected === i) {
            state = "learn-quiz-option--selected";
          }

          return (
            <button
              key={option}
              type="button"
              disabled={answered}
              onClick={() => choose(i)}
              className={`learn-quiz-option ${state}`}
            >
              <span className="learn-quiz-option-letter">
                {String.fromCharCode(65 + i)}
              </span>
              <span>{option}</span>
              {answered && i === question.correctIndex ? (
                <Check className="learn-quiz-option-icon h-4 w-4" />
              ) : null}
              {answered && i === selected && i !== question.correctIndex ? (
                <X className="learn-quiz-option-icon h-4 w-4" />
              ) : null}
            </button>
          );
        })}
      </div>
      {answered ? (
        <p
          className={`learn-quiz-explanation ${isCorrect ? "learn-quiz-explanation--correct" : "learn-quiz-explanation--wrong"}`}
        >
          {question.explanation}
        </p>
      ) : null}
    </div>
  );
}

export function LessonQuiz({
  title = "Quick check",
  questions,
}: {
  title?: string;
  questions: LearnQuizQuestion[];
}) {
  const [score, setScore] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const finished = answeredCount === questions.length;

  const handleAnswered = (correct: boolean) => {
    setAnsweredCount((c) => c + 1);
    if (correct) setScore((s) => s + 1);
  };

  return (
    <section className="learn-quiz studio-card">
      <div className="learn-quiz-header">
        <h2 className="learn-heading-2 !mt-0">{title}</h2>
        <p className="learn-quiz-subtitle">
          Test your understanding — pick the best answer for each question.
        </p>
      </div>

      <div className="learn-quiz-questions">
        {questions.map((q, i) => (
          <QuizQuestion
            key={q.question}
            question={q}
            index={i}
            onAnswered={handleAnswered}
          />
        ))}
      </div>

      {finished ? (
        <div className="learn-quiz-score">
          <span className="learn-quiz-score-value">
            {score}/{questions.length}
          </span>
          <span className="learn-quiz-score-label">
            {score === questions.length
              ? "Perfect! You've got encapsulation down."
              : score >= questions.length / 2
                ? "Good effort — review the explanations above and try again later."
                : "Keep going — re-read the highlighted sections and try again."}
          </span>
        </div>
      ) : null}
    </section>
  );
}
