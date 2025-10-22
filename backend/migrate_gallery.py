# migrate_gallery.py
from sqlalchemy import create_engine, text

SQLALCHEMY_DATABASE_URL = "sqlite:///./fight_match.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})


def migrate():
    with engine.connect() as conn:
        # Drop existing table if there
        conn.execute(text("DROP TABLE IF EXISTS photo_gallery"))

        # Create photo_gallery table with correct schema
        conn.execute(text("""
            CREATE TABLE photo_gallery (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                photo_url VARCHAR NOT NULL,
                is_primary INTEGER DEFAULT 0,
                order_index INTEGER DEFAULT 0,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
        """))
        conn.commit()
        print("✅ Photo gallery table created successfully!")


if __name__ == "__main__":
    migrate()