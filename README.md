# Multilingual Campus Event Management System

A comprehensive web-based system for managing campus events at Nigerian universities with full multilingual support (English, Hausa, Yoruba, Igbo).

## Features

- 🌍 **Multilingual Support**: Switch between English, Hausa, Yoruba, and Igbo
- 👥 **Role-Based Access**: Student, Staff, and Admin roles
- 📅 **Event Management**: Create, edit, publish, and manage campus events
- 🎫 **Registration System**: Easy event registration with capacity management
- 📊 **Admin Dashboard**: Statistics and user management
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🗓️ **Calendar View**: Visual calendar with all events

## Quick Start

### 1. Install Python Dependencies

```bash
cd campus_events
pip install -r requirements.txt
```

### 2. Initialize and Seed Database

```bash
# Set Flask app
set FLASK_APP=run.py  # Windows
export FLASK_APP=run.py  # Linux/Mac

# Create database tables
flask init-db

# Add sample data
flask seed-db
```

### 3. Run the Application

```bash
python run.py
```

Then open http://127.0.0.1:5000 in your browser.

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@lasustech.edu.ng | admin123 |
| Staff | staff@lasustech.edu.ng | staff123 |
| Student | student@lasustech.edu.ng | student123 |

## Project Structure

```
campus_events/
├── app/
│   ├── __init__.py       # App factory
│   ├── config.py         # Configuration
│   ├── models.py         # Database models
│   ├── forms.py          # WTForms
│   ├── routes/           # Blueprints
│   │   ├── main.py       # Homepage, language
│   │   ├── auth.py       # Login, register
│   │   ├── events.py     # Event CRUD
│   │   └── admin.py      # Admin panel
│   ├── templates/        # Jinja2 templates
│   └── static/           # CSS, JS, images
├── requirements.txt
├── run.py
└── README.md
```

## Technologies Used

- **Backend**: Flask, Flask-SQLAlchemy, Flask-Login, Flask-Babel
- **Database**: SQLite (development), PostgreSQL (production)
- **Frontend**: Bootstrap 5, Jinja2, FullCalendar
- **i18n**: Flask-Babel for internationalization

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

This project is for educational purposes - Final Year Project.
