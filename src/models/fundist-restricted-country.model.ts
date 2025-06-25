import { Model, Schema, model, Document } from "mongoose";

const MODEL_NAME = "FundistRestrictedCountry";
const COLLECTION_NAME = "fundist_restricted_countries";

export interface IFundistRestrictedCountry extends Document {
  merchantId: string;
  restrictionId: string;
  name: string;
  bannedCountries: string[];
  bannedSubdivisions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const RestrictedCountrySchema: Schema = new Schema(
  {
    merchantId: { 
      type: String, 
      required: [true, "Merchant ID is required"], 
      unique: true 
    },
    restrictionId: { 
      type: String, 
      required: [true, "Restriction id is required"], 
      unique: true 
    },
    name: { 
      type: String, 
      required: [true, "Name is required"] 
    },
    bannedCountries: { 
      type: [String], 
      required: [true, "Banned countries list is required"],
      default: [] 
    },
    bannedSubdivisions: { 
      type: [String], 
      required: [true, "Banned subdivisions list is required"],
      default: [] 
    }
  },
  { 
    timestamps: true,
    versionKey: false
  }
);

// Add index for faster queries
RestrictedCountrySchema.index({ merchantId: 1 });
RestrictedCountrySchema.index({ bannedCountries: 1 });

export interface IFundistRestrictedCountryModel extends Model<IFundistRestrictedCountry> {
  findByMerchantId(merchantId: string): Promise<IFundistRestrictedCountry | null>;
  findByCountry(countryCode: string): Promise<IFundistRestrictedCountry[]>;
}

RestrictedCountrySchema.statics.findByMerchantId = async function(merchantId: string) {
  return this.findOne({ merchantId });
};

RestrictedCountrySchema.statics.findByCountry = async function(countryCode: string) {
  return this.find({ bannedCountries: countryCode });
};

export const RestrictedCountryModel = model<IFundistRestrictedCountry, IFundistRestrictedCountryModel>(
  MODEL_NAME,
  RestrictedCountrySchema,
  COLLECTION_NAME
);