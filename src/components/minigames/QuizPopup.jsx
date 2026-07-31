"use client";
import { useEffect, useMemo, useState } from "react";

// Builds a fallback question from the block's stats if no explicit `quiz` field exists.
function buildFallbackQuiz(content) {
  if (!content.stats || content.stats.length === 0) return null;
  const correct = content.stats[0];
  const decoys = ["7.42", "8.85", "9.61", "2026", "3", "IIT", "NIT"].filter(d => d !== correct.val);
  const options = [correct.val, decoys[0], decoys[1]].sort(() => Math.random() - 0.5);
  return {
    q: `What was the ${correct.label}?`,
    options,
    answer: correct.val,
  };
}

export default function QuizPopup({ content, onComplete, onSkip }) {
  const quiz = useMemo(() => content.quiz || buildFallbackQuiz(content), [content]);
  const [answered, setAnswered] = useState(null);

  useEffect(() => {
    if (!quiz) { onSkip(); return; }
    const auto = setTimeout(() => onSkip(), 3000);
    const onKey = (e) => { if (e.code === "Escape") onSkip(); };
    window.addEventListener("keydown", onKey);
    return () => { clearTimeout(auto); window.removeEventListener("keydown", onKey); };
  }, [quiz, onSkip]);

  if (!quiz) return null;

  const pick = (opt) => {
    if (answered) return;
    const correct = opt === quiz.answer;
    setAnswered(correct ? "correct" : "wrong");
    setTimeout(() => onComplete(correct ? 250 : 0), 550);
  };

  return (
    <div className="minigame-overlay" onClick={onSkip}>
      <div className="minigame-box quiz-box" onClick={(e) => e.stopPropagation()}>
        <div className="minigame-tag">⚡ POP QUIZ</div>
        <div className="quiz-question">{quiz.q}</div>
        <div className="quiz-options">
          {quiz.options.map((opt) => (
            <button
              key={opt}
              className={`quiz-opt ${answered && opt === quiz.answer ? "correct" : ""} ${answered === "wrong" && opt !== quiz.answer ? "" : ""}`}
              onClick={() => pick(opt)}
              disabled={!!answered}
            >
              {opt}
            </button>
          ))}
        </div>
        {answered && <div className={`quiz-result ${answered}`}>{answered === "correct" ? "✓ +250" : "→ continuing..."}</div>}
        <button className="minigame-skip" onClick={onSkip}>ESC to skip</button>
      </div>
    </div>
  );
}
