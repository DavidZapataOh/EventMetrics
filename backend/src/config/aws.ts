import { S3Client } from '@aws-sdk/client-s3';

console.log('Loading AWS configuration...');
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Not set');
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not set');
console.log('AWS_REGION:', process.env.AWS_REGION);
console.log('AWS_S3_BUCKET:', process.env.AWS_S3_BUCKET);

// Configurar AWS
export const s3 = new S3Client({
  region: process.env.AWS_REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const S3_CONFIG = {
  bucket: process.env.AWS_S3_BUCKET || 'eventmetrics-image',
  region: process.env.AWS_REGION || 'sa-east-1',
  signedUrlExpires: 300 // 5 minutos
};