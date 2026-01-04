"""
WTForms for Campus Event Management System
"""
import re
from flask_wtf import FlaskForm
from flask_babel import lazy_gettext as _l
from wtforms import (StringField, PasswordField, TextAreaField, SelectField,
                     DateTimeLocalField, IntegerField, BooleanField, SubmitField)
from wtforms.validators import (DataRequired, EqualTo, Length, 
                                 Optional, NumberRange, ValidationError, Regexp)
from app.models import User


# Simple email regex pattern (doesn't check DNS)
EMAIL_REGEX = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'


class LoginForm(FlaskForm):
    """User login form."""
    email = StringField(_l('Email'), validators=[
        DataRequired(message=_l('Email is required')),
        Regexp(EMAIL_REGEX, message=_l('Please enter a valid email address'))
    ])
    password = PasswordField(_l('Password'), validators=[
        DataRequired(message=_l('Password is required'))
    ])
    remember_me = BooleanField(_l('Remember Me'))
    submit = SubmitField(_l('Sign In'))


class RegistrationForm(FlaskForm):
    """User registration form."""
    full_name = StringField(_l('Full Name'), validators=[
        DataRequired(message=_l('Full name is required')),
        Length(min=2, max=100, message=_l('Name must be between 2 and 100 characters'))
    ])
    email = StringField(_l('Email'), validators=[
        DataRequired(message=_l('Email is required')),
        Regexp(EMAIL_REGEX, message=_l('Please enter a valid email address'))
    ])
    phone = StringField(_l('Phone Number'), validators=[
        Optional(),
        Length(max=15, message=_l('Phone number is too long'))
    ])
    matric_number = StringField(_l('Matric Number'), validators=[
        Optional(),
        Length(max=20, message=_l('Matric number is too long'))
    ])
    department_id = SelectField(_l('Department'), coerce=int, validators=[Optional()])
    password = PasswordField(_l('Password'), validators=[
        DataRequired(message=_l('Password is required')),
        Length(min=6, message=_l('Password must be at least 6 characters'))
    ])
    password2 = PasswordField(_l('Confirm Password'), validators=[
        DataRequired(message=_l('Please confirm your password')),
        EqualTo('password', message=_l('Passwords must match'))
    ])
    preferred_language = SelectField(_l('Preferred Language'), choices=[
        ('en', 'English'),
        ('ha', 'Hausa'),
        ('yo', 'Yorùbá'),
        ('ig', 'Igbo')
    ], default='en')
    submit = SubmitField(_l('Register'))
    
    def validate_email(self, email):
        """Check if email is already registered."""
        user = User.query.filter_by(email=email.data.lower()).first()
        if user:
            raise ValidationError(_l('This email address is already registered.'))
    
    def validate_matric_number(self, matric_number):
        """Check if matric number is already registered."""
        if matric_number.data:
            user = User.query.filter_by(matric_number=matric_number.data.upper()).first()
            if user:
                raise ValidationError(_l('This matric number is already registered.'))


class ProfileForm(FlaskForm):
    """User profile update form."""
    full_name = StringField(_l('Full Name'), validators=[
        DataRequired(message=_l('Full name is required')),
        Length(min=2, max=100)
    ])
    phone = StringField(_l('Phone Number'), validators=[
        Optional(),
        Length(max=15)
    ])
    matric_number = StringField(_l('Matric Number'), validators=[
        Optional(),
        Length(max=20)
    ])
    staff_id = StringField(_l('Staff ID'), validators=[
        Optional(),
        Length(max=20)
    ])
    preferred_language = SelectField(_l('Preferred Language'), choices=[
        ('en', 'English'),
        ('ha', 'Hausa'),
        ('yo', 'Yorùbá'),
        ('ig', 'Igbo')
    ])
    submit = SubmitField(_l('Update Profile'))


class ChangePasswordForm(FlaskForm):
    """Password change form."""
    current_password = PasswordField(_l('Current Password'), validators=[
        DataRequired(message=_l('Current password is required'))
    ])
    new_password = PasswordField(_l('New Password'), validators=[
        DataRequired(message=_l('New password is required')),
        Length(min=6, message=_l('Password must be at least 6 characters'))
    ])
    confirm_password = PasswordField(_l('Confirm New Password'), validators=[
        DataRequired(),
        EqualTo('new_password', message=_l('Passwords must match'))
    ])
    submit = SubmitField(_l('Change Password'))


class EventForm(FlaskForm):
    """Event creation and editing form."""
    title = StringField(_l('Event Title'), validators=[
        DataRequired(message=_l('Event title is required')),
        Length(min=3, max=200, message=_l('Title must be between 3 and 200 characters'))
    ])
    description = TextAreaField(_l('Description'), validators=[
        Optional(),
        Length(max=5000, message=_l('Description is too long'))
    ])
    category_id = SelectField(_l('Category'), coerce=int, validators=[
        DataRequired(message=_l('Please select a category'))
    ])
    venue = StringField(_l('Venue'), validators=[
        DataRequired(message=_l('Venue is required')),
        Length(max=200)
    ])
    start_date = DateTimeLocalField(_l('Start Date & Time'), format='%Y-%m-%dT%H:%M',
                                     validators=[DataRequired(message=_l('Start date is required'))])
    end_date = DateTimeLocalField(_l('End Date & Time'), format='%Y-%m-%dT%H:%M',
                                   validators=[DataRequired(message=_l('End date is required'))])
    max_attendees = IntegerField(_l('Maximum Attendees (0 for unlimited)'), validators=[
        Optional(),
        NumberRange(min=0, message=_l('Must be 0 or greater'))
    ], default=0)
    status = SelectField(_l('Status'), choices=[
        ('draft', _l('Draft')),
        ('published', _l('Published')),
        ('cancelled', _l('Cancelled'))
    ], default='draft')
    submit = SubmitField(_l('Save Event'))
    
    def validate_end_date(self, end_date):
        """Ensure end date is after start date."""
        if self.start_date.data and end_date.data:
            if end_date.data <= self.start_date.data:
                raise ValidationError(_l('End date must be after start date.'))


class SearchForm(FlaskForm):
    """Event search form."""
    query = StringField(_l('Search events...'), validators=[Optional()])
    category = SelectField(_l('Category'), coerce=int, validators=[Optional()])
    date_from = DateTimeLocalField(_l('From'), format='%Y-%m-%dT%H:%M', validators=[Optional()])
    date_to = DateTimeLocalField(_l('To'), format='%Y-%m-%dT%H:%M', validators=[Optional()])
    submit = SubmitField(_l('Search'))
