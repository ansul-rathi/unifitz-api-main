const SPORTS_CONFIG = {
    soccer: {
      apiParams: { fi: '1', sport: '1' },
      priority: 1,
      pollIntervals: {
        inplay: 60,    // Seconds
        upcoming: 300,
        ended: 600
      }
    },
    basketball: {
      apiParams: { fi: '2', sport: '2' },
      priority: 2,
      pollIntervals: {
        inplay: 30,
        upcoming: 180,
        ended: 900
      }
    }
  };