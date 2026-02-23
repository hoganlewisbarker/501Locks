export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Odds API key not configured' });
  }

  const TEAM_MAP = {
    'Michigan Wolverines':'MICH','Duke Blue Devils':'DUKE','Houston Cougars':'HOU',
    'Arizona Wildcats':'ARIZ','Kansas Jayhawks':'KU','Cincinnati Bearcats':'CIN',
    'Kentucky Wildcats':'UK','Auburn Tigers':'AUB','St. John\'s Red Storm':'SJU',
    'Creighton Bluejays':'CREI','Vanderbilt Commodores':'VAN','Tennessee Volunteers':'TENN',
    'North Carolina Tar Heels':'UNC','Syracuse Orange':'SYR','Gonzaga Bulldogs':'GONZ',
    'Connecticut Huskies':'CONN','Iowa State Cyclones':'ISU','Miami (OH) RedHawks':'M-OH',
    'Bowling Green Falcons':'BGSU','Nebraska Cornhuskers':'NEB','Penn State Nittany Lions':'PSU',
    'Florida Gators':'FLA','Ole Miss Rebels':'MISS','Texas Tech Red Raiders':'TTU',
    'Kansas State Wildcats':'KSU','Villanova Wildcats':'VILL','Saint Louis Billikens':'SLU',
    'VCU Rams':'VCU','Virginia Tech Hokies':'VT','Wake Forest Demon Deacons':'WAKE',
    'Clemson Tigers':'CLEM','Florida State Seminoles':'FSU','Minnesota Golden Gophers':'MINN',
    'Rutgers Scarlet Knights':'RUTG','South Carolina Gamecocks':'SCAR',
    'Mississippi State Bulldogs':'MSST','Butler Bulldogs':'BUT','Xavier Musketeers':'XAV',
    'Notre Dame Fighting Irish':'ND','Virginia Cavaliers':'UVA','Miami Hurricanes':'MIA',
    'Louisville Cardinals':'LOU','Georgia Tech Yellow Jackets':'GT','Dayton Flyers':'DAY',
    'Duquesne Dukes':'DUQ','Maryland Terrapins':'MD','Washington Huskies':'WASH',
    'Georgia Bulldogs':'UGA','Texas Longhorns':'TEX','Colorado Buffaloes':'COLO',
    'Oklahoma State Cowboys':'OKST','Arkansas Razorbacks':'ARK','Missouri Tigers':'MIZZ',
    'USC Trojans':'USC','Oregon Ducks':'ORE','Baylor Bears':'BAY',
    'Arizona State Sun Devils':'ASU','TCU Horned Frogs':'TCU','West Virginia Mountaineers':'WVU',
    'LSU Tigers':'LSU','Alabama Crimson Tide':'ALA','Seton Hall Pirates':'HALL',
    'Georgetown Hoyas':'GTWN','UCLA Bruins':'UCLA','Illinois Fighting Illini':'ILL',
    'Oklahoma Sooners':'OKLA','Texas A&M Aggies':'TXAM','BYU Cougars':'BYU',
    'Michigan State Spartans':'MSU','Ohio State Buckeyes':'OSU','Wisconsin Badgers':'WIS',
    'Iowa Hawkeyes':'IOWA','Purdue Boilermakers':'PUR','Indiana Hoosiers':'IND',
    'Northwestern Wildcats':'NW','Akron Zips':'AKR','Ball State Cardinals':'BALL',
    'Providence Friars':'PROV','Marquette Golden Eagles':'MARQ','DePaul Blue Demons':'DEP',
    'Stanford Cardinal':'STAN','California Golden Bears':'CAL','Pittsburgh Panthers':'PITT',
    'Boston College Eagles':'BC','NC State Wolfpack':'NCST','SMU Mustangs':'SMU',
    'Utah State Aggies':'USU','New Mexico Lobos':'UNM','San Diego State Aztecs':'SDSU',
    'Colorado State Rams':'CSU','Boise State Broncos':'BSU','Nevada Wolf Pack':'NEV',
    'Wyoming Cowboys':'WYO','UNLV Rebels':'UNLV','Fresno State Bulldogs':'FRES',
    'Saint Mary\'s Gaels':'SMC','Santa Clara Broncos':'SCU','Grand Canyon Antelopes':'GC',
    'Tulsa Golden Hurricane':'TLSA','South Florida Bulls':'USF','Wichita State Shockers':'WICH',
    'Tulane Green Wave':'TULN','North Texas Mean Green':'UNT','South Alabama Jaguars':'USA',
    'Troy Trojans':'TROY','Marshall Thundering Herd':'MRSH','Belmont Bruins':'BEL',
    'Murray State Racers':'MURR','Bradley Braves':'BRAD','Georgia Southern Eagles':'GASO',
    'Georgia State Panthers':'GAST','Yale Bulldogs':'YALE','Kent State Golden Flashes':'KENT',
    'Buffalo Bulls':'BUFF','UCF Knights':'UCF','Utah Utes':'UTAH'
  };

  try {
    // Get current date and next 7 days
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Format dates for API
    const dateFrom = today.toISOString().split('T')[0];
    const dateTo = nextWeek.toISOString().split('T')[0];

    // Fetch odds data with date range
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/basketball_ncaab/odds/?apiKey=${apiKey}&regions=us&markets=spreads,totals,h2h&bookmakers=fanduel&oddsFormat=american&dateFormat=iso&commenceTimeFrom=${dateFrom}T00:00:00Z&commenceTimeTo=${dateTo}T23:59:59Z`
    );

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: 'Odds API error', detail: err });
    }

    const data = await response.json();
    
    // Process games by date
    const gamesByDate = {
      today: [],
      week: [],
      final: []
    };

    const lines = {};

    for (const game of data) {
      const homeAbbr = TEAM_MAP[game.home_team];
      const awayAbbr = TEAM_MAP[game.away_team];
      
      if (!homeAbbr || !awayAbbr) continue;

      const gameDate = new Date(game.commence_time);
      const isToday = gameDate.toDateString() === today.toDateString();
      const isPastGame = gameDate < today;

      const fanduel = game.bookmakers?.find(b => b.key === 'fanduel');
      if (!fanduel) continue;

      // Extract all markets
      const spreadMarket = fanduel.markets?.find(m => m.key === 'spreads');
      const totalsMarket = fanduel.markets?.find(m => m.key === 'totals');
      const h2hMarket = fanduel.markets?.find(m => m.key === 'h2h');

      let gameData = {
        id: `${awayAbbr}_${homeAbbr}_${gameDate.getTime()}`,
        commence_time: game.commence_time,
        home_team: game.home_team,
        away_team: game.away_team,
        home_abbr: homeAbbr,
        away_abbr: awayAbbr,
        status: isPastGame ? 'final' : 'upcoming'
      };

      // Process spread
      if (spreadMarket) {
        const awayOutcome = spreadMarket.outcomes.find(o => o.name === game.away_team);
        const homeOutcome = spreadMarket.outcomes.find(o => o.name === game.home_team);
        
        if (awayOutcome && homeOutcome) {
          lines[homeAbbr + '|' + awayAbbr] = awayOutcome.point;
          gameData.spread = {
            away: { point: awayOutcome.point, price: awayOutcome.price },
            home: { point: homeOutcome.point, price: homeOutcome.price }
          };
        }
      }

      // Process totals
      if (totalsMarket) {
        const overOutcome = totalsMarket.outcomes.find(o => o.name === 'Over');
        const underOutcome = totalsMarket.outcomes.find(o => o.name === 'Under');
        
        if (overOutcome && underOutcome) {
          gameData.total = {
            over: { point: overOutcome.point, price: overOutcome.price },
            under: { point: underOutcome.point, price: underOutcome.price }
          };
        }
      }

      // Process moneyline
      if (h2hMarket) {
        const awayML = h2hMarket.outcomes.find(o => o.name === game.away_team);
        const homeML = h2hMarket.outcomes.find(o => o.name === game.home_team);
        
        if (awayML && homeML) {
          gameData.moneyline = {
            away: awayML.price,
            home: homeML.price
          };
        }
      }

      // Categorize by date
      if (isPastGame) {
        gamesByDate.final.push(gameData);
      } else if (isToday) {
        gamesByDate.today.push(gameData);
      } else {
        gamesByDate.week.push(gameData);
      }
    }

    // Sort games by time
    Object.keys(gamesByDate).forEach(category => {
      gamesByDate[category].sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time));
    });

    return res.status(200).json({ 
      lines,
      games: gamesByDate,
      lastUpdated: new Date().toISOString(),
      totalGames: data.length
    });

  } catch (err) {
    console.error('Odds API error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}
