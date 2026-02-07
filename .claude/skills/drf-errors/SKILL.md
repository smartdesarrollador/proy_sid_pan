---
name: drf-errors
description: >
  Patrones y mejores prácticas para error handling y validación en Django REST Framework.
  Usar cuando se trabaje con exception handlers, validaciones de serializers, error responses,
  status codes, custom exceptions, logging de errores, validators o manejo de errores en DRF.
---

# Error Handling & Validation en Django REST Framework

## 1. Custom Exception Handlers

### Exception handler base

```python
# apps/core/exceptions.py
import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404

logger = logging.getLogger("api.errors")


def api_exception_handler(exc, context) -> Response | None:
    # Convertir excepciones Django a DRF
    if isinstance(exc, DjangoValidationError):
        exc = _django_to_drf_validation_error(exc)
    if isinstance(exc, Http404):
        exc = exceptions.NotFound()

    response = exception_handler(exc, context)

    if response is None:
        # Excepción no manejada (500)
        logger.exception(
            "Unhandled exception",
            extra=_get_request_context(context),
        )
        response = Response(
            {
                "success": False,
                "error": {
                    "code": "internal_error",
                    "message": "Ha ocurrido un error interno.",
                    "status": 500,
                },
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
        return response

    # Formatear respuesta de error
    error_payload = _format_error(exc, response)

    # Logging
    _log_error(exc, context, response)

    response.data = error_payload
    return response


def _format_error(exc, response) -> dict:
    """Formato consistente para todas las respuestas de error."""
    error_data = {
        "success": False,
        "error": {
            "code": _get_error_code(exc),
            "message": _get_error_message(exc),
            "status": response.status_code,
        },
    }

    # Agregar detalles de validación si existen
    if hasattr(exc, "detail"):
        details = _normalize_errors(exc.detail)
        if details:
            error_data["error"]["details"] = details

    return error_data


def _get_error_code(exc) -> str:
    if hasattr(exc, "default_code"):
        return exc.default_code
    return "error"


def _get_error_message(exc) -> str:
    messages = {
        "not_authenticated": "Autenticación requerida.",
        "authentication_failed": "Credenciales inválidas.",
        "permission_denied": "No tienes permiso para esta acción.",
        "not_found": "Recurso no encontrado.",
        "method_not_allowed": "Método HTTP no permitido.",
        "throttled": "Demasiadas solicitudes. Intenta más tarde.",
    }
    code = _get_error_code(exc)
    return messages.get(code, str(exc.detail) if hasattr(exc, "detail") else "Error.")


def _normalize_errors(detail) -> dict | list | None:
    """Normaliza errores de DRF a formato consistente."""
    if isinstance(detail, list):
        return [str(item) for item in detail]
    if isinstance(detail, dict):
        return {
            field: [str(e) for e in (errors if isinstance(errors, list) else [errors])]
            for field, errors in detail.items()
        }
    return None


def _django_to_drf_validation_error(exc):
    from rest_framework.exceptions import ValidationError
    if hasattr(exc, "message_dict"):
        return ValidationError(detail=exc.message_dict)
    return ValidationError(detail=exc.messages)


def _get_request_context(context) -> dict:
    request = context.get("request")
    if not request:
        return {}
    return {
        "method": request.method,
        "path": request.path,
        "user": str(getattr(request, "user", "anonymous")),
    }


def _log_error(exc, context, response):
    request_ctx = _get_request_context(context)
    if response.status_code >= 500:
        logger.error("Server error: %s", exc, extra=request_ctx)
    elif response.status_code >= 400:
        logger.warning("Client error: %s", exc, extra=request_ctx)
```

```python
# settings.py
REST_FRAMEWORK = {
    "EXCEPTION_HANDLER": "apps.core.exceptions.api_exception_handler",
}
```

### Handler para development vs production

