# justpastlink
Diploma

## Development setup

Before starting the API, apply database migrations:

```bash
alembic upgrade head
```

The project intentionally stores quiz data in the `quizzes` table only (JSON payload per video).  
`quiz_questions` has been deprecated and removed by migration `010_drop_quiz_questions.up.sql`.
