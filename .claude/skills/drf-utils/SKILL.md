---
name: drf-utils
description: |
  Django REST Framework utilities and common patterns. Use this skill when implementing:
  - Management commands (data cleanup, imports, batch processing)
  - Django signals (model events, cache invalidation, notifications)
  - File uploads (validation, S3/cloud storage, image processing)
  - Email sending (HTML templates, queuing, attachments)
  - Background tasks with Celery (async processing, periodic tasks, retries)
  - Logging patterns (structured logging, audit trails, request tracking)
  - Custom mixins/abstract models (timestamps, soft delete, UUID, publishable)
  - Custom middleware (timing, logging, user agent detection)
  - Model managers/querysets (custom filters, reusable query methods)
  - Decorators (permissions, caching, rate limiting, retry logic)
  - Data export/import (CSV, Excel, PDF, bulk operations, streaming)
  - Common patterns (health checks, audit logging, webhooks, API versioning)
license: MIT
---

# Django REST Framework - Utilities & Common Patterns

This skill provides production-ready code patterns for common Django/DRF features. All code examples are copy-paste ready and follow Django/DRF best practices.

## When to Use This Skill

Invoke this skill when you need to implement any of these features in a Django REST Framework project:

- **Infrastructure**: Management commands, signals, middleware, logging
- **File Handling**: Uploads, validation, cloud storage, image processing
- **Communication**: Emails, background tasks, webhooks, notifications
- **Data Operations**: Import/export (CSV, Excel, PDF), bulk operations, streaming
- **Code Patterns**: Mixins, abstract models, custom managers, decorators
- **System Features**: Health checks, audit logging, soft delete, API versioning

## How to Use This Skill

1. **Identify your need** from the quick reference below
2. **Jump to the relevant section** for implementation details
3. **Copy and adapt** the code to your project
4. **Follow the inline comments** for customization options

## Quick Reference

| Feature | Section | Use Cases |
|---------|---------|-----------|
| Management Commands | §1 | Data cleanup, imports, batch jobs, scheduled tasks |
| Django Signals | §2 | Auto-create related objects, cache invalidation, audit logs |
| File Uploads | §3 | Handle file/image uploads, S3 storage, validation, thumbnails |
| Email Sending | §4 | HTML emails, attachments, async with Celery |
| Background Tasks | §5 | Async processing, periodic tasks, retry logic |
| Logging | §6 | Structured logs, request tracking, JSON formatting |
| Mixins & Abstract Models | §7 | Timestamps, soft delete, UUID, publishable content |
| Custom Middleware | §8 | Request/response processing, timing, logging |
| Model Managers | §9 | Custom filters, reusable querysets, soft delete |
| Decorators | §10 | Permissions, caching, rate limiting, retry |
| Export/Import | §11 | CSV, Excel, PDF, bulk imports, streaming |
| Common Patterns | §12 | Health checks, audit logs, webhooks, versioning |

---

## §1. Custom Management Commands

**Quick Start**: Create `management/commands/my_command.py` with a `Command` class.

### Basic Structure

```python
# management/commands/my_command.py
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

class Command(BaseCommand):
    help = 'Description of what this command does'

    def add_arguments(self, parser):
        # Positional arguments
        parser.add_argument('user_ids', nargs='+', type=int)

        # Named (optional) arguments
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Run without making changes',
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=100,
            help='Number of records to process at once',
        )

    def handle(self, *args, **options):
        user_ids = options['user_ids']
        dry_run = options['dry_run']
        batch_size = options['batch_size']

        if dry_run:
            self.stdout.write(
                self.style.WARNING('Running in dry-run mode')
            )

        try:
            with transaction.atomic():
                # Your logic here
                count = self.process_users(user_ids, batch_size)

                if dry_run:
                    raise CommandError("Dry run - rolling back")

                self.stdout.write(
                    self.style.SUCCESS(f'Successfully processed {count} users')
                )

        except Exception as e:
            raise CommandError(f'Error: {e}')

    def process_users(self, user_ids, batch_size):
        # Implementation
        return len(user_ids)
```

### Common Use Cases

```python
# Cleanup old data
class Command(BaseCommand):
    help = 'Clean up old records'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=90,
            help='Delete records older than N days',
        )

    def handle(self, *args, **options):
        cutoff = timezone.now() - timedelta(days=options['days'])
        deleted, _ = OldModel.objects.filter(created_at__lt=cutoff).delete()
        self.stdout.write(f'Deleted {deleted} records')

# Data import
class Command(BaseCommand):
    help = 'Import data from CSV'

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str)

    def handle(self, *args, **options):
        import csv
        with open(options['csv_file'], 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                Model.objects.create(**row)

# Send notifications
class Command(BaseCommand):
    help = 'Send weekly digest emails'

    def handle(self, *args, **options):
        users = User.objects.filter(email_preferences__weekly_digest=True)
        for user in users:
            send_weekly_digest.delay(user.id)
        self.stdout.write(f'Queued {users.count()} emails')
```

### Testing Commands

```python
# tests/test_commands.py
from io import StringIO
from django.core.management import call_command
from django.test import TestCase

class CommandTests(TestCase):
    def test_my_command(self):
        out = StringIO()
        call_command('my_command', '1', '2', '3', stdout=out)
        self.assertIn('Successfully processed', out.getvalue())

    def test_dry_run(self):
        out = StringIO()
        with self.assertRaises(CommandError):
            call_command('my_command', '1', '--dry-run', stdout=out)
```

---

## §2. Django Signals

**Quick Start**: Use `@receiver` decorator to connect signal handlers. Common signals: `post_save`, `pre_save`, `post_delete`, `m2m_changed`.

**⚠️ Warning**: Avoid using signals for business logic that belongs in model methods. Signals are for cross-app communication, not core business rules.

### Common Signal Patterns

