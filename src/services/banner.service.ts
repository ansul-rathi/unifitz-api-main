import { Service, Container } from 'typedi';
import { Logger } from 'winston';
import { ServiceResponse } from '@interfaces/service-response.interface';
import { BannerModel, BannerType, BannerStatus, IBanner } from '@models/banner.model';
import { S3Service } from './s3.service';

@Service()
export class BannerService {
  private logger: Logger = Container.get('logger');
  private s3Service: S3Service = Container.get(S3Service);

  public async createBanner(data: {
    title: string;
    type: BannerType;
    file: Buffer;
    fileName: string;
    linkUrl?: string;
    startDate?: Date;
    endDate?: Date;
    createdBy: string;
  }): Promise<ServiceResponse> {
    try {
      // Upload image to S3
      const uploadResult = await this.s3Service.uploadFile(
        'banners',
        `${Date.now()}-${data.fileName}`,
        data.file
      );

      // Get max sequence number for this type
      const maxSeq = await BannerModel.findOne({ type: data.type })
        .sort({ sequence: -1 })
        .select('sequence');

      // Create banner
      const banner = await BannerModel.create({
        title: data.title,
        type: data.type,
        imageUrl: this.s3Service.getObjectUrl(uploadResult.key),
        imageKey: uploadResult.key,
        sequence: maxSeq ? maxSeq.sequence + 1 : 0,
        status: BannerStatus.ACTIVE,
        linkUrl: data.linkUrl,
        startDate: data.startDate,
        endDate: data.endDate,
        createdBy: data.createdBy
      });

      return {
        success: true,
        message: 'Banner created successfully',
        data: banner
      };
    } catch (error) {
      this.logger.error('Error creating banner:', error);
      return {
        success: false,
        message: error.message || 'Failed to create banner',
        data: null
      };
    }
  }

  public async listBanners(params: {
    type?: BannerType;
    status?: BannerStatus;
    activeOnly?: boolean;
  }): Promise<ServiceResponse> {
    try {
      const query: any = {};
      
      if (params.type) {
        query.type = params.type;
      }
      
      if (params.status) {
        query.status = params.status;
      }

      if (params.activeOnly) {
        const now = new Date();
        query.status = BannerStatus.ACTIVE;
        query.$or = [
          { startDate: { $exists: false } },
          { startDate: { $lte: now } }
        ];
        query.$and = [
          { $or: [
            { endDate: { $exists: false } },
            { endDate: { $gte: now } }
          ]}
        ];
      }

      const banners = await BannerModel.find(query)
        .sort({ sequence: 1 })
        .populate('createdBy', 'name email');

      return {
        success: true,
        message: 'Banners retrieved successfully',
        data: banners
      };
    } catch (error) {
      this.logger.error('Error listing banners:', error);
      return {
        success: false,
        message: 'Failed to retrieve banners',
        data: null
      };
    }
  }

  public async updateBanner(
    bannerId: string,
    data: Partial<IBanner> & { file?: Buffer; fileName?: string },
    updatedBy: string
  ): Promise<ServiceResponse> {
    try {
      const banner = await BannerModel.findById(bannerId);
      if (!banner) {
        return {
          success: false,
          message: 'Banner not found',
          data: null
        };
      }

      // If new file is provided, upload it and delete old one
      if (data.file && data.fileName) {
        // Delete old image
        await this.s3Service.deleteFile('banners', banner.imageKey);

        // Upload new image
        const uploadResult = await this.s3Service.uploadFile(
          'banners',
          `${Date.now()}-${data.fileName}`,
          data.file
        );

        data.imageUrl = this.s3Service.getObjectUrl(uploadResult.key);
        data.imageKey = uploadResult.key;
      }

      // Update banner
      const updatedBanner = await BannerModel.findByIdAndUpdate(
        bannerId,
        {
          ...data,
          updatedBy
        },
        { new: true }
      ).populate('createdBy updatedBy', 'name email');

      return {
        success: true,
        message: 'Banner updated successfully',
        data: updatedBanner
      };
    } catch (error) {
      this.logger.error('Error updating banner:', error);
      return {
        success: false,
        message: 'Failed to update banner',
        data: null
      };
    }
  }

  public async updateSequence(updates: { id: string; sequence: number }[]): Promise<ServiceResponse> {
    try {
      const operations = updates.map(update => ({
        updateOne: {
          filter: { _id: update.id },
          update: { $set: { sequence: update.sequence } }
        }
      }));

      await BannerModel.bulkWrite(operations);

      return {
        success: true,
        message: 'Banner sequences updated successfully',
        data: null
      };
    } catch (error) {
      this.logger.error('Error updating banner sequences:', error);
      return {
        success: false,
        message: 'Failed to update banner sequences',
        data: null
      };
    }
  }

  public async deleteBanner(bannerId: string): Promise<ServiceResponse> {
    try {
      const banner = await BannerModel.findById(bannerId);
      if (!banner) {
        return {
          success: false,
          message: 'Banner not found',
          data: null
        };
      }

      // Delete image from S3
      await this.s3Service.deleteFile('banners', banner.imageKey);

      // Delete banner
      await banner.deleteOne();

      return {
        success: true,
        message: 'Banner deleted successfully',
        data: null
      };
    } catch (error) {
      this.logger.error('Error deleting banner:', error);
      return {
        success: false,
        message: 'Failed to delete banner',
        data: null
      };
    }
  }
}