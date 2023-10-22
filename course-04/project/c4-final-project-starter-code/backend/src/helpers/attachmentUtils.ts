import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
const s3 = new S3Client({})

const bucketName = process.env.ATTACHMENT_S3_BUCKET

// TODO: Implement the fileStogare logic
export function AttachmentUtils(todoId: string) {

  const command = new PutObjectCommand ({
    Bucket: bucketName,
    Key: todoId,
  });
  return s3.send(command)
}
