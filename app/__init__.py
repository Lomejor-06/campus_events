"""
Campus Event Management System
Flask Application Factory
"""
from flask import Flask, request, g
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_babel import Babel, lazy_gettext as _l
from flask_wtf.csrf import CSRFProtect

from app.config import Config

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()
babel = Babel()
csrf = CSRFProtect()

# Login configuration
login_manager.login_view = 'auth.login'
login_manager.login_message = _l('Please log in to access this page.')
login_manager.login_message_category = 'info'


def get_locale():
    """Get the best matching language for the user."""
    # Check if user is logged in and has a preference
    from flask_login import current_user
    if current_user.is_authenticated and current_user.preferred_language:
        return current_user.preferred_language
    
    # Check session for language preference
    lang = request.args.get('lang')
    if lang and lang in Config.LANGUAGES:
        return lang
    
    # Check cookie
    lang = request.cookies.get('language')
    if lang and lang in Config.LANGUAGES:
        return lang
    
    # Fall back to browser preference
    return request.accept_languages.best_match(Config.LANGUAGES.keys())


def create_app(config_class=Config):
    """Application factory function."""
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    babel.init_app(app, locale_selector=get_locale)
    csrf.init_app(app)
    
    # Register blueprints
    from app.routes.main import main_bp
    from app.routes.auth import auth_bp
    from app.routes.events import events_bp
    from app.routes.admin import admin_bp
    
    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(events_bp, url_prefix='/events')
    app.register_blueprint(admin_bp, url_prefix='/admin')
    
    # Context processors
    @app.context_processor
    def inject_languages():
        """Make languages available in all templates."""
        return {
            'languages': Config.LANGUAGES,
            'current_language': get_locale()
        }
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    # Error handlers
    @app.errorhandler(404)
    def not_found_error(error):
        from flask import render_template
        return render_template('errors/404.html', title='Page Not Found'), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        from flask import render_template
        db.session.rollback()
        return render_template('errors/500.html', title='Server Error'), 500
    
    return app
