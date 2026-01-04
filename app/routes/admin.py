"""
Admin routes - Dashboard, User Management, Statistics
"""
from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import current_user, login_required
from flask_babel import _
from functools import wraps
from datetime import datetime, timedelta
from sqlalchemy import func

from app import db
from app.models import User, Event, Category, Registration, Department

admin_bp = Blueprint('admin', __name__)


def admin_required(f):
    """Decorator to require admin role."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_admin():
            flash(_('You do not have permission to access this page.'), 'danger')
            return redirect(url_for('main.index'))
        return f(*args, **kwargs)
    return decorated_function


@admin_bp.route('/')
@login_required
@admin_required
def dashboard():
    """Admin dashboard with statistics."""
    # Statistics
    total_users = User.query.count()
    total_events = Event.query.count()
    published_events = Event.query.filter_by(status='published').count()
    total_registrations = Registration.query.filter_by(status='registered').count()
    
    # Upcoming events count
    upcoming_events = Event.query.filter(
        Event.status == 'published',
        Event.start_date >= datetime.utcnow()
    ).count()
    
    # Recent registrations
    recent_registrations = Registration.query\
        .filter_by(status='registered')\
        .order_by(Registration.registered_at.desc())\
        .limit(10).all()
    
    # Events by category
    events_by_category = db.session.query(
        Category.name,
        func.count(Event.id)
    ).outerjoin(Event).group_by(Category.id).all()
    
    # Users by role
    users_by_role = db.session.query(
        User.role,
        func.count(User.id)
    ).group_by(User.role).all()
    
    return render_template('admin/dashboard.html',
                          title=_('Admin Dashboard'),
                          total_users=total_users,
                          total_events=total_events,
                          published_events=published_events,
                          total_registrations=total_registrations,
                          upcoming_events=upcoming_events,
                          recent_registrations=recent_registrations,
                          events_by_category=events_by_category,
                          users_by_role=users_by_role)


@admin_bp.route('/users')
@login_required
@admin_required
def users_list():
    """List all users."""
    page = request.args.get('page', 1, type=int)
    role_filter = request.args.get('role')
    search = request.args.get('q', '')
    
    query = User.query
    
    if role_filter:
        query = query.filter(User.role == role_filter)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            db.or_(
                User.full_name.ilike(search_term),
                User.email.ilike(search_term),
                User.matric_number.ilike(search_term)
            )
        )
    
    users = query.order_by(User.created_at.desc()).paginate(
        page=page, per_page=20, error_out=False
    )
    
    return render_template('admin/users.html',
                          title=_('User Management'),
                          users=users,
                          current_role=role_filter,
                          search_query=search)


@admin_bp.route('/users/<int:user_id>/toggle-status', methods=['POST'])
@login_required
@admin_required
def toggle_user_status(user_id):
    """Activate or deactivate a user."""
    user = User.query.get_or_404(user_id)
    
    if user.id == current_user.id:
        flash(_('You cannot deactivate your own account.'), 'warning')
        return redirect(url_for('admin.users_list'))
    
    user.is_active = not user.is_active
    db.session.commit()
    
    status = _('activated') if user.is_active else _('deactivated')
    flash(_('User %(name)s has been %(status)s.', name=user.full_name, status=status), 'success')
    
    return redirect(url_for('admin.users_list'))


@admin_bp.route('/users/<int:user_id>/change-role', methods=['POST'])
@login_required
@admin_required
def change_user_role(user_id):
    """Change user role."""
    user = User.query.get_or_404(user_id)
    new_role = request.form.get('role')
    
    if new_role not in ['student', 'staff', 'admin']:
        flash(_('Invalid role specified.'), 'danger')
        return redirect(url_for('admin.users_list'))
    
    if user.id == current_user.id and new_role != 'admin':
        flash(_('You cannot remove your own admin privileges.'), 'warning')
        return redirect(url_for('admin.users_list'))
    
    user.role = new_role
    db.session.commit()
    
    flash(_('Role for %(name)s changed to %(role)s.', name=user.full_name, role=new_role), 'success')
    
    return redirect(url_for('admin.users_list'))


@admin_bp.route('/events')
@login_required
@admin_required
def events_list():
    """List all events."""
    page = request.args.get('page', 1, type=int)
    status_filter = request.args.get('status')
    
    query = Event.query
    
    if status_filter:
        query = query.filter(Event.status == status_filter)
    
    events = query.order_by(Event.created_at.desc()).paginate(
        page=page, per_page=20, error_out=False
    )
    
    return render_template('admin/events.html',
                          title=_('Manage Events'),
                          events=events,
                          current_status=status_filter)


@admin_bp.route('/events/<int:event_id>/registrations')
@login_required
@admin_required
def event_registrations(event_id):
    """View registrations for an event."""
    event = Event.query.get_or_404(event_id)
    
    registrations = Registration.query.filter_by(event_id=event_id)\
        .order_by(Registration.registered_at.desc()).all()
    
    return render_template('admin/registrations.html',
                          title=_('Event Registrations'),
                          event=event,
                          registrations=registrations)


@admin_bp.route('/categories')
@login_required
@admin_required
def categories_list():
    """Manage event categories."""
    categories = Category.query.all()
    
    return render_template('admin/categories.html',
                          title=_('Manage Categories'),
                          categories=categories)


@admin_bp.route('/categories/create', methods=['POST'])
@login_required
@admin_required
def create_category():
    """Create a new category."""
    name = request.form.get('name')
    name_ha = request.form.get('name_ha')
    name_yo = request.form.get('name_yo')
    name_ig = request.form.get('name_ig')
    color = request.form.get('color', '#007bff')
    icon = request.form.get('icon', 'bi-calendar-event')
    
    if not name:
        flash(_('Category name is required.'), 'danger')
        return redirect(url_for('admin.categories_list'))
    
    category = Category(
        name=name,
        name_ha=name_ha,
        name_yo=name_yo,
        name_ig=name_ig,
        color=color,
        icon=icon
    )
    
    db.session.add(category)
    db.session.commit()
    
    flash(_('Category created successfully!'), 'success')
    return redirect(url_for('admin.categories_list'))


@admin_bp.route('/departments')
@login_required
@admin_required
def departments_list():
    """Manage university departments."""
    departments = Department.query.order_by(Department.faculty, Department.name).all()
    
    return render_template('admin/departments.html',
                          title=_('Manage Departments'),
                          departments=departments)


@admin_bp.route('/departments/create', methods=['POST'])
@login_required
@admin_required
def create_department():
    """Create a new department."""
    name = request.form.get('name')
    faculty = request.form.get('faculty')
    code = request.form.get('code')
    
    if not name or not faculty:
        flash(_('Department name and faculty are required.'), 'danger')
        return redirect(url_for('admin.departments_list'))
    
    department = Department(
        name=name,
        faculty=faculty,
        code=code.upper() if code else None
    )
    
    db.session.add(department)
    db.session.commit()
    
    flash(_('Department created successfully!'), 'success')
    return redirect(url_for('admin.departments_list'))
