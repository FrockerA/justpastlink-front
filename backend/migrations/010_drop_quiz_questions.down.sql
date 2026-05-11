CREATE TABLE IF NOT EXISTS quiz_questions (
    id BIGSERIAL PRIMARY KEY,
    lecture_id BIGINT NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,

    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT,
    option_d TEXT,

    correct_answer VARCHAR(1) NOT NULL,
    explanation TEXT,
    question_order INT NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_quiz_questions_correct_answer
        CHECK (correct_answer IN ('A', 'B', 'C', 'D')),

    CONSTRAINT chk_quiz_questions_order
        CHECK (question_order > 0)
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_lecture_id ON quiz_questions(lecture_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_order ON quiz_questions(lecture_id, question_order);