```python
from django.db.models.signals import (
    pre_save, post_save,
    pre_delete, post_delete,
    m2m_changed
)
from django.dispatch import receiver

# Post-save signal
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Create profile when user is created"""
    if created:
        Profile.objects.create(user=instance)

# Pre-save signal
@receiver(pre_save, sender=Post)
def generate_slug(sender, instance, **kwargs):
    """Generate slug before saving"""
    if not instance.slug:
        instance.slug = slugify(instance.title)

# Post-delete signal
@receiver(post_delete, sender=Document)
def delete_file(sender, instance, **kwargs):
    """Delete file when document is deleted"""
    if instance.file:
        instance.file.delete(save=False)

# M2M changed signal
@receiver(m2m_changed, sender=Group.users.through)
def group_users_changed(sender, instance, action, **kwargs):
    """Handle group membership changes"""
    if action == 'post_add':
        # Send notification
        notify_group_joined(instance)
```

### Receivers y Decorators

```python
# signals.py
from django.dispatch import Signal, receiver

# Custom signal
user_logged_in_from_new_device = Signal()

# Multiple senders
@receiver(post_save, sender=User)
@receiver(post_save, sender=AdminUser)
def user_saved(sender, instance, **kwargs):
    # Handle both User and AdminUser
    pass

# Connect manually (without decorator)
def my_handler(sender, **kwargs):
    pass

post_save.connect(my_handler, sender=MyModel)

# Disconnect signal
post_save.disconnect(my_handler, sender=MyModel)
```

### Cuándo Usar Signals vs Methods

```python
# ✅ Use signals for:
# - Cross-app communication
# - Audit logging
# - Cache invalidation
# - Third-party integrations

@receiver(post_save, sender=Product)
def invalidate_cache(sender, instance, **kwargs):
    cache.delete(f'product_{instance.id}')

# ❌ Don't use signals for:
# - Business logic that should be in model methods
# - Simple relationships (use model methods instead)

# BAD - Use model method instead
@receiver(post_save, sender=Order)
def calculate_total(sender, instance, **kwargs):
    instance.total = sum(item.price for item in instance.items.all())
    instance.save()  # Can cause infinite loop!

# GOOD - Model method
class Order(models.Model):
    def save(self, *args, **kwargs):
        self.total = self.calculate_total()
        super().save(*args, **kwargs)

    def calculate_total(self):
        return sum(item.price for item in self.items.all())
```

### Common Patterns

```python
# Audit logging
@receiver(post_save)
def log_model_save(sender, instance, created, **kwargs):
    """Log all model saves"""
    if sender._meta.app_label == 'myapp':
        AuditLog.objects.create(
            action='created' if created else 'updated',
            model_name=sender.__name__,
            object_id=instance.pk,
        )

# Cache invalidation
@receiver(post_save, sender=Article)
@receiver(post_delete, sender=Article)
def invalidate_article_cache(sender, instance, **kwargs):
    cache_keys = [
        f'article_{instance.id}',
        'article_list',
        f'category_{instance.category_id}_articles',
    ]
    cache.delete_many(cache_keys)

# Send notification
@receiver(post_save, sender=Comment)
def notify_comment_author(sender, instance, created, **kwargs):
    if created:
        notify_user.delay(
            user_id=instance.post.author.id,
            message=f'New comment on your post'
        )
```

---

## §3. File Upload Handling

**Quick Start**: Use `models.FileField` for any file, `models.ImageField` for images (auto-validates). Add validators for size/type restrictions.

### Model Configuration

```python
# models.py
from django.db import models
from django.core.validators import FileExtensionValidator

class Document(models.Model):
    # Basic file field
    file = models.FileField(upload_to='documents/%Y/%m/')

    # With validation
    pdf = models.FileField(
        upload_to='pdfs/',
        validators=[FileExtensionValidator(allowed_extensions=['pdf'])]
    )

class Profile(models.Model):
    # Image field (validates it's an image)
    avatar = models.ImageField(
        upload_to='avatars/',
        blank=True,
        null=True
    )

    # With custom upload_to function
    def avatar_upload_path(instance, filename):
        return f'users/{instance.user.id}/avatar.jpg'

    avatar = models.ImageField(upload_to=avatar_upload_path)
```

### Validation & Storage Backends

```python
# validators.py
from django.core.exceptions import ValidationError

def validate_file_size(value):
    """Max 5MB"""
    limit = 5 * 1024 * 1024
    if value.size > limit:
        raise ValidationError(f'File too large. Max size is {limit} bytes')

def validate_image_dimensions(value):
    """Max 2000x2000"""
    from PIL import Image
    img = Image.open(value)
    if img.width > 2000 or img.height > 2000:
        raise ValidationError('Image dimensions too large')

# models.py
class Upload(models.Model):
    file = models.FileField(
        upload_to='uploads/',
        validators=[validate_file_size]
    )
    image = models.ImageField(
        upload_to='images/',
        validators=[validate_file_size, validate_image_dimensions]
    )
```

### S3/Cloud Storage Integration

```python
# Install: pip install django-storages boto3

# settings.py
INSTALLED_APPS += ['storages']

# S3 Configuration
AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
AWS_STORAGE_BUCKET_NAME = 'my-bucket'
AWS_S3_REGION_NAME = 'us-east-1'
AWS_DEFAULT_ACL = None
AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'

# Static files
STATICFILES_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'

# Media files
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'

# Custom storage classes
# storages.py
from storages.backends.s3boto3 import S3Boto3Storage

class PublicMediaStorage(S3Boto3Storage):
    location = 'media/public'
    default_acl = 'public-read'
    file_overwrite = False

class PrivateMediaStorage(S3Boto3Storage):
    location = 'media/private'
    default_acl = 'private'
    file_overwrite = False
    custom_domain = False

# models.py
from .storages import PublicMediaStorage, PrivateMediaStorage

class Document(models.Model):
    public_file = models.FileField(storage=PublicMediaStorage())
    private_file = models.FileField(storage=PrivateMediaStorage())
```

### Image Processing with Pillow

