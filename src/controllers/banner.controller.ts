import { Container, Service } from 'typedi';
import { Request, Response, NextFunction } from 'express';
import Busboy from "busboy";
import fs from "fs";
import path from "path";
import HttpStatusCodes from 'http-status-codes';

import { BannerType, BannerStatus } from '@models/banner.model';
import { IRequest } from '@interfaces/express.interface';
import { BannerService } from '@services/banner.service';
import ResponseModel from '@models/response.model';

@Service()
export class BannerController {
private bannerService: BannerService = Container.get(
    BannerService
  );
  public async createBanner(req: IRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const createdBy = req.user.id;
      let bannerData: any = {};
      let imageFile: any = null;
  
      const busboy = Busboy({ headers: req.headers });
  
      // Handle regular fields
      busboy.on('field', (fieldname, value) => {
        bannerData[fieldname] = value;
      });
  
      // Handle file upload
      busboy.on('file', (_fieldname, file, fileInfo) => {
        const date = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = fileInfo?.filename || date;
        const saveTo = path.join(__dirname, '../../uploads', filename);
        const writeStream = fs.createWriteStream(saveTo);
        file.pipe(writeStream);
  
        imageFile = {
          filePath: saveTo,
          originalName: filename,
          mimeType: fileInfo?.mimeType,
        };
      });
  
      // Process the upload when all parts are processed
      busboy.on('finish', async () => {
        try {
          if (!imageFile) {
            res.status(HttpStatusCodes.BAD_REQUEST).json(
              new ResponseModel(null, HttpStatusCodes.BAD_REQUEST, 'Image file is required').generate()
            );
            return;
          }
  
          // Read the file from the temp location
          const fileBuffer = fs.readFileSync(imageFile.filePath);
  
          const result = await this.bannerService.createBanner({
            ...bannerData,
            file: fileBuffer,
            fileName: imageFile.originalName,
            createdBy,
          });
  
          // Clean up temporary file
          fs.unlinkSync(imageFile.filePath);
  
          if (result.success) {
            res.status(HttpStatusCodes.CREATED).json(
              new ResponseModel(result.data, HttpStatusCodes.CREATED, result.message).generate()
            );
          } else {
            res.status(HttpStatusCodes.BAD_REQUEST).json(
              new ResponseModel(null, HttpStatusCodes.BAD_REQUEST, result.message).generate()
            );
          }
        } catch (error) {
          // Clean up temporary file in case of error
          if (imageFile?.filePath && fs.existsSync(imageFile.filePath)) {
            fs.unlinkSync(imageFile.filePath);
          }
          next(error);
        }
      });
  
      req.pipe(busboy);
    } catch (error) {
      next(error);
    }
  }
  public async listBanners(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type, status, activeOnly } = req.query;

      const result = await this.bannerService.listBanners({
        type: type as BannerType,
        status: status as BannerStatus,
        activeOnly: activeOnly === 'true'
      });

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
  }

  public async updateBanner(req: IRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bannerId } = req.params;
      const file = req.file;
      
      const updateData = {
        ...req.body,
        ...(file && {
          file: file.buffer,
          fileName: file.originalname
        })
      };

      const result = await this.bannerService.updateBanner(
        bannerId,
        updateData,
        req.user.id
      );

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
  }
  public async deleteBanner(req: IRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bannerId } = req.params;
      
      const result = await this.bannerService.deleteBanner(bannerId);

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
  }
  public async updateSequence(req: IRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sequences } = req.body;

      if (!Array.isArray(sequences)) {
        res.status(HttpStatusCodes.BAD_REQUEST).json(
          new ResponseModel(null, HttpStatusCodes.BAD_REQUEST, 'Invalid sequence data').generate()
        );
        return;
      }

      const result = await this.bannerService.updateSequence(sequences);

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
  }
  public async updateStatus(req: IRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bannerId } = req.params;
      const { status } = req.body;

      if (!Object.values(BannerStatus).includes(status)) {
        res.status(HttpStatusCodes.BAD_REQUEST).json(
          new ResponseModel(null, HttpStatusCodes.BAD_REQUEST, 'Invalid status').generate()
        );
        return;
      }

      const result = await this.bannerService.updateBanner(
        bannerId,
        { status },
        req.user.id
      );

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
  }
}