```python
import traceback
from django.conf import settings


def api_exception_handler(exc, context) -> Response | None:
    response = exception_handler(exc, context)

    if response is None:
        logger.exception("Unhandled exception")
        error_data = {
            "success": False,
            "error": {
                "code": "internal_error",
                "message": "Ha ocurrido un error interno.",
                "status": 500,
            },
        }
        # Solo en DEBUG mostrar detalles internos
        if settings.DEBUG:
            error_data["error"]["debug"] = {
                "exception": exc.__class__.__name__,
                "message": str(exc),
                "traceback": traceback.format_exc().splitlines(),
            }
        return Response(error_data, status=500)

    # ... formato normal
```

## 2. API Exceptions

### Built-in exceptions

```python
from rest_framework.exceptions import (
    ValidationError,        # 400 - datos inválidos
    AuthenticationFailed,   # 401 - credenciales inválidas
    NotAuthenticated,       # 401 - sin credenciales
    PermissionDenied,       # 403 - sin permisos
    NotFound,               # 404 - recurso no existe
    MethodNotAllowed,       # 405 - método HTTP no soportado
    NotAcceptable,          # 406 - content type no soportado
    Throttled,              # 429 - rate limit excedido
    APIException,           # 500 - base para custom exceptions
)

# Uso directo en views
def perform_create(self, serializer):
    if not self.request.user.is_email_verified:
        raise PermissionDenied("Debes verificar tu email primero.")
    serializer.save(created_by=self.request.user)
```

### Custom exception classes

```python
from rest_framework.exceptions import APIException
from rest_framework import status


class ConflictError(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "El recurso ya existe o hay un conflicto de estado."
    default_code = "conflict"


class BusinessLogicError(APIException):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    default_detail = "La operación no puede completarse."
    default_code = "business_error"


class ExternalServiceError(APIException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = "Servicio externo no disponible."
    default_code = "service_unavailable"


class RateLimitError(APIException):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_detail = "Demasiadas solicitudes."
    default_code = "rate_limited"

    def __init__(self, wait: int = None):
        detail = self.default_detail
        if wait:
            detail = f"{detail} Intenta en {wait} segundos."
        super().__init__(detail=detail)


class GoneError(APIException):
    status_code = status.HTTP_410_GONE
    default_detail = "Este recurso ya no está disponible."
    default_code = "gone"


# Uso
def perform_create(self, serializer):
    if Item.objects.filter(code=serializer.validated_data["code"]).exists():
        raise ConflictError("Ya existe un item con ese código.")
    serializer.save()
```

### Excepciones con múltiples errores

```python
from rest_framework.exceptions import ValidationError

# Un solo campo
raise ValidationError({"email": "Este email ya está registrado."})

# Múltiples campos
raise ValidationError({
    "email": ["Este email ya está registrado."],
    "code": ["El código debe ser alfanumérico.", "Máximo 10 caracteres."],
})

# Non-field errors
raise ValidationError(["La combinación de fecha inicio/fin es inválida."])

# Con códigos de error
raise ValidationError(
    detail={"code": "El código ya existe."},
    code="duplicate",
)
```

## 3. Serializer Validation

### Field-level validation

```python
from rest_framework import serializers
import re


class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = ["id", "name", "code", "email", "value", "status"]

    def validate_name(self, value: str) -> str:
        if len(value.strip()) < 2:
            raise serializers.ValidationError("El nombre debe tener al menos 2 caracteres.")
        return value.strip()

    def validate_code(self, value: str) -> str:
        if not re.match(r"^[A-Z0-9-]+$", value):
            raise serializers.ValidationError(
                "Solo mayúsculas, números y guiones.",
                code="invalid_format",
            )
        return value

    def validate_value(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("El valor no puede ser negativo.")
        return value
```

### Object-level validation

```python
class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = ["name", "start_date", "end_date", "min_value", "max_value"]

    def validate(self, attrs: dict) -> dict:
        errors = {}

        # Validación de rango de fechas
        start = attrs.get("start_date")
        end = attrs.get("end_date")
        if start and end and start >= end:
            errors["end_date"] = "Debe ser posterior a la fecha de inicio."

        # Validación de rango de valores
        min_val = attrs.get("min_value")
        max_val = attrs.get("max_value")
        if min_val is not None and max_val is not None and min_val > max_val:
            errors["max_value"] = "Debe ser mayor o igual al valor mínimo."

        if errors:
            raise serializers.ValidationError(errors)

        return attrs
```

