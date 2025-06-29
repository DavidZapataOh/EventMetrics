import { s3, S3_CONFIG } from '../config/aws';
import { DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Configurar multer para S3
export const uploadToS3 = multer({
  storage: multerS3({
    s3: s3,
    bucket: S3_CONFIG.bucket,
    key: function (req, file, cb) {
      // Generar nombre único para el archivo
      const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB límite
  },
  fileFilter: (req, file, cb) => {
    // Solo permitir imágenes
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'));
    }
  }
});

// Generar URL firmada
export const getSignedUrl = async (key: string): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: S3_CONFIG.bucket,
    Key: key,
  });
  
  return await awsGetSignedUrl(s3, command, { expiresIn: S3_CONFIG.signedUrlExpires });
};

// Eliminar archivo de S3
export const deleteFromS3 = async (key: string): Promise<void> => {
  const command = new DeleteObjectCommand({
    Bucket: S3_CONFIG.bucket,
    Key: key
  });
  
  await s3.send(command);
};

// Obtener información del archivo
export const getFileInfo = async (key: string) => {
  try {
    const command = new HeadObjectCommand({
      Bucket: S3_CONFIG.bucket,
      Key: key
    });
    
    const result = await s3.send(command);
    
    return {
      size: result.ContentLength,
      lastModified: result.LastModified,
      contentType: result.ContentType
    };
  } catch (error) {
    console.error('Error getting file info from S3:', error);
    throw error;
  }
};

// En lugar de URLs firmadas, usar CloudFront
export const getImageUrl = async (key: string): Promise<string> => {
  // Para desarrollo: usar S3 directo con URLs firmadas
  if (process.env.NODE_ENV === 'development') {
    return await getSignedUrl(key);
  }
  
  // Para producción: usar CloudFront
  const cloudFrontDomain = process.env.CLOUDFRONT_DOMAIN;
  return `https://${cloudFrontDomain}/${key}`;
};