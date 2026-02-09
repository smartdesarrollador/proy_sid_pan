/**
 * Ejemplos de configuración para FileUploadComponent
 * Copia y adapta según tus necesidades
 */

import { FileUploadConfig } from '../models/file-upload.models';

/**
 * Configuración básica para upload de imágenes
 */
export const IMAGE_UPLOAD_CONFIG: FileUploadConfig = {
  multiple: true,
  autoUpload: false,
  showPreview: true,
  dragDrop: true,
  validation: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    maxFiles: 10,
    minImageDimensions: {
      width: 800,
      height: 600
    },
    maxImageDimensions: {
      width: 4000,
      height: 3000
    }
  },
  uploadOptions: {
    url: '/api/images/upload',
    fieldName: 'image',
    compressImages: true,
    compressionQuality: 0.8,
    maxRetries: 3
  },
  labels: {
    dropZone: 'Arrastra imágenes aquí o haz clic para seleccionar',
    browse: 'Seleccionar imágenes',
    uploading: 'Subiendo imágenes...',
    success: 'Imagen subida exitosamente',
    error: 'Error al subir imagen'
  }
};

/**
 * Configuración para upload de documentos (PDF, Word, Excel)
 */
export const DOCUMENT_UPLOAD_CONFIG: FileUploadConfig = {
  multiple: true,
  autoUpload: true,
  showPreview: true,
  dragDrop: true,
  validation: {
    maxSize: 20 * 1024 * 1024, // 20MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    allowedExtensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx'],
    maxFiles: 5
  },
  uploadOptions: {
    url: '/api/documents/upload',
    fieldName: 'document',
    maxRetries: 2,
    metadata: {
      category: 'legal-documents',
      department: 'HR'
    }
  },
  labels: {
    dropZone: 'Arrastra documentos PDF, Word o Excel aquí',
    browse: 'Seleccionar documentos',
    uploading: 'Subiendo documentos...',
    success: 'Documento subido',
    error: 'Error al subir documento'
  }
};

/**
 * Configuración para avatar de usuario (single file)
 */
export const AVATAR_UPLOAD_CONFIG: FileUploadConfig = {
  multiple: false,
  autoUpload: true,
  showPreview: true,
  dragDrop: true,
  validation: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png'],
    allowedExtensions: ['.jpg', '.jpeg', '.png'],
    maxFiles: 1,
    minImageDimensions: {
      width: 200,
      height: 200
    },
    maxImageDimensions: {
      width: 2000,
      height: 2000
    }
  },
  uploadOptions: {
    url: '/api/users/avatar',
    fieldName: 'avatar',
    compressImages: true,
    compressionQuality: 0.9,
    maxRetries: 3
  },
  labels: {
    dropZone: 'Arrastra tu foto de perfil aquí',
    browse: 'Seleccionar foto',
    uploading: 'Subiendo foto...',
    success: 'Foto actualizada',
    error: 'Error al actualizar foto'
  }
};

/**
 * Configuración para archivos grandes con chunk upload
 */
export const LARGE_FILE_UPLOAD_CONFIG: FileUploadConfig = {
  multiple: false,
  autoUpload: true,
  showPreview: false,
  dragDrop: true,
  validation: {
    maxSize: 500 * 1024 * 1024, // 500MB
    allowedTypes: ['video/mp4', 'video/webm', 'application/zip'],
    allowedExtensions: ['.mp4', '.webm', '.zip'],
    maxFiles: 1
  },
  uploadOptions: {
    url: '/api/files/large',
    fieldName: 'file',
    useChunks: true,
    chunkSize: 1024 * 1024, // 1MB chunks
    maxRetries: 5
  },
  labels: {
    dropZone: 'Arrastra archivos grandes aquí (hasta 500MB)',
    browse: 'Seleccionar archivo',
    uploading: 'Subiendo archivo...',
    success: 'Archivo subido completamente',
    error: 'Error al subir archivo'
  }
};

/**
 * Configuración estricta para archivos CSV
 */
export const CSV_UPLOAD_CONFIG: FileUploadConfig = {
  multiple: false,
  autoUpload: false,
  showPreview: false,
  dragDrop: true,
  validation: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['text/csv', 'application/vnd.ms-excel'],
    allowedExtensions: ['.csv'],
    maxFiles: 1
  },
  uploadOptions: {
    url: '/api/import/csv',
    fieldName: 'csv',
    maxRetries: 1,
    metadata: {
      importType: 'users',
      encoding: 'utf-8'
    }
  },
  labels: {
    dropZone: 'Arrastra archivo CSV para importar',
    browse: 'Seleccionar CSV',
    uploading: 'Importando datos...',
    success: 'Datos importados exitosamente',
    error: 'Error al importar datos'
  }
};

/**
 * Configuración minimalista (máxima flexibilidad)
 */
export const MINIMAL_UPLOAD_CONFIG: FileUploadConfig = {
  multiple: true,
  autoUpload: false,
  showPreview: true,
  dragDrop: true,
  validation: {
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 10
  },
  uploadOptions: {
    url: '/api/upload'
  }
};

/**
 * Configuración enterprise (máxima seguridad)
 */
export const ENTERPRISE_UPLOAD_CONFIG: FileUploadConfig = {
  multiple: true,
  autoUpload: false,
  showPreview: true,
  dragDrop: true,
  validation: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png'
    ],
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxFiles: 5,
    minImageDimensions: {
      width: 800,
      height: 600
    }
  },
  uploadOptions: {
    url: '/api/secure/upload',
    fieldName: 'file',
    headers: {
      'X-Upload-Token': 'your-secure-token-here'
    },
    metadata: {
      userId: 'current-user-id',
      timestamp: new Date().toISOString(),
      source: 'web-app'
    },
    compressImages: true,
    compressionQuality: 0.85,
    maxRetries: 2
  },
  labels: {
    dropZone: 'Zona de carga segura - Solo PDF e imágenes',
    browse: 'Examinar archivos',
    uploading: 'Procesando de forma segura...',
    success: 'Archivo verificado y almacenado',
    error: 'Error de seguridad - Contacte soporte'
  }
};
