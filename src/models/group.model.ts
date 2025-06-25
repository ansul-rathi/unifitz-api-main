import { Schema, model, Document, Model } from "mongoose";

const MODEL_NAME = "Group";
const COLLECTION_NAME = "groups";

const GroupSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter a group name"],
      unique: true,
    },
    tags: [{
      type: String,
      required: true
    }],
    agents: [{
      type: Schema.Types.ObjectId,
      ref: 'Staff'
    }],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Staff',
      required: true
    }
  },
  { 
    timestamps: true 
  }
);

// Interface for the document
export interface IGroup extends Document {
  name: string;
  tags: string[];
  agents: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Create and export the model
export const GroupModel: Model<IGroup> = model<IGroup>(
  MODEL_NAME,
  GroupSchema,
  COLLECTION_NAME
);