```python
# Install: pip install Pillow

# utils.py
from PIL import Image
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile
import sys

def resize_image(image_field, max_width=800, max_height=800):
    """Resize image maintaining aspect ratio"""
    img = Image.open(image_field)

    # Convert to RGB if needed
    if img.mode not in ('RGB', 'RGBA'):
        img = img.convert('RGB')

    # Resize
    img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)

    # Save to BytesIO
    output = BytesIO()
    img.save(output, format='JPEG', quality=85, optimize=True)
    output.seek(0)

    # Return InMemoryUploadedFile
    return InMemoryUploadedFile(
        output,
        'ImageField',
        f"{image_field.name.split('.')[0]}.jpg",
        'image/jpeg',
        sys.getsizeof(output),
        None
    )

def create_thumbnail(image_field, size=(150, 150)):
    """Create square thumbnail"""
    img = Image.open(image_field)

    # Crop to square
    width, height = img.size
    min_dim = min(width, height)
    left = (width - min_dim) / 2
    top = (height - min_dim) / 2
    right = (width + min_dim) / 2
    bottom = (height + min_dim) / 2
    img = img.crop((left, top, right, bottom))

    # Resize
    img = img.resize(size, Image.Resampling.LANCZOS)

    # Save
    output = BytesIO()
    img.save(output, format='JPEG', quality=90)
    output.seek(0)

    return InMemoryUploadedFile(
        output, 'ImageField', 'thumb.jpg',
        'image/jpeg', sys.getsizeof(output), None
    )

# models.py
class Photo(models.Model):
    original = models.ImageField(upload_to='photos/original/')
    thumbnail = models.ImageField(upload_to='photos/thumb/', blank=True)

    def save(self, *args, **kwargs):
        if self.original and not self.thumbnail:
            self.thumbnail = create_thumbnail(self.original)
        super().save(*args, **kwargs)
```

---

## §4. Email Sending

**Quick Start**: Configure `EMAIL_BACKEND` in settings. Use `EmailMultiAlternatives` for HTML emails. Queue with Celery for async delivery.

### Configuration (settings.py)

```python
# settings.py

# Console backend (development)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# SMTP (production)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = 'noreply@example.com'

# File backend (testing)
EMAIL_BACKEND = 'django.core.mail.backends.filebased.EmailBackend'
EMAIL_FILE_PATH = '/tmp/app-emails'
```

### HTML Emails with Templates

```python
# emails.py
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

def send_welcome_email(user):
    """Send welcome email with HTML template"""
    subject = 'Welcome to Our Platform'
    from_email = 'noreply@example.com'
    to = user.email

    # Render HTML template
    html_content = render_to_string('emails/welcome.html', {
        'user': user,
        'activation_url': user.get_activation_url(),
    })

    # Create plain text version
    text_content = strip_tags(html_content)

    # Create message
    msg = EmailMultiAlternatives(
        subject, text_content, from_email, [to]
    )
    msg.attach_alternative(html_content, "text/html")
    msg.send()

# templates/emails/welcome.html
"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; }
        .button {
            background-color: #4CAF50;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <h1>Welcome, {{ user.first_name }}!</h1>
    <p>Thanks for joining our platform.</p>
    <a href="{{ activation_url }}" class="button">Activate Account</a>
</body>
</html>
"""

# Send email with attachment
def send_invoice_email(order):
    from django.core.mail import EmailMessage

    email = EmailMessage(
        'Your Invoice',
        'Please find attached your invoice.',
        'billing@example.com',
        [order.user.email],
    )
    email.attach_file(order.invoice_pdf.path)
    email.send()
```

### Celery for Queuing

```python
# tasks.py
from celery import shared_task
from django.core.mail import send_mail

@shared_task
def send_email_task(subject, message, recipient_list):
    """Send email asynchronously"""
    send_mail(
        subject,
        message,
        'noreply@example.com',
        recipient_list,
        fail_silently=False,
    )

@shared_task
def send_bulk_emails(user_ids, subject, template_name):
    """Send bulk emails"""
    from django.contrib.auth import get_user_model
    User = get_user_model()

    users = User.objects.filter(id__in=user_ids)
    for user in users:
        send_templated_email.delay(user.id, subject, template_name)

@shared_task(bind=True, max_retries=3)
def send_templated_email(self, user_id, subject, template_name):
    """Send templated email with retry"""
    try:
        user = User.objects.get(id=user_id)
        html_content = render_to_string(template_name, {'user': user})
        # Send email...
    except Exception as exc:
        # Retry in 5 minutes
        raise self.retry(exc=exc, countdown=300)

# Usage
send_email_task.delay(
    'Hello',
    'Message body',
    ['user@example.com']
)
```

### Testing Emails

```python
# tests/test_emails.py
from django.test import TestCase
from django.core import mail

class EmailTests(TestCase):
    def test_welcome_email(self):
        user = User.objects.create(email='test@example.com')
        send_welcome_email(user)

        # Check email was sent
        self.assertEqual(len(mail.outbox), 1)

        # Check email content
        email = mail.outbox[0]
        self.assertEqual(email.subject, 'Welcome to Our Platform')
        self.assertIn(user.email, email.to)
        self.assertIn('Welcome', email.body)

    def test_email_has_html(self):
        send_welcome_email(user)
        email = mail.outbox[0]

        # Check has HTML alternative
        self.assertEqual(len(email.alternatives), 1)
        html_content, mime_type = email.alternatives[0]
        self.assertEqual(mime_type, 'text/html')
        self.assertIn('<html>', html_content)
```

---

## §5. Background Tasks (Celery)

**Quick Start**: Install `celery` and `redis`. Create `celery.py` with app configuration. Decorate functions with `@shared_task`.

**Common Use Cases**: Sending emails, processing uploads, generating reports, data cleanup, external API calls.

### Setup

```python
# Install: pip install celery redis

# celery.py
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')

app = Celery('myproject')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# settings.py
CELERY_BROKER_URL = 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'

# __init__.py (in project root)
from .celery import app as celery_app
__all__ = ('celery_app',)
```

### Task Definition & Routing

