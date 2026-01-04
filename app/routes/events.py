"""
Event routes - Browse, Create, Edit, Register
"""
from flask import Blueprint, render_template, redirect, url_for, flash, request, abort, jsonify
from flask_login import current_user, login_required
from flask_babel import _
from datetime import datetime
from functools import wraps

from app import db
from app.models import Event, Category, Registration, SavedEvent
from app.forms import EventForm, SearchForm

events_bp = Blueprint('events', __name__)


def staff_required(f):
    """Decorator to require staff or admin role."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.can_create_events():
            flash(_('You do not have permission to access this page.'), 'danger')
            return redirect(url_for('main.index'))
        return f(*args, **kwargs)
    return decorated_function


@events_bp.route('/')
def list_events():
    """Browse all published events."""
    page = request.args.get('page', 1, type=int)
    category_id = request.args.get('category', type=int)
    query = request.args.get('q', '')
    
    # Base query - only published and upcoming events
    events_query = Event.query.filter(
        Event.status == 'published',
        Event.start_date >= datetime.utcnow()
    )
    
    # Apply category filter
    if category_id:
        events_query = events_query.filter(Event.category_id == category_id)
    
    # Apply search query
    if query:
        search_term = f"%{query}%"
        events_query = events_query.filter(
            db.or_(
                Event.title.ilike(search_term),
                Event.description.ilike(search_term),
                Event.venue.ilike(search_term)
            )
        )
    
    # Order by start date and paginate
    events = events_query.order_by(Event.start_date.asc()).paginate(
        page=page, per_page=12, error_out=False
    )
    
    categories = Category.query.all()
    
    return render_template('events/list.html',
                          title=_('Browse Events'),
                          events=events,
                          categories=categories,
                          current_category=category_id,
                          search_query=query)


@events_bp.route('/<int:event_id>')
def event_detail(event_id):
    """View event details."""
    event = Event.query.get_or_404(event_id)
    
    # Check if event is published or user is creator/admin
    if event.status != 'published':
        if not current_user.is_authenticated:
            abort(404)
        if not (current_user.is_admin() or current_user.id == event.created_by):
            abort(404)
    
    # Check if current user is registered
    is_registered = False
    is_saved = False
    if current_user.is_authenticated:
        registration = Registration.query.filter_by(
            user_id=current_user.id,
            event_id=event_id,
            status='registered'
        ).first()
        is_registered = registration is not None
        is_saved = current_user.has_saved_event(event_id)
    
    return render_template('events/detail.html',
                          title=event.title,
                          event=event,
                          is_registered=is_registered,
                          is_saved=is_saved)


@events_bp.route('/create', methods=['GET', 'POST'])
@login_required
@staff_required
def create_event():
    """Create a new event."""
    form = EventForm()
    
    # Populate category choices
    categories = Category.query.all()
    form.category_id.choices = [(c.id, c.name) for c in categories]
    
    if form.validate_on_submit():
        event = Event(
            title=form.title.data,
            description=form.description.data,
            category_id=form.category_id.data,
            venue=form.venue.data,
            start_date=form.start_date.data,
            end_date=form.end_date.data,
            max_attendees=form.max_attendees.data or 0,
            status=form.status.data,
            created_by=current_user.id
        )
        
        db.session.add(event)
        db.session.commit()
        
        flash(_('Event created successfully!'), 'success')
        return redirect(url_for('events.event_detail', event_id=event.id))
    
    return render_template('events/form.html',
                          title=_('Create Event'),
                          form=form,
                          is_edit=False)


@events_bp.route('/<int:event_id>/edit', methods=['GET', 'POST'])
@login_required
@staff_required
def edit_event(event_id):
    """Edit an existing event."""
    event = Event.query.get_or_404(event_id)
    
    # Check permission
    if not current_user.is_admin() and current_user.id != event.created_by:
        flash(_('You do not have permission to edit this event.'), 'danger')
        return redirect(url_for('events.event_detail', event_id=event_id))
    
    form = EventForm(obj=event)
    
    # Populate category choices
    categories = Category.query.all()
    form.category_id.choices = [(c.id, c.name) for c in categories]
    
    if form.validate_on_submit():
        event.title = form.title.data
        event.description = form.description.data
        event.category_id = form.category_id.data
        event.venue = form.venue.data
        event.start_date = form.start_date.data
        event.end_date = form.end_date.data
        event.max_attendees = form.max_attendees.data or 0
        event.status = form.status.data
        
        db.session.commit()
        
        flash(_('Event updated successfully!'), 'success')
        return redirect(url_for('events.event_detail', event_id=event.id))
    
    return render_template('events/form.html',
                          title=_('Edit Event'),
                          form=form,
                          event=event,
                          is_edit=True)


@events_bp.route('/<int:event_id>/delete', methods=['POST'])
@login_required
@staff_required
def delete_event(event_id):
    """Delete an event."""
    event = Event.query.get_or_404(event_id)
    
    # Check permission
    if not current_user.is_admin() and current_user.id != event.created_by:
        flash(_('You do not have permission to delete this event.'), 'danger')
        return redirect(url_for('events.event_detail', event_id=event_id))
    
    db.session.delete(event)
    db.session.commit()
    
    flash(_('Event deleted successfully.'), 'success')
    return redirect(url_for('events.list_events'))


@events_bp.route('/<int:event_id>/register', methods=['POST'])
@login_required
def register_for_event(event_id):
    """Register for an event."""
    event = Event.query.get_or_404(event_id)
    
    # Check if event is published and upcoming
    if event.status != 'published':
        flash(_('This event is not available for registration.'), 'warning')
        return redirect(url_for('events.event_detail', event_id=event_id))
    
    if event.start_date < datetime.utcnow():
        flash(_('This event has already started.'), 'warning')
        return redirect(url_for('events.event_detail', event_id=event_id))
    
    # Check if already registered
    existing = Registration.query.filter_by(
        user_id=current_user.id,
        event_id=event_id
    ).first()
    
    if existing:
        if existing.status == 'registered':
            flash(_('You are already registered for this event.'), 'info')
        else:
            # Re-register if previously cancelled
            existing.status = 'registered'
            existing.registered_at = datetime.utcnow()
            db.session.commit()
            flash(_('You have been registered for this event!'), 'success')
        return redirect(url_for('events.event_detail', event_id=event_id))
    
    # Check capacity
    if event.is_full:
        flash(_('Sorry, this event is full.'), 'warning')
        return redirect(url_for('events.event_detail', event_id=event_id))
    
    # Create registration
    registration = Registration(
        user_id=current_user.id,
        event_id=event_id,
        status='registered'
    )
    db.session.add(registration)
    db.session.commit()
    
    flash(_('You have been registered for this event!'), 'success')
    return redirect(url_for('events.event_detail', event_id=event_id))


@events_bp.route('/<int:event_id>/unregister', methods=['POST'])
@login_required
def unregister_from_event(event_id):
    """Cancel event registration."""
    registration = Registration.query.filter_by(
        user_id=current_user.id,
        event_id=event_id
    ).first()
    
    if not registration:
        flash(_('You are not registered for this event.'), 'warning')
        return redirect(url_for('events.event_detail', event_id=event_id))
    
    registration.status = 'cancelled'
    db.session.commit()
    
    flash(_('Your registration has been cancelled.'), 'info')
    return redirect(url_for('events.event_detail', event_id=event_id))


@events_bp.route('/my-events')
@login_required
@staff_required
def my_events():
    """View events created by current user."""
    page = request.args.get('page', 1, type=int)
    
    events = Event.query.filter_by(created_by=current_user.id)\
        .order_by(Event.created_at.desc())\
        .paginate(page=page, per_page=10, error_out=False)
    
    return render_template('events/my_events.html',
                          title=_('My Events'),
                          events=events)


@events_bp.route('/<int:event_id>/save', methods=['POST'])
@login_required
def save_event(event_id):
    """Save/bookmark an event."""
    event = Event.query.get_or_404(event_id)
    
    # Check if already saved
    existing = SavedEvent.query.filter_by(
        user_id=current_user.id,
        event_id=event_id
    ).first()
    
    if existing:
        flash(_('Event already saved.'), 'info')
        return redirect(url_for('events.event_detail', event_id=event_id))
    
    saved = SavedEvent(user_id=current_user.id, event_id=event_id)
    db.session.add(saved)
    db.session.commit()
    
    flash(_('Event saved!'), 'success')
    return redirect(url_for('events.event_detail', event_id=event_id))


@events_bp.route('/<int:event_id>/unsave', methods=['POST'])
@login_required
def unsave_event(event_id):
    """Remove saved event."""
    saved = SavedEvent.query.filter_by(
        user_id=current_user.id,
        event_id=event_id
    ).first()
    
    if saved:
        db.session.delete(saved)
        db.session.commit()
        flash(_('Event removed from saved.'), 'info')
    
    return redirect(url_for('events.event_detail', event_id=event_id))


@events_bp.route('/saved')
@login_required
def saved_events():
    """View saved events."""
    saved = SavedEvent.query.filter_by(user_id=current_user.id)\
        .order_by(SavedEvent.saved_at.desc()).all()
    
    return render_template('events/saved.html',
                          title=_('Saved Events'),
                          saved_events=saved)


@events_bp.route('/api/events')
def api_events():
    """API endpoint for calendar events (JSON)."""
    start = request.args.get('start')
    end = request.args.get('end')
    
    events_query = Event.query.filter(Event.status == 'published')
    
    if start:
        events_query = events_query.filter(Event.start_date >= start)
    if end:
        events_query = events_query.filter(Event.end_date <= end)
    
    events = events_query.all()
    
    events_data = [{
        'id': e.id,
        'title': e.title,
        'start': e.start_date.isoformat(),
        'end': e.end_date.isoformat(),
        'url': url_for('events.event_detail', event_id=e.id),
        'color': e.category.color if e.category else '#007bff'
    } for e in events]
    
    return jsonify(events_data)