### Custom validators reutilizables

```python
import re
from django.core.exceptions import ValidationError


def validate_no_special_chars(value: str) -> str:
    if re.search(r"[<>\"';]", value):
        raise ValidationError("No se permiten caracteres especiales: < > \" ' ;")
    return value


def validate_file_size(max_mb: int = 10):
    def validator(file):
        max_bytes = max_mb * 1024 * 1024
        if file.size > max_bytes:
            raise ValidationError(f"El archivo no puede superar {max_mb}MB.")
    return validator


def validate_file_extension(allowed: list[str]):
    def validator(file):
        import os
        ext = os.path.splitext(file.name)[1].lower()
        if ext not in allowed:
            raise ValidationError(
                f"Extensión no permitida. Permitidas: {', '.join(allowed)}"
            )
    return validator


class MaxValueForStatus:
    """Validator que depende de otro campo (usar en validate())."""

    def __init__(self, max_values: dict[str, int]):
        self.max_values = max_values

    def __call__(self, attrs: dict):
        status = attrs.get("status")
        value = attrs.get("value")
        max_val = self.max_values.get(status)
        if max_val is not None and value is not None and value > max_val:
            raise ValidationError(
                {"value": f"Máximo permitido para status '{status}': {max_val}"}
            )


# Uso en serializer
class ItemSerializer(serializers.ModelSerializer):
    name = serializers.CharField(validators=[validate_no_special_chars])
    attachment = serializers.FileField(
        validators=[validate_file_size(5), validate_file_extension([".pdf", ".csv"])],
        required=False,
    )

    class Meta:
        model = Item
        fields = "__all__"
        validators = [MaxValueForStatus({"draft": 100, "active": 10000})]
```

### Error messages personalizados

```python
class ItemSerializer(serializers.ModelSerializer):
    name = serializers.CharField(
        min_length=2,
        max_length=255,
        error_messages={
            "blank": "El nombre no puede estar vacío.",
            "min_length": "El nombre debe tener al menos {min_length} caracteres.",
            "max_length": "El nombre no puede superar {max_length} caracteres.",
            "required": "El nombre es obligatorio.",
        },
    )
    value = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        error_messages={
            "invalid": "Ingresa un número válido.",
            "max_digits": "Máximo {max_digits} dígitos en total.",
        },
    )
    status = serializers.ChoiceField(
        choices=["draft", "active", "archived"],
        error_messages={
            "invalid_choice": "'{value}' no es un status válido. Opciones: draft, active, archived.",
        },
    )
```

## 4. Model Validation

### Model.clean() y validators

```python
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, RegexValidator


class Item(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(
        max_length=50,
        validators=[
            RegexValidator(
                regex=r"^[A-Z0-9-]+$",
                message="Solo mayúsculas, números y guiones.",
            ),
        ],
    )
    value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0, message="El valor no puede ser negativo.")],
    )
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)

    def clean(self):
        """Validación a nivel de modelo (cross-field)."""
        super().clean()
        errors = {}

        if self.end_date and self.start_date and self.end_date <= self.start_date:
            errors["end_date"] = "Debe ser posterior a start_date."

        if self.status == "active" and not self.value:
            errors["value"] = "Items activos requieren un valor."

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()  # ejecuta clean() + field validators
        super().save(*args, **kwargs)
```

### Constraints vs validation