```python
# tasks.py
from celery import shared_task
from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)

@shared_task
def add(x, y):
    """Simple task"""
    return x + y

@shared_task(bind=True)
def process_data(self, data_id):
    """Task with self reference"""
    try:
        data = Data.objects.get(id=data_id)
        # Process data...
        return {'status': 'success'}
    except Exception as exc:
        logger.error(f'Error processing {data_id}: {exc}')
        raise

@shared_task(name='generate_report')
def generate_report(report_id):
    """Task with custom name"""
    report = Report.objects.get(id=report_id)
    # Generate report...

# Task routing
# settings.py
CELERY_TASK_ROUTES = {
    'myapp.tasks.process_data': {'queue': 'high_priority'},
    'myapp.tasks.generate_report': {'queue': 'low_priority'},
}

# Start workers for specific queues
# celery -A myproject worker -Q high_priority
# celery -A myproject worker -Q low_priority
```

### Periodic Tasks

```python
# Install: pip install django-celery-beat

# settings.py
INSTALLED_APPS += ['django_celery_beat']

CELERY_BEAT_SCHEDULE = {
    'send-daily-digest': {
        'task': 'myapp.tasks.send_daily_digest',
        'schedule': crontab(hour=8, minute=0),  # 8 AM daily
    },
    'cleanup-old-sessions': {
        'task': 'myapp.tasks.cleanup_sessions',
        'schedule': crontab(hour=0, minute=0),  # Midnight
    },
    'check-health-every-minute': {
        'task': 'myapp.tasks.health_check',
        'schedule': 60.0,  # Every 60 seconds
    },
}

# tasks.py
from celery import shared_task
from celery.schedules import crontab

@shared_task
def send_daily_digest():
    """Send daily digest to all users"""
    users = User.objects.filter(email_preferences__daily_digest=True)
    for user in users:
        generate_digest.delay(user.id)

@shared_task
def cleanup_sessions():
    """Clean up expired sessions"""
    from django.contrib.sessions.models import Session
    Session.objects.filter(expire_date__lt=timezone.now()).delete()

# Run beat scheduler
# celery -A myproject beat -l info
```

### Error Handling & Retries

```python
# tasks.py
from celery import shared_task
from requests.exceptions import RequestException

@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60  # 1 minute
)
def call_external_api(self, url, data):
    """Task with automatic retry"""
    try:
        response = requests.post(url, json=data, timeout=10)
        response.raise_for_status()
        return response.json()
    except RequestException as exc:
        # Exponential backoff: 1min, 2min, 4min
        raise self.retry(
            exc=exc,
            countdown=2 ** self.request.retries * 60
        )

@shared_task(
    autoretry_for=(RequestException,),
    retry_kwargs={'max_retries': 5},
    retry_backoff=True,
    retry_backoff_max=600,  # 10 minutes
    retry_jitter=True
)
def smart_retry_task(url):
    """Task with smart retry configuration"""
    response = requests.get(url)
    response.raise_for_status()
    return response.json()

# Task with callback on failure
@shared_task
def process_order(order_id):
    try:
        order = Order.objects.get(id=order_id)
        # Process order...
    except Exception as exc:
        # Log error and notify admin
        notify_admin.delay(f'Order {order_id} processing failed: {exc}')
        raise

# Task chaining
from celery import chain

# Execute tasks in sequence
workflow = chain(
    task1.s(arg1),
    task2.s(arg2),
    task3.s(arg3)
)
workflow.apply_async()

# Task groups (parallel execution)
from celery import group

job = group(
    process_item.s(item_id)
    for item_id in item_ids
)
result = job.apply_async()
```

---

## §6. Logging Patterns

**Quick Start**: Configure `LOGGING` dict in settings.py. Use Python's `logging.getLogger(__name__)` in each module. Add extra fields for structured logging.

### Basic Configuration

```python
# settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
        'json': {
            '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
            'format': '%(asctime)s %(name)s %(levelname)s %(message)s'
        },
    },
    'filters': {
        'require_debug_true': {
            '()': 'django.utils.log.RequireDebugTrue',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple'
        },
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/app.log',
            'maxBytes': 1024 * 1024 * 10,  # 10MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
        'error_file': {
            'level': 'ERROR',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/error.log',
            'maxBytes': 1024 * 1024 * 10,
            'backupCount': 5,
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': True,
        },
        'myapp': {
            'handlers': ['console', 'file', 'error_file'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}
```

### Log Levels & Structured Logging

```python
# views.py
import logging
logger = logging.getLogger(__name__)

class OrderAPIView(APIView):
    def post(self, request):
        logger.debug(f'Order request received: {request.data}')

        try:
            order = self.create_order(request.data)
            logger.info(f'Order created: {order.id}', extra={
                'order_id': order.id,
                'user_id': request.user.id,
                'amount': float(order.total),
            })
            return Response({'id': order.id})

        except ValidationError as e:
            logger.warning(f'Invalid order data: {e}')
            return Response({'error': str(e)}, status=400)

        except Exception as e:
            logger.error(f'Order creation failed', exc_info=True, extra={
                'user_id': request.user.id,
                'data': request.data,
            })
            return Response({'error': 'Internal error'}, status=500)

# Structured logging with structlog
import structlog

logger = structlog.get_logger()

logger.info(
    'order_created',
    order_id=order.id,
    user_id=user.id,
    amount=order.total
)
```

### Request Tracking

```python
# middleware.py
import logging
import time
import uuid

logger = logging.getLogger(__name__)

class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Generate request ID
        request_id = str(uuid.uuid4())
        request.request_id = request_id

        # Log request
        start_time = time.time()
        logger.info(f'Request started: {request.method} {request.path}', extra={
            'request_id': request_id,
            'method': request.method,
            'path': request.path,
            'user_id': request.user.id if request.user.is_authenticated else None,
            'ip': self.get_client_ip(request),
        })

        # Process request
        response = self.get_response(request)

        # Log response
        duration = time.time() - start_time
        logger.info(f'Request completed: {response.status_code}', extra={
            'request_id': request_id,
            'status_code': response.status_code,
            'duration': duration,
        })

        # Add request ID to response headers
        response['X-Request-ID'] = request_id

        return response

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
```

