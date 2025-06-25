import { Service, Container } from 'typedi';
import { Logger } from 'winston';
import { ServiceResponse } from '@interfaces/service-response.interface';
import { RestrictedCountryModel } from '@models/fundist-restricted-country.model';

interface IRestrictedCountryRawData {
  IDMerchant: string;
  Name: string;
  ID: string;
  Countries: string[];
  Subdivisions: string[];
}

@Service()
export class FundistRestrictedCountryService {
  private logger: Logger = Container.get('logger');

  public async storeRestrictedCountries(rawData: Record<string, IRestrictedCountryRawData>): Promise<ServiceResponse> {
    try {
      const transformedData = Object.values(rawData).map(entity => ({
        merchantId: entity.IDMerchant,
        name: entity.Name,
        restrictionId: entity.ID,
        bannedCountries: entity.Countries.map(c => c.toLowerCase()),
        bannedSubdivisions: entity.Subdivisions.map(s => s.toLowerCase())
      }));

      // Use bulkWrite for better performance
      const operations = transformedData.map(data => ({
        updateOne: {
          filter: { merchantId: data.merchantId },
          update: { $set: data },
          upsert: true
        }
      }));

      const result = await RestrictedCountryModel.bulkWrite(operations);

      this.logger.info('Restricted country data updated:', {
        matched: result.matchedCount,
        modified: result.modifiedCount,
        upserted: result.upsertedCount
      });

      return {
        success: true,
        message: 'Restricted country data updated successfully',
        data: {
          updated: result.modifiedCount,
          created: result.upsertedCount
        }
      };
    } catch (error) {
      this.logger.error('Error storing restricted countries:', {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        message: error.message || 'Failed to store restricted countries',
        data: null
      };
    }
  }

  public async getRestrictedCountries(): Promise<ServiceResponse> {
    try {
      const restrictions = await RestrictedCountryModel.find()
        .sort({ name: 1 })
        .lean();

      return {
        success: true,
        message: 'Restricted countries retrieved successfully',
        data: restrictions
      };
    } catch (error) {
      this.logger.error('Error getting restricted countries:', {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        message: error.message || 'Failed to get restricted countries',
        data: null
      };
    }
  }

  public async isCountryRestricted(params: {
    merchantId: string;
    countryCode: string;
    subdivisionCode?: string;
  }): Promise<ServiceResponse> {
    try {
      const countryCode = params.countryCode.toLowerCase();
      const subdivisionCode = params.subdivisionCode?.toLowerCase();

      const restriction = await RestrictedCountryModel.findOne({
        merchantId: params.merchantId
      });

      if (!restriction) {
        return {
          success: true,
          message: 'No restrictions found',
          data: {
            restricted: false
          }
        };
      }

      const isCountryBanned = restriction.bannedCountries.includes(countryCode);
      const isSubdivisionBanned = subdivisionCode ? 
        restriction.bannedSubdivisions.includes(subdivisionCode) : 
        false;

      return {
        success: true,
        message: 'Restriction check completed',
        data: {
          restricted: isCountryBanned || isSubdivisionBanned,
          countryBanned: isCountryBanned,
          subdivisionBanned: isSubdivisionBanned,
          merchant: {
            id: restriction.merchantId,
            name: restriction.name
          }
        }
      };
    } catch (error) {
      this.logger.error('Error checking country restriction:', {
        error: error.message,
        params,
        stack: error.stack
      });

      return {
        success: false,
        message: error.message || 'Failed to check country restriction',
        data: null
      };
    }
  }
}