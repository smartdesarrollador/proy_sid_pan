---
name: angular-file-upload
description: >
  Sistema completo de file upload con drag & drop para Angular standalone con Tailwind CSS.
  Usar cuando se necesite implementar upload de archivos a APIs REST (multipart/form-data),
  multiple file selection, drag and drop zone, file preview (imágenes/PDFs/documentos),
  progress tracking con progress bar, validación de tipos MIME y tamaño máximo, thumbnail
  generation para imágenes, remove/retry/cancel uploads, upload queue management, image
  compression, chunk upload para archivos grandes, integración con formularios reactivos,
  o cualquier funcionalidad relacionada con file upload enterprise-ready. Incluye
  FileUploadComponent standalone con Tailwind, FileUploadService para HTTP multipart requests,
  DragDropDirective reutilizable, interfaces tipadas, file reader utilities, validadores,
  error handling específico, y best practices para proyectos Angular 19+ production-ready.
---

# Angular File Upload - Sistema Completo con Drag & Drop

Sistema enterprise-ready de file upload para Angular standalone con drag & drop, progress tracking, previews y validaciones.

## Prerequisitos

```bash
# Opcional para image compression
npm install browser-image-compression

# Opcional para PDF preview
npm install ngx-extended-pdf-viewer

# TypeScript types
npm install --save-dev @types/file-saver
```

## Arquitectura del Sistema

```
file-upload/
├── components/
│   ├── file-upload/
│   │   ├── file-upload.component.ts       # Componente principal
│   │   ├── file-upload.component.html
│   │   └── file-upload.component.css
│   ├── file-preview/
│   │   ├── file-preview.component.ts      # Preview de archivos
│   │   └── file-preview.component.html
│   └── progress-bar/
│       ├── progress-bar.component.ts      # Barra de progreso
│       └── progress-bar.component.html
├── directives/
│   └── drag-drop.directive.ts             # Drag & drop functionality
├── services/
│   ├── file-upload.service.ts             # HTTP multipart requests
│   └── file-validator.service.ts          # Validaciones de archivos
├── models/
│   └── file-upload.models.ts              # Interfaces tipadas
└── utils/
    ├── file-reader.util.ts                # File reading utilities
    ├── image-compression.util.ts          # Image compression
    └── chunk-upload.util.ts               # Chunk upload logic
```

## 1. Interfaces y Modelos Tipados

### file-upload.models.ts

```typescript
// src/app/shared/models/file-upload.models.ts

/**
 * Archivo en la cola de upload con metadata.
 */
export interface UploadFile {
  /** ID único del archivo */
  id: string;
  /** Archivo nativo del navegador */
  file: File;
  /** Estado del upload */
  status: UploadStatus;
  /** Progreso del upload (0-100) */
  progress: number;
  /** URL de preview (para imágenes) */
  previewUrl?: string;
  /** URL del archivo subido (respuesta del servidor) */
  uploadedUrl?: string;
  /** Error si el upload falló */
  error?: string;
  /** Tamaño formateado (ej: "2.5 MB") */
  formattedSize: string;
  /** Timestamp de creación */
  createdAt: Date;
  /** Número de intentos de retry */
  retryCount?: number;
}

/**
 * Estados posibles de un archivo en upload.
 */
export type UploadStatus =
  | 'pending'      // En cola, esperando
  | 'uploading'    // Subiendo actualmente
  | 'success'      // Upload exitoso
  | 'error'        // Error en upload
  | 'cancelled';   // Cancelado por usuario

/**
 * Progreso de upload de un archivo.
 */
export interface UploadProgress {
  /** ID del archivo */
  fileId: string;
  /** Bytes cargados */
  loaded: number;
  /** Total de bytes */
  total: number;
  /** Porcentaje (0-100) */
  percentage: number;
  /** Velocidad de upload (bytes/segundo) */
  speed?: number;
  /** Tiempo restante estimado (segundos) */
  estimatedTime?: number;
}

/**
 * Respuesta del servidor al subir un archivo.
 */
export interface UploadResponse {
  /** URL del archivo subido */
  url: string;
  /** ID del archivo en el servidor */
  fileId: string;
  /** Nombre del archivo */
  filename: string;
  /** Tamaño en bytes */
  size: number;
  /** MIME type */
  mimeType: string;
  /** Metadata adicional */
  metadata?: Record<string, any>;
}

/**
 * Configuración de validación de archivos.
 */
export interface FileValidationConfig {
  /** Tamaño máximo en bytes (default: 10MB) */
  maxSize?: number;
  /** MIME types permitidos */
  allowedTypes?: string[];
  /** Extensiones permitidas */
  allowedExtensions?: string[];
  /** Dimensiones mínimas para imágenes */
  minImageDimensions?: {
    width: number;
    height: number;
  };
  /** Dimensiones máximas para imágenes */
  maxImageDimensions?: {
    width: number;
    height: number;
  };
  /** Número máximo de archivos */
  maxFiles?: number;
}

/**
 * Resultado de validación de un archivo.
 */
export interface FileValidationResult {
  /** Si el archivo es válido */
  valid: boolean;
  /** Errores de validación */
  errors: string[];
}

/**
 * Opciones para upload de archivos.
 */
export interface UploadOptions {
  /** URL del endpoint */
  url: string;
  /** Nombre del campo en FormData (default: 'file') */
  fieldName?: string;
  /** Headers HTTP adicionales */
  headers?: Record<string, string>;
  /** Metadata adicional a enviar */
  metadata?: Record<string, any>;
  /** Comprimir imágenes antes de subir */
  compressImages?: boolean;
  /** Calidad de compresión (0-1, default: 0.8) */
  compressionQuality?: number;
  /** Usar chunk upload para archivos grandes */
  useChunks?: boolean;
  /** Tamaño de cada chunk en bytes (default: 1MB) */
  chunkSize?: number;
  /** Reintentos automáticos en caso de error */
  maxRetries?: number;
}

/**
 * Configuración del componente FileUpload.
 */
export interface FileUploadConfig {
  /** Permitir múltiples archivos */
  multiple?: boolean;
  /** Validación de archivos */
  validation?: FileValidationConfig;
  /** Opciones de upload */
  uploadOptions?: UploadOptions;
  /** Mostrar preview de archivos */
  showPreview?: boolean;
  /** Auto-upload al seleccionar archivos */
  autoUpload?: boolean;
  /** Drag & drop habilitado */
  dragDrop?: boolean;
  /** Textos personalizados */
  labels?: {
    dropZone?: string;
    browse?: string;
    uploading?: string;
    success?: string;
    error?: string;
  };
}
```

## 2. File Upload Service

### file-upload.service.ts