### Custom Formatters

```python
# formatters.py
import logging
import json

class JSONFormatter(logging.Formatter):
    """Format logs as JSON"""

    def format(self, record):
        log_data = {
            'timestamp': self.formatTime(record, self.datefmt),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
        }

        # Add extra fields
        if hasattr(record, 'request_id'):
            log_data['request_id'] = record.request_id
        if hasattr(record, 'user_id'):
            log_data['user_id'] = record.user_id

        # Add exception info if present
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)

        return json.dumps(log_data)

# settings.py
LOGGING = {
    'formatters': {
        'json': {
            '()': 'myapp.formatters.JSONFormatter',
        },
    },
    'handlers': {
        'json_file': {
            'class': 'logging.FileHandler',
            'filename': 'logs/app.json',
            'formatter': 'json',
        },
    },
}
```

---

## §7. Mixins & Abstract Models

**Quick Start**: Create abstract base models with `Meta: abstract = True`. Common mixins: timestamps, soft delete, UUID primary key, publishable content.

### Essential Mixins

```python
# models.py
from django.db import models

class TimestampedModel(models.Model):
    """Abstract model with created/updated timestamps"""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

# Usage
class Post(TimestampedModel):
    title = models.CharField(max_length=200)
    content = models.TextField()
    # Automatically has created_at and updated_at
```

### SoftDeleteMixin

```python
# models.py
from django.db import models
from django.utils import timezone

class SoftDeleteQuerySet(models.QuerySet):
    def delete(self):
        """Soft delete queryset"""
        return self.update(deleted_at=timezone.now())

    def hard_delete(self):
        """Actually delete from database"""
        return super().delete()

    def alive(self):
        """Return non-deleted objects"""
        return self.filter(deleted_at=None)

    def dead(self):
        """Return deleted objects"""
        return self.exclude(deleted_at=None)

class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        """Only return non-deleted objects by default"""
        return SoftDeleteQuerySet(self.model, using=self._db).alive()

    def all_with_deleted(self):
        """Return all objects including deleted"""
        return SoftDeleteQuerySet(self.model, using=self._db)

class SoftDeleteMixin(models.Model):
    """Mixin for soft delete functionality"""
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = SoftDeleteManager()
    all_objects = models.Manager()  # Access all including deleted

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False):
        """Soft delete"""
        self.deleted_at = timezone.now()
        self.save(using=using)

    def hard_delete(self):
        """Actually delete from database"""
        super().delete()

    def restore(self):
        """Restore soft-deleted object"""
        self.deleted_at = None
        self.save()

# Usage
class Article(SoftDeleteMixin, TimestampedModel):
    title = models.CharField(max_length=200)

# Queries
Article.objects.all()  # Only non-deleted
Article.all_objects.all()  # All including deleted
Article.objects.dead()  # Only deleted
article.delete()  # Soft delete
article.restore()  # Restore
article.hard_delete()  # Actually delete
```

### UUIDMixin

```python
# models.py
import uuid
from django.db import models

class UUIDMixin(models.Model):
    """Mixin for UUID primary key"""
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    class Meta:
        abstract = True

# Usage
class Document(UUIDMixin, TimestampedModel):
    title = models.CharField(max_length=200)
```

### Custom QuerySet Mixins

```python
# querysets.py
from django.db import models

class PublishableQuerySet(models.QuerySet):
    def published(self):
        """Return published objects"""
        return self.filter(
            status='published',
            published_at__lte=timezone.now()
        )

    def draft(self):
        """Return draft objects"""
        return self.filter(status='draft')

    def scheduled(self):
        """Return scheduled objects"""
        return self.filter(
            status='published',
            published_at__gt=timezone.now()
        )

class PublishableManager(models.Manager):
    def get_queryset(self):
        return PublishableQuerySet(self.model, using=self._db)

    def published(self):
        return self.get_queryset().published()

    def draft(self):
        return self.get_queryset().draft()

class PublishableMixin(models.Model):
    """Mixin for publishable content"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
    ]

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='draft'
    )
    published_at = models.DateTimeField(null=True, blank=True)

    objects = PublishableManager()

    class Meta:
        abstract = True

    def publish(self):
        """Publish the object"""
        self.status = 'published'
        if not self.published_at:
            self.published_at = timezone.now()
        self.save()

# Usage
class BlogPost(PublishableMixin, TimestampedModel):
    title = models.CharField(max_length=200)
    content = models.TextField()

# Queries
BlogPost.objects.published()
BlogPost.objects.draft()
post.publish()
```

---

## §8. Custom Middleware

**Quick Start**: Create class with `__init__(get_response)` and `__call__(request)`. Add to `MIDDLEWARE` in settings.py.

### Structure

```python
# middleware.py
class SimpleMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        # One-time configuration and initialization

    def __call__(self, request):
        # Code executed for each request before view

        response = self.get_response(request)

        # Code executed for each request after view

        return response

    def process_exception(self, request, exception):
        # Called if view raises exception
        pass
```

### Request/Response Processing

```python
# middleware.py
import time

class TimingMiddleware:
    """Add response time header"""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.time()

        response = self.get_response(request)

        duration = time.time() - start_time
        response['X-Response-Time'] = f'{duration:.3f}s'

        return response

class UserAgentMiddleware:
    """Parse and attach user agent info"""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        request.is_mobile = 'Mobile' in user_agent
        request.is_bot = 'bot' in user_agent.lower()

        return self.get_response(request)
```

### Logging & Timing Middleware

```python
# middleware.py
import logging
import json

logger = logging.getLogger(__name__)

class APILoggingMiddleware:
    """Log all API requests and responses"""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Log request
        if request.path.startswith('/api/'):
            self.log_request(request)

        response = self.get_response(request)

        # Log response
        if request.path.startswith('/api/'):
            self.log_response(request, response)

        return response

    def log_request(self, request):
        logger.info('API Request', extra={
            'method': request.method,
            'path': request.path,
            'user': str(request.user),
            'ip': self.get_client_ip(request),
            'body': self.get_body(request),
        })

    def log_response(self, request, response):
        logger.info('API Response', extra={
            'method': request.method,
            'path': request.path,
            'status': response.status_code,
        })

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        return x_forwarded_for.split(',')[0] if x_forwarded_for else request.META.get('REMOTE_ADDR')

    def get_body(self, request):
        try:
            return json.loads(request.body.decode('utf-8'))
        except:
            return None
```

