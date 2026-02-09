# Angular File Upload Skill

Skill completo para implementar file upload enterprise-ready en proyectos Angular standalone con Tailwind CSS.

## Características Principales

✅ **Componente FileUpload** standalone con drag & drop zone
✅ **Upload a APIs REST** con multipart/form-data
✅ **Multiple file selection** con límites configurables
✅ **File preview** para imágenes, PDFs y documentos
✅ **Progress tracking** con barra de progreso detallada
✅ **Validación robusta** de tipos MIME, tamaño y dimensiones
✅ **Drag and drop** functionality con directiva reutilizable
✅ **Remove/Retry/Cancel** uploads con gestión de estado
✅ **Thumbnail generation** para optimización de imágenes
✅ **Upload queue management** con signals de Angular
✅ **Image compression** antes de subir (opcional)
✅ **Chunk upload** para archivos grandes (opcional)
✅ **Error handling** específico con retry automático
✅ **Reactive Forms** integration completa

## Contenido del Skill

### Archivo Principal
- `SKILL.md` - Documentación completa con código listo para usar

### Referencias Adicionales
- `references/MIME_TYPES.md` - Referencia de tipos MIME comunes
- `references/SECURITY.md` - Best practices de seguridad
- `references/ADVANCED_FEATURES.md` - Features avanzadas (S3, Cloudinary, etc.)

## Componentes Incluidos

1. **FileUploadComponent** - Componente principal con UI completa
2. **FilePreviewComponent** - Preview de archivos (imágenes, PDFs, docs)
3. **ProgressBarComponent** - Barra de progreso reutilizable
4. **DragDropDirective** - Directiva para drag & drop
5. **FileUploadService** - Servicio HTTP para multipart uploads
6. **FileValidatorService** - Validación de archivos
7. **Utilities** - File reader, image compression, chunk upload

## Cuándo Usar Este Skill

Usa este skill cuando necesites:
- Upload de archivos con excelente UX
- Drag & drop de archivos
- Progress tracking visual
- Validación de archivos (tipo, tamaño, dimensiones)
- Preview de imágenes/documentos
- Gestión de cola de uploads
- Retry/Cancel de uploads
- Compresión de imágenes
- Upload de archivos grandes con chunks
- Integración con formularios reactivos

## Inicio Rápido

```typescript
// 1. Importar componente
import { FileUploadComponent } from './shared/components/file-upload/file-upload.component';

// 2. Configurar
uploadConfig = {
  multiple: true,
  autoUpload: false,
  validation: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png']
  },
  uploadOptions: {
    url: '/api/upload'
  }
};

// 3. Usar en template
<app-file-upload
  [config]="uploadConfig"
  (filesUploaded)="onFilesUploaded($event)">
</app-file-upload>
```

## Stack Tecnológico

- **Angular 19+** - Framework principal
- **Standalone Components** - Arquitectura moderna
- **Tailwind CSS** - Styling
- **RxJS** - Manejo de observables
- **Signals** - State management
- **TypeScript** - Type safety
- **HttpClient** - HTTP requests con progress tracking

## Seguridad

Este skill incluye:
- Validación de tipos MIME y extensiones
- Sanitización de nombres de archivo
- Límites de tamaño y número de archivos
- DomSanitizer para previews seguros
- Rate limiting (backend)
- Ejemplos de escaneo de virus (backend)

Ver `references/SECURITY.md` para detalles completos.

## Features Avanzadas

El skill también cubre:
- Resume upload (uploads resumables)
- Parallel chunk upload
- Image optimization (WebP conversion)
- EXIF data stripping
- AWS S3 direct upload
- Cloudinary integration
- Client-side encryption
- Paste upload (clipboard)
- Webcam capture

Ver `references/ADVANCED_FEATURES.md` para implementaciones.

## Backend Compatible

Incluye ejemplos completos para:
- Express.js con Multer
- Chunk upload endpoints
- Validación server-side
- Rate limiting
- Error handling

## Testing

Incluye ejemplos de:
- Unit tests con Jasmine/Jest
- Component testing con TestBed
- Service testing con HttpClientTestingModule
- Validation testing

## Soporte

Este skill está optimizado para:
- Angular 19+
- TypeScript 5+
- Tailwind CSS 3+
- Navegadores modernos (Chrome, Firefox, Safari, Edge)

## Autor

Creado para proyectos Angular enterprise-ready con mejores prácticas de la industria.

## Licencia

Úsalo libremente en proyectos personales y comerciales.