```typescript
// src/app/core/services/file-upload.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpHeaders, HttpRequest } from '@angular/common/http';
import { Observable, Subject, throwError, timer } from 'rxjs';
import { catchError, map, retry, switchMap } from 'rxjs/operators';
import { UploadOptions, UploadProgress, UploadResponse } from '../../shared/models/file-upload.models';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private readonly http = inject(HttpClient);

  /**
   * Sube un archivo al servidor con tracking de progreso.
   *
   * @param file - Archivo a subir
   * @param options - Opciones de configuración
   * @returns Observable con eventos de progreso y respuesta
   *
   * @example
   * ```typescript
   * this.fileUploadService.uploadFile(file, {
   *   url: '/api/upload',
   *   fieldName: 'document',
   *   metadata: { userId: '123' }
   * }).subscribe({
   *   next: (event) => {
   *     if (event.type === 'progress') {
   *       console.log(`Progress: ${event.progress.percentage}%`);
   *     } else if (event.type === 'response') {
   *       console.log('Upload complete:', event.response);
   *     }
   *   },
   *   error: (error) => console.error('Upload failed:', error)
   * });
   * ```
   */
  uploadFile(
    file: File,
    options: UploadOptions
  ): Observable<{ type: 'progress' | 'response'; progress?: UploadProgress; response?: UploadResponse }> {
    const formData = this.createFormData(file, options);
    const headers = new HttpHeaders(options.headers || {});

    const request = new HttpRequest('POST', options.url, formData, {
      headers,
      reportProgress: true, // Habilitar reporte de progreso
      responseType: 'json'
    });

    const startTime = Date.now();
    let lastLoaded = 0;
    let lastTime = startTime;

    return this.http.request<UploadResponse>(request).pipe(
      map((event: HttpEvent<UploadResponse>) => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            const currentTime = Date.now();
            const timeElapsed = (currentTime - lastTime) / 1000; // segundos
            const bytesUploaded = event.loaded - lastLoaded;
            const speed = timeElapsed > 0 ? bytesUploaded / timeElapsed : 0;
            const bytesRemaining = (event.total || 0) - event.loaded;
            const estimatedTime = speed > 0 ? bytesRemaining / speed : 0;

            lastLoaded = event.loaded;
            lastTime = currentTime;

            const progress: UploadProgress = {
              fileId: file.name,
              loaded: event.loaded,
              total: event.total || 0,
              percentage: event.total ? Math.round((event.loaded / event.total) * 100) : 0,
              speed,
              estimatedTime
            };

            return { type: 'progress' as const, progress };

          case HttpEventType.Response:
            return { type: 'response' as const, response: event.body as UploadResponse };

          default:
            return { type: 'progress' as const };
        }
      }),
      retry({
        count: options.maxRetries || 0,
        delay: (error, retryCount) => {
          // Exponential backoff: 1s, 2s, 4s, 8s...
          const delayMs = Math.pow(2, retryCount - 1) * 1000;
          console.log(`Retry ${retryCount} after ${delayMs}ms`);
          return timer(delayMs);
        }
      }),
      catchError((error) => {
        console.error('Upload error:', error);
        return throwError(() => ({
          message: error.error?.message || 'Upload failed',
          status: error.status,
          error: error.error
        }));
      })
    );
  }

  /**
   * Sube múltiples archivos en paralelo.
   *
   * @param files - Array de archivos a subir
   * @param options - Opciones de configuración
   * @returns Observable con progreso agregado de todos los archivos
   */
  uploadMultipleFiles(
    files: File[],
    options: UploadOptions
  ): Observable<Map<string, { progress?: UploadProgress; response?: UploadResponse; error?: any }>> {
    const progressMap = new Map<string, { progress?: UploadProgress; response?: UploadResponse; error?: any }>();
    const subject = new Subject<Map<string, any>>();

    let completedCount = 0;

    files.forEach(file => {
      this.uploadFile(file, options).subscribe({
        next: (event) => {
          if (event.type === 'progress' && event.progress) {
            progressMap.set(file.name, { progress: event.progress });
            subject.next(new Map(progressMap));
          } else if (event.type === 'response' && event.response) {
            progressMap.set(file.name, { response: event.response });
            completedCount++;
            subject.next(new Map(progressMap));

            if (completedCount === files.length) {
              subject.complete();
            }
          }
        },
        error: (error) => {
          progressMap.set(file.name, { error });
          completedCount++;
          subject.next(new Map(progressMap));

          if (completedCount === files.length) {
            subject.complete();
          }
        }
      });
    });

    return subject.asObservable();
  }

  /**
   * Sube un archivo en chunks (para archivos grandes).
   *
   * @param file - Archivo a subir
   * @param options - Opciones con chunkSize
   * @returns Observable con progreso y respuesta
   */
  uploadFileInChunks(
    file: File,
    options: UploadOptions & { chunkSize: number }
  ): Observable<{ type: 'progress' | 'response'; progress?: UploadProgress; response?: UploadResponse }> {
    const chunkSize = options.chunkSize || 1024 * 1024; // 1MB default
    const totalChunks = Math.ceil(file.size / chunkSize);
    const subject = new Subject<{ type: 'progress' | 'response'; progress?: UploadProgress; response?: UploadResponse }>();

    let currentChunk = 0;
    let uploadedBytes = 0;

    const uploadNextChunk = () => {
      if (currentChunk >= totalChunks) {
        // Todos los chunks subidos, finalizar
        subject.next({
          type: 'response',
          response: {
            url: `${options.url}/${file.name}`,
            fileId: file.name,
            filename: file.name,
            size: file.size,
            mimeType: file.type
          }
        });
        subject.complete();
        return;
      }

      const start = currentChunk * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('chunkIndex', currentChunk.toString());
      formData.append('totalChunks', totalChunks.toString());
      formData.append('filename', file.name);

      this.http.post(`${options.url}/chunk`, formData).subscribe({
        next: () => {
          uploadedBytes += chunk.size;
          currentChunk++;

          const progress: UploadProgress = {
            fileId: file.name,
            loaded: uploadedBytes,
            total: file.size,
            percentage: Math.round((uploadedBytes / file.size) * 100)
          };

          subject.next({ type: 'progress', progress });
          uploadNextChunk();
        },
        error: (error) => {
          subject.error(error);
        }
      });
    };

    uploadNextChunk();
    return subject.asObservable();
  }

  /**
   * Crea FormData con el archivo y metadata.
   */
  private createFormData(file: File, options: UploadOptions): FormData {
    const formData = new FormData();
    const fieldName = options.fieldName || 'file';

    formData.append(fieldName, file, file.name);

    // Agregar metadata adicional
    if (options.metadata) {
      Object.entries(options.metadata).forEach(([key, value]) => {
        formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
      });
    }

    return formData;
  }
}
```

## 3. File Validator Service

### file-validator.service.ts