### Testing Middleware

```python
# tests/test_middleware.py
from django.test import TestCase, RequestFactory
from myapp.middleware import TimingMiddleware

class MiddlewareTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_timing_middleware(self):
        def get_response(request):
            from django.http import HttpResponse
            return HttpResponse()

        middleware = TimingMiddleware(get_response)
        request = self.factory.get('/test/')

        response = middleware(request)

        self.assertIn('X-Response-Time', response)
        self.assertTrue(response['X-Response-Time'].endswith('s'))
```

---

## §9. Model Managers & QuerySets

**Quick Start**: Create custom `QuerySet` with reusable filter methods. Create `Manager` that returns your custom QuerySet. Assign to model's `objects`.

### Pattern

```python
# models.py
from django.db import models

class PublishedManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(status='published')

class Article(models.Model):
    title = models.CharField(max_length=200)
    status = models.CharField(max_length=10)

    objects = models.Manager()  # Default manager
    published = PublishedManager()  # Custom manager

# Usage
Article.objects.all()  # All articles
Article.published.all()  # Only published articles
```

### Reusable QuerySet Methods

```python
# querysets.py
from django.db import models
from django.db.models import Q, Count, Avg

class ArticleQuerySet(models.QuerySet):
    def published(self):
        return self.filter(status='published')

    def featured(self):
        return self.filter(is_featured=True)

    def by_author(self, author):
        return self.filter(author=author)

    def search(self, query):
        return self.filter(
            Q(title__icontains=query) |
            Q(content__icontains=query)
        )

    def with_comment_count(self):
        return self.annotate(comment_count=Count('comments'))

    def popular(self, min_views=100):
        return self.filter(views__gte=min_views)

class ArticleManager(models.Manager):
    def get_queryset(self):
        return ArticleQuerySet(self.model, using=self._db)

    def published(self):
        return self.get_queryset().published()

    def featured(self):
        return self.get_queryset().featured()

    def search(self, query):
        return self.get_queryset().search(query)

# models.py
class Article(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    status = models.CharField(max_length=10)
    is_featured = models.BooleanField(default=False)
    views = models.IntegerField(default=0)
    author = models.ForeignKey(User, on_delete=models.CASCADE)

    objects = ArticleManager()

# Usage
Article.objects.published().featured()
Article.objects.search('django').with_comment_count()
Article.objects.by_author(user).popular(min_views=500)
```

### Soft Delete Patterns

```python
# Complete soft delete implementation
class SoftDeleteQuerySet(models.QuerySet):
    def delete(self):
        return self.update(is_deleted=True, deleted_at=timezone.now())

    def hard_delete(self):
        return super().delete()

    def alive(self):
        return self.filter(is_deleted=False)

    def dead(self):
        return self.filter(is_deleted=True)

    def with_deleted(self):
        return self

class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db).alive()

    def with_deleted(self):
        return SoftDeleteQuerySet(self.model, using=self._db)

class SoftDeleteModel(models.Model):
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = SoftDeleteManager()

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(using=using)

    def restore(self):
        self.is_deleted = False
        self.deleted_at = None
        self.save()
```

---

## §10. Decorators

**Quick Start**: Use `@functools.wraps(func)` to preserve function metadata. Common patterns: permissions, caching, rate limiting, retry logic, timing.

### Common Decorators

```python
# decorators.py
from functools import wraps
from rest_framework.response import Response
from rest_framework import status

def require_permissions(*permissions):
    """Require specific permissions"""
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(self, request, *args, **kwargs):
            if not request.user.is_authenticated:
                return Response(
                    {'error': 'Authentication required'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            if not request.user.has_perms(permissions):
                return Response(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )

            return view_func(self, request, *args, **kwargs)
        return wrapper
    return decorator

# Usage
class ArticleView(APIView):
    @require_permissions('articles.view_article', 'articles.change_article')
    def put(self, request, pk):
        # Update article
        pass

def admin_required(view_func):
    """Require admin user"""
    @wraps(view_func)
    def wrapper(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN
            )
        return view_func(self, request, *args, **kwargs)
    return wrapper
```

### Caching & Rate Limiting

```python
# decorators.py
from functools import wraps
from django.core.cache import cache
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

def cache_response(timeout=300, key_prefix='view'):
    """Cache view response"""
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(self, request, *args, **kwargs):
            # Build cache key
            cache_key = f"{key_prefix}:{request.path}:{request.GET.urlencode()}"

            # Try to get from cache
            response = cache.get(cache_key)
            if response is not None:
                return response

            # Execute view
            response = view_func(self, request, *args, **kwargs)

            # Cache response
            cache.set(cache_key, response, timeout)

            return response
        return wrapper
    return decorator

# Usage
class ArticleListView(APIView):
    @cache_response(timeout=600)
    def get(self, request):
        articles = Article.objects.all()
        serializer = ArticleSerializer(articles, many=True)
        return Response(serializer.data)

# Rate limiting decorator
def rate_limit(max_calls=10, period=60):
    """Rate limit view calls"""
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(self, request, *args, **kwargs):
            # Build rate limit key
            user_id = request.user.id if request.user.is_authenticated else request.META.get('REMOTE_ADDR')
            cache_key = f"rate_limit:{view_func.__name__}:{user_id}"

            # Get call count
            calls = cache.get(cache_key, 0)

            if calls >= max_calls:
                return Response(
                    {'error': 'Rate limit exceeded'},
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )

            # Increment call count
            cache.set(cache_key, calls + 1, period)

            return view_func(self, request, *args, **kwargs)
        return wrapper
    return decorator
```

### Retry & Timing Decorators

