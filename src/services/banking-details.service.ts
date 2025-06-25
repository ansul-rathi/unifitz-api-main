import { Service, Container } from "typedi";
import { Logger } from "winston";
import { S3Service } from "./s3.service";
import { ServiceResponse } from "@interfaces/service-response.interface";
import { BankingDetailsModel } from "@models/banking-detail.model";

@Service()
export class BankingDetailsService {
  private logger: Logger = Container.get("logger");
  private s3Service: S3Service = Container.get(S3Service);

  public async upsertBankingDetails(data: {
    // qrCodeFile?: Buffer;
    qrCodeFileName?: string;
    qrCodeKey?: string;
    qrCodeUrl?: string;
    upiId?: string;
    bankDetails?: {
      accountNumber: string;
      ifscCode: string;
      bankName: string;
      beneficiaryName: string;
    };
    createdBy: string;
  }): Promise<ServiceResponse> {
    try {

      // If a QR code file is provided, upload it to S3
      // if (data.qrCodeFile && data.qrCodeFileName) {
      //   const uploadResult = await this.s3Service.uploadFile(
      //     "banking-details",
      //     `${Date.now()}-${data.qrCodeFileName}`,
      //     fs.readFileSync(data.qrCodeFile.filePath)
      //   );
      //   qrCodeUrl = this.s3Service.getObjectUrl(uploadResult.key);
      //   qrCodeKey = uploadResult.key;
      // }

      // Check if banking details already exist
      const existingDetails = await BankingDetailsModel.findOne();

      if (existingDetails) {
        // Update existing details
        if (data.qrCodeKey && existingDetails.qrCodeKey) {
          // Delete old QR code from S3
          await this.s3Service.deleteFile("banking-details", existingDetails.qrCodeKey);
        }

        const updatedDetails = await BankingDetailsModel.findByIdAndUpdate(
          existingDetails._id,
          {
            ...(data.qrCodeUrl && { qrCodeUrl: data.qrCodeUrl }),
            ...(data.qrCodeKey && { qrCodeKey: data.qrCodeKey }),
            ...(data.upiId && { upiId: data.upiId }),
            ...(data.bankDetails && { bankDetails: data.bankDetails }),
            createdBy: data.createdBy,
          },
          { new: true }
        );

        return {
          success: true,
          message: "Banking details updated successfully",
          data: updatedDetails,
        };
      } else {
        // Create new banking details
        const newDetails = await BankingDetailsModel.create({
          qrCodeUrl: data.qrCodeUrl,
          qrCodeKey: data.qrCodeKey,
          upiId: data.upiId,
          bankDetails: data.bankDetails,
          createdBy: data.createdBy,
        });

        return {
          success: true,
          message: "Banking details created successfully",
          data: newDetails,
        };
      }
    } catch (error) {
      this.logger.error("Error upserting banking details:", error);
      return {
        success: false,
        message: "Failed to upsert banking details",
        data: null,
      };
    }
  }

  public async getBankingDetails(): Promise<ServiceResponse> {
    try {
      const bankingDetails = await BankingDetailsModel.findOne();
  
      if (!bankingDetails) {
        return {
          success: false,
          message: "Banking details not found",
          data: null,
        };
      }
  
      return {
        success: true,
        message: "Banking details retrieved successfully",
        data: bankingDetails,
      };
    } catch (error) {
      this.logger.error("Error retrieving banking details:", error);
      return {
        success: false,
        message: "Failed to retrieve banking details",
        data: null,
      };
    }
  }
}