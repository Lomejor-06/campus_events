"""
Database Models for Campus Event Management System
"""
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from app import db, login_manager


@login_manager.user_loader
def load_user(id):
    """Load user by ID for Flask-Login."""
    return User.query.get(int(id))


class Department(db.Model):
    """University department model."""
    __tablename__ = 'departments'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    faculty = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(10), unique=True)
    
    # Relationships
    users = db.relationship('User', backref='department', lazy='dynamic')
    
    def __repr__(self):
        return f'<Department {self.name}>'


class User(UserMixin, db.Model):
    """User model for students, staff, and admins."""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    matric_number = db.Column(db.String(20), unique=True, nullable=True)  # For students
    staff_id = db.Column(db.String(20), unique=True, nullable=True)  # For staff
    phone = db.Column(db.String(15), nullable=True)
    
    # Role: 'student', 'staff', 'admin'
    role = db.Column(db.String(20), default='student', nullable=False)
    
    # Language preference
    preferred_language = db.Column(db.String(5), default='en')
    
    # Foreign keys
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    events_created = db.relationship('Event', backref='creator', lazy='dynamic',
                                     foreign_keys='Event.created_by')
    registrations = db.relationship('Registration', backref='user', lazy='dynamic')
    saved_events = db.relationship('SavedEvent', backref='user', lazy='dynamic')
    
    def set_password(self, password):
        """Hash and set password."""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check password against hash."""
        return check_password_hash(self.password_hash, password)
    
    def is_admin(self):
        """Check if user is admin."""
        return self.role == 'admin'
    
    def is_staff(self):
        """Check if user is staff or admin."""
        return self.role in ['staff', 'admin']
    
    def can_create_events(self):
        """Check if user can create events."""
        return self.role in ['staff', 'admin']
    
    def has_saved_event(self, event_id):
        """Check if user has saved an event."""
        return self.saved_events.filter_by(event_id=event_id).first() is not None
    
    def __repr__(self):
        return f'<User {self.email}>'


class Category(db.Model):
    """Event category with multilingual support."""
    __tablename__ = 'categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)  # English name
    name_ha = db.Column(db.String(50), nullable=True)  # Hausa
    name_yo = db.Column(db.String(50), nullable=True)  # Yoruba
    name_ig = db.Column(db.String(50), nullable=True)  # Igbo
    color = db.Column(db.String(7), default='#007bff')  # Hex color
    icon = db.Column(db.String(50), default='bi-calendar-event')  # Bootstrap icon
    
    # Relationships
    events = db.relationship('Event', backref='category', lazy='dynamic')
    
    def get_name(self, lang='en'):
        """Get category name in specified language."""
        names = {
            'en': self.name,
            'ha': self.name_ha or self.name,
            'yo': self.name_yo or self.name,
            'ig': self.name_ig or self.name
        }
        return names.get(lang, self.name)
    
    def __repr__(self):
        return f'<Category {self.name}>'


class Event(db.Model):
    """Event model for campus events."""
    __tablename__ = 'events'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    
    # Date and time
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    
    # Location
    venue = db.Column(db.String(200), nullable=False)
    
    # Capacity
    max_attendees = db.Column(db.Integer, default=0)  # 0 = unlimited
    
    # Status: 'draft', 'published', 'cancelled', 'completed'
    status = db.Column(db.String(20), default='draft')
    
    # Image
    image_url = db.Column(db.String(500), nullable=True)
    
    # Foreign keys
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    registrations = db.relationship('Registration', backref='event', lazy='dynamic',
                                    cascade='all, delete-orphan')
    
    @property
    def registration_count(self):
        """Get count of active registrations."""
        return self.registrations.filter_by(status='registered').count()
    
    @property
    def is_full(self):
        """Check if event has reached capacity."""
        if self.max_attendees == 0:
            return False
        return self.registration_count >= self.max_attendees
    
    @property
    def spots_left(self):
        """Get remaining spots."""
        if self.max_attendees == 0:
            return None  # Unlimited
        return max(0, self.max_attendees - self.registration_count)
    
    @property
    def is_upcoming(self):
        """Check if event is in the future."""
        return self.start_date > datetime.utcnow()
    
    @property
    def is_ongoing(self):
        """Check if event is currently happening."""
        now = datetime.utcnow()
        return self.start_date <= now <= self.end_date
    
    def __repr__(self):
        return f'<Event {self.title}>'


class Registration(db.Model):
    """Event registration/RSVP model."""
    __tablename__ = 'registrations'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'), nullable=False)
    
    # Status: 'registered', 'attended', 'cancelled', 'waitlist'
    status = db.Column(db.String(20), default='registered')
    
    # Timestamps
    registered_at = db.Column(db.DateTime, default=datetime.utcnow)
    attended_at = db.Column(db.DateTime, nullable=True)
    
    # Unique constraint: one registration per user per event
    __table_args__ = (
        db.UniqueConstraint('user_id', 'event_id', name='unique_user_event'),
    )
    
    def __repr__(self):
        return f'<Registration User:{self.user_id} Event:{self.event_id}>'


class SavedEvent(db.Model):
    """Saved/bookmarked events by users."""
    __tablename__ = 'saved_events'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'), nullable=False)
    
    # Timestamps
    saved_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Unique constraint: one save per user per event
    __table_args__ = (
        db.UniqueConstraint('user_id', 'event_id', name='unique_saved_event'),
    )
    
    # Relationship to event
    event = db.relationship('Event', backref='saved_by')
    
    def __repr__(self):
        return f'<SavedEvent User:{self.user_id} Event:{self.event_id}>'