```typescript
// src/app/core/services/file-validator.service.ts
import { Injectable } from '@angular/core';
import { FileValidationConfig, FileValidationResult } from '../../shared/models/file-upload.models';

@Injectable({
  providedIn: 'root'
})
export class FileValidatorService {
  /**
   * Valida un archivo según la configuración proporcionada.
   *
   * @param file - Archivo a validar
   * @param config - Configuración de validación
   * @returns Resultado de validación con errores
   *
   * @example
   * ```typescript
   * const result = this.validator.validateFile(file, {
   *   maxSize: 5 * 1024 * 1024, // 5MB
   *   allowedTypes: ['image/jpeg', 'image/png'],
   *   allowedExtensions: ['.jpg', '.jpeg', '.png']
   * });
   *
   * if (!result.valid) {
   *   console.error('Validation errors:', result.errors);
   * }
   * ```
   */
  validateFile(file: File, config: FileValidationConfig): FileValidationResult {
    const errors: string[] = [];

    // Validar tamaño
    if (config.maxSize && file.size > config.maxSize) {
      const maxSizeMB = (config.maxSize / (1024 * 1024)).toFixed(2);
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      errors.push(`El archivo excede el tamaño máximo permitido de ${maxSizeMB} MB (tamaño actual: ${fileSizeMB} MB)`);
    }

    // Validar tipo MIME
    if (config.allowedTypes && config.allowedTypes.length > 0) {
      if (!config.allowedTypes.includes(file.type)) {
        errors.push(`Tipo de archivo no permitido: ${file.type}. Tipos permitidos: ${config.allowedTypes.join(', ')}`);
      }
    }

    // Validar extensión
    if (config.allowedExtensions && config.allowedExtensions.length > 0) {
      const extension = this.getFileExtension(file.name);
      if (!config.allowedExtensions.includes(extension)) {
        errors.push(`Extensión no permitida: ${extension}. Extensiones permitidas: ${config.allowedExtensions.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida dimensiones de una imagen.
   *
   * @param file - Archivo de imagen
   * @param config - Configuración con dimensiones min/max
   * @returns Promise con resultado de validación
   */
  async validateImageDimensions(
    file: File,
    config: FileValidationConfig
  ): Promise<FileValidationResult> {
    const errors: string[] = [];

    if (!file.type.startsWith('image/')) {
      errors.push('El archivo no es una imagen');
      return { valid: false, errors };
    }

    try {
      const dimensions = await this.getImageDimensions(file);

      if (config.minImageDimensions) {
        if (dimensions.width < config.minImageDimensions.width ||
            dimensions.height < config.minImageDimensions.height) {
          errors.push(
            `La imagen es muy pequeña. Mínimo requerido: ${config.minImageDimensions.width}x${config.minImageDimensions.height}px, ` +
            `tamaño actual: ${dimensions.width}x${dimensions.height}px`
          );
        }
      }

      if (config.maxImageDimensions) {
        if (dimensions.width > config.maxImageDimensions.width ||
            dimensions.height > config.maxImageDimensions.height) {
          errors.push(
            `La imagen es muy grande. Máximo permitido: ${config.maxImageDimensions.width}x${config.maxImageDimensions.height}px, ` +
            `tamaño actual: ${dimensions.width}x${dimensions.height}px`
          );
        }
      }
    } catch (error) {
      errors.push('Error al leer las dimensiones de la imagen');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida múltiples archivos.
   */
  validateFiles(files: File[], config: FileValidationConfig): Map<string, FileValidationResult> {
    const results = new Map<string, FileValidationResult>();

    // Validar número máximo de archivos
    if (config.maxFiles && files.length > config.maxFiles) {
      const globalError: FileValidationResult = {
        valid: false,
        errors: [`Se permiten máximo ${config.maxFiles} archivos. Seleccionaste ${files.length}`]
      };
      results.set('_global', globalError);
      return results;
    }

    // Validar cada archivo individualmente
    files.forEach(file => {
      const result = this.validateFile(file, config);
      results.set(file.name, result);
    });

    return results;
  }

  /**
   * Obtiene dimensiones de una imagen.
   */
  private getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          resolve({
            width: img.width,
            height: img.height
          });
        };

        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };

        img.src = e.target?.result as string;
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Obtiene la extensión de un archivo.
   */
  private getFileExtension(filename: string): string {
    return '.' + filename.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Formatea el tamaño de un archivo en formato legible.
   *
   * @param bytes - Tamaño en bytes
   * @returns String formateado (ej: "2.5 MB")
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
```

## 4. Drag & Drop Directive

### drag-drop.directive.ts

```typescript
// src/app/shared/directives/drag-drop.directive.ts
import { Directive, EventEmitter, HostListener, Output, HostBinding, Input } from '@angular/core';

/**
 * Directiva para habilitar drag & drop de archivos.
 *
 * @example
 * ```html
 * <div appDragDrop
 *      (filesDropped)="onFilesDropped($event)"
 *      [disabled]="isUploading">
 *   Drop files here
 * </div>
 * ```
 */
@Directive({
  selector: '[appDragDrop]',
  standalone: true
})
export class DragDropDirective {
  /** Emite archivos cuando se sueltan */
  @Output() filesDropped = new EventEmitter<File[]>();

  /** Deshabilitar drag & drop */
  @Input() disabled = false;

  /** Clase CSS cuando se arrastra sobre el elemento */
  @HostBinding('class.drag-over') isDragOver = false;

  /**
   * Maneja el evento dragover.
   */
  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    if (this.disabled) return;

    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  /**
   * Maneja el evento dragleave.
   */
  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent): void {
    if (this.disabled) return;

    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  /**
   * Maneja el evento drop.
   */
  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): void {
    if (this.disabled) return;

    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      this.filesDropped.emit(fileArray);
    }
  }
}
```

## 5. Progress Bar Component

### progress-bar.component.ts

```typescript
// src/app/shared/components/progress-bar/progress-bar.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Componente de barra de progreso reutilizable.
 *
 * @example
 * ```html
 * <app-progress-bar
 *   [progress]="uploadProgress"
 *   [showPercentage]="true"
 *   [color]="'blue'"
 *   [animated]="true">
 * </app-progress-bar>
 * ```
 */
@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full">
      <!-- Progress bar container -->
      <div class="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          class="absolute top-0 left-0 h-full transition-all duration-300 ease-out rounded-full"
          [class.animate-pulse]="animated && progress < 100"
          [ngClass]="colorClasses"
          [style.width.%]="progress">
        </div>
      </div>

      <!-- Percentage text -->
      <div *ngIf="showPercentage" class="mt-1 text-sm text-gray-600 text-right">
        {{ progress }}%
      </div>

      <!-- Speed and estimated time -->
      <div *ngIf="showDetails && (speed || estimatedTime)" class="mt-1 flex justify-between text-xs text-gray-500">
        <span *ngIf="speed">{{ formatSpeed(speed) }}</span>
        <span *ngIf="estimatedTime">{{ formatTime(estimatedTime) }} restante</span>
      </div>
    </div>
  `,
  styles: [`
    .animate-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.8;
      }
    }
  `]
})
export class ProgressBarComponent {
  /** Progreso actual (0-100) */
  @Input() progress = 0;

  /** Mostrar porcentaje */
  @Input() showPercentage = true;

  /** Mostrar detalles (velocidad, tiempo) */
  @Input() showDetails = false;

  /** Color de la barra */
  @Input() color: 'blue' | 'green' | 'red' | 'yellow' = 'blue';

  /** Animación pulsante */
  @Input() animated = true;

  /** Velocidad de upload (bytes/segundo) */
  @Input() speed?: number;

  /** Tiempo estimado restante (segundos) */
  @Input() estimatedTime?: number;

  /**
   * Clases CSS para el color de la barra.
   */
  get colorClasses(): string {
    const colors = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      red: 'bg-red-500',
      yellow: 'bg-yellow-500'
    };
    return colors[this.color];
  }

  /**
   * Formatea la velocidad de upload.
   */
  formatSpeed(bytesPerSecond: number): string {
    const kbps = bytesPerSecond / 1024;
    const mbps = kbps / 1024;

    if (mbps >= 1) {
      return `${mbps.toFixed(2)} MB/s`;
    } else {
      return `${kbps.toFixed(2)} KB/s`;
    }
  }

  /**
   * Formatea el tiempo restante.
   */
  formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes}m ${Math.round(seconds % 60)}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  }
}
```