```python
# decorators.py
import time
import logging
from functools import wraps

logger = logging.getLogger(__name__)

def retry(max_attempts=3, delay=1, backoff=2, exceptions=(Exception,)):
    """Retry function on exception"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            attempt = 0
            current_delay = delay

            while attempt < max_attempts:
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    attempt += 1
                    if attempt >= max_attempts:
                        logger.error(f'{func.__name__} failed after {max_attempts} attempts')
                        raise

                    logger.warning(f'{func.__name__} failed, retrying in {current_delay}s (attempt {attempt}/{max_attempts})')
                    time.sleep(current_delay)
                    current_delay *= backoff

        return wrapper
    return decorator

# Usage
@retry(max_attempts=3, delay=2, backoff=2)
def call_external_api(url):
    response = requests.get(url)
    response.raise_for_status()
    return response.json()

def timing(func):
    """Log function execution time"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        duration = time.time() - start

        logger.info(f'{func.__name__} took {duration:.3f}s')
        return result
    return wrapper

# Usage
@timing
def expensive_operation():
    # ...
    pass
```

---

## §11. Data Export/Import

**Quick Start**: Use `csv.writer()` for CSV, `openpyxl` for Excel, `reportlab` for PDF. For large datasets, use `StreamingHttpResponse` with `.iterator(chunk_size=100)`.

### Export Formats

```python
# views.py
import csv
from django.http import HttpResponse
from openpyxl import Workbook

class ExportCSVView(APIView):
    """Export data to CSV"""

    def get(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="articles.csv"'

        writer = csv.writer(response)
        writer.writerow(['ID', 'Title', 'Author', 'Created'])

        articles = Article.objects.all()
        for article in articles:
            writer.writerow([
                article.id,
                article.title,
                article.author.username,
                article.created_at.strftime('%Y-%m-%d')
            ])

        return response

class ExportExcelView(APIView):
    """Export data to Excel"""

    def get(self, request):
        # Create workbook
        wb = Workbook()
        ws = wb.active
        ws.title = "Articles"

        # Headers
        ws.append(['ID', 'Title', 'Author', 'Created'])

        # Data
        articles = Article.objects.select_related('author')
        for article in articles:
            ws.append([
                article.id,
                article.title,
                article.author.username,
                article.created_at.strftime('%Y-%m-%d')
            ])

        # Save to response
        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="articles.xlsx"'
        wb.save(response)

        return response
```

### PDF Generation

```python
# Install: pip install reportlab

# views.py
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from django.http import HttpResponse

class GeneratePDFView(APIView):
    """Generate PDF report"""

    def get(self, request, report_id):
        report = Report.objects.get(id=report_id)

        # Create PDF
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="report_{report_id}.pdf"'

        doc = SimpleDocTemplate(response, pagesize=letter)
        elements = []

        # Styles
        styles = getSampleStyleSheet()

        # Title
        title = Paragraph(f"Report: {report.title}", styles['Title'])
        elements.append(title)

        # Table
        data = [['ID', 'Name', 'Value']]
        for item in report.items.all():
            data.append([item.id, item.name, item.value])

        table = Table(data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(table)

        # Build PDF
        doc.build(elements)

        return response
```

### Bulk Import Patterns

```python
# views.py
import csv
from rest_framework.parsers import MultiPartParser

class BulkImportView(APIView):
    """Bulk import from CSV"""
    parser_classes = [MultiPartParser]

    def post(self, request):
        csv_file = request.FILES.get('file')

        if not csv_file.name.endswith('.csv'):
            return Response(
                {'error': 'File must be CSV'},
                status=400
            )

        # Parse CSV
        decoded_file = csv_file.read().decode('utf-8').splitlines()
        reader = csv.DictReader(decoded_file)

        created_count = 0
        errors = []

        # Bulk create
        objects_to_create = []

        for row_num, row in enumerate(reader, start=2):
            try:
                # Validate row
                serializer = ArticleSerializer(data=row)
                if serializer.is_valid():
                    objects_to_create.append(
                        Article(**serializer.validated_data)
                    )
                else:
                    errors.append({
                        'row': row_num,
                        'errors': serializer.errors
                    })

            except Exception as e:
                errors.append({
                    'row': row_num,
                    'error': str(e)
                })

        # Bulk insert
        if objects_to_create:
            Article.objects.bulk_create(objects_to_create, batch_size=100)
            created_count = len(objects_to_create)

        return Response({
            'created': created_count,
            'errors': errors
        })

# Async bulk import with Celery
from celery import shared_task

@shared_task
def process_bulk_import(file_path, user_id):
    """Process bulk import in background"""
    with open(file_path, 'r') as f:
        reader = csv.DictReader(f)
        objects = []

        for row in reader:
            objects.append(Article(**row))

            # Batch insert every 1000 records
            if len(objects) >= 1000:
                Article.objects.bulk_create(objects)
                objects = []

        # Insert remaining
        if objects:
            Article.objects.bulk_create(objects)

    # Notify user
    notify_import_complete.delay(user_id)
```

### Streaming Responses

```python
# views.py
from django.http import StreamingHttpResponse

class StreamCSVView(APIView):
    """Stream large CSV export"""

    def get(self, request):
        def csv_generator():
            # Yield header
            yield 'ID,Title,Author,Created\n'

            # Stream data in chunks
            articles = Article.objects.select_related('author').iterator(chunk_size=100)
            for article in articles:
                yield f'{article.id},{article.title},{article.author.username},{article.created_at}\n'

        response = StreamingHttpResponse(
            csv_generator(),
            content_type='text/csv'
        )
        response['Content-Disposition'] = 'attachment; filename="articles.csv"'

        return response

# Stream JSON
import json

class StreamJSONView(APIView):
    """Stream large JSON export"""

    def get(self, request):
        def json_generator():
            yield '['

            articles = Article.objects.iterator(chunk_size=100)
            first = True

            for article in articles:
                if not first:
                    yield ','
                first = False

                yield json.dumps({
                    'id': article.id,
                    'title': article.title,
                    'author': article.author.username
                })

            yield ']'

        response = StreamingHttpResponse(
            json_generator(),
            content_type='application/json'
        )
        return response
```

