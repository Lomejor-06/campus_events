"""
Run script for Campus Event Management System
"""
from app import create_app, db
from app.models import User, Department, Category, Event, Registration

app = create_app()


@app.shell_context_processor
def make_shell_context():
    """Make database models available in flask shell."""
    return {
        'db': db,
        'User': User,
        'Department': Department,
        'Category': Category,
        'Event': Event,
        'Registration': Registration
    }


@app.cli.command('init-db')
def init_db():
    """Initialize the database with tables."""
    db.create_all()
    print('Database tables created successfully!')


@app.cli.command('seed-db')
def seed_db():
    """Seed the database with sample data."""
    from datetime import datetime, timedelta
    
    # Clear existing data
    print('Clearing existing data...')
    Registration.query.delete()
    Event.query.delete()
    User.query.delete()
    Category.query.delete()
    Department.query.delete()
    db.session.commit()
    
    # Create Departments (Nigerian University Style)
    print('Creating departments...')
    departments = [
        Department(name='Computer Science', faculty='Faculty of Science', code='CSC'),
        Department(name='Electrical Engineering', faculty='Faculty of Engineering', code='EEE'),
        Department(name='Business Administration', faculty='Faculty of Management Sciences', code='BUS'),
        Department(name='Medicine', faculty='Faculty of Health Sciences', code='MED'),
        Department(name='Mass Communication', faculty='Faculty of Arts', code='MAC'),
        Department(name='Law', faculty='Faculty of Law', code='LAW'),
        Department(name='Agricultural Science', faculty='Faculty of Agriculture', code='AGR'),
        Department(name='Economics', faculty='Faculty of Social Sciences', code='ECO'),
    ]
    for dept in departments:
        db.session.add(dept)
    db.session.commit()
    
    # Create Categories with Nigerian languages
    print('Creating categories...')
    categories = [
        Category(name='Academic', name_ha='Ilimi', name_yo='Ẹ̀kọ́', name_ig='Mmụta', 
                 color='#1a73e8', icon='bi-book'),
        Category(name='Social', name_ha='Zamantakewa', name_yo='Àwùjọ', name_ig='Mmekọrịta',
                 color='#ea4335', icon='bi-people'),
        Category(name='Sports', name_ha='Wasanni', name_yo='Eré-ìdárayá', name_ig='Egwuregwu',
                 color='#34a853', icon='bi-trophy'),
        Category(name='Cultural', name_ha="Al'ada", name_yo='Àṣà', name_ig='Omenala',
                 color='#fbbc04', icon='bi-music-note-beamed'),
        Category(name='Religious', name_ha='Addini', name_yo='Ẹ̀sìn', name_ig='Okpukpe',
                 color='#9c27b0', icon='bi-hearts'),
        Category(name='Career', name_ha="Sana'a", name_yo='Iṣẹ́', name_ig='Ọrụ',
                 color='#00bcd4', icon='bi-briefcase'),
    ]
    for cat in categories:
        db.session.add(cat)
    db.session.commit()
    
    # Create Admin User
    print('Creating admin user...')
    admin = User(
        email='admin@lasustech.edu.ng',
        full_name='System Administrator',
        role='admin',
        preferred_language='en'
    )
    admin.set_password('admin123')
    db.session.add(admin)
    
    # Create Staff User
    staff = User(
        email='staff@lasustech.edu.ng',
        full_name='Dr. Emeka Okonkwo',
        role='staff',
        staff_id='STAFF001',
        department_id=1,
        preferred_language='ig'
    )
    staff.set_password('staff123')
    db.session.add(staff)
    
    # Create Student User
    student = User(
        email='student@lasustech.edu.ng',
        full_name='Amina Yusuf',
        role='student',
        matric_number='2021/12345',
        department_id=1,
        preferred_language='ha'
    )
    student.set_password('student123')
    db.session.add(student)
    db.session.commit()
    
    # Create Sample Events
    print('Creating sample events...')
    now = datetime.utcnow()
    
    events = [
        Event(
            title='Annual Tech Conference 2026',
            description='Join us for the biggest tech event on campus! Learn about AI, Machine Learning, and the future of technology from industry experts.',
            start_date=now + timedelta(days=7),
            end_date=now + timedelta(days=7, hours=6),
            venue='Main Auditorium, Block A',
            max_attendees=200,
            status='published',
            category_id=1,
            created_by=2
        ),
        Event(
            title='Inter-Faculty Football Tournament',
            description='Cheer for your faculty in the annual football competition. May the best team win!',
            start_date=now + timedelta(days=14),
            end_date=now + timedelta(days=14, hours=4),
            venue='University Sports Complex',
            max_attendees=500,
            status='published',
            category_id=3,
            created_by=2
        ),
        Event(
            title='Cultural Day Celebration',
            description='Celebrate Nigeria\'s rich cultural heritage with traditional dances, food, and fashion from all ethnic groups.',
            start_date=now + timedelta(days=21),
            end_date=now + timedelta(days=21, hours=8),
            venue='University Amphitheatre',
            max_attendees=0,  # Unlimited
            status='published',
            category_id=4,
            created_by=2
        ),
        Event(
            title='Career Fair 2026',
            description='Meet top employers and explore internship and job opportunities. Bring your CV!',
            start_date=now + timedelta(days=30),
            end_date=now + timedelta(days=30, hours=5),
            venue='University Hall',
            max_attendees=300,
            status='published',
            category_id=6,
            created_by=1
        ),
        Event(
            title='Welcome Party for Freshers',
            description='A fun-filled orientation party for all new students. Meet your coursemates!',
            start_date=now + timedelta(days=3),
            end_date=now + timedelta(days=3, hours=4),
            venue='Student Union Building',
            max_attendees=150,
            status='published',
            category_id=2,
            created_by=2
        ),
        Event(
            title='Interfaith Prayer Service',
            description='A peaceful gathering for students of all faiths to pray for academic success.',
            start_date=now + timedelta(days=5),
            end_date=now + timedelta(days=5, hours=2),
            venue='University Chapel',
            max_attendees=100,
            status='published',
            category_id=5,
            created_by=1
        ),
    ]
    
    for event in events:
        db.session.add(event)
    db.session.commit()
    
    print('\n✅ Database seeded successfully!')
    print('\n📋 Test Accounts:')
    print('━' * 40)
    print('Admin:   admin@lasustech.edu.ng / admin123')
    print('Staff:   staff@lasustech.edu.ng / staff123')
    print('Student: student@lasustech.edu.ng / student123')
    print('━' * 40)


if __name__ == '__main__':
    app.run(debug=True)
