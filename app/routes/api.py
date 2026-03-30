"""
API Blueprint - RESTful JSON API for React frontend
"""
from flask import Blueprint, jsonify, request, session
from flask_login import login_user, logout_user, current_user, login_required
from datetime import datetime
from functools import wraps
from app.utils import delete_past_events

from app import db
from app.models import User, Event, Category, Registration, SavedEvent, Department, Notification

api_bp = Blueprint('api', __name__, url_prefix='/api')


def json_response(data=None, message=None, status=200):
    """Helper to create consistent JSON responses."""
    response = {}
    if data is not None:
        response['data'] = data
    if message:
        response['message'] = message
    return jsonify(response), status


def staff_required(f):
    """Decorator to require staff or admin role."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.can_create_events():
            return jsonify({'message': 'Permission denied'}), 403
        return f(*args, **kwargs)
    return decorated_function


def admin_required(f):
    """Decorator to require admin role."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_admin():
            return jsonify({'message': 'Permission denied'}), 403
        return f(*args, **kwargs)
    return decorated_function


def user_to_dict(user):
    """Convert User model to dictionary."""
    return {
        'id': user.id,
        'email': user.email,
        'full_name': user.full_name,
        'role': user.role,
        'matric_number': user.matric_number,
        'staff_id': user.staff_id,
        'phone': user.phone,
        'department_id': user.department_id,
        'preferred_language': user.preferred_language,
        'is_active': user.is_active,
    }


def category_to_dict(category):
    """Convert Category model to dictionary."""
    return {
        'id': category.id,
        'name': category.name,
        'name_ha': category.name_ha,
        'name_yo': category.name_yo,
        'name_ig': category.name_ig,
        'color': category.color,
        'icon': category.icon,
    }


def event_to_dict(event, include_registered=False, include_saved=False):
    """Convert Event model to dictionary."""
    data = {
        'id': event.id,
        'title': event.title,
        'description': event.description,
        'start_date': event.start_date.isoformat(),
        'end_date': event.end_date.isoformat(),
        'venue': event.venue,
        'max_attendees': event.max_attendees,
        'status': event.status,
        'image_url': event.image_url,
        'category_id': event.category_id,
        'category': category_to_dict(event.category) if event.category else None,
        'created_by': event.created_by,
        'creator': {'id': event.creator.id, 'full_name': event.creator.full_name} if event.creator else None,
        'registration_count': event.registration_count,
        'is_full': event.is_full,
        'spots_left': event.spots_left,
        'is_upcoming': event.is_upcoming,
    }
    
    if include_registered and current_user.is_authenticated:
        reg = Registration.query.filter_by(
            user_id=current_user.id, event_id=event.id, status='registered'
        ).first()
        data['is_registered'] = reg is not None
    
    if include_saved and current_user.is_authenticated:
        data['is_saved'] = current_user.has_saved_event(event.id)
    
    return data


# ============ AUTH ENDPOINTS ============

@api_bp.route('/auth/login', methods=['POST'])
def login():
    """User login."""
    if current_user.is_authenticated:
        return jsonify({'user': user_to_dict(current_user), 'message': 'Already logged in'})
    
    data = request.get_json()
    email = data.get('email', '').lower()
    password = data.get('password', '')
    remember = data.get('remember_me', False)
    
    user = User.query.filter_by(email=email).first()
    
    if user is None or not user.check_password(password):
        return jsonify({'message': 'Invalid email or password'}), 401
    
    if not user.is_active:
        return jsonify({'message': 'Account deactivated'}), 403
    
    login_user(user, remember=remember)
    user.last_login = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'user': user_to_dict(user),
        'message': f'Welcome back, {user.full_name}!'
    })


@api_bp.route('/auth/register', methods=['POST'])
def register():
    """User registration."""
    if current_user.is_authenticated:
        return jsonify({'message': 'Already logged in'}), 400
    
    data = request.get_json()
    
    # Check if email exists
    if User.query.filter_by(email=data.get('email', '').lower()).first():
        return jsonify({'message': 'Email already registered'}), 400
    
    user = User(
        email=data.get('email', '').lower(),
        full_name=data.get('full_name'),
        phone=data.get('phone'),
        matric_number=data.get('matric_number', '').upper() if data.get('matric_number') else None,
        department_id=data.get('department_id') if data.get('department_id') else None,
        preferred_language=data.get('preferred_language', 'en'),
        role='student'
    )
    user.set_password(data.get('password'))
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'message': 'Registration successful! Please log in.'}), 201


