from main import SessionLocal, User, firebase_db
from firebase_admin import firestore

db = SessionLocal()

# Get all users
users = db.query(User).all()

print(f"Found {len(users)} users to sync...")

for user in users:
    try:
        # Check if user exists in Firebase
        doc_ref = firebase_db.collection('users').document(str(user.id))
        doc = doc_ref.get()

        if doc.exists:
            # Update with new column (replace 'your_column_name' with actual column)
            doc_ref.update({
                'last_viewed_matches': user.last_viewed_matches if hasattr(user, 'last_viewed_matches') else None,
                # Add other columns here
                'updated_at': firestore.SERVER_TIMESTAMP
            })
            print(f"✅ Updated user {user.id} ({user.username})")
        else:
            # User doesn't exist in Firebase, create it
            doc_ref.set({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': user.full_name,
                'age': user.age,
                'height': user.height,
                'weight': user.weight,
                'location': user.location,
                'bio': user.bio,
                'martial_arts': user.martial_arts,
                'experience_years': user.experience_years,
                'skill_level': user.skill_level,
                'preferred_styles': user.preferred_styles,
                'weight_class': user.weight_class,
                'wins': user.wins,
                'losses': user.losses,
                'draws': user.draws,
                'profile_pic': user.profile_pic,
                'last_viewed_matches': user.last_viewed_matches if hasattr(user, 'last_viewed_matches') else None,
                'created_at': firestore.SERVER_TIMESTAMP
            })
            print(f"✅ Created user {user.id} ({user.username}) in Firebase")

    except Exception as e:
        print(f"❌ Error with user {user.id}: {e}")

print(f"\n✅ Sync complete! Processed {len(users)} users.")
db.close()