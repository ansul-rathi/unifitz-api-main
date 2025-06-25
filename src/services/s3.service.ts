import { Logger } from "winston";
import {
  s3BucketName,
  s3AceessKey,
  s3AwsKeyId,
  s3Endpoint,
} from "../config/constants";
import { Container, Service } from "typedi";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

@Service()
export class S3Service {
  private client: S3Client;
  private readonly bucketName: string = s3BucketName;
  private logger: Logger = Container.get("logger");

  constructor() {
    this.client = new S3Client({
      endpoint: s3Endpoint,
      forcePathStyle: false,
      credentials: {
        accessKeyId: s3AwsKeyId,
        secretAccessKey: s3AceessKey,
      },
      region: "us-east-1",
    });
  }

  async uploadFile(
    keySalt: string,
    fileName: string,
    fileBuffer: Buffer
  ): Promise<any> {
    this.logger.info("<Service>:<S3-Service>:<Doc upload starting>");
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: `${keySalt}/${fileName}`,
      Body: fileBuffer,
      ACL: "public-read",
    });
    this.logger.info("-----------------------------------------");
    this.logger.info("upload file is filereq body is", command);
    this.logger.info("-----------------------------------------");
    try {
      const response = await this.client.send(command);
      return { ...response, key: `${keySalt}/${fileName}` };
    } catch (err) {
      console.log({ err });
      this.logger.error("err in s3", err);
      throw new Error("There is some problem with file uploading");
    }
  }

  async uploadFileStream(
    keySalt: string,
    fileName: string,
    fileStream: ReadableStream
  ): Promise<any> {
    this.logger.info("<Service>:<S3-Service>:<Doc upload starting>");
    try {
  
      const upload = new Upload({
        client: this.client,
        params: {
          Bucket: this.bucketName,
          Key: `${keySalt}/${fileName}`,
          Body: fileStream,
          ACL: "public-read",
        },
      });

      const response = await upload.done();

      return { ...response, key: `${keySalt}/${fileName}` };
    } catch (err) {
      console.log({ err });
      this.logger.error("err in s3", err);
      throw new Error("There is some problem with file uploading");
    }
  }

  async deleteFile(keySalt: string, fileName: string): Promise<any> {
    this.logger.info("<Service>:<S3-Service>:<Doc upload starting>");
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: `${keySalt}/${fileName}`,
    });
    this.logger.info("-----------------------------------------");
    this.logger.info("delete file ", command);
    this.logger.info("-----------------------------------------");
    try {
      const response = await this.client.send(command);
      console.log({ response });
      return { ...response, key: `${keySalt}/${fileName}` };
    } catch (err) {
      console.log({ err });
      this.logger.error("err in s3", err);
      throw new Error("There is some problem with file deleting");
    }
  }
  getObjectUrl(fileKey: string): string {
    return `https://${this.bucketName}.sgp1.cdn.digitaloceanspaces.com/${fileKey}`;
  }
}