```python
class Item(models.Model):
    class Meta:
        constraints = [
            # DB-level: se aplica siempre, incluso en raw SQL
            models.CheckConstraint(
                check=models.Q(value__gte=0),
                name="item_value_non_negative",
            ),
            models.UniqueConstraint(
                fields=["code"],
                condition=models.Q(is_deleted=False),
                name="unique_active_code",
            ),
        ]

    # Application-level: solo cuando se usa .save() o .full_clean()
    def clean(self):
        if self.end_date and self.end_date <= self.start_date:
            raise ValidationError({"end_date": "Fecha inválida."})

# Regla:
# - Constraints para invariantes que NUNCA deben violarse (integridad)
# - clean()/validators para validaciones con mensajes amigables
# - Ambas cuando se necesita seguridad + UX
```

## 5. Error Response Structure

### Formato estándar

```json
// Validación simple (400)
{
    "success": false,
    "error": {
        "code": "validation_error",
        "message": "Los datos proporcionados son inválidos.",
        "status": 400,
        "details": {
            "name": ["Este campo es obligatorio."],
            "value": ["El valor no puede ser negativo."]
        }
    }
}

// Autenticación (401)
{
    "success": false,
    "error": {
        "code": "not_authenticated",
        "message": "Autenticación requerida.",
        "status": 401
    }
}

// Permiso denegado (403)
{
    "success": false,
    "error": {
        "code": "permission_denied",
        "message": "No tienes permiso para esta acción.",
        "status": 403
    }
}

// No encontrado (404)
{
    "success": false,
    "error": {
        "code": "not_found",
        "message": "Recurso no encontrado.",
        "status": 404
    }
}

// Conflicto (409)
{
    "success": false,
    "error": {
        "code": "conflict",
        "message": "Ya existe un item con ese código.",
        "status": 409
    }
}

// Error interno (500)
{
    "success": false,
    "error": {
        "code": "internal_error",
        "message": "Ha ocurrido un error interno.",
        "status": 500
    }
}

// Error interno en DEBUG=True (500)
{
    "success": false,
    "error": {
        "code": "internal_error",
        "message": "Ha ocurrido un error interno.",
        "status": 500,
        "debug": {
            "exception": "ZeroDivisionError",
            "message": "division by zero",
            "traceback": ["..."]
        }
    }
}
```

### Nested errors para nested serializers

```json
// POST /api/v1/composites/
// Body inválido con nested items
{
    "success": false,
    "error": {
        "code": "validation_error",
        "message": "Los datos proporcionados son inválidos.",
        "status": 400,
        "details": {
            "title": ["Este campo es obligatorio."],
            "items": [
                {},
                {"name": ["Este campo es obligatorio."], "value": ["Debe ser positivo."]}
            ]
        }
    }
}
```

## 6. HTTP Status Codes

### Referencia y cuándo usar cada uno

```python
from rest_framework import status

# 2xx Success
status.HTTP_200_OK              # GET, PUT, PATCH exitosos
status.HTTP_201_CREATED         # POST exitoso (recurso creado)
status.HTTP_204_NO_CONTENT      # DELETE exitoso

# 4xx Client Errors
status.HTTP_400_BAD_REQUEST     # Validación fallida, datos malformados
status.HTTP_401_UNAUTHORIZED    # Sin credenciales o credenciales inválidas
status.HTTP_403_FORBIDDEN       # Autenticado pero sin permisos
status.HTTP_404_NOT_FOUND       # Recurso no existe
status.HTTP_405_METHOD_NOT_ALLOWED  # GET en endpoint solo POST, etc.
status.HTTP_409_CONFLICT        # Duplicado, conflicto de estado
status.HTTP_410_GONE            # Recurso eliminado permanentemente
status.HTTP_422_UNPROCESSABLE_ENTITY  # Datos válidos pero lógica de negocio falla
status.HTTP_429_TOO_MANY_REQUESTS    # Rate limit excedido

# 5xx Server Errors
status.HTTP_500_INTERNAL_SERVER_ERROR  # Error no manejado
status.HTTP_502_BAD_GATEWAY            # Servicio upstream falló
status.HTTP_503_SERVICE_UNAVAILABLE    # Servicio temporalmente no disponible
```

### 401 vs 403

