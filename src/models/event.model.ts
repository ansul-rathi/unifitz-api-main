import { Model, Schema, model } from 'mongoose';
import { IEvent } from '@interfaces/events.interface';
import { EventTimeStatus } from '@interfaces/bets-api.interface';

const MODEL_NAME = 'Event';
const COLLECTION_NAME = 'events';

const EventSchema: Schema = new Schema({
  eventId: {
    type: String,
    required: [true, 'Event ID is required'],
    unique: true
  },
  sportId: {
    type: String,
    required: [true, 'Sport ID is required'],
    index: true
  },
  startTime: { 
    type: Date, 
    required: [true, 'Start time is required'],
    index: true
  },
  status: { 
    type: String, 
    required: [true, 'Status is required'],
    enum: Object.values(EventTimeStatus),
    default: EventTimeStatus.NOT_STARTED
  },
  league: {
    id: { 
      type: String, 
      required: [true, 'League ID is required'] 
    },
    name: { 
      type: String, 
      required: [true, 'League name is required'] 
    }
  },
  teams: {
    home: {
      id: { 
        type: String, 
        required: [true, 'Home team ID is required'] 
      },
      name: { 
        type: String, 
        required: [true, 'Home team name is required'] 
      }
    },
    away: {
      id: { 
        type: String, 
        required: [true, 'Away team ID is required'] 
      },
      name: { 
        type: String, 
        required: [true, 'Away team name is required'] 
      }
    }
  },
  score: { 
    type: String,
    default: null
  },
  provider: {
    type: String,
    required: [true, 'Provider is required'],
    default: 'bet365'
  },
  metadata: {
    ourEventId: String,
    providerId: String,
    externalId: String
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: COLLECTION_NAME
});

// Create indexes
EventSchema.index({ sportId: 1, startTime: -1 });
EventSchema.index({ 'league.id': 1 });
EventSchema.index({ status: 1 });
EventSchema.index({ active: 1 });

export interface IEventModel extends Model<IEvent> {
  findByEventId(eventId: string): Promise<IEvent | null>;
  findUpcoming(sportId?: string): Promise<IEvent[]>;
  findLive(sportId?: string): Promise<IEvent[]>;
}

// Add static methods
EventSchema.statics.findByEventId = function(eventId: string): Promise<IEvent | null> {
  return this.findOne({ eventId });
};

EventSchema.statics.findUpcoming = function(sportId?: string): Promise<IEvent[]> {
  const query: any = {
    startTime: { $gt: new Date() },
    status: 'NOT_STARTED',
    active: true
  };
  if (sportId) query.sportId = sportId;
  
  return this.find(query)
    .sort({ startTime: 1 })
    .limit(1000);
};

EventSchema.statics.findLive = function(sportId?: string): Promise<IEvent[]> {
  const query: any = {
    status: 'INPLAY',
    active: true
  };
  if (sportId) query.sportId = sportId;
  
  return this.find(query)
    .sort({ startTime: -1 });
};

export const EventModel = model<IEvent, IEventModel>(MODEL_NAME, EventSchema);