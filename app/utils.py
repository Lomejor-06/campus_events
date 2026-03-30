from datetime import datetime
from app import db
from app.models import Event, SavedEvent, Notification

def delete_past_events():
    """
    Delete events that have passed (end_date < now).
    Also cleans up related SavedEvents and Notifications.
    Registrations are handled by SQLAlchemy cascade.
    """
    try:
        now = datetime.utcnow()
        # Find expired events
        expired_events = Event.query.filter(Event.end_date < now).all()
        
        if not expired_events:
            return
            
        for event in expired_events:
            # Delete related SavedEvents (no cascade defined)
            SavedEvent.query.filter_by(event_id=event.id).delete()
            
            # Delete related Notifications
            Notification.query.filter_by(event_id=event.id).delete()
            
            # Delete event (Registrations cascade)
            db.session.delete(event)
        
        db.session.commit()
    except Exception as e:
        print(f"Error cleaning up past events: {e}")
        db.session.rollback()