@api_bp.route('/auth/logout', methods=['POST'])
@login_required
def logout():
    """User logout."""
    logout_user()
    return jsonify({'message': 'Logged out successfully'})


@api_bp.route('/auth/profile', methods=['GET'])
@login_required
def get_profile():
    """Get current user profile."""
    return jsonify(user_to_dict(current_user))


@api_bp.route('/auth/profile', methods=['PUT'])
@login_required
def update_profile():
    """Update user profile."""
    data = request.get_json()
    
    current_user.full_name = data.get('full_name', current_user.full_name)
    current_user.phone = data.get('phone', current_user.phone)
    current_user.matric_number = data.get('matric_number', '').upper() if data.get('matric_number') else current_user.matric_number
    current_user.staff_id = data.get('staff_id', '').upper() if data.get('staff_id') else current_user.staff_id
    current_user.department_id = data.get('department_id') if data.get('department_id') else current_user.department_id
    current_user.preferred_language = data.get('preferred_language', current_user.preferred_language)
    
    db.session.commit()
    return jsonify(user_to_dict(current_user))


@api_bp.route('/auth/change-password', methods=['POST'])
@login_required
def change_password():
    """Change user password."""
    data = request.get_json()
    
    if not current_user.check_password(data.get('current_password')):
        return jsonify({'message': 'Current password is incorrect'}), 400
    
    current_user.set_password(data.get('new_password'))
    db.session.commit()
    
    return jsonify({'message': 'Password changed successfully'})


@api_bp.route('/auth/registrations', methods=['GET'])
@login_required
def get_user_registrations():
    """Get user's upcoming event registrations."""
    registrations = Registration.query.filter_by(
        user_id=current_user.id, status='registered'
    ).join(Event).filter(
        Event.start_date >= datetime.utcnow()
    ).order_by(Event.start_date.asc()).all()
    
    result = []
    for reg in registrations:
        result.append({
            'id': reg.id,
            'event': {
                'id': reg.event.id,
                'title': reg.event.title,
                'start_date': reg.event.start_date.isoformat(),
                'venue': reg.event.venue,
            },
            'registered_at': reg.registered_at.isoformat(),
        })
    
    return jsonify(result)


# ============ EVENTS ENDPOINTS ============

@api_bp.route('/events', methods=['GET'])
def list_events():
    """List published events."""
    # Clean up past events
    delete_past_events()
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 12, type=int)
    category_id = request.args.get('category', type=int)
    query = request.args.get('q', '')
    status = request.args.get('status', 'published')
    
    events_query = Event.query.filter(
        Event.status == status,
        Event.start_date >= datetime.utcnow()
    )
    
    if category_id:
        events_query = events_query.filter(Event.category_id == category_id)
    
    if query:
        search_term = f"%{query}%"
        events_query = events_query.filter(
            db.or_(
                Event.title.ilike(search_term),
                Event.description.ilike(search_term),
                Event.venue.ilike(search_term)
            )
        )
    
    pagination = events_query.order_by(Event.start_date.asc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'items': [event_to_dict(e, include_registered=True, include_saved=True) for e in pagination.items],
        'total': pagination.total,
        'page': pagination.page,
        'pages': pagination.pages,
        'per_page': per_page,
    })


@api_bp.route('/events/<int:event_id>', methods=['GET'])
def get_event(event_id):
    """Get event details."""
    event = Event.query.get_or_404(event_id)
    
    if event.status != 'published':
        if not current_user.is_authenticated:
            return jsonify({'message': 'Event not found'}), 404
        if not (current_user.is_admin() or current_user.id == event.created_by):
            return jsonify({'message': 'Event not found'}), 404
    
    return jsonify(event_to_dict(event, include_registered=True, include_saved=True))


@api_bp.route('/events', methods=['POST'])
@login_required
@staff_required
def create_event():
    """Create a new event."""
    data = request.get_json()
    
    event = Event(
        title=data.get('title'),
        description=data.get('description'),
        category_id=data.get('category_id') if data.get('category_id') else None,
        venue=data.get('venue'),
        start_date=datetime.fromisoformat(data.get('start_date')),
        end_date=datetime.fromisoformat(data.get('end_date')),
        max_attendees=data.get('max_attendees', 0),
        status=data.get('status', 'draft'),
        created_by=current_user.id
    )
    
    db.session.add(event)
    db.session.commit()
    
    # Notify students in the same department if event is published
    if event.status == 'published' and current_user.department_id:
        students = User.query.filter_by(
            department_id=current_user.department_id,
            role='student'
        ).all()
        
        notifications = []
        for student in students:
            notifications.append(Notification(
                user_id=student.id,
                type='new_event',
                title='New Event in Your Department',
                message=f'New event "{event.title}" has been posted by {current_user.full_name}',
                event_id=event.id,
                triggered_by_id=current_user.id
            ))
        
        if notifications:
            db.session.add_all(notifications)
            db.session.commit()
    
    return jsonify(event_to_dict(event)), 201


