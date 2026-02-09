# Advanced File Upload Features

## 1. Resume Upload (Upload Resumable)

Para uploads interrumpidos que se pueden reanudar.

### Frontend Implementation

```typescript
// resumable-upload.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';

interface UploadSession {
  sessionId: string;
  fileId: string;
  uploadedBytes: number;
  totalBytes: number;
}

@Injectable({ providedIn: 'root' })
export class ResumableUploadService {
  private sessions = new Map<string, UploadSession>();

  constructor(private http: HttpClient) {}

  /**
   * Inicia o reanuda un upload.
   */
  uploadResumable(file: File, url: string): Observable<number> {
    const subject = new Subject<number>();
    const fileId = this.generateFileId(file);

    // Verificar si hay sesión existente
    this.http.get<UploadSession>(`${url}/session/${fileId}`)
      .subscribe({
        next: (session) => {
          // Reanudar desde uploadedBytes
          this.continueUpload(file, url, session, subject);
        },
        error: () => {
          // Iniciar nuevo upload
          this.startNewUpload(file, url, subject);
        }
      });

    return subject.asObservable();
  }

  private continueUpload(
    file: File,
    url: string,
    session: UploadSession,
    subject: Subject<number>
  ): void {
    const chunk = file.slice(session.uploadedBytes);
    this.uploadChunk(chunk, url, session, subject);
  }

  private startNewUpload(
    file: File,
    url: string,
    subject: Subject<number>
  ): void {
    const session: UploadSession = {
      sessionId: this.generateSessionId(),
      fileId: this.generateFileId(file),
      uploadedBytes: 0,
      totalBytes: file.size
    };

    this.uploadChunk(file, url, session, subject);
  }

  private uploadChunk(
    chunk: Blob,
    url: string,
    session: UploadSession,
    subject: Subject<number>
  ): void {
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('sessionId', session.sessionId);
    formData.append('uploadedBytes', session.uploadedBytes.toString());

    this.http.post<{ uploadedBytes: number }>(`${url}/chunk`, formData)
      .subscribe({
        next: (response) => {
          session.uploadedBytes = response.uploadedBytes;
          const progress = (session.uploadedBytes / session.totalBytes) * 100;
          subject.next(progress);

          if (session.uploadedBytes === session.totalBytes) {
            subject.complete();
          }
        },
        error: (error) => {
          subject.error(error);
        }
      });
  }

  private generateFileId(file: File): string {
    return `${file.name}-${file.size}-${file.lastModified}`;
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

### Backend Implementation (Express.js)

```javascript
// resumable-upload.controller.js
const sessions = new Map(); // En producción usar Redis

exports.getSession = (req, res) => {
  const { fileId } = req.params;
  const session = sessions.get(fileId);

  if (session) {
    res.json(session);
  } else {
    res.status(404).json({ message: 'Session not found' });
  }
};

exports.uploadChunk = (req, res) => {
  const { chunk, sessionId, uploadedBytes } = req.body;

  // Guardar chunk
  const chunkPath = path.join('uploads', 'chunks', sessionId, uploadedBytes);
  fs.writeFileSync(chunkPath, chunk);

  // Actualizar sesión
  const newUploadedBytes = parseInt(uploadedBytes) + chunk.size;
  sessions.set(sessionId, {
    ...sessions.get(sessionId),
    uploadedBytes: newUploadedBytes
  });

  res.json({ uploadedBytes: newUploadedBytes });
};
```

## 2. Parallel Upload (Upload Paralelo)

Upload de múltiples chunks en paralelo.

```typescript
// parallel-upload.service.ts
@Injectable({ providedIn: 'root' })
export class ParallelUploadService {
  /**
   * Sube archivo en múltiples chunks paralelos.
   */
  uploadParallel(
    file: File,
    url: string,
    options: { chunkSize: number; maxParallel: number }
  ): Observable<number> {
    const { chunkSize, maxParallel } = options;
    const totalChunks = Math.ceil(file.size / chunkSize);
    const subject = new Subject<number>();

    let uploadedChunks = 0;
    let currentChunk = 0;

    const uploadNextBatch = () => {
      const batch = [];

      for (let i = 0; i < maxParallel && currentChunk < totalChunks; i++) {
        const start = currentChunk * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        batch.push(this.uploadChunk(chunk, currentChunk, url));
        currentChunk++;
      }

      if (batch.length === 0) return;

      forkJoin(batch).subscribe({
        next: () => {
          uploadedChunks += batch.length;
          const progress = (uploadedChunks / totalChunks) * 100;
          subject.next(progress);

          if (uploadedChunks === totalChunks) {
            subject.complete();
          } else {
            uploadNextBatch();
          }
        },
        error: (error) => subject.error(error)
      });
    };

    uploadNextBatch();
    return subject.asObservable();
  }

