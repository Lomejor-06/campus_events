# Multilingual Campus Event Management System

A comprehensive web-based system for managing campus events at Lasustech with full multilingual support (English, Hausa, Yoruba, Igbo).

## Features

- 🌍 **Multilingual Support**: Switch between English, Hausa, Yoruba, and Igbo
- 👥 **Role-Based Access**: Student, Staff, and Admin roles
- 📅 **Event Management**: Create, edit, publish, and manage campus events
- 🎫 **Registration System**: Easy event registration with capacity management
- 📊 **Admin Dashboard**: Statistics and user management
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🗓️ **Calendar View**: Visual calendar with all events

## Quick Start

To run the application, you need to set up both the backend (Flask) and the frontend (React).

### 1. Backend Setup (Terminal 1)

Initialize the Python environment and database:

```bash
cd campus_events

# Install dependencies
pip install -r requirements.txt

# Initialize and Seed Database
# Windows users:
set FLASK_APP=run.py
# Mac/Linux users:
export FLASK_APP=run.py

flask init-db
flask seed-db

# Run the Backend Server
python run.py
```
The backend API will run on `http://127.0.0.1:5000`.

### 2. Frontend Setup (Terminal 2)

In a new terminal window, start the React interface:

```bash
cd campus_events/frontend

# Install Node dependencies
npm install

# Start the Development Server
npm run dev
```

### 3. Access the App

Open your browser and go to:
👉 **http://localhost:5173**

Use this URL to interact with the application. The Flask URL (port 5000) is used only for API calls.

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@lasustech.edu.ng | admin123 |
| Staff | staff@lasustech.edu.ng | staff123 |
| Student | student@lasustech.edu.ng | student123 |


## Technologies Used

- **Backend**: Flask, Flask-SQLAlchemy, Flask-Login
- **Frontend**: React, TypeScript, Vite, Bootstrap 5
- **Database**: SQLite (development), PostgreSQL (production)
- **i18n**: react-i18next for internationalization

## Project Structure

```
campus_events/
├── app/                  # Flask Backend
│   ├── __init__.py       # App factory
│   ├── models.py         # Database models
│   └── routes/           # API Endpoints
├── frontend/             # React Frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Route components (Pages)
│   │   ├── context/      # React Conext (Auth, Notifications)
│   │   └── services/     # API service layer
│   └── public/           # Static assets
├── requirements.txt
├── run.py
└── README.md
```

## Event Categories

| English | Hausa | Yoruba | Igbo |
|---------|-------|--------|------|
| Academic | Ilimi | Ẹ̀kọ́ | Mmụta |
| Social | Zamantakewa | Àwùjọ | Mmekọrịta |
| Sports | Wasanni | Eré-ìdárayá | Egwuregwu |
| Cultural | Al'ada | Àṣà | Omenala |
| Religious | Addini | Ẹ̀sìn | Okpukpe |
| Career | Sana'a | Iṣẹ́ | Ọrụ |

## License

This project is for educational purposes - Final Year Project of ODUNLAMI OLUDAMILARE ISRAEL.