```python
# 401: NO estás autenticado (¿quién eres?)
class NotAuthenticated(APIException):
    status_code = 401
# Se usa cuando: no hay token, token expirado, credenciales inválidas

# 403: ESTÁS autenticado pero no tienes permiso (sabemos quién eres, pero no puedes)
class PermissionDenied(APIException):
    status_code = 403
# Se usa cuando: user autenticado intenta acceder a recurso de otro user
```

### 400 vs 422

```python
# 400: datos malformados o inválidos sintácticamente
# JSON mal formado, tipo de dato incorrecto, campo requerido faltante
raise ValidationError({"email": "Formato de email inválido."})

# 422: datos válidos sintácticamente pero fallan reglas de negocio
# "No puedes cancelar un pedido ya entregado"
raise BusinessLogicError("No se puede cancelar un item ya procesado.")
```

## 7. Validation Patterns

### Validators comunes

```python
import re
from django.core.validators import (
    EmailValidator,
    URLValidator,
    MinValueValidator,
    MaxValueValidator,
    MinLengthValidator,
    MaxLengthValidator,
    RegexValidator,
    FileExtensionValidator,
)


# Email
email = serializers.EmailField(validators=[EmailValidator(message="Email inválido.")])

# URL
url = serializers.URLField(validators=[URLValidator(schemes=["http", "https"])])

# Teléfono
phone = serializers.CharField(
    validators=[
        RegexValidator(
            regex=r"^\+?[1-9]\d{6,14}$",
            message="Formato: +XXXXXXXXXXX (7-15 dígitos).",
        ),
    ],
)

# Rango numérico
value = serializers.IntegerField(
    validators=[MinValueValidator(0), MaxValueValidator(10000)],
)
```

### File upload validation

```python
class FileUploadSerializer(serializers.Serializer):
    file = serializers.FileField()

    ALLOWED_EXTENSIONS = [".pdf", ".csv", ".xlsx", ".jpg", ".png"]
    ALLOWED_CONTENT_TYPES = [
        "application/pdf",
        "text/csv",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "image/jpeg",
        "image/png",
    ]
    MAX_SIZE_MB = 10

    def validate_file(self, file):
        import os

        # Extensión
        ext = os.path.splitext(file.name)[1].lower()
        if ext not in self.ALLOWED_EXTENSIONS:
            raise serializers.ValidationError(
                f"Extensión no permitida. Permitidas: {', '.join(self.ALLOWED_EXTENSIONS)}"
            )

        # Content type
        if file.content_type not in self.ALLOWED_CONTENT_TYPES:
            raise serializers.ValidationError("Tipo de archivo no permitido.")

        # Tamaño
        max_bytes = self.MAX_SIZE_MB * 1024 * 1024
        if file.size > max_bytes:
            raise serializers.ValidationError(
                f"El archivo no puede superar {self.MAX_SIZE_MB}MB."
            )

        return file
```

### JSON field validation

```python
class ConfigSerializer(serializers.Serializer):
    metadata = serializers.JSONField()

    REQUIRED_KEYS = {"version", "type"}
    ALLOWED_TYPES = ["basic", "advanced", "custom"]

    def validate_metadata(self, value: dict) -> dict:
        if not isinstance(value, dict):
            raise serializers.ValidationError("Debe ser un objeto JSON.")

        missing = self.REQUIRED_KEYS - set(value.keys())
        if missing:
            raise serializers.ValidationError(
                f"Faltan campos requeridos: {', '.join(missing)}"
            )

        if value.get("type") not in self.ALLOWED_TYPES:
            raise serializers.ValidationError(
                f"type debe ser uno de: {', '.join(self.ALLOWED_TYPES)}"
            )

        return value
```

### Conditional validation

