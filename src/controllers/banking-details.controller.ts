import Container, { Service } from "typedi";
import {  Response, NextFunction } from "express";
import HttpStatusCodes from "http-status-codes";
import ResponseModel from "@models/response.model";
import { BankingDetailsService } from "@services/banking-details.service";
import { IRequest } from "@interfaces/express.interface";
import Busboy from "busboy";
import {S3Service} from "@services/s3.service";

@Service()
export class BankingDetailsController {
  private bankingDetailsService: BankingDetailsService = Container.get(BankingDetailsService);

  public async upsertBankingDetails(req: IRequest, res: Response, next: NextFunction): Promise<void> {
    const s3Service: S3Service = Container.get(S3Service);
    try {
      const createdBy = req.user.id;
      let bankingDetails: any = {};
  
      const busboy = Busboy({ headers: req.headers });
      let uploadPromise: Promise<any> | null = null;
  
      // Handle regular fields
      busboy.on('field', (fieldname, value) => {
        console.log({fieldname, value});
        bankingDetails[fieldname] = value;
      });
  
      // Handle file upload
      busboy.on('file', (_fieldname, file, fileData, _encoding, _mimetype) => {
        const date = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = fileData?.filename || date;
        uploadPromise = s3Service.uploadFileStream('banking-details', filename, file);

      });
  
      // Process the upload when all parts are processed
      busboy.on('finish', async () => {
        try {
   
           const uploadResponse = await uploadPromise;

           const  resultParams: any = {
            upiId: bankingDetails.upiId,
            bankDetails: {
              accountNumber: bankingDetails.accountNumber,
              ifscCode: bankingDetails.ifscCode,
              bankName: bankingDetails.bankName,
              beneficiaryName: bankingDetails.beneficiaryName,
            },
            createdBy,
           };

           if(uploadResponse) {
            resultParams.qrCodeFileName = uploadResponse.key;
            resultParams.qrCodeKey = uploadResponse.key;
            resultParams.qrCodeUrl = uploadResponse.Location;
          }
  
          const result = await this.bankingDetailsService.upsertBankingDetails(resultParams);
          
  
          if (result.success) {
            res.status(HttpStatusCodes.OK).json(
              new ResponseModel(result.data, HttpStatusCodes.OK, result.message).generate()
            );
          } else {
            res.status(HttpStatusCodes.BAD_REQUEST).json(
              new ResponseModel(null, HttpStatusCodes.BAD_REQUEST, result.message).generate()
            );
          }
        } catch (error) {
        
          next(error);
        }
      });
  
      req.pipe(busboy);
    } catch (error) {
      next(error);
    }
  }

  public async getBankingDetails(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.bankingDetailsService.getBankingDetails();
  
      if (result.success) {
        res.status(HttpStatusCodes.OK).json(
          new ResponseModel(result.data, HttpStatusCodes.OK, result.message).generate()
        );
      } else {
        res.status(HttpStatusCodes.NOT_FOUND).json(
          new ResponseModel(null, HttpStatusCodes.NOT_FOUND, result.message).generate()
        );
      }
    } catch (error) {
      next(error);
    }
  }
}