# ============ NOTIFICATION ENDPOINTS ============

@api_bp.route('/notifications', methods=['GET'])
@login_required
def get_notifications():
    """Get user's notifications."""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    pagination = Notification.query.filter_by(user_id=current_user.id).order_by(
        Notification.created_at.desc()
    ).paginate(page=page, per_page=per_page, error_out=False)
    
    result = []
    for notif in pagination.items:
        result.append({
            'id': notif.id,
            'type': notif.type,
            'title': notif.title,
            'message': notif.message,
            'is_read': notif.is_read,
            'created_at': notif.created_at.isoformat(),
            'event_id': notif.event_id,
            'triggered_by': notif.triggered_by.full_name if notif.triggered_by else None,
        })
    
    return jsonify({
        'items': result,
        'total': pagination.total,
        'page': pagination.page,
        'pages': pagination.pages,
        'per_page': per_page,
    })


@api_bp.route('/notifications/unread-count', methods=['GET'])
@login_required
def get_unread_count():
    """Get count of unread notifications."""
    count = Notification.query.filter_by(
        user_id=current_user.id, 
        is_read=False
    ).count()
    return jsonify({'count': count})


@api_bp.route('/notifications/<int:notification_id>/read', methods=['POST'])
@login_required
def mark_notification_read(notification_id):
    """Mark a notification as read."""
    notification = Notification.query.filter_by(
        id=notification_id, 
        user_id=current_user.id
    ).first_or_404()
    
    notification.is_read = True
    notification.read_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({'message': 'Marked as read'})


@api_bp.route('/notifications/mark-all-read', methods=['POST'])
@login_required
def mark_all_read():
    """Mark all notifications as read."""
    Notification.query.filter_by(
        user_id=current_user.id, 
        is_read=False
    ).update({
        'is_read': True, 
        'read_at': datetime.utcnow()
    })
    db.session.commit()
    
    return jsonify({'message': 'All marked as read'})


@api_bp.route('/events/<int:event_id>', methods=['PUT'])
@login_required
@staff_required
def update_event(event_id):
    """Update an event."""
    event = Event.query.get_or_404(event_id)
    
    if not current_user.is_admin() and current_user.id != event.created_by:
        return jsonify({'message': 'Permission denied'}), 403
    
    data = request.get_json()
    
    event.title = data.get('title', event.title)
    event.description = data.get('description', event.description)
    event.category_id = data.get('category_id') if data.get('category_id') else event.category_id
    event.venue = data.get('venue', event.venue)
    event.start_date = datetime.fromisoformat(data.get('start_date')) if data.get('start_date') else event.start_date
    event.end_date = datetime.fromisoformat(data.get('end_date')) if data.get('end_date') else event.end_date
    event.max_attendees = data.get('max_attendees', event.max_attendees)
    event.status = data.get('status', event.status)
    
    db.session.commit()
    
    return jsonify(event_to_dict(event))


@api_bp.route('/events/<int:event_id>', methods=['DELETE'])
@login_required
@staff_required
def delete_event(event_id):
    """Delete an event."""
    event = Event.query.get_or_404(event_id)
    
    if not current_user.is_admin() and current_user.id != event.created_by:
        return jsonify({'message': 'Permission denied'}), 403
    
    db.session.delete(event)
    db.session.commit()
    
    return jsonify({'message': 'Event deleted successfully'})


