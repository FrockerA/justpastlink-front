import os
import re
from pathlib import Path

import psycopg2


RE_NUMERIC_SQL = re.compile(r"^(\d+)_.*\.sql$")


def iter_migration_sql_files(migrations_dir: Path) -> list[Path]:
    files: list[tuple[int, Path]] = []
    # Apply numbered migrations in order.
    # We run:
    # - `NNN_... .up.sql`
    # - `NNN_... .sql` (ex: `009_fix_user.sql`)
    # Skip:
    # - `NNN_... .down.sql`
    for p in migrations_dir.glob("*.sql"):
        if p.name.endswith(".down.sql"):
            continue
        m = RE_NUMERIC_SQL.match(p.name)
        if not m:
            continue
        files.append((int(m.group(1)), p))
    files.sort(key=lambda t: t[0])
    return [p for _, p in files]


def main() -> None:
    # Use the same DATABASE_URL as the backend.
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        # Fallback: load from backend/.env if running without env loaded.
        env_path = Path(__file__).resolve().parent / ".env"
        if env_path.exists():
            for line in env_path.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if line.startswith("DATABASE_URL="):
                    db_url = line.split("=", 1)[1].strip()
                    break

    if not db_url:
        raise RuntimeError("DATABASE_URL not set (and not found in backend/.env)")

    migrations_dir = Path(__file__).resolve().parent / "migrations"
    up_sql_files = iter_migration_sql_files(migrations_dir)
    if not up_sql_files:
        raise RuntimeError(f"No migrations found in {migrations_dir}")

    conn = psycopg2.connect(db_url)
    conn.autocommit = False
    try:
        with conn.cursor() as cur:
            for sql_file in up_sql_files:
                print(f"Applying {sql_file.name} ...")
                sql = sql_file.read_text(encoding="utf-8")
                cur.execute(sql)
                conn.commit()
        print("All SQL migrations applied successfully.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