```python
class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = ["name", "status", "value", "reason", "scheduled_at"]

    def validate(self, attrs: dict) -> dict:
        status = attrs.get("status", getattr(self.instance, "status", None))

        # Si status es "active", value es obligatorio
        if status == "active" and not attrs.get("value"):
            raise serializers.ValidationError(
                {"value": "Obligatorio cuando el status es 'active'."}
            )

        # Si status es "archived", reason es obligatorio
        if status == "archived" and not attrs.get("reason"):
            raise serializers.ValidationError(
                {"reason": "Debes indicar un motivo para archivar."}
            )

        # Si status es "scheduled", scheduled_at es obligatorio y debe ser futuro
        if status == "scheduled":
            scheduled_at = attrs.get("scheduled_at")
            if not scheduled_at:
                raise serializers.ValidationError(
                    {"scheduled_at": "Obligatorio para items programados."}
                )
            from django.utils import timezone
            if scheduled_at <= timezone.now():
                raise serializers.ValidationError(
                    {"scheduled_at": "Debe ser una fecha futura."}
                )

        return attrs
```

## 8. Business Logic Validation

### Validation en service layer

```python
# apps/services/item_service.py
from apps.core.exceptions import BusinessLogicError, ConflictError


class ItemService:
    @staticmethod
    def activate(item, user) -> "Item":
        if item.status == "active":
            raise ConflictError("El item ya está activo.")

        if not item.value or item.value <= 0:
            raise BusinessLogicError("El item debe tener un valor positivo para activarse.")

        if not user.has_perm("app.activate_item"):
            raise PermissionDenied("No tienes permiso para activar items.")

        item.status = "active"
        item.activated_by = user
        item.activated_at = timezone.now()
        item.save(update_fields=["status", "activated_by", "activated_at"])
        return item

    @staticmethod
    def transfer(source, target, amount, user) -> None:
        if source.pk == target.pk:
            raise BusinessLogicError("No puedes transferir a ti mismo.")

        if source.value < amount:
            raise BusinessLogicError(
                f"Saldo insuficiente. Disponible: {source.value}, solicitado: {amount}"
            )

        if amount <= 0:
            raise BusinessLogicError("El monto debe ser positivo.")

        with transaction.atomic():
            source.value = F("value") - amount
            target.value = F("value") + amount
            source.save(update_fields=["value"])
            target.save(update_fields=["value"])
```

### Uso en ViewSet

```python
class ItemViewSet(viewsets.ModelViewSet):
    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        item = self.get_object()
        # Las excepciones del service se propagan al exception handler
        item = ItemService.activate(item, request.user)
        return Response(ItemSerializer(item).data)
```

## 9. Error Logging & Monitoring

### Logging configuration

```python
# settings.py
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "()": "pythonjsonlogger.jsonlogger.JsonFormatter",
            "format": "%(asctime)s %(name)s %(levelname)s %(message)s",
        },
        "verbose": {
            "format": "[{asctime}] {levelname} {name} {message}",
            "style": "{",
        },
    },
    "filters": {
        "sensitive_data": {
            "()": "apps.core.logging.SensitiveDataFilter",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
        "error_file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": "logs/errors.log",
            "maxBytes": 10 * 1024 * 1024,  # 10MB
            "backupCount": 5,
            "formatter": "json",
            "filters": ["sensitive_data"],
            "level": "WARNING",
        },
    },
    "loggers": {
        "api.errors": {
            "handlers": ["console", "error_file"],
            "level": "WARNING",
            "propagate": False,
        },
        "django.request": {
            "handlers": ["error_file"],
            "level": "ERROR",
            "propagate": False,
        },
    },
}
```

### Filtro de datos sensibles

```python
# apps/core/logging.py
import logging
import re


class SensitiveDataFilter(logging.Filter):
    PATTERNS = [
        (re.compile(r'"password"\s*:\s*"[^"]*"'), '"password": "***"'),
        (re.compile(r'"token"\s*:\s*"[^"]*"'), '"token": "***"'),
        (re.compile(r'"api_key"\s*:\s*"[^"]*"'), '"api_key": "***"'),
        (re.compile(r'"secret"\s*:\s*"[^"]*"'), '"secret": "***"'),
        (re.compile(r'"authorization"\s*:\s*"[^"]*"'), '"authorization": "***"'),
    ]

    def filter(self, record) -> bool:
        if record.msg and isinstance(record.msg, str):
            for pattern, replacement in self.PATTERNS:
                record.msg = pattern.sub(replacement, record.msg)
        return True
```