@api_bp.route('/events/<int:event_id>/register', methods=['POST'])
@login_required
def register_for_event(event_id):
    """Register for an event."""
    event = Event.query.get_or_404(event_id)
    
    if event.status != 'published':
        return jsonify({'message': 'Event not available for registration'}), 400
    
    if event.start_date < datetime.utcnow():
        return jsonify({'message': 'Event has already started'}), 400
    
    existing = Registration.query.filter_by(
        user_id=current_user.id, event_id=event_id
    ).first()
    
    if existing:
        if existing.status == 'registered':
            return jsonify({'message': 'Already registered'}), 400
        existing.status = 'registered'
        existing.registered_at = datetime.utcnow()
        db.session.commit()
        
        # Notify event creator
        if event.creator and event.creator.id != current_user.id:
            notification = Notification(
                user_id=event.creator.id,
                type='registration',
                title='New Registration',
                message=f'{current_user.full_name} registered for your event "{event.title}"',
                event_id=event.id,
                triggered_by_id=current_user.id
            )
            db.session.add(notification)
            db.session.commit()
        
        return jsonify({'message': 'Registered successfully'})
    
    if event.is_full:
        return jsonify({'message': 'Event is full'}), 400
    
    registration = Registration(
        user_id=current_user.id,
        event_id=event_id,
        status='registered'
    )
    db.session.add(registration)
    db.session.commit()
    
    # Notify event creator about new registration
    if event.creator and event.creator.id != current_user.id:
        notification = Notification(
            user_id=event.creator.id,
            type='registration',
            title='New Registration',
            message=f'{current_user.full_name} registered for your event "{event.title}"',
            event_id=event.id,
            triggered_by_id=current_user.id
        )
        db.session.add(notification)
        db.session.commit()
    
    return jsonify({'message': 'Registered successfully'})


@api_bp.route('/events/<int:event_id>/unregister', methods=['POST'])
@login_required
def unregister_from_event(event_id):
    """Cancel event registration."""
    registration = Registration.query.filter_by(
        user_id=current_user.id, event_id=event_id
    ).first()
    
    if not registration:
        return jsonify({'message': 'Not registered'}), 400
    
    registration.status = 'cancelled'
    db.session.commit()
    
    return jsonify({'message': 'Registration cancelled'})


@api_bp.route('/events/<int:event_id>/save', methods=['POST'])
@login_required
def save_event(event_id):
    """Save/bookmark an event."""
    Event.query.get_or_404(event_id)
    
    existing = SavedEvent.query.filter_by(
        user_id=current_user.id, event_id=event_id
    ).first()
    
    if existing:
        return jsonify({'message': 'Already saved'}), 400
    
    saved = SavedEvent(user_id=current_user.id, event_id=event_id)
    db.session.add(saved)
    db.session.commit()
    
    return jsonify({'message': 'Event saved'})


@api_bp.route('/events/<int:event_id>/unsave', methods=['POST'])
@login_required
def unsave_event(event_id):
    """Remove saved event."""
    saved = SavedEvent.query.filter_by(
        user_id=current_user.id, event_id=event_id
    ).first()
    
    if saved:
        db.session.delete(saved)
        db.session.commit()
    
    return jsonify({'message': 'Event unsaved'})


@api_bp.route('/events/saved', methods=['GET'])
@login_required
def get_saved_events():
    """Get user's saved events."""
    saved = SavedEvent.query.filter_by(user_id=current_user.id).order_by(
        SavedEvent.saved_at.desc()
    ).all()
    
    return jsonify([event_to_dict(s.event) for s in saved if s.event])


@api_bp.route('/events/my-events', methods=['GET'])
@login_required
@staff_required
def get_my_events():
    """Get events created by current user."""
    page = request.args.get('page', 1, type=int)
    
    pagination = Event.query.filter_by(created_by=current_user.id).order_by(
        Event.created_at.desc()
    ).paginate(page=page, per_page=10, error_out=False)
    
    return jsonify({
        'items': [event_to_dict(e) for e in pagination.items],
        'total': pagination.total,
        'page': pagination.page,
        'pages': pagination.pages,
        'per_page': 10,
    })


@api_bp.route('/events/calendar', methods=['GET'])
def get_calendar_events():
    """Get events for calendar view."""
    start = request.args.get('start')
    end = request.args.get('end')
    
    events_query = Event.query.filter(Event.status == 'published')
    
    if start:
        events_query = events_query.filter(Event.start_date >= start)
    if end:
        events_query = events_query.filter(Event.end_date <= end)
    
    events = events_query.all()
    
    return jsonify([{
        'id': e.id,
        'title': e.title,
        'start': e.start_date.isoformat(),
        'end': e.end_date.isoformat(),
        'color': e.category.color if e.category else '#800020'
    } for e in events])


# ============ CATEGORIES ENDPOINTS ============

@api_bp.route('/categories', methods=['GET'])
def get_categories():
    """Get all categories."""
    categories = Category.query.all()
    return jsonify([category_to_dict(c) for c in categories])


# ============ DEPARTMENTS ENDPOINTS ============

