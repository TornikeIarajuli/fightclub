from sqlalchemy import create_engine, text

SQLALCHEMY_DATABASE_URL = "sqlite:///./fight_match.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})


def migrate_database():
    """Add new columns for advanced filtering"""

    with engine.connect() as conn:
        try:
            # Add gender column
            conn.execute(text("ALTER TABLE users ADD COLUMN gender VARCHAR"))
            print("✓ Added gender column")
        except Exception as e:
            print(f"Gender column might already exist: {e}")

        try:
            # Add latitude column
            conn.execute(text("ALTER TABLE users ADD COLUMN latitude FLOAT"))
            print("✓ Added latitude column")
        except Exception as e:
            print(f"Latitude column might already exist: {e}")

        try:
            # Add longitude column
            conn.execute(text("ALTER TABLE users ADD COLUMN longitude FLOAT"))
            print("✓ Added longitude column")
        except Exception as e:
            print(f"Longitude column might already exist: {e}")

        try:
            # Add availability column (JSON)
            conn.execute(text("ALTER TABLE users ADD COLUMN availability JSON"))
            print("✓ Added availability column")
        except Exception as e:
            print(f"Availability column might already exist: {e}")

        conn.commit()
        print("\n✅ Migration completed!")


if __name__ == "__main__":
    print("Starting database migration...")
    migrate_database()