# Security Best Practices for File Upload

## Frontend Security

### 1. File Type Validation

```typescript
// ❌ MAL - Solo verificar extensión
const isValid = filename.endsWith('.jpg');

// ✅ BIEN - Verificar MIME type Y extensión
const isValid =
  file.type === 'image/jpeg' &&
  filename.toLowerCase().endsWith('.jpg');
```

### 2. File Size Limits

```typescript
// Siempre establecer límites razonables
const validation = {
  maxSize: 10 * 1024 * 1024, // 10MB máximo
  maxFiles: 5 // Máximo 5 archivos
};
```

### 3. Content Sanitization

```typescript
// Sanitizar nombres de archivo
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Remover caracteres especiales
    .replace(/\.{2,}/g, '.') // Evitar path traversal (..)
    .substring(0, 255); // Limitar longitud
}
```

### 4. Preview Seguro

```typescript
// Usar DomSanitizer para URLs
import { DomSanitizer } from '@angular/platform-browser';

constructor(private sanitizer: DomSanitizer) {}

safeUrl = this.sanitizer.bypassSecurityTrustUrl(previewUrl);
```

## Backend Security (Express.js)

### 1. Validación Exhaustiva

```javascript
const fileFilter = (req, file, cb) => {
  // Verificar MIME type
  const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowedMimes.includes(file.mimetype)) {
    return cb(new Error('Invalid file type'), false);
  }

  // Verificar extensión
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.pdf'];
  if (!allowedExts.includes(ext)) {
    return cb(new Error('Invalid file extension'), false);
  }

  // Verificar magic bytes (file signature)
  // Implementar verificación de magic bytes aquí

  cb(null, true);
};
```

### 2. Sanitización de Nombres

```javascript
const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    // Generar nombre único y seguro
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    const safeName = file.originalname
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .substring(0, 100);

    cb(null, `${uniqueId}-${safeName}${ext}`);
  }
});
```

### 3. Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Máximo 10 uploads por ventana
  message: 'Too many uploads, please try again later'
});

app.post('/upload', uploadLimiter, upload.single('file'), handleUpload);
```

### 4. Escaneo de Virus

```javascript
const ClamScan = require('clamscan');

async function scanFile(filePath) {
  const clamscan = await new ClamScan().init();
  const { isInfected, viruses } = await clamscan.scanFile(filePath);

  if (isInfected) {
    fs.unlinkSync(filePath); // Eliminar archivo infectado
    throw new Error(`Virus detected: ${viruses.join(', ')}`);
  }
}
```

### 5. Almacenamiento Seguro

```javascript
// ❌ MAL - Almacenar en carpeta pública
const uploadDir = 'public/uploads/';

// ✅ BIEN - Almacenar fuera de public, servir con middleware
const uploadDir = 'private/uploads/';

// Middleware para servir archivos autenticados
app.get('/files/:id', authenticateUser, async (req, res) => {
  const fileId = req.params.id;

  // Verificar permisos
  const hasPermission = await checkUserPermission(req.user, fileId);
  if (!hasPermission) {
    return res.status(403).send('Forbidden');
  }

  // Servir archivo
  const filePath = path.join(uploadDir, fileId);
  res.sendFile(filePath);
});
```

## Checklist de Seguridad

### Frontend
- [ ] Validar tipo MIME y extensión
- [ ] Establecer límites de tamaño
- [ ] Validar dimensiones de imágenes
- [ ] Sanitizar nombres de archivo
- [ ] Usar DomSanitizer para previews
- [ ] Limpiar URLs temporales (revokeObjectURL)
- [ ] Implementar CSRF tokens
- [ ] Validar respuestas del servidor

### Backend
- [ ] Verificar MIME type real (magic bytes)
- [ ] Validar extensión de archivo
- [ ] Sanitizar nombres de archivo
- [ ] Límites de tamaño estrictos
- [ ] Rate limiting por IP/usuario
- [ ] Escaneo de virus/malware
- [ ] Almacenamiento fuera de webroot
- [ ] Autenticación para descargas
- [ ] Logging de uploads
- [ ] Backup y recuperación

## Vulnerabilidades Comunes

### 1. Path Traversal
```javascript
// ❌ VULNERABLE
const filename = req.body.filename; // ../../../etc/passwd
const filePath = path.join(uploadDir, filename);

// ✅ SEGURO
const filename = path.basename(req.body.filename);
const filePath = path.join(uploadDir, filename);
```

### 2. File Type Bypass
```javascript
// ❌ VULNERABLE - Solo extensión
if (filename.endsWith('.jpg')) { /* ... */ }

// ✅ SEGURO - MIME + extensión + magic bytes
const fileType = await FileType.fromBuffer(buffer);
if (fileType.mime === 'image/jpeg' && filename.endsWith('.jpg')) {
  /* ... */
}
```

### 3. Unrestricted File Upload
```javascript
// ❌ VULNERABLE - Permitir todos los tipos
app.post('/upload', upload.single('file'), ...);

// ✅ SEGURO - Whitelist estricta
const allowedTypes = ['image/jpeg', 'image/png'];
const fileFilter = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid type'), false);
  }
};
```

### 4. Denial of Service (DoS)
```javascript
// ❌ VULNERABLE - Sin límites
const upload = multer({ dest: 'uploads/' });

// ✅ SEGURO - Límites estrictos
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // Máximo 5 archivos
  }
});
```

## Referencias

- [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [OWASP Top 10 - A05:2021 Security Misconfiguration](https://owasp.org/Top10/A05_2021-Security_Misconfiguration/)
- [CWE-434: Unrestricted Upload of File with Dangerous Type](https://cwe.mitre.org/data/definitions/434.html)