## 6. File Preview Component

### file-preview.component.ts

```typescript
// src/app/shared/components/file-preview/file-preview.component.ts
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

/**
 * Componente para preview de archivos (imágenes, PDFs, documentos).
 *
 * @example
 * ```html
 * <app-file-preview
 *   [file]="selectedFile"
 *   [type]="'image'"
 *   [size]="'large'">
 * </app-file-preview>
 * ```
 */
@Component({
  selector: 'app-file-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="file-preview" [ngClass]="sizeClasses">
      <!-- Image preview -->
      <div *ngIf="isImage" class="relative w-full h-full">
        <img
          [src]="previewUrl"
          [alt]="file?.name || 'Preview'"
          class="w-full h-full object-cover rounded-lg"
          (error)="onImageError()" />

        <div *ngIf="loading"
             class="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>

      <!-- PDF preview -->
      <div *ngIf="isPdf" class="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div class="text-center p-4">
          <svg class="w-16 h-16 mx-auto text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/>
          </svg>
          <p class="mt-2 text-sm font-medium text-gray-700">{{ file?.name }}</p>
          <p class="text-xs text-gray-500">PDF Document</p>
        </div>
      </div>

      <!-- Generic file preview -->
      <div *ngIf="!isImage && !isPdf" class="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div class="text-center p-4">
          <svg class="w-16 h-16 mx-auto text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/>
          </svg>
          <p class="mt-2 text-sm font-medium text-gray-700 truncate max-w-full">{{ file?.name }}</p>
          <p class="text-xs text-gray-500">{{ fileExtension }}</p>
        </div>
      </div>

      <!-- Error state -->
      <div *ngIf="error" class="w-full h-full flex items-center justify-center bg-red-50 rounded-lg">
        <div class="text-center p-4">
          <svg class="w-16 h-16 mx-auto text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
          </svg>
          <p class="mt-2 text-sm text-red-600">Error al cargar el preview</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .file-preview {
      @apply overflow-hidden;
    }
  `]
})
export class FilePreviewComponent implements OnInit, OnDestroy {
  /** Archivo a previsualizar */
  @Input() file?: File;

  /** URL de preview (alternativa a file) */
  @Input() url?: string;

  /** Tipo de archivo */
  @Input() type?: 'image' | 'pdf' | 'document';

  /** Tamaño del preview */
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  previewUrl?: SafeUrl;
  loading = true;
  error = false;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    if (this.url) {
      this.previewUrl = this.sanitizer.bypassSecurityTrustUrl(this.url);
      this.loading = false;
    } else if (this.file) {
      this.generatePreview();
    }
  }

  ngOnDestroy(): void {
    // Limpiar URL temporal
    if (this.previewUrl && typeof this.previewUrl === 'string' && this.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.previewUrl);
    }
  }

  /**
   * Genera preview del archivo.
   */
  private generatePreview(): void {
    if (!this.file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result as string;
      this.previewUrl = this.sanitizer.bypassSecurityTrustUrl(result);
      this.loading = false;
    };

    reader.onerror = () => {
      this.error = true;
      this.loading = false;
    };

    reader.readAsDataURL(this.file);
  }

  /**
   * Maneja error al cargar imagen.
   */
  onImageError(): void {
    this.error = true;
    this.loading = false;
  }

  /**
   * Verifica si es imagen.
   */
  get isImage(): boolean {
    if (this.type === 'image') return true;
    return this.file?.type.startsWith('image/') || false;
  }

  /**
   * Verifica si es PDF.
   */
  get isPdf(): boolean {
    if (this.type === 'pdf') return true;
    return this.file?.type === 'application/pdf' || false;
  }

  /**
   * Obtiene extensión del archivo.
   */
  get fileExtension(): string {
    if (!this.file) return '';
    return this.file.name.split('.').pop()?.toUpperCase() || '';
  }

  /**
   * Clases CSS para el tamaño.
   */
  get sizeClasses(): string {
    const sizes = {
      small: 'w-20 h-20',
      medium: 'w-40 h-40',
      large: 'w-full h-64'
    };
    return sizes[this.size];
  }
}
```

## 7. File Upload Component (Main Component)

### file-upload.component.ts

```typescript
// src/app/shared/components/file-upload/file-upload.component.ts
import { Component, Input, Output, EventEmitter, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropDirective } from '../../directives/drag-drop.directive';
import { ProgressBarComponent } from '../progress-bar/progress-bar.component';
import { FilePreviewComponent } from '../file-preview/file-preview.component';
import { FileUploadService } from '../../../core/services/file-upload.service';
import { FileValidatorService } from '../../../core/services/file-validator.service';
import {
  UploadFile,
  FileUploadConfig,
  UploadOptions,
  UploadStatus
} from '../../models/file-upload.models';

/**
 * Componente principal de File Upload con drag & drop.
 *
 * @example
 * ```html
 * <app-file-upload
 *   [config]="uploadConfig"
 *   (filesUploaded)="onFilesUploaded($event)"
 *   (uploadError)="onUploadError($event)">
 * </app-file-upload>
 * ```
 */
