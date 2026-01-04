"""
Authentication routes - Login, Register, Logout, Profile
"""
from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_user, logout_user, current_user, login_required
from flask_babel import _
from datetime import datetime
from urllib.parse import urlparse

from app import db
from app.models import User, Department
from app.forms import LoginForm, RegistrationForm, ProfileForm, ChangePasswordForm

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """User login."""
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data.lower()).first()
        
        if user is None or not user.check_password(form.password.data):
            flash(_('Invalid email or password.'), 'danger')
            return redirect(url_for('auth.login'))
        
        if not user.is_active:
            flash(_('Your account has been deactivated. Please contact admin.'), 'warning')
            return redirect(url_for('auth.login'))
        
        login_user(user, remember=form.remember_me.data)
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        flash(_('Welcome back, %(name)s!', name=user.full_name), 'success')
        
        # Redirect to next page or dashboard
        next_page = request.args.get('next')
        if not next_page or urlparse(next_page).netloc != '':
            next_page = url_for('main.index')
        
        return redirect(next_page)
    
    return render_template('auth/login.html', title=_('Sign In'), form=form)


@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    """User registration."""
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    
    form = RegistrationForm()
    
    # Populate department choices
    departments = Department.query.order_by(Department.name).all()
    form.department_id.choices = [(0, _('-- Select Department --'))] + \
                                  [(d.id, f"{d.name} ({d.faculty})") for d in departments]
    
    if form.validate_on_submit():
        user = User(
            email=form.email.data.lower(),
            full_name=form.full_name.data,
            phone=form.phone.data,
            matric_number=form.matric_number.data.upper() if form.matric_number.data else None,
            department_id=form.department_id.data if form.department_id.data != 0 else None,
            preferred_language=form.preferred_language.data,
            role='student'  # Default role
        )
        user.set_password(form.password.data)
        
        db.session.add(user)
        db.session.commit()
        
        flash(_('Registration successful! Please log in.'), 'success')
        return redirect(url_for('auth.login'))
    
    return render_template('auth/register.html', title=_('Register'), form=form)


@auth_bp.route('/logout')
@login_required
def logout():
    """User logout."""
    logout_user()
    flash(_('You have been logged out.'), 'info')
    return redirect(url_for('main.index'))


@auth_bp.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    """User profile page."""
    form = ProfileForm()
    
    if form.validate_on_submit():
        current_user.full_name = form.full_name.data
        current_user.phone = form.phone.data
        current_user.matric_number = form.matric_number.data.upper() if form.matric_number.data else None
        current_user.staff_id = form.staff_id.data.upper() if form.staff_id.data else None
        current_user.preferred_language = form.preferred_language.data
        db.session.commit()
        
        flash(_('Your profile has been updated.'), 'success')
        return redirect(url_for('auth.profile'))
    
    elif request.method == 'GET':
        form.full_name.data = current_user.full_name
        form.phone.data = current_user.phone
        form.matric_number.data = current_user.matric_number
        form.staff_id.data = current_user.staff_id
        form.preferred_language.data = current_user.preferred_language
    
    # Get user's registered events
    from app.models import Registration, Event
    registrations = Registration.query.filter_by(
        user_id=current_user.id,
        status='registered'
    ).join(Event).filter(
        Event.start_date >= datetime.utcnow()
    ).order_by(Event.start_date.asc()).all()
    
    return render_template('auth/profile.html',
                          title=_('My Profile'),
                          form=form,
                          registrations=registrations)


@auth_bp.route('/change-password', methods=['GET', 'POST'])
@login_required
def change_password():
    """Change user password."""
    form = ChangePasswordForm()
    
    if form.validate_on_submit():
        if not current_user.check_password(form.current_password.data):
            flash(_('Current password is incorrect.'), 'danger')
            return redirect(url_for('auth.change_password'))
        
        current_user.set_password(form.new_password.data)
        db.session.commit()
        
        flash(_('Your password has been changed.'), 'success')
        return redirect(url_for('auth.profile'))
    
    return render_template('auth/change_password.html',
                          title=_('Change Password'),
                          form=form)
