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
    'Pacific Tigers':'PAC','Portland Pilots':'PORT','Northwestern Wildcats':'NW',
    'Akron Zips':'AKR','Ball State Cardinals':'BALL',
  };

  try {
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/basketball_ncaab/odds/?apiKey=${apiKey}&regions=us&markets=spreads&bookmakers=fanduel&oddsFormat=american`
    );

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: 'Odds API error', detail: err });
    }

    const data = await response.json();
    const lines = {};

    for (const game of data) {
      const homeAbbr = TEAM_MAP[game.home_team];
      const awayAbbr = TEAM_MAP[game.away_team];
      if (!homeAbbr || !awayAbbr) continue;

      const fanduel = game.bookmakers?.[0];
      if (!fanduel) continue;

      const spreadMarket = fanduel.markets?.find(m => m.key === 'spreads');
      if (!spreadMarket) continue;

      const awayOutcome = spreadMarket.outcomes.find(o => o.name === game.away_team);
if (!awayOutcome) continue;

lines[homeAbbr + '|' + awayAbbr] = awayOutcome.point;
    }

    return res.status(200).json({ lines });
  } catch (err) {
    console.error('Odds API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