@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropDirective,
    ProgressBarComponent,
    FilePreviewComponent
  ],
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent implements OnInit {
  /** Configuración del componente */
  @Input() config: FileUploadConfig = {};

  /** Emite cuando archivos se suben exitosamente */
  @Output() filesUploaded = new EventEmitter<UploadFile[]>();

  /** Emite cuando hay error en upload */
  @Output() uploadError = new EventEmitter<{ file: UploadFile; error: any }>();

  /** Emite cuando se seleccionan archivos */
  @Output() filesSelected = new EventEmitter<File[]>();

  /** Emite cuando se remueve un archivo */
  @Output() fileRemoved = new EventEmitter<UploadFile>();

  /** Cola de archivos */
  files = signal<UploadFile[]>([]);

  /** Archivos en upload */
  uploadingFiles = computed(() =>
    this.files().filter(f => f.status === 'uploading')
  );

  /** Archivos completados */
  completedFiles = computed(() =>
    this.files().filter(f => f.status === 'success')
  );

  /** Archivos con error */
  errorFiles = computed(() =>
    this.files().filter(f => f.status === 'error')
  );

  /** Progreso total */
  totalProgress = computed(() => {
    const allFiles = this.files();
    if (allFiles.length === 0) return 0;

    const totalProgress = allFiles.reduce((sum, file) => sum + file.progress, 0);
    return Math.round(totalProgress / allFiles.length);
  });

  constructor(
    private uploadService: FileUploadService,
    private validatorService: FileValidatorService
  ) {}

  ngOnInit(): void {
    // Configuración por defecto
    this.config = {
      multiple: true,
      autoUpload: false,
      showPreview: true,
      dragDrop: true,
      validation: {
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: [],
        maxFiles: 10
      },
      uploadOptions: {
        url: '/api/upload',
        fieldName: 'file',
        maxRetries: 3
      },
      labels: {
        dropZone: 'Arrastra archivos aquí o haz clic para seleccionar',
        browse: 'Seleccionar archivos',
        uploading: 'Subiendo...',
        success: 'Upload exitoso',
        error: 'Error en upload'
      },
      ...this.config
    };
  }

  /**
   * Maneja la selección de archivos desde el input.
   */
  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);
      this.handleFiles(files);
      input.value = ''; // Reset input
    }
  }

  /**
   * Maneja archivos desde drag & drop.
   */
  onFilesDropped(files: File[]): void {
    this.handleFiles(files);
  }

  /**
   * Procesa archivos seleccionados o dropeados.
   */
  private async handleFiles(files: File[]): Promise<void> {
    // Validar archivos
    const validationResults = this.validatorService.validateFiles(
      files,
      this.config.validation!
    );

    // Verificar error global (ej: maxFiles excedido)
    const globalError = validationResults.get('_global');
    if (globalError && !globalError.valid) {
      alert(globalError.errors.join('\n'));
      return;
    }

    // Crear UploadFile objects
    const uploadFiles: UploadFile[] = [];

    for (const file of files) {
      const validation = validationResults.get(file.name);

      if (validation && !validation.valid) {
        // Mostrar errores de validación
        alert(`${file.name}:\n${validation.errors.join('\n')}`);
        continue;
      }

      const uploadFile: UploadFile = {
        id: this.generateId(),
        file,
        status: 'pending',
        progress: 0,
        formattedSize: this.validatorService.formatFileSize(file.size),
        createdAt: new Date(),
        retryCount: 0
      };

      // Generar preview para imágenes
      if (file.type.startsWith('image/') && this.config.showPreview) {
        uploadFile.previewUrl = await this.generatePreviewUrl(file);
      }

      uploadFiles.push(uploadFile);
    }

    // Agregar a la cola
    this.files.update(current => [...current, ...uploadFiles]);

    // Emitir evento
    this.filesSelected.emit(files);

    // Auto-upload si está habilitado
    if (this.config.autoUpload) {
      uploadFiles.forEach(f => this.uploadFile(f));
    }
  }

  /**
   * Sube un archivo.
   */
  uploadFile(uploadFile: UploadFile): void {
    // Actualizar estado a uploading
    this.updateFileStatus(uploadFile.id, 'uploading');

    const options: UploadOptions = {
      ...this.config.uploadOptions!,
      metadata: {
        originalName: uploadFile.file.name,
        size: uploadFile.file.size,
        type: uploadFile.file.type
      }
    };

    this.uploadService.uploadFile(uploadFile.file, options).subscribe({
      next: (event) => {
        if (event.type === 'progress' && event.progress) {
          this.updateFileProgress(uploadFile.id, event.progress.percentage);
        } else if (event.type === 'response' && event.response) {
          this.updateFileStatus(uploadFile.id, 'success');
          this.updateFileUrl(uploadFile.id, event.response.url);

          const file = this.files().find(f => f.id === uploadFile.id);
          if (file) {
            this.filesUploaded.emit([file]);
          }
        }
      },
      error: (error) => {
        this.updateFileStatus(uploadFile.id, 'error');
        this.updateFileError(uploadFile.id, error.message || 'Upload failed');

        const file = this.files().find(f => f.id === uploadFile.id);
        if (file) {
          this.uploadError.emit({ file, error });
        }
      }
    });
  }

  /**
   * Sube todos los archivos pendientes.
   */
  uploadAll(): void {
    const pendingFiles = this.files().filter(f => f.status === 'pending');
    pendingFiles.forEach(f => this.uploadFile(f));
  }

  /**
   * Reintenta subir un archivo fallido.
   */
  retryUpload(uploadFile: UploadFile): void {
    if (uploadFile.status !== 'error') return;

    // Incrementar contador de retry
    const maxRetries = this.config.uploadOptions?.maxRetries || 3;
    const retryCount = (uploadFile.retryCount || 0) + 1;

    if (retryCount > maxRetries) {
      alert(`Máximo de reintentos alcanzado (${maxRetries})`);
      return;
    }

    this.updateFileRetryCount(uploadFile.id, retryCount);
    this.uploadFile(uploadFile);
  }

  /**
   * Remueve un archivo de la cola.
   */
  removeFile(uploadFile: UploadFile): void {
    // No permitir remover archivos en upload
    if (uploadFile.status === 'uploading') {
      alert('No se puede remover un archivo mientras se está subiendo. Cancela el upload primero.');
      return;
    }

    this.files.update(current => current.filter(f => f.id !== uploadFile.id));

    // Limpiar preview URL
    if (uploadFile.previewUrl) {
      URL.revokeObjectURL(uploadFile.previewUrl);
    }

    this.fileRemoved.emit(uploadFile);
  }

  /**
   * Cancela el upload de un archivo.
   * TODO: Implementar cancelación real con AbortController
   */
  cancelUpload(uploadFile: UploadFile): void {
    if (uploadFile.status !== 'uploading') return;

    this.updateFileStatus(uploadFile.id, 'cancelled');
    alert('Cancelación de upload aún no implementada completamente');
  }

  /**
   * Limpia todos los archivos.
   */
  clearAll(): void {
    this.files().forEach(f => {
      if (f.previewUrl) {
        URL.revokeObjectURL(f.previewUrl);
      }
    });

    this.files.set([]);
  }

  /**
   * Genera preview URL para un archivo.
   */
  private generatePreviewUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Actualiza el estado de un archivo.
   */
  private updateFileStatus(id: string, status: UploadStatus): void {
    this.files.update(current =>
      current.map(f => f.id === id ? { ...f, status } : f)
    );
  }

  /**
   * Actualiza el progreso de un archivo.
   */
  private updateFileProgress(id: string, progress: number): void {
    this.files.update(current =>
      current.map(f => f.id === id ? { ...f, progress } : f)
    );
  }

  /**
   * Actualiza la URL subida de un archivo.
   */
  private updateFileUrl(id: string, url: string): void {
    this.files.update(current =>
      current.map(f => f.id === id ? { ...f, uploadedUrl: url } : f)
    );
  }

  /**
   * Actualiza el error de un archivo.
   */
  private updateFileError(id: string, error: string): void {
    this.files.update(current =>
      current.map(f => f.id === id ? { ...f, error } : f)
    );
  }

  /**
   * Actualiza el contador de retry.
   */
  private updateFileRetryCount(id: string, retryCount: number): void {
    this.files.update(current =>
      current.map(f => f.id === id ? { ...f, retryCount } : f)
    );
  }

  /**
   * Genera ID único.
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obtiene el icono según el estado.
   */
  getStatusIcon(status: UploadStatus): string {
    const icons = {
      pending: '⏳',
      uploading: '⬆️',
      success: '✅',
      error: '❌',
      cancelled: '🚫'
    };
    return icons[status];
  }
}
```

### file-upload.component.html

```html
<!-- src/app/shared/components/file-upload/file-upload.component.html -->

