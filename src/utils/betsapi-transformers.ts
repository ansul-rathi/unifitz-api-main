import { BetsApiEvent, EventTimeStatus } from "@interfaces/bets-api.interface";
import { IEvent } from "@interfaces/events.interface";

export const transformEvent = (apiEvent: BetsApiEvent): IEvent => {
  const statusMap: { [key: string]: string } = {
    "0": EventTimeStatus.NOT_STARTED,
    "1": EventTimeStatus.INPLAY,
    "2": EventTimeStatus.TO_BE_FIXED,
    "3": EventTimeStatus.ENDED,
    "4": EventTimeStatus.POSTPONED,
    "5": EventTimeStatus.CANCELLED,
    "6": EventTimeStatus.WALKOVER,
    "7": EventTimeStatus.INTERRUPTED,
    "8": EventTimeStatus.ABANDONED,
    "9": EventTimeStatus.RETIRED,
    "10": EventTimeStatus.SUSPENDED,
    "11": EventTimeStatus.DECIDED_BY_FA,
    "99": EventTimeStatus.REMOVED,
  };

  return {
    eventId: apiEvent.id,
    sportId: apiEvent.sport_id,
    startTime: new Date(parseInt(apiEvent.time) * 1000), // Convert Unix timestamp to Date
    status: statusMap[apiEvent.time_status] || EventTimeStatus.NOT_STARTED,
    league: {
      id: apiEvent.league?.id || "",
      name: apiEvent.league?.name || "",
    },
    teams: {
      home: {
        id: apiEvent.home?.id || "",
        name: apiEvent.home?.name || "",
      },
      away: {
        id: apiEvent.away?.id || "",
        name: apiEvent.away?.name || "",
      },
    },
    score: apiEvent.ss,
    provider: "bet365",
    metadata: {
      ourEventId: apiEvent.our_event_id || undefined,
      externalId: apiEvent.r_id || undefined,
    },
    active: true,
  };
};
export const transformResult = (apiEvent: any): any => {
  const statusMap: { [key: string]: string } = {
    "0": EventTimeStatus.NOT_STARTED,
    "1": EventTimeStatus.INPLAY,
    "2": EventTimeStatus.TO_BE_FIXED,
    "3": EventTimeStatus.ENDED,
    "4": EventTimeStatus.POSTPONED,
    "5": EventTimeStatus.CANCELLED,
    "6": EventTimeStatus.WALKOVER,
    "7": EventTimeStatus.INTERRUPTED,
    "8": EventTimeStatus.ABANDONED,
    "9": EventTimeStatus.RETIRED,
    "10": EventTimeStatus.SUSPENDED,
    "11": EventTimeStatus.DECIDED_BY_FA,
    "99": EventTimeStatus.REMOVED,
  };
  
  // Create a copy of apiEvent without the used fields
  const { 
    bet365_id, 
    sport_id, 
    time, 
    time_status, 
    league, 
    home, 
    away, 
    ss, 
    our_event_id, 
    r_id, 
    ...remainingFields 
  } = apiEvent;
  
  return {
    ...remainingFields,
    eventId: bet365_id,
    sportId: sport_id,
    startTime: new Date(parseInt(time) * 1000), // Convert Unix timestamp to Date
    status: statusMap[time_status] || EventTimeStatus.NOT_STARTED,
    league: {
      id: league?.id || "",
      name: league?.name || "",
    },
    home: {
      id: home?.id || "",
      name: home?.name || "",
    },
    away: {
      id: away?.id || "",
      name: away?.name || "",
    },
    score: ss,
    provider: "bet365",
    metadata: {
      ourEventId: our_event_id || undefined,
      externalId: r_id || undefined,
    },
  };
};

export const transformEvents = (apiEvents: BetsApiEvent[]) => {
  return apiEvents.map((event) => transformEvent(event));
};
export const transformResults = (apiEvents: BetsApiEvent[]) => {
  return apiEvents.map((event) => transformResult(event));
};


export function transformPrematchOddsEntries(data) {
  const oddsEntries = [];
  
  // Check that we have a valid result set
  if (data.success !== 1 || !Array.isArray(data.results)) return oddsEntries;
  
  data.results.forEach(result => {
    // Common event-level identifiers
    const FI = result.FI;
    const eventId = result.event_id;
    
    // Loop over each key in the result (skipping known non-event keys)
    Object.keys(result).forEach(key => {
      if (key === "FI" || key === "event_id") return;
      
      // key here represents the event type (e.g., "1st_over", "match", etc.)
      const eventData = result[key];
      const eventType = key;
      const updatedAtUnix = eventData.updated_at;
      const eventKey = eventData.key;
      
      // The "sp" object holds the markets (like "1st_over_total_runs", etc.)
      const sp = eventData.sp;
      if (!sp) return;
      
      Object.keys(sp).forEach(marketKey => {
        const marketData = sp[marketKey];
        const marketId = marketData.id;
        const marketName = marketData.name;
        
        // Process each odds entry in the market's odds array
        if (Array.isArray(marketData.odds)) {
          marketData.odds.forEach(odd => {
            oddsEntries.push({
              FI,                           // event FI field
              eventId,                      // event_id field
              eventType,                    // e.g., "1st_over"
              updatedAt: new Date(parseInt(updatedAtUnix, 10) * 1000),
              eventKey,                     // key for this event
              marketKey,                    // key of the market (e.g., "1st_over_total_runs")
              marketId,                     // market's id
              marketName,                   // market's name
              oddId: odd.id,                // odds entry id
              oddsValue: parseFloat(odd.odds), // convert odds from string to number
              header: odd.header || null,
              oddName: odd.name,
              handicap: odd.handicap || null,
              name: odd.name,
              name2: odd.name2 || null
            });
          });
        }
      });
    });
  });
  return oddsEntries;
}




function calculateOdd(oddString) {
  if (!oddString) return null;
  const [numerator, denominator] = oddString.split('/').map(Number);
  if (denominator === 0) return null;
  return 1 + (numerator / denominator);
}

export function transformInplayOddsData(data:any, FI:string, eventId: string) {
if (!data.results?.[0]) return [];

const transformedData = [];
let currentMarketGroup = null;

data.results[0].forEach((item) => {
  if (item.type === "MG") {
    // If there was a previous market group with participants, save it
    if (currentMarketGroup?.participants.length > 0) {
      transformedData.push(currentMarketGroup);
    }

    // Create new market group
    currentMarketGroup = {
      FI,
      eventId: eventId,
      marketId: item.ID,
      marketName: item.NA,
      participants: [],
      updatedAt: new Date()
    };
  } else if (item.type === "PA" && currentMarketGroup) {
    const oddValue = calculateOdd(item.OD);
    currentMarketGroup.participants.push({
      id: item.ID,
      name: item.NA,
      odd: item.OD,
      oddValue: oddValue || 1,
      suspended: item.SU === "1"
    });
  }
});

// Don't forget to push the last market group if it has participants
if (currentMarketGroup?.participants.length > 0) {
  transformedData.push(currentMarketGroup);
}
return transformedData;
}

