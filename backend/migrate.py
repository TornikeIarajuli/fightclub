from sqlalchemy import create_engine, text
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./fight_match.db")
engine = create_engine(DATABASE_URL)

def add_missing_columns():
    with engine.connect() as conn:
        try:
            # Add last_viewed_matches column
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN last_viewed_matches DATETIME
            """))
            conn.commit()
            print("✅ Added last_viewed_matches column")
        except Exception as e:
            print(f"Column might already exist or error: {e}")

if __name__ == "__main__":
    add_missing_columns()