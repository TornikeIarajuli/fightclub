# backend/migrate_achievements.py
"""
Run this script to add the new achievement tables to your database
"""
from main import engine, Base, UserTitle, UserBadge, AchievementNotification

def migrate():
    print("Creating achievement tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Migration complete!")

if __name__ == "__main__":
    migrate()