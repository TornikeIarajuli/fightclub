import requests

API_URL = "https://fightmatch-backend.onrender.com"  # or your Render URL

users = [
    {
        "username": "fighter1",
        "email": "fighter1@test.com",
        "password": "password123",
        "full_name": "Mike Tyson",
        "age": 25,
        "height": 180,
        "weight": 85,
        "location": "New York, USA",
        "bio": "Boxing champion",
        "martial_arts": ["Boxing", "MMA"],
        "experience_years": 5,
        "skill_level": "Advanced",
        "preferred_styles": ["Boxing"],
        "weight_class": "Middleweight"
    },
    {
        "username": "fighter2",
        "email": "fighter2@test.com",
        "password": "password123",
        "full_name": "Connor McGregor",
        "age": 28,
        "height": 175,
        "weight": 77,
        "location": "Dublin, Ireland",
        "bio": "MMA fighter",
        "martial_arts": ["MMA", "Boxing", "BJJ"],
        "experience_years": 8,
        "skill_level": "Professional",
        "preferred_styles": ["MMA"],
        "weight_class": "Lightweight"
    },
    {
        "username": "fighter3",
        "email": "fighter3@test.com",
        "password": "password123",
        "full_name": "Ronda Rousey",
        "age": 30,
        "height": 170,
        "weight": 61,
        "location": "Los Angeles, USA",
        "bio": "Judo and MMA champion",
        "martial_arts": ["Judo", "MMA"],
        "experience_years": 10,
        "skill_level": "Professional",
        "preferred_styles": ["Judo", "MMA"],
        "weight_class": "Bantamweight"
    }
]

for user in users:
    response = requests.post(f"{API_URL}/register", json=user)
    if response.status_code == 200:
        print(f"✅ Created user: {user['username']}")
    else:
        print(f"❌ Error creating {user['username']}: {response.text}")