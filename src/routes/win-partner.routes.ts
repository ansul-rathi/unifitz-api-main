import { Router } from 'express';
import { WinPartnerController } from '@controllers/win-partner.controller';
import Container from 'typedi';
import authorize from '@middlewares/auth';
import { StaffRole, UserRole } from '@enums/user-role.enum';

export class WinPartnerRoute {
  private api: Router = Router();
  private readonly winPartnerController: WinPartnerController = Container.get(WinPartnerController);

  public getApi(): Router {
    // Admin routes for managing partners
    this.api.post(
      '/',
      authorize([StaffRole.ADMIN]),
      this.winPartnerController.createPartner.bind(this.winPartnerController)
    );

   

    // Partner routes for managing customers
    this.api.post(
      '/customers',
      authorize([UserRole.WIN_PARTNER]),
      this.winPartnerController.createCustomer.bind(this.winPartnerController)
    );

    this.api.get(
      '/customers',
      authorize([UserRole.WIN_PARTNER]),
      this.winPartnerController.listCustomers.bind(this.winPartnerController)
    );

    this.api.post(
      '/deposit',
      authorize([UserRole.WIN_PARTNER]),
      this.winPartnerController.depositToCustomer.bind(this.winPartnerController)
    );

    // Partner reporting routes
    this.api.get(
      '/stats',
      authorize([UserRole.WIN_PARTNER]),
      this.winPartnerController.getCustomerStats.bind(this.winPartnerController)
    );

    this.api.get(
      '/customers/export',
      authorize([UserRole.WIN_PARTNER]),
      this.winPartnerController.exportCustomerData.bind(this.winPartnerController)
    );

    this.api.get(
      '/:customerId/transactions',
      authorize([UserRole.WIN_PARTNER]),
      this.winPartnerController.getTransactionHistory.bind(this.winPartnerController)
    );
    
    this.api.put(
      '/:partnerId/status',
      authorize([StaffRole.ADMIN]),
      this.winPartnerController.updatePartnerStatus.bind(this.winPartnerController)
    );

    this.api.get(
      '/:partnerId/customers',
      authorize([StaffRole.ADMIN]),
      this.winPartnerController.listCustomersAdmin.bind(this.winPartnerController)
    );

    return this.api;
  }
}