<div class="file-upload-container space-y-4">
  <!-- Drag & Drop Zone -->
  <div
    *ngIf="config.dragDrop"
    appDragDrop
    (filesDropped)="onFilesDropped($event)"
    [disabled]="uploadingFiles().length > 0"
    class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-blue-400 hover:bg-blue-50">

    <!-- Icon -->
    <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>

    <!-- Text -->
    <p class="mt-2 text-sm text-gray-600">
      {{ config.labels?.dropZone }}
    </p>

    <!-- File input -->
    <input
      #fileInput
      type="file"
      class="hidden"
      [accept]="config.validation?.allowedTypes?.join(',') || '*'"
      [multiple]="config.multiple"
      (change)="onFileSelect($event)" />

    <!-- Browse button -->
    <button
      type="button"
      (click)="fileInput.click()"
      class="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
      {{ config.labels?.browse }}
    </button>

    <!-- Validation info -->
    <div class="mt-4 text-xs text-gray-500">
      <p *ngIf="config.validation?.maxSize">
        Tamaño máximo: {{ validatorService.formatFileSize(config.validation.maxSize) }}
      </p>
      <p *ngIf="config.validation?.allowedExtensions && config.validation.allowedExtensions.length > 0">
        Formatos permitidos: {{ config.validation.allowedExtensions.join(', ') }}
      </p>
      <p *ngIf="config.validation?.maxFiles">
        Máximo {{ config.validation.maxFiles }} archivos
      </p>
    </div>
  </div>

  <!-- Upload All Button -->
  <div *ngIf="!config.autoUpload && files().length > 0" class="flex gap-2">
    <button
      type="button"
      (click)="uploadAll()"
      [disabled]="uploadingFiles().length > 0"
      class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">
      Subir todos ({{ files().filter(f => f.status === 'pending').length }})
    </button>

    <button
      type="button"
      (click)="clearAll()"
      [disabled]="uploadingFiles().length > 0"
      class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">
      Limpiar todos
    </button>
  </div>

  <!-- Total Progress -->
  <div *ngIf="uploadingFiles().length > 0" class="space-y-2">
    <p class="text-sm font-medium text-gray-700">
      Subiendo {{ uploadingFiles().length }} archivo(s)...
    </p>
    <app-progress-bar
      [progress]="totalProgress()"
      [color]="'blue'"
      [showPercentage]="true"
      [animated]="true">
    </app-progress-bar>
  </div>

  <!-- File List -->
  <div *ngIf="files().length > 0" class="space-y-3">
    <h3 class="text-sm font-medium text-gray-700">
      Archivos ({{ files().length }})
    </h3>

    <div class="space-y-2">
      <div
        *ngFor="let uploadFile of files()"
        class="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">

        <!-- Preview -->
        <div *ngIf="config.showPreview && uploadFile.previewUrl" class="flex-shrink-0">
          <app-file-preview
            [file]="uploadFile.file"
            [url]="uploadFile.previewUrl"
            [size]="'small'">
          </app-file-preview>
        </div>

        <!-- Icon (si no hay preview) -->
        <div *ngIf="!config.showPreview || !uploadFile.previewUrl"
             class="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg">
          <svg class="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/>
          </svg>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <p class="text-sm font-medium text-gray-900 truncate">
              {{ uploadFile.file.name }}
            </p>
            <span class="text-2xl">{{ getStatusIcon(uploadFile.status) }}</span>
          </div>

          <p class="text-xs text-gray-500">
            {{ uploadFile.formattedSize }}
            <span *ngIf="uploadFile.retryCount && uploadFile.retryCount > 0">
              • Reintento {{ uploadFile.retryCount }}
            </span>
          </p>

          <!-- Progress bar -->
          <div *ngIf="uploadFile.status === 'uploading'" class="mt-2">
            <app-progress-bar
              [progress]="uploadFile.progress"
              [color]="'blue'"
              [showPercentage]="true"
              [animated]="true"
              [showDetails]="false">
            </app-progress-bar>
          </div>

          <!-- Error message -->
          <p *ngIf="uploadFile.status === 'error' && uploadFile.error"
             class="mt-1 text-xs text-red-600">
            {{ uploadFile.error }}
          </p>

          <!-- Success message -->
          <p *ngIf="uploadFile.status === 'success'"
             class="mt-1 text-xs text-green-600">
            {{ config.labels?.success }}
          </p>
        </div>

        <!-- Actions -->
        <div class="flex-shrink-0 flex items-center gap-2">
          <!-- Upload button (si no es auto-upload) -->
          <button
            *ngIf="!config.autoUpload && uploadFile.status === 'pending'"
            type="button"
            (click)="uploadFile(uploadFile)"
            class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Subir">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
            </svg>
          </button>

          <!-- Cancel button -->
          <button
            *ngIf="uploadFile.status === 'uploading'"
            type="button"
            (click)="cancelUpload(uploadFile)"
            class="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
            title="Cancelar">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>

          <!-- Retry button -->
          <button
            *ngIf="uploadFile.status === 'error'"
            type="button"
            (click)="retryUpload(uploadFile)"
            class="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            title="Reintentar">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </button>

          <!-- Remove button -->
          <button
            type="button"
            (click)="removeFile(uploadFile)"
            [disabled]="uploadFile.status === 'uploading'"
            class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
            title="Eliminar">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Summary -->
  <div *ngIf="files().length > 0" class="flex gap-4 text-sm text-gray-600 border-t pt-4">
    <div class="flex items-center gap-1">
      <span class="font-medium">Total:</span>
      <span>{{ files().length }}</span>
    </div>
    <div *ngIf="uploadingFiles().length > 0" class="flex items-center gap-1">
      <span class="font-medium">Subiendo:</span>
      <span>{{ uploadingFiles().length }}</span>
    </div>
    <div *ngIf="completedFiles().length > 0" class="flex items-center gap-1">
      <span class="font-medium text-green-600">Completados:</span>
      <span>{{ completedFiles().length }}</span>
    </div>
    <div *ngIf="errorFiles().length > 0" class="flex items-center gap-1">
      <span class="font-medium text-red-600">Errores:</span>
      <span>{{ errorFiles().length }}</span>
    </div>
  </div>
</div>
```

### file-upload.component.css

```css
/* src/app/shared/components/file-upload/file-upload.component.css */

.file-upload-container {
  @apply w-full;
}

/* Drag over state */
:host ::ng-deep .drag-over {
  @apply border-blue-500 bg-blue-100;
}
```

## 8. Utility Functions

### file-reader.util.ts

```typescript
// src/app/shared/utils/file-reader.util.ts

