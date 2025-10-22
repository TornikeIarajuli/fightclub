# Fight Match App - Local Setup

## Backend Setup (FastAPI)

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the backend:
   ```bash
   python main.py
   ```
   The API will be available at https://fightmatch-backend.onrender.com
   API docs at https://fightmatch-backend.onrender.com/docs

## Frontend Setup (Next.js)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create pages/_app.js:
   ```javascript
   import '../styles/globals.css'

   export default function App({ Component, pageProps }) {
     return <Component {...pageProps} />
   }
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```
   The app will be available at http://localhost:3000

```
fight-match-app/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── fight_match.db (created automatically)
├── frontend/
│   ├── pages/
│   │   ├── _app.js
│   │   ├── index.js
│   │   ├── register.js
│   │   ├── login.js
│   │   ├── discover.js
│   │   ├── matches.js
│   │   └── profile.js
│   ├── styles/
│   │   └── globals.css
│   ├── package.json
│   ├── tailwind.config.js
│   └── node_modules/
```

## Features

- **User Registration**: Create fighter profiles with martial arts background
- **Authentication**: Secure JWT-based login system
- **Discovery**: Swipe through potential sparring partners
- **Matching**: Get matched when both fighters like each other
- **Fight Scheduling**: Schedule fights with your matches
- **Fighter Stats**: Track wins, losses, and draws
- **Profile Management**: View and manage your fighter profile

## Usage

1. Register a new account with your fighting background
2. Login with your credentials
3. Browse through other fighters in the Discover section
4. Swipe right (heart) to like, left (X) to pass
5. When you match with someone, schedule a fight!
6. View your matches and scheduled fights
7. Track your fight statistics in your profile

## Notes

- The SQLite database is created automatically on first run
- All data is stored locally in fight_match.db
- Default secret key is included - change it for any production use
- CORS is configured for local development only