  private uploadChunk(chunk: Blob, index: number, url: string): Observable<any> {
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('index', index.toString());

    return this.http.post(`${url}/chunk`, formData);
  }
}
```

## 3. Image Optimization (Optimización de Imágenes)

### WebP Conversion

```typescript
// webp-converter.service.ts
@Injectable({ providedIn: 'root' })
export class WebPConverterService {
  /**
   * Convierte imagen a formato WebP.
   */
  async convertToWebP(file: File, quality: number = 0.8): Promise<File> {
    const bitmap = await createImageBitmap(file);

    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const webpFile = new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), {
              type: 'image/webp',
              lastModified: Date.now()
            });
            resolve(webpFile);
          } else {
            reject(new Error('WebP conversion failed'));
          }
        },
        'image/webp',
        quality
      );
    });
  }
}
```

### EXIF Data Stripping (Seguridad/Privacidad)

```typescript
// exif-stripper.service.ts
@Injectable({ providedIn: 'root' })
export class ExifStripperService {
  /**
   * Remueve metadata EXIF de imágenes.
   */
  async stripExif(file: File): Promise<File> {
    const bitmap = await createImageBitmap(file);

    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const cleanFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(cleanFile);
          } else {
            reject(new Error('EXIF stripping failed'));
          }
        },
        file.type,
        0.95
      );
    });
  }
}
```

## 4. Cloud Storage Integration

### AWS S3 Direct Upload

```typescript
// s3-upload.service.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable({ providedIn: 'root' })
export class S3UploadService {
  private s3Client = new S3Client({
    region: 'us-east-1',
    credentials: {
      accessKeyId: environment.aws.accessKeyId,
      secretAccessKey: environment.aws.secretAccessKey
    }
  });

  /**
   * Sube archivo directamente a S3.
   */
  async uploadToS3(
    file: File,
    bucket: string,
    key: string
  ): Promise<{ url: string }> {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file,
      ContentType: file.type,
      ACL: 'public-read'
    });

    await this.s3Client.send(command);

    return {
      url: `https://${bucket}.s3.amazonaws.com/${key}`
    };
  }

  /**
   * Genera presigned URL para upload directo desde browser.
   */
  async getPresignedUrl(
    bucket: string,
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    // Implementar con @aws-sdk/s3-request-presigner
    // ...
  }
}
```

### Cloudinary Integration

```typescript
// cloudinary-upload.service.ts
@Injectable({ providedIn: 'root' })
export class CloudinaryUploadService {
  private cloudName = environment.cloudinary.cloudName;
  private uploadPreset = environment.cloudinary.uploadPreset;

  /**
   * Sube imagen a Cloudinary.
   */
  uploadToCloudinary(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);

    const url = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;

    return this.http.post(url, formData).pipe(
      map((response: any) => ({
        url: response.secure_url,
        publicId: response.public_id,
        format: response.format,
        width: response.width,
        height: response.height
      }))
    );
  }
}
```

## 5. Client-side Encryption

Encriptar archivos antes de subirlos.

```typescript
// encryption.service.ts
@Injectable({ providedIn: 'root' })
export class EncryptionService {
  /**
   * Encripta archivo usando Web Crypto API.
   */
  async encryptFile(file: File, password: string): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer();

    // Derivar clave desde password
    const enc = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: enc.encode('salt'), // Usar salt aleatorio en producción
        iterations: 100000,
        hash: 'SHA-256'
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    // Encriptar
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      arrayBuffer
    );

    // Combinar IV + encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);

    return new Blob([combined]);
  }

  /**
   * Desencripta archivo.
   */
  async decryptFile(encryptedBlob: Blob, password: string): Promise<Blob> {
    // Implementación similar pero con decrypt
    // ...
  }
}
```

## 6. Paste Upload (Upload desde Portapapeles)

```typescript
// paste-upload.directive.ts
@Directive({
  selector: '[appPasteUpload]',
  standalone: true
})
export class PasteUploadDirective {
  @Output() filesPasted = new EventEmitter<File[]>();

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();

    const items = event.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }

    if (files.length > 0) {
      this.filesPasted.emit(files);
    }
  }
}

// Uso
// <div appPasteUpload (filesPasted)="onFilesPasted($event)">
//   Paste images here (Ctrl+V)
// </div>
```

## 7. Webcam Capture

```typescript
// webcam-capture.component.ts
@Component({
  selector: 'app-webcam-capture',
  standalone: true,
  template: `
    <div>
      <video #video autoplay></video>
      <button (click)="capture()">Capturar Foto</button>
      <canvas #canvas style="display: none;"></canvas>
    </div>
  `
})
export class WebcamCaptureComponent {
  @ViewChild('video') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasElement!: ElementRef<HTMLCanvasElement>;
  @Output() photoCaptured = new EventEmitter<File>();

  async ngAfterViewInit() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720 }
    });
    this.videoElement.nativeElement.srcObject = stream;
  }

  capture(): void {
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `photo-${Date.now()}.jpg`, {
          type: 'image/jpeg'
        });
        this.photoCaptured.emit(file);
      }
    }, 'image/jpeg', 0.95);
  }
}
```

## Referencias

- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/welcome.html)
- [Cloudinary Upload API](https://cloudinary.com/documentation/image_upload_api_reference)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [MediaStream API](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_API)
