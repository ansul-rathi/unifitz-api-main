import { Router } from 'express';
import { BannerController } from '@controllers/banner.controller';
import Container from 'typedi';
import authorize from '@middlewares/auth';
import { StaffRole } from '@enums/user-role.enum';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB limit
  }
});

export class BannerRoute {
  private api: Router = Router();
  private readonly bannerController: BannerController = Container.get(BannerController);

  public getApi(): Router {
    // Public routes
    this.api.get(
      '/',
      this.bannerController.listBanners.bind(this.bannerController)
    );

    // Admin routes
    this.api.post(
      '/',
      authorize([StaffRole.ADMIN, StaffRole.AGENT]),
      this.bannerController.createBanner.bind(this.bannerController)
    );

    this.api.put(
      '/:bannerId',
      authorize([StaffRole.ADMIN, StaffRole.AGENT]),
      upload.single('file'),
      this.bannerController.updateBanner.bind(this.bannerController)
    );

    this.api.delete(
      '/:bannerId',
      authorize([StaffRole.ADMIN, StaffRole.AGENT]),
      this.bannerController.deleteBanner.bind(this.bannerController)
    );

    this.api.put(
      '/sequence/update',
      authorize([StaffRole.ADMIN, StaffRole.AGENT]),
      this.bannerController.updateSequence.bind(this.bannerController)
    );

    this.api.put(
      '/:bannerId/status',
      authorize([StaffRole.ADMIN, StaffRole.AGENT]),
      this.bannerController.updateStatus.bind(this.bannerController)
    );

    return this.api;
  }
}