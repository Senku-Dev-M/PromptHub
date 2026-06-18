export interface UploadFileResult {
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export interface IStorageService {
  uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    bucketName?: string
  ): Promise<UploadFileResult>;
}