/**
 * Utilidades para lectura de archivos.
 */
export class FileReaderUtil {
  /**
   * Lee un archivo como Data URL (base64).
   */
  static readAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Lee un archivo como texto.
   */
  static readAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Lee un archivo como ArrayBuffer.
   */
  static readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        resolve(e.target?.result as ArrayBuffer);
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Genera thumbnail para una imagen.
   */
  static async generateThumbnail(
    file: File,
    maxWidth: number = 200,
    maxHeight: number = 200,
    quality: number = 0.8
  ): Promise<Blob> {
    const dataUrl = await this.readAsDataURL(file);

    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calcular nuevas dimensiones manteniendo aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = height * (maxWidth / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = width * (maxHeight / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = dataUrl;
    });
  }

  /**
   * Convierte Data URL a Blob.
   */
  static dataURLtoBlob(dataUrl: string): Blob {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || '';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new Blob([u8arr], { type: mime });
  }

  /**
   * Convierte Blob a Data URL.
   */
  static blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };

      reader.onerror = () => {
        reject(new Error('Failed to read blob'));
      };

      reader.readAsDataURL(blob);
    });
  }
}
```

### image-compression.util.ts

```typescript
// src/app/shared/utils/image-compression.util.ts

/**
 * Utilidades para compresión de imágenes.
 */
export class ImageCompressionUtil {
  /**
   * Comprime una imagen reduciendo su calidad y/o dimensiones.
   *
   * @param file - Archivo de imagen a comprimir
   * @param options - Opciones de compresión
   * @returns Promise con archivo comprimido
   *
   * @example
   * ```typescript
   * const compressed = await ImageCompressionUtil.compressImage(file, {
   *   maxWidth: 1920,
   *   maxHeight: 1080,
   *   quality: 0.8
   * });
   * ```
   */
  static async compressImage(
    file: File,
    options: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
      mimeType?: string;
    } = {}
  ): Promise<File> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      mimeType = file.type
    } = options;

    // Leer imagen
    const dataUrl = await this.readFileAsDataURL(file);

    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calcular nuevas dimensiones
        if (width > maxWidth) {
          height = height * (maxWidth / width);
          width = maxWidth;
        }

        if (height > maxHeight) {
          width = width * (maxHeight / height);
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: mimeType,
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          mimeType,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = dataUrl;
    });
  }

  /**
   * Lee archivo como Data URL.
   */
  private static readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Calcula el ratio de compresión.
   */
  static calculateCompressionRatio(originalSize: number, compressedSize: number): number {
    return ((originalSize - compressedSize) / originalSize) * 100;
  }
}
```

## 9. Ejemplos de Uso

### Ejemplo 1: Upload Básico

```typescript
// app.component.ts
import { Component } from '@angular/core';
import { FileUploadComponent } from './shared/components/file-upload/file-upload.component';
import { FileUploadConfig, UploadFile } from './shared/models/file-upload.models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FileUploadComponent],
  template: `
    <div class="container mx-auto p-8">
      <h1 class="text-2xl font-bold mb-4">File Upload Example</h1>

      <app-file-upload
        [config]="uploadConfig"
        (filesUploaded)="onFilesUploaded($event)"
        (uploadError)="onUploadError($event)">
      </app-file-upload>
    </div>
  `
})
export class AppComponent {
  uploadConfig: FileUploadConfig = {
    multiple: true,
    autoUpload: false,
    showPreview: true,
    dragDrop: true,
    validation: {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.pdf'],
      maxFiles: 5
    },
    uploadOptions: {
      url: '/api/upload',
      fieldName: 'document',
      maxRetries: 3
    }
  };

  onFilesUploaded(files: UploadFile[]): void {
    console.log('Files uploaded successfully:', files);
    files.forEach(f => {
      console.log(`${f.file.name} uploaded to ${f.uploadedUrl}`);
    });
  }

  onUploadError(event: { file: UploadFile; error: any }): void {
    console.error('Upload error:', event);
    alert(`Error uploading ${event.file.file.name}: ${event.error.message}`);
  }
}
```

### Ejemplo 2: Upload de Imágenes con Compresión

```typescript
// image-upload.component.ts
import { Component } from '@angular/core';
import { FileUploadComponent } from './shared/components/file-upload/file-upload.component';
import { FileUploadConfig } from './shared/models/file-upload.models';
import { ImageCompressionUtil } from './shared/utils/image-compression.util';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [FileUploadComponent],
  template: `
    <app-file-upload
      [config]="uploadConfig"
      (filesSelected)="onFilesSelected($event)"
      (filesUploaded)="onFilesUploaded($event)">
    </app-file-upload>
  `
})
export class ImageUploadComponent {
  uploadConfig: FileUploadConfig = {
    multiple: true,
    autoUpload: true,
    showPreview: true,
    validation: {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      minImageDimensions: { width: 800, height: 600 },
      maxImageDimensions: { width: 4000, height: 3000 }
    },
    uploadOptions: {
      url: '/api/images/upload',
      compressImages: true,
      compressionQuality: 0.8
    }
  };

  async onFilesSelected(files: File[]): Promise<void> {
    console.log('Files selected:', files);

    // Comprimir imágenes antes de subir
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const compressed = await ImageCompressionUtil.compressImage(file, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.8
        });

        const ratio = ImageCompressionUtil.calculateCompressionRatio(file.size, compressed.size);
        console.log(`Compressed ${file.name}: ${ratio.toFixed(2)}% reduction`);
      }
    }
  }

  onFilesUploaded(files: any[]): void {
    console.log('Images uploaded:', files);
  }
}
```

### Ejemplo 3: Upload en Formulario Reactivo

```typescript
// profile-form.component.ts
import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FileUploadComponent } from './shared/components/file-upload/file-upload.component';
import { UploadFile } from './shared/models/file-upload.models';

@Component({
  selector: 'app-profile-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FileUploadComponent],
  template: `
    <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="max-w-2xl mx-auto p-8 space-y-6">
      <h2 class="text-2xl font-bold">Perfil de Usuario</h2>

      <!-- Name -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
        <input
          type="text"
          formControlName="name"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
      </div>

      <!-- Avatar Upload -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Avatar</label>
        <app-file-upload
          [config]="avatarConfig"
          (filesUploaded)="onAvatarUploaded($event)">
        </app-file-upload>
      </div>

      <!-- Documents Upload -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Documentos</label>
        <app-file-upload
          [config]="documentsConfig"
          (filesUploaded)="onDocumentsUploaded($event)">
        </app-file-upload>
      </div>

      <!-- Submit -->
      <button
        type="submit"
        [disabled]="profileForm.invalid || isSubmitting()"
        class="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed">
        {{ isSubmitting() ? 'Guardando...' : 'Guardar Perfil' }}
      </button>
    </form>
  `
})
export class ProfileFormComponent {
  profileForm: FormGroup;
  isSubmitting = signal(false);

  avatarConfig = {
    multiple: false,
    autoUpload: true,
    showPreview: true,
    validation: {
      maxSize: 2 * 1024 * 1024, // 2MB
      allowedTypes: ['image/jpeg', 'image/png'],
      maxFiles: 1
    },
    uploadOptions: {
      url: '/api/avatar/upload'
    }
  };

