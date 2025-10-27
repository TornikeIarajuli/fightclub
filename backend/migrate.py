# backend/migrate_db.py
from sqlalchemy import text
from main import engine, Base, UserTitle, UserBadge, AchievementNotification


def migrate():
    print("Running database migrations...")

    with engine.connect() as conn:
        try:
            # Add columns to users table
            print("Adding columns to users table...")
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS current_title VARCHAR,
                ADD COLUMN IF NOT EXISTS total_achievement_points INTEGER DEFAULT 0;
            """))
            conn.commit()
            print("✅ User table updated")
        except Exception as e:
            print(f"Note: {e}")

    # Create new tables
    print("Creating achievement tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Migration complete!")


if __name__ == "__main__":
    migrate()