@api_bp.route('/departments', methods=['GET'])
def get_departments():
    """Get all departments."""
    departments = Department.query.order_by(Department.name).all()
    return jsonify([{
        'id': d.id,
        'name': d.name,
        'faculty': d.faculty,
        'code': d.code,
    } for d in departments])


# ============ ADMIN ENDPOINTS ============

@api_bp.route('/admin/stats', methods=['GET'])
@login_required
@admin_required
def get_admin_stats():
    """Get admin dashboard statistics."""
    total_users = User.query.count()
    total_events = Event.query.count()
    total_registrations = Registration.query.filter_by(status='registered').count()
    upcoming_events = Event.query.filter(
        Event.status == 'published',
        Event.start_date >= datetime.utcnow()
    ).count()
    
    users_by_role = db.session.query(
        User.role, db.func.count(User.id)
    ).group_by(User.role).all()
    
    events_by_status = db.session.query(
        Event.status, db.func.count(Event.id)
    ).group_by(Event.status).all()
    
    return jsonify({
        'total_users': total_users,
        'total_events': total_events,
        'total_registrations': total_registrations,
        'upcoming_events': upcoming_events,
        'users_by_role': [{'role': r, 'count': c} for r, c in users_by_role],
        'events_by_status': [{'status': s, 'count': c} for s, c in events_by_status],
    })


@api_bp.route('/admin/users', methods=['GET'])
@login_required
@admin_required
def get_all_users():
    """Get all users for admin management."""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    role_filter = request.args.get('role', '')
    search = request.args.get('q', '')
    
    users_query = User.query
    
    if role_filter:
        users_query = users_query.filter(User.role == role_filter)
    
    if search:
        search_term = f"%{search}%"
        users_query = users_query.filter(
            db.or_(
                User.email.ilike(search_term),
                User.full_name.ilike(search_term),
                User.matric_number.ilike(search_term)
            )
        )
    
    pagination = users_query.order_by(User.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    users_data = []
    for u in pagination.items:
        users_data.append({
            'id': u.id,
            'email': u.email,
            'full_name': u.full_name,
            'role': u.role,
            'matric_number': u.matric_number,
            'staff_id': u.staff_id,
            'phone': u.phone,
            'is_active': u.is_active,
            'created_at': u.created_at.isoformat() if u.created_at else None,
            'last_login': u.last_login.isoformat() if u.last_login else None,
        })
    
    return jsonify({
        'items': users_data,
        'total': pagination.total,
        'page': pagination.page,
        'pages': pagination.pages,
        'per_page': per_page,
    })


@api_bp.route('/admin/users/<int:user_id>', methods=['DELETE'])
@login_required
@admin_required
def delete_user(user_id):
    """Delete a user (admin only)."""
    user = User.query.get_or_404(user_id)
    
    # Prevent admin from deleting themselves
    if user.id == current_user.id:
        return jsonify({'message': 'Cannot delete yourself'}), 400
    
    # Delete related records
    Registration.query.filter_by(user_id=user_id).delete()
    SavedEvent.query.filter_by(user_id=user_id).delete()
    
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({'message': f'User {user.full_name} deleted successfully'})


@api_bp.route('/admin/users/<int:user_id>/role', methods=['PUT'])
@login_required
@admin_required
def update_user_role(user_id):
    """Update user role (promote/demote)."""
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    new_role = data.get('role')
    
    if new_role not in ['student', 'staff', 'admin']:
        return jsonify({'message': 'Invalid role'}), 400
    
    # Prevent admin from demoting themselves
    if user.id == current_user.id and new_role != 'admin':
        return jsonify({'message': 'Cannot change your own role'}), 400
    
    old_role = user.role
    user.role = new_role
    db.session.commit()
    
    return jsonify({
        'message': f'User {user.full_name} role changed from {old_role} to {new_role}',
        'user': user_to_dict(user)
    })


@api_bp.route('/admin/users/<int:user_id>/toggle-active', methods=['POST'])
@login_required
@admin_required
def toggle_user_active(user_id):
    """Toggle user active status."""
    user = User.query.get_or_404(user_id)
    
    # Prevent admin from deactivating themselves
    if user.id == current_user.id:
        return jsonify({'message': 'Cannot deactivate yourself'}), 400
    
    user.is_active = not user.is_active
    db.session.commit()
    
    status = 'activated' if user.is_active else 'deactivated'
    return jsonify({
        'message': f'User {user.full_name} {status}',
        'user': user_to_dict(user)
    })