---

## §12. Common Patterns

**Quick Start**: Production-ready patterns for health checks, audit logging, webhooks, and API versioning.

### Monitoring & Operations

```python
# views.py
from django.db import connection
from django.core.cache import cache
import redis

class HealthCheckView(APIView):
    """Health check endpoint for monitoring"""
    permission_classes = []  # Public endpoint

    def get(self, request):
        health = {
            'status': 'healthy',
            'checks': {}
        }

        # Database check
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            health['checks']['database'] = 'ok'
        except Exception as e:
            health['checks']['database'] = 'error'
            health['status'] = 'unhealthy'

        # Cache check
        try:
            cache.set('health_check', 'ok', 10)
            cache.get('health_check')
            health['checks']['cache'] = 'ok'
        except Exception as e:
            health['checks']['cache'] = 'error'
            health['status'] = 'unhealthy'

        # Celery check
        try:
            from myapp.tasks import health_check_task
            result = health_check_task.delay()
            result.get(timeout=5)
            health['checks']['celery'] = 'ok'
        except Exception as e:
            health['checks']['celery'] = 'error'
            health['status'] = 'unhealthy'

        status_code = 200 if health['status'] == 'healthy' else 503
        return Response(health, status=status_code)
```

### Audit Logging

```python
# models.py
class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
    ]

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=255)
    changes = models.JSONField(default=dict)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True)

# utils.py
def log_audit(user, action, instance, changes=None, ip_address=None):
    """Log audit trail"""
    AuditLog.objects.create(
        user=user,
        action=action,
        model_name=instance.__class__.__name__,
        object_id=str(instance.pk),
        changes=changes or {},
        ip_address=ip_address
    )

# signals.py
from django.db.models.signals import post_save, post_delete

@receiver(post_save)
def log_model_save(sender, instance, created, **kwargs):
    if sender._meta.app_label == 'myapp':
        log_audit(
            user=get_current_user(),
            action='create' if created else 'update',
            instance=instance
        )

@receiver(post_delete)
def log_model_delete(sender, instance, **kwargs):
    if sender._meta.app_label == 'myapp':
        log_audit(
            user=get_current_user(),
            action='delete',
            instance=instance
        )
```

### Webhook Handling

```python
# views.py
import hmac
import hashlib
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

@method_decorator(csrf_exempt, name='dispatch')
class WebhookView(APIView):
    """Handle incoming webhooks"""
    permission_classes = []

    def post(self, request):
        # Verify signature
        signature = request.headers.get('X-Webhook-Signature')
        if not self.verify_signature(request.body, signature):
            return Response(
                {'error': 'Invalid signature'},
                status=403
            )

        # Parse payload
        payload = request.data
        event_type = payload.get('event')

        # Process event
        if event_type == 'payment.success':
            self.handle_payment_success(payload)
        elif event_type == 'user.created':
            self.handle_user_created(payload)

        return Response({'status': 'received'})

    def verify_signature(self, payload, signature):
        """Verify webhook signature"""
        secret = settings.WEBHOOK_SECRET
        expected = hmac.new(
            secret.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(signature, expected)

    def handle_payment_success(self, payload):
        # Process payment
        pass

    def handle_user_created(self, payload):
        # Process user creation
        pass
```

### API Versioning Basics

```python
# urls.py
from django.urls import path, include

urlpatterns = [
    path('api/v1/', include('myapp.urls_v1')),
    path('api/v2/', include('myapp.urls_v2')),
]

# Using REST framework versioning
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_VERSIONING_CLASS': 'rest_framework.versioning.URLPathVersioning',
    'DEFAULT_VERSION': 'v1',
    'ALLOWED_VERSIONS': ['v1', 'v2'],
}

# views.py
class ArticleListView(APIView):
    def get(self, request):
        if request.version == 'v1':
            serializer_class = ArticleSerializerV1
        else:
            serializer_class = ArticleSerializerV2

        articles = Article.objects.all()
        serializer = serializer_class(articles, many=True)
        return Response(serializer.data)

# Header-based versioning
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_VERSIONING_CLASS': 'rest_framework.versioning.AcceptHeaderVersioning',
}

# Client sends: Accept: application/json; version=v2
```

---

## Quick Reference

### Common Model Patterns

```python
# Base model with all common mixins
class BaseModel(UUIDMixin, TimestampedModel, SoftDeleteMixin):
    class Meta:
        abstract = True

# Usage
class MyModel(BaseModel):
    name = models.CharField(max_length=200)
    # Automatically has: id (UUID), created_at, updated_at, deleted_at
```

### Common View Patterns

```python
# API view with caching and rate limiting
class MyAPIView(APIView):
    @cache_response(timeout=300)
    @rate_limit(max_calls=100, period=60)
    def get(self, request):
        data = self.get_data()
        return Response(data)
```

### Common Task Patterns

```python
# Celery task with retry
@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_kwargs={'max_retries': 3},
    retry_backoff=True
)
def my_task(self, data):
    # Process data
    pass
```

---

## Summary: Best Practices

**Code Organization**:
- Keep management commands focused on single responsibility
- Use abstract models for reusable patterns (timestamps, soft delete, UUID)
- Create custom QuerySets for reusable filter logic
- Place signals in `signals.py`, register in `apps.py`

**Performance**:
- Queue emails and heavy processing with Celery
- Use `.iterator(chunk_size=100)` for large querysets
- Stream large exports with `StreamingHttpResponse`
- Cache expensive operations with decorators

**Security**:
- Validate file uploads (type, size, dimensions)
- Verify webhook signatures with HMAC
- Use environment variables for secrets (S3 keys, SMTP passwords)
- Sanitize user input before processing

**Production Ready**:
- Add health check endpoints for monitoring
- Implement structured logging with request IDs
- Create audit trails for sensitive operations
- Use versioning for public APIs (URL or header-based)

---

**Last Updated**: 2026-02
**Version**: 2.0
**License**: MIT