### Sentry integration pattern

```python
# settings.py
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

if not DEBUG:
    sentry_sdk.init(
        dsn=os.environ.get("SENTRY_DSN"),
        integrations=[DjangoIntegration()],
        traces_sample_rate=0.1,
        send_default_pii=False,
        environment=os.environ.get("ENVIRONMENT", "production"),
    )

# En exception handler, agregar contexto a Sentry
def api_exception_handler(exc, context):
    if not isinstance(exc, APIException):
        sentry_sdk.set_context("request", _get_request_context(context))
        sentry_sdk.capture_exception(exc)
    # ... resto del handler
```

## 10. Common Validation Scenarios

### Required y unique fields

```python
class ItemSerializer(serializers.ModelSerializer):
    # Required explícito
    name = serializers.CharField(required=True, allow_blank=False)

    # Optional con default
    status = serializers.CharField(default="draft")

    # Unique validation
    code = serializers.CharField(
        validators=[
            UniqueValidator(
                queryset=Item.objects.all(),
                message="Ya existe un item con este código.",
            ),
        ],
    )

    # Unique en update (excluir instancia actual)
    def validate_code(self, value: str) -> str:
        qs = Item.objects.filter(code=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Ya existe un item con este código.")
        return value
```

### Choice validation

```python
class ItemSerializer(serializers.ModelSerializer):
    status = serializers.ChoiceField(
        choices=Item.Status.choices,
        error_messages={
            "invalid_choice": "Status inválido. Opciones: {choices}",
        },
    )

    # Validación de transición de estado
    def validate_status(self, value: str) -> str:
        if not self.instance:
            return value

        valid_transitions = {
            "draft": ["active", "archived"],
            "active": ["archived"],
            "archived": [],
        }
        current = self.instance.status
        allowed = valid_transitions.get(current, [])

        if value != current and value not in allowed:
            raise serializers.ValidationError(
                f"No se puede cambiar de '{current}' a '{value}'. "
                f"Transiciones permitidas: {', '.join(allowed) or 'ninguna'}"
            )
        return value
```

### Array/List validation

```python
class BatchSerializer(serializers.Serializer):
    ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        min_length=1,
        max_length=100,
        error_messages={
            "min_length": "Debes seleccionar al menos un elemento.",
            "max_length": "Máximo 100 elementos por operación.",
        },
    )
    tags = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        default=list,
    )

    def validate_ids(self, value: list[int]) -> list[int]:
        # Verificar que no haya duplicados
        if len(value) != len(set(value)):
            raise serializers.ValidationError("No se permiten IDs duplicados.")

        # Verificar que todos existan
        existing = set(Item.objects.filter(pk__in=value).values_list("pk", flat=True))
        missing = set(value) - existing
        if missing:
            raise serializers.ValidationError(
                f"IDs no encontrados: {', '.join(str(i) for i in missing)}"
            )
        return value
```

## 11. Error Handling Best Practices

### Middleware de seguridad para errores

```python
import json
from django.http import JsonResponse


class ErrorSecurityMiddleware:
    """Asegura que errores 500 nunca expongan detalles internos en producción."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if response.status_code >= 500 and not settings.DEBUG:
            # Verificar que no se filtren detalles internos
            if hasattr(response, "content"):
                try:
                    data = json.loads(response.content)
                    for key in ("traceback", "debug", "stack", "exception"):
                        data.get("error", {}).pop(key, None)
                    response.content = json.dumps(data)
                except (json.JSONDecodeError, AttributeError):
                    pass

        return response
```

### Errores descriptivos vs genéricos