  documentsConfig = {
    multiple: true,
    autoUpload: false,
    showPreview: true,
    validation: {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
      maxFiles: 5
    },
    uploadOptions: {
      url: '/api/documents/upload'
    }
  };

  constructor(private fb: FormBuilder) {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      avatarUrl: [''],
      documentUrls: [[]]
    });
  }

  onAvatarUploaded(files: UploadFile[]): void {
    if (files.length > 0) {
      this.profileForm.patchValue({
        avatarUrl: files[0].uploadedUrl
      });
    }
  }

  onDocumentsUploaded(files: UploadFile[]): void {
    const urls = files.map(f => f.uploadedUrl);
    this.profileForm.patchValue({
      documentUrls: urls
    });
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      this.isSubmitting.set(true);

      const formData = this.profileForm.value;
      console.log('Submitting profile:', formData);

      // Simular API call
      setTimeout(() => {
        this.isSubmitting.set(false);
        alert('Perfil guardado exitosamente');
      }, 2000);
    }
  }
}
```

## 10. Backend Example (Express.js)

### upload.controller.js

```javascript
// backend/controllers/upload.controller.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// Filtro de archivos
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG and PDF are allowed.'));
  }
};

// Configuración de multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: fileFilter
});

// Endpoint para upload simple
exports.uploadSingle = upload.single('file');

exports.handleSingleUpload = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const response = {
      url: `/uploads/${req.file.filename}`,
      fileId: req.file.filename,
      filename: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
      metadata: req.body
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Endpoint para upload múltiple
exports.uploadMultiple = upload.array('files', 10);

exports.handleMultipleUpload = (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const files = req.files.map(file => ({
      url: `/uploads/${file.filename}`,
      fileId: file.filename,
      filename: file.originalname,
      size: file.size,
      mimeType: file.mimetype
    }));

    res.status(200).json({
      success: true,
      files
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Endpoint para chunk upload
const chunks = new Map(); // En producción usar Redis o DB

exports.handleChunkUpload = (req, res) => {
  try {
    const { chunk, chunkIndex, totalChunks, filename } = req.body;

    if (!chunks.has(filename)) {
      chunks.set(filename, []);
    }

    const fileChunks = chunks.get(filename);
    fileChunks[parseInt(chunkIndex)] = chunk;

    // Si todos los chunks están completos, ensamblar
    if (fileChunks.filter(Boolean).length === parseInt(totalChunks)) {
      const buffer = Buffer.concat(fileChunks);
      const filePath = path.join('uploads', filename);

      fs.writeFileSync(filePath, buffer);
      chunks.delete(filename);

      res.status(200).json({
        success: true,
        message: 'File upload complete',
        url: `/uploads/${filename}`
      });
    } else {
      res.status(200).json({
        success: true,
        message: `Chunk ${parseInt(chunkIndex) + 1}/${totalChunks} uploaded`
      });
    }
  } catch (error) {
    console.error('Chunk upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

### upload.routes.js

```javascript
// backend/routes/upload.routes.js
const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');

// Single file upload
router.post('/upload',
  uploadController.uploadSingle,
  uploadController.handleSingleUpload
);

// Multiple files upload
router.post('/upload/multiple',
  uploadController.uploadMultiple,
  uploadController.handleMultipleUpload
);

// Chunk upload
router.post('/upload/chunk',
  uploadController.handleChunkUpload
);

module.exports = router;
```

## 11. Testing

### file-upload.component.spec.ts

```typescript
// file-upload.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FileUploadComponent } from './file-upload.component';
import { FileUploadService } from '../../../core/services/file-upload.service';
import { FileValidatorService } from '../../../core/services/file-validator.service';

describe('FileUploadComponent', () => {
  let component: FileUploadComponent;
  let fixture: ComponentFixture<FileUploadComponent>;
  let uploadService: FileUploadService;
  let validatorService: FileValidatorService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FileUploadComponent,
        HttpClientTestingModule
      ],
      providers: [
        FileUploadService,
        FileValidatorService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FileUploadComponent);
    component = fixture.componentInstance;
    uploadService = TestBed.inject(FileUploadService);
    validatorService = TestBed.inject(FileValidatorService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default config', () => {
    component.ngOnInit();
    expect(component.config.multiple).toBe(true);
    expect(component.config.autoUpload).toBe(false);
  });

  it('should add files to queue', () => {
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    component['handleFiles']([file]);

    expect(component.files().length).toBeGreaterThan(0);
  });

  it('should validate file size', () => {
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.txt');
    const result = validatorService.validateFile(largeFile, {
      maxSize: 10 * 1024 * 1024
    });

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should format file size correctly', () => {
    expect(validatorService.formatFileSize(1024)).toBe('1 KB');
    expect(validatorService.formatFileSize(1024 * 1024)).toBe('1 MB');
  });
});
```

## 12. Best Practices

### Seguridad

1. **Validación del lado del servidor**: Siempre validar tipo, tamaño y contenido en el backend
2. **Sanitización de nombres**: Limpiar nombres de archivo para evitar path traversal
3. **Límites de tasa**: Implementar rate limiting para prevenir abuse
4. **Escaneo de malware**: Integrar antivirus para archivos sospechosos
5. **HTTPS obligatorio**: Nunca permitir upload sobre HTTP

### Performance

1. **Lazy loading**: Cargar preview solo cuando sea necesario
2. **Virtual scrolling**: Para listas largas de archivos
3. **Chunk upload**: Para archivos > 5MB
4. **Compresión**: Comprimir imágenes antes de subir
5. **CDN**: Servir archivos subidos desde CDN

### UX

1. **Feedback visual**: Progress bars, spinners, estados claros
2. **Drag & drop**: Experiencia más natural
3. **Preview inmediato**: Mostrar preview antes de subir
4. **Retry automático**: Para errores transitorios
5. **Mensajes claros**: Errores descriptivos y accionables

### Accesibilidad

1. **Teclado navegable**: Tab, Enter, Escape funcionando
2. **Screen reader**: ARIA labels y live regions
3. **Alto contraste**: Colores accesibles
4. **Focus indicators**: Visible focus states

## Referencias

- [Angular File Upload Tutorial - Djamware](https://www.djamware.com/post/685f4b8ee1a9ac448f9a759d/angular-file-upload-tutorial-with-draganddrop-and-progress-bar)
- [Angular HttpClient Upload Progress - Daniel Kreider](https://danielk.tech/home/angular-file-upload-with-upload-progress)
- [Angular File Upload Guide - Angular University](https://blog.angular-university.io/angular-file-upload/)
- [Better Upload Progress Tracking - Medium](https://medium.com/@usamahameed.dev/a-better-way-to-track-file-upload-progress-in-angular-using-httpclient-497cefa84c8a)
- [MDN - Using Files from Web Applications](https://developer.mozilla.org/en-US/docs/Web/API/File_API/Using_files_from_web_applications)
- [Multer Documentation](https://github.com/expressjs/multer)
