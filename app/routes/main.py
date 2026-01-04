"""
Main routes - Homepage and public pages
"""
from flask import Blueprint, render_template, redirect, url_for, request, make_response
from flask_login import current_user
from flask_babel import get_locale
from datetime import datetime

from app import db
from app.models import Event, Category
from app.config import Config

main_bp = Blueprint('main', __name__)


@main_bp.route('/')
@main_bp.route('/index')
def index():
    """Homepage with upcoming events."""
    # Get upcoming published events
    upcoming_events = Event.query.filter(
        Event.status == 'published',
        Event.start_date >= datetime.utcnow()
    ).order_by(Event.start_date.asc()).limit(6).all()
    
    # Get all categories for filtering
    categories = Category.query.all()
    
    return render_template('main/index.html',
                          title='Campus Events',
                          events=upcoming_events,
                          categories=categories)


@main_bp.route('/about')
def about():
    """About page."""
    return render_template('main/about.html', title='About Us')


@main_bp.route('/contact')
def contact():
    """Contact page."""
    return render_template('main/contact.html', title='Contact Us')


@main_bp.route('/set-language/<language>')
def set_language(language):
    """Set user preferred language."""
    if language not in Config.LANGUAGES:
        language = 'en'
    
    # If user is logged in, save preference to database
    if current_user.is_authenticated:
        current_user.preferred_language = language
        db.session.commit()
    
    # Set language cookie
    response = make_response(redirect(request.referrer or url_for('main.index')))
    response.set_cookie('language', language, max_age=60*60*24*365)  # 1 year
    
    return response


@main_bp.route('/calendar')
def calendar():
    """Calendar view of events."""
    # Get all published events for the calendar
    events = Event.query.filter(
        Event.status == 'published'
    ).order_by(Event.start_date.asc()).all()
    
    categories = Category.query.all()
    
    return render_template('main/calendar.html',
                          title='Event Calendar',
                          events=events,
                          categories=categories)