```python
# MAL: mensaje genérico que no ayuda al cliente
raise ValidationError("Error de validación.")

# BIEN: mensaje específico y accionable
raise ValidationError({"email": "Este email ya está registrado. ¿Olvidaste tu contraseña?"})

# MAL: exponer detalles internos
raise APIException(f"PostgreSQL error: {e}")

# BIEN: mensaje seguro con logging interno
logger.error("Database error: %s", e, exc_info=True)
raise APIException("No se pudo completar la operación.")

# MAL: error 500 para validación de negocio
raise Exception("No se puede eliminar")

# BIEN: excepción apropiada con status code correcto
raise BusinessLogicError("No se puede eliminar un item con dependencias activas.")
```

## 12. Testing Error Handling

### Testing exception handler

```python
class ExceptionHandlerTest(APITestCase):
    def setUp(self):
        self.user = UserFactory()
        self.client.force_authenticate(user=self.user)

    def test_error_response_format(self):
        response = self.client.post("/api/v1/items/", {}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data["success"])
        self.assertIn("error", response.data)
        self.assertIn("code", response.data["error"])
        self.assertIn("message", response.data["error"])
        self.assertIn("status", response.data["error"])

    def test_validation_error_includes_details(self):
        response = self.client.post("/api/v1/items/", {}, format="json")
        self.assertIn("details", response.data["error"])
        self.assertIn("name", response.data["error"]["details"])

    def test_not_found_format(self):
        response = self.client.get("/api/v1/items/99999/")
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.data["error"]["code"], "not_found")

    def test_permission_denied_format(self):
        other_user = UserFactory()
        item = ItemFactory(created_by=other_user)
        response = self.client.delete(f"/api/v1/items/{item.pk}/")
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data["error"]["code"], "permission_denied")

    def test_unauthenticated_format(self):
        self.client.force_authenticate(user=None)
        response = self.client.post("/api/v1/items/", {}, format="json")
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.data["error"]["code"], "not_authenticated")
```

### Testing validation errors

```python
class ValidationErrorTest(APITestCase):
    def setUp(self):
        self.user = UserFactory()
        self.client.force_authenticate(user=self.user)

    def test_missing_required_fields(self):
        response = self.client.post("/api/v1/items/", {}, format="json")
        self.assertEqual(response.status_code, 400)
        details = response.data["error"]["details"]
        self.assertIn("name", details)

    def test_invalid_field_type(self):
        response = self.client.post(
            "/api/v1/items/",
            {"name": "Test", "value": "not_a_number"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("value", response.data["error"]["details"])

    def test_unique_constraint_error(self):
        ItemFactory(code="ABC", created_by=self.user)
        response = self.client.post(
            "/api/v1/items/",
            {"name": "Duplicate", "code": "ABC"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("code", response.data["error"]["details"])

    def test_cross_field_validation(self):
        response = self.client.post(
            "/api/v1/items/",
            {"name": "Test", "start_date": "2024-12-01", "end_date": "2024-01-01"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_business_logic_error(self):
        item = ItemFactory(status="archived", created_by=self.user)
        response = self.client.post(
            f"/api/v1/items/{item.pk}/activate/",
        )
        self.assertIn(response.status_code, [400, 422])

    def test_state_transition_error(self):
        item = ItemFactory(status="archived", created_by=self.user)
        response = self.client.patch(
            f"/api/v1/items/{item.pk}/",
            {"status": "draft"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("status", response.data["error"]["details"])
```

### Testing error logging

```python
from unittest.mock import patch


class ErrorLoggingTest(APITestCase):
    @patch("apps.core.exceptions.logger")
    def test_500_error_is_logged(self, mock_logger):
        with patch.object(
            ItemViewSet, "list", side_effect=RuntimeError("Unexpected"),
        ):
            self.client.force_authenticate(user=UserFactory())
            response = self.client.get("/api/v1/items/")
            self.assertEqual(response.status_code, 500)
            mock_logger.exception.assert_called()

    @patch("apps.core.exceptions.logger")
    def test_400_error_is_warned(self, mock_logger):
        self.client.force_authenticate(user=UserFactory())
        self.client.post("/api/v1/items/", {}, format="json")
        mock_logger.warning.assert_called()
```
