# main.py
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, ForeignKey, Table, DateTime, JSON
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from typing import List
from passlib.context import CryptContext
import jwt
from jwt import PyJWTError
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, ForeignKey, Table, DateTime, Text
from pydantic import BaseModel, EmailStr, ConfigDict
from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, JSON
from datetime import datetime, timedelta
from collections import defaultdict
from sqlalchemy import func, Boolean
import firebase_admin
from firebase_admin import credentials, firestore, storage
import uuid
from sqlalchemy.orm import Session


import os
import json

# Initialize Firebase
# Check if running in production (environment variable exists)
if os.getenv('FIREBASE_CREDENTIALS'):
    # Production: Load from environment variable
    firebase_creds = json.loads(os.getenv('FIREBASE_CREDENTIALS'))
    cred = credentials.Certificate(firebase_creds)
else:
    # Local development: Load from file
    cred = credentials.Certificate("serviceAccountKey.json")

firebase_admin.initialize_app(cred, {
    'storageBucket': 'fightmatch-45bf4.firebasestorage.app'
})

firebase_db = firestore.client()
firebase_bucket = storage.bucket()

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./fight_match.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Security setup
SECRET_KEY = "your-secret-key-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

app = FastAPI(title="Fight Match API")

UPLOAD_DIR = Path("uploads/profile_photos")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Mount static files to serve uploaded images
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://fightmatch.onrender.com",
        "https://fightmatch-45bf4.web.app",
        "https://fightmatch-45bf4.firebaseapp.com",
        "https://fightmatch-backend.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database Models
matches_table = Table(
    'matches',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('matched_user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('created_at', DateTime, default=datetime.utcnow)
)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    age = Column(Integer)
    height = Column(Float)
    weight = Column(Float)
    location = Column(String)
    bio = Column(String)
    profile_pic = Column(String, nullable=True)

    # Fight stats - CHANGED TO JSON
    martial_arts = Column(JSON)  # Now stores as JSON array
    experience_years = Column(Integer)
    wins = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    draws = Column(Integer, default=0)
    skill_level = Column(String)  # Beginner, Intermediate, Advanced, Pro
    preferred_styles = Column(JSON)  # Now stores as JSON array
    weight_class = Column(String)
    gender = Column(String, nullable=True)  # Male, Female, Other, Prefer not to say
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    # availability is stored as JSON: {"monday": ["09:00-12:00", "18:00-21:00"], "tuesday": [...]}
    availability = Column(JSON, nullable=True)
    last_viewed_matches = Column(DateTime, nullable=True)

    # Matching preferences
    preferred_distance = Column(Integer, default=50)  # km
    preferred_skill_range = Column(String, default="all")


    # Relationships
    matches = relationship(
        "User",
        secondary=matches_table,
        primaryjoin=id == matches_table.c.user_id,
        secondaryjoin=id == matches_table.c.matched_user_id,
        backref="matched_by"
    )
    swipes_made = relationship("Swipe", foreign_keys="Swipe.user_id", back_populates="user")
    swipes_received = relationship("Swipe", foreign_keys="Swipe.target_user_id", back_populates="target_user")


from pydantic import BaseModel, ConfigDict
from typing import Optional


class PhotoGallery(Base):
    __tablename__ = "photo_gallery"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    photo_url = Column(String)
    is_primary = Column(Integer, default=0)  # Changed from Boolean to Integer for SQLite compatibility
    order_index = Column(Integer, default=0)  # Display order
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="gallery_photos")


# Pydantic model for photo gallery
class PhotoGalleryResponse(BaseModel):
    id: int
    photo_url: str
    is_primary: bool
    order_index: int

    model_config = ConfigDict(from_attributes=True)


class DiscoverFilters(BaseModel):
    martial_arts: Optional[List[str]] = None
    weight_class: Optional[str] = None
    skill_level: Optional[str] = None
    gender: Optional[str] = None
    max_distance: Optional[int] = None  # in km
    experience_min: Optional[int] = None
    experience_max: Optional[int] = None
    day_of_week: Optional[str] = None  # For availability filtering

    model_config = ConfigDict(from_attributes=True)

class FightRecordCreate(BaseModel):
    opponent_id: int
    result: str
    martial_art_style: str
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class FightRecordUpdate(BaseModel):
    wins: int
    losses: int
    draws: int

class Swipe(Base):
    __tablename__ = "swipes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    target_user_id = Column(Integer, ForeignKey("users.id"))
    is_like = Column(Boolean)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id], back_populates="swipes_made")
    target_user = relationship("User", foreign_keys=[target_user_id], back_populates="swipes_received")


class Fight(Base):
    __tablename__ = "fights"

    id = Column(Integer, primary_key=True, index=True)
    fighter1_id = Column(Integer, ForeignKey("users.id"))
    fighter2_id = Column(Integer, ForeignKey("users.id"))
    scheduled_date = Column(DateTime)
    location = Column(String)
    status = Column(String, default="scheduled")  # scheduled, completed, cancelled
    winner_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    fighter1 = relationship("User", foreign_keys=[fighter1_id])
    fighter2 = relationship("User", foreign_keys=[fighter2_id])
    winner = relationship("User", foreign_keys=[winner_id])

class FightRecord(Base):
    __tablename__ = "fight_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    opponent_id = Column(Integer, ForeignKey("users.id"))
    result = Column(String)  # "win", "loss", "draw"
    martial_art_style = Column(String)
    date = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)

    user = relationship("User", foreign_keys=[user_id])
    opponent = relationship("User", foreign_keys=[opponent_id])

# Pydantic models
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    age: int
    height: float
    weight: float
    location: str
    bio: str
    martial_arts: List[str]
    experience_years: int
    skill_level: str
    preferred_styles: List[str]
    weight_class: str


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: int
    wins: int
    losses: int
    draws: int
    profile_pic: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class SwipeRequest(BaseModel):
    target_user_id: int
    is_like: bool


class FightSchedule(BaseModel):
    opponent_id: int
    scheduled_date: datetime
    location: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


# Create tables TODO
# Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)


# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Utility functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except PyJWTError:
        raise credentials_exception
    user = db.query(User).filter(User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user


import math


def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points using Haversine formula (in km)"""
    if not all([lat1, lon1, lat2, lon2]):
        return None

    R = 6371  # Earth's radius in kilometers

    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)

    a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))

    return R * c


# Routes
@app.get("/")
def read_root():
    return {"message": "Welcome to Fight Match API! Access documentation at /docs"}


@app.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(
        (User.username == user.username) | (User.email == user.email)
    ).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username or email already registered")

    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        age=user.age,
        height=user.height,
        weight=user.weight,
        location=user.location,
        bio=user.bio,
        martial_arts=user.martial_arts,
        experience_years=user.experience_years,
        skill_level=user.skill_level,
        preferred_styles=user.preferred_styles,
        weight_class=user.weight_class
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # ✅ ADD THIS: Sync to Firebase Firestore
    try:
        firebase_db.collection('users').document(str(db_user.id)).set({
            'id': db_user.id,
            'username': db_user.username,
            'email': db_user.email,
            'full_name': db_user.full_name,
            'age': db_user.age,
            'height': db_user.height,
            'weight': db_user.weight,
            'location': db_user.location,
            'bio': db_user.bio,
            'martial_arts': db_user.martial_arts,
            'experience_years': db_user.experience_years,
            'skill_level': db_user.skill_level,
            'preferred_styles': db_user.preferred_styles,
            'weight_class': db_user.weight_class,
            'wins': db_user.wins,
            'losses': db_user.losses,
            'draws': db_user.draws,
            'profile_pic': db_user.profile_pic,
            'created_at': firestore.SERVER_TIMESTAMP
        })
    except Exception as e:
        print(f"Error syncing user to Firebase: {e}")
        # Don't fail registration if Firebase sync fails

    return db_user


@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/users/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


@app.get("/users/discover", response_model=List[UserResponse])
async def discover_users(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    Get users that haven't been swiped on yet
    """
    # Get IDs of users already swiped on
    swiped_ids = db.query(Swipe.target_user_id).filter(
        Swipe.user_id == current_user.id
    ).subquery()

    # Get all users except current user and already swiped users
    users = db.query(User).filter(
        User.id != current_user.id,
        ~User.id.in_(swiped_ids)
    ).all()

    return users


# UPDATED: Optional filtered discover endpoint (also excludes swiped users)
@app.post("/users/discover/filter")
async def discover_users_filtered(
        filters: DiscoverFilters,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Discover users with advanced filtering (excludes already swiped users)"""

    # Get users that haven't been swiped on yet
    swiped_ids = db.query(Swipe.target_user_id).filter(
        Swipe.user_id == current_user.id
    ).subquery()

    # Start with base query - exclude current user and swiped users
    query = db.query(User).filter(
        User.id != current_user.id,
        ~User.id.in_(swiped_ids)
    )

    # Apply filters only if provided

    # Filter by weight class
    if filters.weight_class:
        query = query.filter(User.weight_class == filters.weight_class)

    # Filter by skill level
    if filters.skill_level:
        query = query.filter(User.skill_level == filters.skill_level)

    # Filter by gender
    if filters.gender:
        query = query.filter(User.gender == filters.gender)

    # Filter by experience years
    if filters.experience_min is not None:
        query = query.filter(User.experience_years >= filters.experience_min)

    if filters.experience_max is not None:
        query = query.filter(User.experience_years <= filters.experience_max)

    # Get all users that match basic filters
    users = query.all()

    # Apply martial arts filter (stored as JSON array)
    if filters.martial_arts:
        filtered_users = []
        for user in users:
            user_martial_arts = user.martial_arts if isinstance(user.martial_arts, list) else []
            # Check if user has at least one of the requested martial arts
            if any(ma in user_martial_arts for ma in filters.martial_arts):
                filtered_users.append(user)
        users = filtered_users

    # Apply distance filter
    if filters.max_distance and current_user.latitude and current_user.longitude:
        users_with_distance = []
        for user in users:
            if user.latitude and user.longitude:
                distance = calculate_distance(
                    current_user.latitude,
                    current_user.longitude,
                    user.latitude,
                    user.longitude
                )
                if distance and distance <= filters.max_distance:
                    users_with_distance.append(user)
        users = users_with_distance

    # Apply availability filter
    if filters.day_of_week:
        filtered_by_availability = []
        for user in users:
            if user.availability:
                availability = user.availability if isinstance(user.availability, dict) else {}
                # Check if user has availability on the requested day
                if filters.day_of_week.lower() in availability and availability[filters.day_of_week.lower()]:
                    filtered_by_availability.append(user)
        users = filtered_by_availability

    return users


class LocationUpdate(BaseModel):
    latitude: float
    longitude: float


@app.put("/users/me/location")
async def update_location(
        location: LocationUpdate,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Update user's location for distance filtering"""
    current_user.latitude = location.latitude
    current_user.longitude = location.longitude

    db.commit()
    db.refresh(current_user)

    return {"message": "Location updated successfully"}


# Add endpoint to update user availability
class AvailabilityUpdate(BaseModel):
    availability: dict  # {"monday": ["09:00-12:00", "18:00-21:00"], ...}


@app.put("/users/me/availability")
async def update_availability(
        availability_data: AvailabilityUpdate,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Update user's availability schedule"""
    current_user.availability = availability_data.availability

    db.commit()
    db.refresh(current_user)

    return {"message": "Availability updated successfully"}


# Add endpoint to get filter options (for dropdown menus)
@app.get("/filters/options")
def get_filter_options():
    """Get available filter options"""
    return {
        "martial_arts": [
            "BJJ", "Muay Thai", "Boxing", "Wrestling", "Judo",
            "Karate", "Taekwondo", "Kickboxing", "MMA", "Sambo",
            "Krav Maga", "Wing Chun", "Capoeira"
        ],
        "weight_classes": [
            "Flyweight", "Bantamweight", "Featherweight", "Lightweight",
            "Welterweight", "Middleweight", "Light Heavyweight", "Heavyweight"
        ],
        "skill_levels": [
            "Beginner", "Intermediate", "Advanced", "Professional"
        ],
        "genders": [
            "Male", "Female", "Other", "Prefer not to say"
        ],
        "days_of_week": [
            "monday", "tuesday", "wednesday", "thursday",
            "friday", "saturday", "sunday"
        ]
    }


@app.put("/users/me/record")
async def update_fight_record(
        record: FightRecordUpdate,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    current_user.wins = record.wins
    current_user.losses = record.losses
    current_user.draws = record.draws

    db.commit()
    db.refresh(current_user)

    # ✅ ADD THIS: Sync to Firebase
    try:
        firebase_db.collection('users').document(str(current_user.id)).update({
            'wins': current_user.wins,
            'losses': current_user.losses,
            'draws': current_user.draws,
            'updated_at': firestore.SERVER_TIMESTAMP
        })
    except Exception as e:
        print(f"Error syncing fight record to Firebase: {e}")

    return {
        "wins": current_user.wins,
        "losses": current_user.losses,
        "draws": current_user.draws,
        "message": "Fight record updated successfully"
    }


@app.post("/swipe")
async def swipe(
        swipe_data: SwipeRequest,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    # Check if already swiped
    existing_swipe = db.query(Swipe).filter(
        Swipe.user_id == current_user.id,
        Swipe.target_user_id == swipe_data.target_user_id
    ).first()

    if existing_swipe:
        raise HTTPException(status_code=400, detail="Already swiped on this user")

    # Create new swipe
    new_swipe = Swipe(
        user_id=current_user.id,
        target_user_id=swipe_data.target_user_id,
        is_like=swipe_data.is_like
    )
    db.add(new_swipe)

    # Check for mutual match
    is_match = False
    if swipe_data.is_like:
        mutual_swipe = db.query(Swipe).filter(
            Swipe.user_id == swipe_data.target_user_id,
            Swipe.target_user_id == current_user.id,
            Swipe.is_like == True
        ).first()

        if mutual_swipe:
            is_match = True
            # Add to matches table
            target_user = db.query(User).filter(User.id == swipe_data.target_user_id).first()
            current_user.matches.append(target_user)
            target_user.matches.append(current_user)

            # ✅ ADD THIS: Sync match to Firebase
            try:
                match_id = f"match_{min(current_user.id, target_user.id)}_{max(current_user.id, target_user.id)}"
                firebase_db.collection('matches').document(match_id).set({
                    'user1_id': current_user.id,
                    'user2_id': target_user.id,
                    'user1_name': current_user.username,
                    'user2_name': target_user.username,
                    'matched_at': firestore.SERVER_TIMESTAMP
                })
            except Exception as e:
                print(f"Error syncing match to Firebase: {e}")

    db.commit()
    return {"match": is_match}


@app.get("/matches", response_model=List[UserResponse])
async def get_matches(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    return current_user.matches


@app.post("/fights/schedule")
async def schedule_fight(
        fight_data: FightSchedule,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    # Verify users are matched
    is_matched = db.query(User).filter(
        User.id == current_user.id
    ).first().matches.filter(User.id == fight_data.opponent_id).first()

    if not is_matched:
        raise HTTPException(status_code=400, detail="Can only schedule fights with matches")

    new_fight = Fight(
        fighter1_id=current_user.id,
        fighter2_id=fight_data.opponent_id,
        scheduled_date=fight_data.scheduled_date,
        location=fight_data.location
    )
    db.add(new_fight)
    db.commit()
    db.refresh(new_fight)

    return {"fight_id": new_fight.id, "status": "scheduled"}


@app.get("/fights")
async def get_fights(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    fights = db.query(Fight).filter(
        (Fight.fighter1_id == current_user.id) | (Fight.fighter2_id == current_user.id)
    ).all()
    return fights


@app.get("/stats/{user_id}")
async def get_user_stats(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    total_fights = user.wins + user.losses + user.draws
    win_rate = (user.wins / total_fights * 100) if total_fights > 0 else 0

    return {
        "user_id": user_id,
        "username": user.username,
        "total_fights": total_fights,
        "wins": user.wins,
        "losses": user.losses,
        "draws": user.draws,
        "win_rate": win_rate,
        "skill_level": user.skill_level,
        "martial_arts": user.martial_arts if user.martial_arts else [],  # FIXED - no more eval()
        "experience_years": user.experience_years
    }


@app.put("/users/me", response_model=UserResponse)
async def update_user(
        user_update: UserBase,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    current_user.username = user_update.username
    current_user.email = user_update.email
    current_user.full_name = user_update.full_name
    current_user.age = user_update.age
    current_user.height = user_update.height
    current_user.weight = user_update.weight
    current_user.location = user_update.location
    current_user.bio = user_update.bio
    current_user.martial_arts = user_update.martial_arts
    current_user.experience_years = user_update.experience_years
    current_user.skill_level = user_update.skill_level
    current_user.preferred_styles = user_update.preferred_styles
    current_user.weight_class = user_update.weight_class

    db.commit()
    db.refresh(current_user)

    # ✅ ADD THIS: Sync to Firebase
    try:
        firebase_db.collection('users').document(str(current_user.id)).update({
            'username': current_user.username,
            'email': current_user.email,
            'full_name': current_user.full_name,
            'age': current_user.age,
            'height': current_user.height,
            'weight': current_user.weight,
            'location': current_user.location,
            'bio': current_user.bio,
            'martial_arts': current_user.martial_arts,
            'experience_years': current_user.experience_years,
            'skill_level': current_user.skill_level,
            'preferred_styles': current_user.preferred_styles,
            'weight_class': current_user.weight_class,
            'updated_at': firestore.SERVER_TIMESTAMP
        })
    except Exception as e:
        print(f"Error syncing user update to Firebase: {e}")

    return current_user


@app.get("/analytics")
def get_analytics(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get detailed analytics for the current user"""

    user = db.query(User).filter(User.id == current_user.id).first()

    # Calculate win/loss streaks
    fights = db.query(FightRecord).filter(
        (FightRecord.user_id == user.id) | (FightRecord.opponent_id == user.id)
    ).order_by(FightRecord.date.desc()).all()

    current_streak = 0
    longest_streak = 0
    temp_streak = 0

    for fight in fights:
        is_winner = (fight.user_id == user.id and fight.result == "win") or \
                    (fight.opponent_id == user.id and fight.result == "loss")

        if is_winner:
            temp_streak += 1
            longest_streak = max(longest_streak, temp_streak)
        else:
            temp_streak = 0

    # Current streak is the most recent
    for fight in fights:
        is_winner = (fight.user_id == user.id and fight.result == "win") or \
                    (fight.opponent_id == user.id and fight.result == "loss")

        if is_winner:
            current_streak += 1
        else:
            break

    # Calculate stats by martial art style
    style_stats = defaultdict(lambda: {"wins": 0, "losses": 0, "draws": 0})

    for fight in fights:
        if fight.martial_art_style:
            style = fight.martial_art_style
            is_user = fight.user_id == user.id

            if fight.result == "win" and is_user:
                style_stats[style]["wins"] += 1
            elif fight.result == "loss" and is_user:
                style_stats[style]["losses"] += 1
            elif fight.result == "draw":
                style_stats[style]["draws"] += 1

    # Monthly activity (last 6 months)
    six_months_ago = datetime.utcnow() - timedelta(days=180)
    monthly_fights = defaultdict(int)

    for fight in fights:
        if fight.date >= six_months_ago:
            month_key = fight.date.strftime("%Y-%m")
            monthly_fights[month_key] += 1

    # Calculate training frequency
    training_days = set()
    for fight in fights:
        training_days.add(fight.date.date())

    training_streak = 0
    check_date = datetime.utcnow().date()

    while check_date in training_days:
        training_streak += 1
        check_date -= timedelta(days=1)

    total_fights = user.wins + user.losses + user.draws
    win_rate = (user.wins / total_fights * 100) if total_fights > 0 else 0

    return {
        "total_fights": total_fights,
        "wins": user.wins,
        "losses": user.losses,
        "draws": user.draws,
        "win_rate": round(win_rate, 1),
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "style_stats": dict(style_stats),
        "monthly_activity": dict(monthly_fights),
        "training_streak": training_streak,
        "unique_training_days": len(training_days)
    }


@app.get("/profile/stats")
def get_profile_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get user stats for achievements"""

    user = db.query(User).filter(User.id == current_user.id).first()

    # Get martial arts from user profile
    if isinstance(user.martial_arts, list):
        martial_arts = user.martial_arts
    elif isinstance(user.martial_arts, str):
        try:
            martial_arts = json.loads(user.martial_arts)
        except:
            martial_arts = []
    else:
        martial_arts = []
    styles_trained = len(martial_arts)

    # Calculate streaks
    fights = db.query(FightRecord).filter(
        (FightRecord.user_id == user.id) | (FightRecord.opponent_id == user.id)
    ).order_by(FightRecord.date.desc()).all()

    current_streak = 0
    longest_streak = 0
    temp_streak = 0

    for fight in fights:
        is_winner = (fight.user_id == user.id and fight.result == "win") or \
                    (fight.opponent_id == user.id and fight.result == "loss")

        if is_winner:
            temp_streak += 1
            longest_streak = max(longest_streak, temp_streak)
        else:
            temp_streak = 0

    # Calculate current streak
    for fight in fights:
        is_winner = (fight.user_id == user.id and fight.result == "win") or \
                    (fight.opponent_id == user.id and fight.result == "loss")

        if is_winner:
            current_streak += 1
        else:
            break

    # Calculate training streak (consecutive days)
    training_days = set()
    for fight in fights:
        training_days.add(fight.date.date())

    training_streak = 0
    check_date = datetime.utcnow().date()

    while check_date in training_days:
        training_streak += 1
        check_date -= timedelta(days=1)

    total_fights = user.wins + user.losses + user.draws
    win_rate = (user.wins / total_fights * 100) if total_fights > 0 else 0

    return {
        "total_fights": total_fights,
        "wins": user.wins,
        "losses": user.losses,
        "draws": user.draws,
        "win_rate": round(win_rate, 1),
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "styles_trained": styles_trained,
        "training_streak": training_streak
    }


@app.post("/fights/record")
def record_fight(
        fight_data: FightRecordCreate,  # Use the Pydantic model here
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Record a fight result"""

    # Add logging to see what we received
    print(f"Received fight data: {fight_data}")
    print(f"opponent_id: {fight_data.opponent_id}")
    print(f"result: {fight_data.result}")
    print(f"martial_art_style: {fight_data.martial_art_style}")
    print(f"notes: {fight_data.notes}")

    if fight_data.result not in ["win", "loss", "draw"]:
        raise HTTPException(status_code=400, detail="Invalid result. Must be 'win', 'loss', or 'draw'")

    # Create fight record
    fight_record = FightRecord(
        user_id=current_user.id,
        opponent_id=fight_data.opponent_id,
        result=fight_data.result,
        martial_art_style=fight_data.martial_art_style,
        notes=fight_data.notes if fight_data.notes else None
    )

    db.add(fight_record)

    # Update user stats
    user = db.query(User).filter(User.id == current_user.id).first()

    if fight_data.result == "win":
        user.wins += 1
    elif fight_data.result == "loss":
        user.losses += 1
    else:
        user.draws += 1

    # Update opponent stats (opposite result)
    opponent = db.query(User).filter(User.id == fight_data.opponent_id).first()

    if opponent:
        if fight_data.result == "win":
            opponent.losses += 1
        elif fight_data.result == "loss":
            opponent.wins += 1
        else:
            opponent.draws += 1

    db.commit()
    db.refresh(fight_record)

    return {
        "message": "Fight recorded successfully",
        "fight_id": fight_record.id,
        "user_stats": {
            "wins": user.wins,
            "losses": user.losses,
            "draws": user.draws
        }
    }

# Get fight history
@app.get("/fights/history")
def get_fight_history(
        limit: int = 20,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Get user's fight history"""

    fights = db.query(FightRecord).filter(
        (FightRecord.user_id == current_user.id) | (FightRecord.opponent_id == current_user.id)
    ).order_by(FightRecord.date.desc()).limit(limit).all()

    fight_history = []

    for fight in fights:
        is_user = fight.user_id == current_user.id
        opponent_id = fight.opponent_id if is_user else fight.user_id
        opponent = db.query(User).filter(User.id == opponent_id).first()

        fight_history.append({
            "id": fight.id,
            "opponent_name": opponent.username if opponent else "Unknown",
            "opponent_id": opponent_id,
            "result": fight.result if is_user else (
                "loss" if fight.result == "win" else "win" if fight.result == "loss" else "draw"),
            "martial_art_style": fight.martial_art_style,
            "date": fight.date.isoformat(),
            "notes": fight.notes
        })

    return fight_history


# Get leaderboard
@app.get("/leaderboard")
def get_leaderboard(
        style: str = None,
        limit: int = 10,
        db: Session = Depends(get_db)
):
    """Get top fighters leaderboard"""

    users = db.query(User).all()

    leaderboard = []

    for user in users:
        total_fights = user.wins + user.losses + user.draws

        if total_fights < 5:  # Minimum fights to qualify
            continue

        win_rate = (user.wins / total_fights * 100) if total_fights > 0 else 0

        # Filter by style if specified
        if style:
            martial_arts = json.loads(user.martial_arts) if user.martial_arts else []
            if style not in martial_arts:
                continue

        leaderboard.append({
            "user_id": user.id,
            "username": user.username,
            "wins": user.wins,
            "losses": user.losses,
            "draws": user.draws,
            "total_fights": total_fights,
            "win_rate": round(win_rate, 1),
            "skill_level": user.skill_level
        })

    # Sort by win rate, then total wins
    leaderboard.sort(key=lambda x: (x["win_rate"], x["wins"]), reverse=True)

    return leaderboard[:limit]


@app.get("/achievements/progress")
def get_achievements_progress(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Get user's achievement progress"""

    user = db.query(User).filter(User.id == current_user.id).first()

    # Get stats - handle both list and string types for martial_arts
    if isinstance(user.martial_arts, list):
        martial_arts = user.martial_arts
    elif isinstance(user.martial_arts, str):
        try:
            martial_arts = json.loads(user.martial_arts)
        except:
            martial_arts = []
    else:
        martial_arts = []

    total_fights = user.wins + user.losses + user.draws

    # Calculate streaks
    fights = db.query(FightRecord).filter(
        (FightRecord.user_id == user.id) | (FightRecord.opponent_id == user.id)
    ).order_by(FightRecord.date.desc()).all()

    current_streak = 0
    longest_streak = 0
    temp_streak = 0

    for fight in fights:
        is_winner = (fight.user_id == user.id and fight.result == "win") or \
                    (fight.opponent_id == user.id and fight.result == "loss")

        if is_winner:
            temp_streak += 1
            longest_streak = max(longest_streak, temp_streak)
        else:
            temp_streak = 0

    # Current streak
    for fight in fights:
        is_winner = (fight.user_id == user.id and fight.result == "win") or \
                    (fight.opponent_id == user.id and fight.result == "loss")

        if is_winner:
            current_streak += 1
        else:
            break

    # Training streak
    training_days = set()
    for fight in fights:
        training_days.add(fight.date.date())

    training_streak = 0
    check_date = datetime.utcnow().date()

    while check_date in training_days:
        training_streak += 1
        check_date -= timedelta(days=1)

    win_rate = (user.wins / total_fights * 100) if total_fights > 0 else 0

    # Calculate total achievement points
    total_points = 0
    points_map = {
        "first_match": 10,
        "first_win": 15,
        "dedicated": 20,
        "warrior": 30,
        "hot_streak": 25,
        "style_master": 35,
        "centurion": 50,
        "unstoppable": 40,
        "champion": 60,
        "legend": 100,
        "grand_master": 75,
        "immortal": 150
    }

    # Define achievements with progress tracking
    achievements = {
        "first_match": {
            "unlocked": total_fights >= 1,
            "progress": min(total_fights, 1),
            "required": 1,
            "points": points_map["first_match"],
            "name": "First Match",
            "description": "Complete your first sparring session"
        },
        "first_win": {
            "unlocked": user.wins >= 1,
            "progress": min(user.wins, 1),
            "required": 1,
            "points": points_map["first_win"],
            "name": "First Victory",
            "description": "Win your first match"
        },
        "dedicated": {
            "unlocked": training_streak >= 7,
            "progress": min(training_streak, 7),
            "required": 7,
            "points": points_map["dedicated"],
            "name": "Dedicated Fighter",
            "description": "Train for 7 consecutive days"
        },
        "warrior": {
            "unlocked": total_fights >= 25,
            "progress": min(total_fights, 25),
            "required": 25,
            "points": points_map["warrior"],
            "name": "Warrior",
            "description": "Complete 25 matches"
        },
        "hot_streak": {
            "unlocked": current_streak >= 5,
            "progress": min(current_streak, 5),
            "required": 5,
            "points": points_map["hot_streak"],
            "name": "Hot Streak",
            "description": "Win 5 matches in a row"
        },
        "style_master": {
            "unlocked": len(martial_arts) >= 5,
            "progress": min(len(martial_arts), 5),
            "required": 5,
            "points": points_map["style_master"],
            "name": "Style Master",
            "description": "Train in 5 different martial arts"
        },
        "centurion": {
            "unlocked": total_fights >= 100,
            "progress": min(total_fights, 100),
            "required": 100,
            "points": points_map["centurion"],
            "name": "Centurion",
            "description": "Complete 100 matches"
        },
        "unstoppable": {
            "unlocked": longest_streak >= 10,
            "progress": min(longest_streak, 10),
            "required": 10,
            "points": points_map["unstoppable"],
            "name": "Unstoppable",
            "description": "Win 10 matches in a row"
        },
        "champion": {
            "unlocked": win_rate >= 80 and total_fights >= 50,
            "progress": min(total_fights, 50) if win_rate >= 80 else 0,
            "required": 50,
            "points": points_map["champion"],
            "name": "Champion",
            "description": "Maintain 80% win rate with 50+ fights"
        },
        "legend": {
            "unlocked": total_fights >= 500,
            "progress": min(total_fights, 500),
            "required": 500,
            "points": points_map["legend"],
            "name": "Legend",
            "description": "Complete 500 matches"
        },
        "grand_master": {
            "unlocked": len(martial_arts) >= 10,
            "progress": min(len(martial_arts), 10),
            "required": 10,
            "points": points_map["grand_master"],
            "name": "Grand Master",
            "description": "Train in 10 different martial arts"
        },
        "immortal": {
            "unlocked": longest_streak >= 25,
            "progress": min(longest_streak, 25),
            "required": 25,
            "points": points_map["immortal"],
            "name": "Immortal",
            "description": "Win 25 matches in a row"
        }
    }

    # Calculate total points earned
    for achievement_key, achievement_data in achievements.items():
        if achievement_data["unlocked"]:
            total_points += achievement_data["points"]

    return {
        "achievements": achievements,
        "total_points": total_points,
        "max_points": sum(points_map.values()),
        "stats": {
            "total_fights": total_fights,
            "wins": user.wins,
            "losses": user.losses,
            "draws": user.draws,
            "win_rate": round(win_rate, 1),
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "styles_trained": len(martial_arts),
            "training_streak": training_streak
        }
    }


@app.post("/users/me/photo")
async def upload_profile_photo(
        file: UploadFile = File(...),
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Upload a profile photo to Firebase Storage"""

    # Validate file type
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed."
        )

    # Validate file size (max 5MB)
    temp_file = await file.read()
    file_size = len(temp_file)

    if file_size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be less than 5MB")

    # Generate unique filename
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"profile_photos/user_{current_user.id}_{uuid.uuid4()}.{file_extension}"

    # Upload to Firebase Storage
    blob = firebase_bucket.blob(unique_filename)
    blob.upload_from_string(temp_file, content_type=file.content_type)

    # Make it publicly accessible
    blob.make_public()

    # Get public URL
    photo_url = blob.public_url

    # Update user profile in database
    current_user.profile_pic = photo_url
    db.commit()
    db.refresh(current_user)

    return {
        "message": "Profile photo uploaded successfully",
        "photo_url": current_user.profile_pic
    }


# Add endpoint to delete profile photo
@app.delete("/users/me/photo")
async def delete_profile_photo(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Delete profile photo"""

    if not current_user.profile_pic:
        raise HTTPException(status_code=404, detail="No profile photo to delete")

    # Delete file from filesystem
    if current_user.profile_pic.startswith("/uploads"):
        file_path = Path("." + current_user.profile_pic)
        if file_path.exists():
            os.remove(file_path)

    # Update database
    current_user.profile_pic = None
    db.commit()
    db.refresh(current_user)

    return {"message": "Profile photo deleted successfully"}


# Update the /users/{user_id} endpoint to get user info (if it doesn't exist)
@app.get("/users/{user_id}")
async def get_user_by_id(
        user_id: int,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Get user by ID"""
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": user.id,
        "username": user.username,
        "profile_pic": user.profile_pic,
        "skill_level": user.skill_level,
        "martial_arts": user.martial_arts if isinstance(user.martial_arts, list) else [],
        "wins": user.wins,
        "losses": user.losses,
        "draws": user.draws,
        "location": user.location,
        "bio": user.bio,
        "weight_class": user.weight_class,
        "height": user.height,
        "weight": user.weight,
        "experience_years": user.experience_years
    }


@app.post("/users/me/gallery")
async def upload_gallery_photo(
        file: UploadFile = File(...),
        is_primary: bool = False,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Upload a photo to user's gallery (Firebase Storage)"""

    # Validate file type
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed."
        )

    # Validate file size (max 5MB)
    temp_file = await file.read()
    file_size = len(temp_file)

    if file_size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be less than 5MB")

    # Check photo limit (max 6 photos)
    existing_photos = db.query(PhotoGallery).filter(
        PhotoGallery.user_id == current_user.id
    ).count()

    if existing_photos >= 6:
        raise HTTPException(status_code=400, detail="Maximum 6 photos allowed")

    # Generate unique filename
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"gallery_photos/user_{current_user.id}_{uuid.uuid4()}.{file_extension}"

    # Upload to Firebase Storage
    blob = firebase_bucket.blob(unique_filename)
    blob.upload_from_string(temp_file, content_type=file.content_type)
    blob.make_public()

    photo_url = blob.public_url

    # If this is set as primary, unset other primary photos
    if is_primary:
        db.query(PhotoGallery).filter(
            PhotoGallery.user_id == current_user.id,
            PhotoGallery.is_primary == True
        ).update({"is_primary": False})

        # Also update profile_pic
        current_user.profile_pic = photo_url

    # Get next order index
    max_order = db.query(func.max(PhotoGallery.order_index)).filter(
        PhotoGallery.user_id == current_user.id
    ).scalar() or -1

    # Create photo gallery entry
    new_photo = PhotoGallery(
        user_id=current_user.id,
        photo_url=photo_url,
        is_primary=is_primary,
        order_index=max_order + 1
    )

    db.add(new_photo)
    db.commit()
    db.refresh(new_photo)

    return {
        "message": "Photo uploaded successfully",
        "photo": {
            "id": new_photo.id,
            "photo_url": new_photo.photo_url,
            "is_primary": new_photo.is_primary,
            "order_index": new_photo.order_index
        }
    }

# Get user's gallery
@app.get("/users/me/gallery")
async def get_my_gallery(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Get current user's photo gallery"""

    photos = db.query(PhotoGallery).filter(
        PhotoGallery.user_id == current_user.id
    ).order_by(PhotoGallery.order_index).all()

    return photos


# Get another user's gallery
@app.get("/users/{user_id}/gallery")
async def get_user_gallery(
        user_id: int,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Get a user's photo gallery"""

    photos = db.query(PhotoGallery).filter(
        PhotoGallery.user_id == user_id
    ).order_by(PhotoGallery.order_index).all()

    return photos


@app.get("/analytics")
def get_analytics(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get detailed analytics for the current user"""

    user = db.query(User).filter(User.id == current_user.id).first()

    # Calculate win/loss streaks
    fights = db.query(FightRecord).filter(
        (FightRecord.user_id == user.id) | (FightRecord.opponent_id == user.id)
    ).order_by(FightRecord.date.desc()).all()

    current_streak = 0
    longest_streak = 0
    temp_streak = 0

    for fight in fights:
        is_winner = (fight.user_id == user.id and fight.result == "win") or \
                    (fight.opponent_id == user.id and fight.result == "loss")

        if is_winner:
            temp_streak += 1
            longest_streak = max(longest_streak, temp_streak)
        else:
            temp_streak = 0

    # Current streak is the most recent
    for fight in fights:
        is_winner = (fight.user_id == user.id and fight.result == "win") or \
                    (fight.opponent_id == user.id and fight.result == "loss")

        if is_winner:
            current_streak += 1
        else:
            break

    # Calculate stats by martial art style
    style_stats = defaultdict(lambda: {"wins": 0, "losses": 0, "draws": 0})

    for fight in fights:
        if fight.martial_art_style:
            style = fight.martial_art_style
            is_user = fight.user_id == user.id

            if fight.result == "win" and is_user:
                style_stats[style]["wins"] += 1
            elif fight.result == "loss" and is_user:
                style_stats[style]["losses"] += 1
            elif fight.result == "draw":
                style_stats[style]["draws"] += 1

    # Monthly activity (last 6 months)
    six_months_ago = datetime.utcnow() - timedelta(days=180)
    monthly_fights = defaultdict(int)

    for fight in fights:
        if fight.date >= six_months_ago:
            month_key = fight.date.strftime("%Y-%m")
            monthly_fights[month_key] += 1

    # Calculate training frequency
    training_days = set()
    for fight in fights:
        training_days.add(fight.date.date())

    training_streak = 0
    check_date = datetime.utcnow().date()

    while check_date in training_days:
        training_streak += 1
        check_date -= timedelta(days=1)

    total_fights = user.wins + user.losses + user.draws
    win_rate = (user.wins / total_fights * 100) if total_fights > 0 else 0

    return {
        "total_fights": total_fights,
        "wins": user.wins,
        "losses": user.losses,
        "draws": user.draws,
        "win_rate": round(win_rate, 1),
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "style_stats": dict(style_stats),
        "monthly_activity": dict(monthly_fights),
        "training_streak": training_streak,
        "unique_training_days": len(training_days)
    }


@app.get("/profile/stats")
def get_profile_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get user stats for achievements"""

    user = db.query(User).filter(User.id == current_user.id).first()

    # Get martial arts from user profile - handle both list and string
    if isinstance(user.martial_arts, list):
        martial_arts = user.martial_arts
    elif isinstance(user.martial_arts, str):
        try:
            martial_arts = json.loads(user.martial_arts)
        except:
            martial_arts = []
    else:
        martial_arts = []

    styles_trained = len(martial_arts)

    # Calculate streaks
    fights = db.query(FightRecord).filter(
        (FightRecord.user_id == user.id) | (FightRecord.opponent_id == user.id)
    ).order_by(FightRecord.date.desc()).all()

    current_streak = 0
    longest_streak = 0
    temp_streak = 0

    for fight in fights:
        is_winner = (fight.user_id == user.id and fight.result == "win") or \
                    (fight.opponent_id == user.id and fight.result == "loss")

        if is_winner:
            temp_streak += 1
            longest_streak = max(longest_streak, temp_streak)
        else:
            temp_streak = 0

    # Calculate current streak
    for fight in fights:
        is_winner = (fight.user_id == user.id and fight.result == "win") or \
                    (fight.opponent_id == user.id and fight.result == "loss")

        if is_winner:
            current_streak += 1
        else:
            break

    # Calculate training streak (consecutive days)
    training_days = set()
    for fight in fights:
        training_days.add(fight.date.date())

    training_streak = 0
    check_date = datetime.utcnow().date()

    while check_date in training_days:
        training_streak += 1
        check_date -= timedelta(days=1)

    total_fights = user.wins + user.losses + user.draws
    win_rate = (user.wins / total_fights * 100) if total_fights > 0 else 0

    return {
        "total_fights": total_fights,
        "wins": user.wins,
        "losses": user.losses,
        "draws": user.draws,
        "win_rate": round(win_rate, 1),
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "styles_trained": styles_trained,
        "training_streak": training_streak
    }


class MessageCreate(BaseModel):
    match_id: int
    content: str


@app.post("/messages/send")
async def send_message(
        message_data: MessageCreate,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Send a real-time message via Firebase"""

    # Verify users are matched - FIX THIS PART
    match = db.query(User).filter(User.id == message_data.match_id).first()

    if not match:
        raise HTTPException(status_code=404, detail="User not found")

    if match not in current_user.matches:
        raise HTTPException(status_code=403, detail="Not matched with this user")

    # Create conversation ID (sorted user IDs for consistency)
    conversation_id = f"chat_{min(current_user.id, message_data.match_id)}_{max(current_user.id, message_data.match_id)}"

    # Add message to Firestore
    message_ref = firebase_db.collection('conversations').document(conversation_id).collection('messages').document()
    message_ref.set({
        'sender_id': current_user.id,
        'sender_name': current_user.username,
        'content': message_data.content,
        'timestamp': firestore.SERVER_TIMESTAMP,
        'read': False
    })

    # Update conversation metadata
    firebase_db.collection('conversations').document(conversation_id).set({
        'participants': [current_user.id, message_data.match_id],
        'last_message': message_data.content,
        'last_message_timestamp': firestore.SERVER_TIMESTAMP,
        'last_sender_id': current_user.id
    }, merge=True)

    return {"status": "sent", "conversation_id": conversation_id}


@app.get("/messages/{match_id}")
async def get_messages(
        match_id: int,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Get message history with a match"""

    # Verify users are matched
    match = db.query(User).filter(User.id == match_id).first()
    if not match or match not in current_user.matches:
        raise HTTPException(status_code=403, detail="Not matched with this user")

    # Create conversation ID
    conversation_id = f"chat_{min(current_user.id, match_id)}_{max(current_user.id, match_id)}"

    # Get messages from Firestore
    messages_ref = firebase_db.collection('conversations').document(conversation_id).collection('messages')
    messages = messages_ref.order_by('timestamp').limit(100).stream()

    message_list = []
    for msg in messages:
        msg_data = msg.to_dict()
        message_list.append({
            'id': msg.id,
            'sender_id': msg_data.get('sender_id'),
            'sender_name': msg_data.get('sender_name'),
            'content': msg_data.get('content'),
            'timestamp': msg_data.get('timestamp'),
            'read': msg_data.get('read', False)
        })

    return {"conversation_id": conversation_id, "messages": message_list}


@app.get("/conversations")
async def get_conversations(
        current_user: User = Depends(get_current_user)
):
    """Get all conversations for current user"""

    conversations_ref = firebase_db.collection('conversations')
    conversations = conversations_ref.where('participants', 'array_contains', current_user.id).stream()

    conv_list = []
    for conv in conversations:
        conv_data = conv.to_dict()
        # Get the other participant ID
        other_user_id = [uid for uid in conv_data.get('participants', []) if uid != current_user.id][0]

        conv_list.append({
            'conversation_id': conv.id,
            'other_user_id': other_user_id,
            'last_message': conv_data.get('last_message'),
            'last_message_timestamp': conv_data.get('last_message_timestamp'),
            'unread': conv_data.get('last_sender_id') != current_user.id
        })

    return conv_list




# Endpoint to record a fight
@app.post("/fights/record")
def record_fight(
        opponent_id: int,
        result: str,
        martial_art_style: str,
        notes: str = None,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Record a fight result"""

    if result not in ["win", "loss", "draw"]:
        raise HTTPException(status_code=400, detail="Invalid result. Must be 'win', 'loss', or 'draw'")

    # Create fight record
    fight_record = FightRecord(
        user_id=current_user.id,
        opponent_id=opponent_id,
        result=result,
        martial_art_style=martial_art_style,
        notes=notes
    )

    db.add(fight_record)

    # Update user stats
    user = db.query(User).filter(User.id == current_user.id).first()

    if result == "win":
        user.wins += 1
    elif result == "loss":
        user.losses += 1
    else:
        user.draws += 1

    # Update opponent stats (opposite result)
    opponent = db.query(User).filter(User.id == opponent_id).first()

    if opponent:
        if result == "win":
            opponent.losses += 1
        elif result == "loss":
            opponent.wins += 1
        else:
            opponent.draws += 1

    db.commit()

    return {"message": "Fight recorded successfully", "fight_id": fight_record.id}


# Get fight history
@app.get("/fights/history")
def get_fight_history(
        limit: int = 20,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Get user's fight history"""

    fights = db.query(FightRecord).filter(
        (FightRecord.user_id == current_user.id) | (FightRecord.opponent_id == current_user.id)
    ).order_by(FightRecord.date.desc()).limit(limit).all()

    fight_history = []

    for fight in fights:
        is_user = fight.user_id == current_user.id
        opponent_id = fight.opponent_id if is_user else fight.user_id
        opponent = db.query(User).filter(User.id == opponent_id).first()

        fight_history.append({
            "id": fight.id,
            "opponent_name": opponent.username if opponent else "Unknown",
            "opponent_id": opponent_id,
            "result": fight.result if is_user else (
                "loss" if fight.result == "win" else "win" if fight.result == "loss" else "draw"),
            "martial_art_style": fight.martial_art_style,
            "date": fight.date.isoformat(),
            "notes": fight.notes
        })

    return fight_history


# Get leaderboard
@app.get("/leaderboard")
def get_leaderboard(
        style: str = None,
        limit: int = 10,
        db: Session = Depends(get_db)
):
    """Get top fighters leaderboard"""

    users = db.query(User).all()

    leaderboard = []

    for user in users:
        total_fights = user.wins + user.losses + user.draws

        if total_fights < 5:  # Minimum fights to qualify
            continue

        win_rate = (user.wins / total_fights * 100) if total_fights > 0 else 0

        # Filter by style if specified
        if style:
            # Handle both list and string types
            if isinstance(user.martial_arts, list):
                martial_arts = user.martial_arts
            elif isinstance(user.martial_arts, str):
                try:
                    martial_arts = json.loads(user.martial_arts)
                except:
                    martial_arts = []
            else:
                martial_arts = []

            if style not in martial_arts:
                continue

        leaderboard.append({
            "user_id": user.id,
            "username": user.username,
            "wins": user.wins,
            "losses": user.losses,
            "draws": user.draws,
            "total_fights": total_fights,
            "win_rate": round(win_rate, 1),
            "skill_level": user.skill_level
        })

    # Sort by win rate, then total wins
    leaderboard.sort(key=lambda x: (x["win_rate"], x["wins"]), reverse=True)

    return leaderboard[:limit]



# Delete photo from gallery
@app.delete("/users/me/gallery/{photo_id}")
async def delete_gallery_photo(
        photo_id: int,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Delete a photo from gallery"""

    photo = db.query(PhotoGallery).filter(
        PhotoGallery.id == photo_id,
        PhotoGallery.user_id == current_user.id
    ).first()

    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    # Delete file from filesystem
    if photo.photo_url.startswith("/uploads"):
        file_path = Path("." + photo.photo_url)
        if file_path.exists():
            os.remove(file_path)

    # If this was primary photo, update profile_pic
    if photo.is_primary:
        current_user.profile_pic = None

    db.delete(photo)
    db.commit()

    return {"message": "Photo deleted successfully"}

## Set photo as primary
@app.put("/users/me/gallery/{photo_id}/primary")
async def set_primary_photo(
    photo_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Set a photo as primary profile photo"""

    photo = db.query(PhotoGallery).filter(
        PhotoGallery.id == photo_id,
        PhotoGallery.user_id == current_user.id
    ).first()

    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    # Unset other primary photos
    db.query(PhotoGallery).filter(
        PhotoGallery.user_id == current_user.id,
        PhotoGallery.is_primary == True
    ).update({"is_primary": False})

    # Set this photo as primary
    photo.is_primary = True
    current_user.profile_pic = photo.photo_url

    db.commit()

    return {"message": "Primary photo updated successfully"}


@app.get("/matches/unread")
async def get_unread_matches(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Get count of matches since last viewed"""

    if not current_user.last_viewed_matches:
        # Never viewed, count all matches
        return {"count": len(current_user.matches)}

    # Count matches created after last view
    recent_matches = db.query(matches_table).filter(
        matches_table.c.user_id == current_user.id,
        matches_table.c.created_at > current_user.last_viewed_matches
    ).count()

    return {"count": recent_matches}


@app.post("/matches/mark-read")
async def mark_matches_read(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Mark all matches as viewed"""
    current_user.last_viewed_matches = datetime.utcnow()
    db.commit()
    return {"status": "success"}


@app.post("/messages/{match_id}/mark-read")
async def mark_messages_read(
        match_id: int,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Mark all messages from a match as read"""
    try:
        # Create conversation ID
        user_ids = sorted([current_user.id, match_id])
        conversation_id = f"chat_{user_ids[0]}_{user_ids[1]}"

        # Get Firestore reference
        firestore_db = firestore.client()
        messages_ref = firestore_db.collection('conversations').document(conversation_id).collection('messages')

        # Query for unread messages from the other user
        unread_messages = messages_ref.where('sender_id', '!=', current_user.id).where('read', '==', False).stream()

        # Mark all as read
        batch = firestore_db.batch()
        count = 0
        for msg in unread_messages:
            batch.update(msg.reference, {'read': True})
            count += 1

        batch.commit()

        return {"message": f"Marked {count} messages as read"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)