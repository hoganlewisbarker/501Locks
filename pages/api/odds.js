// pages/api/odds.js
// Fetches live NCAAM spreads from The Odds API
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Odds API key not configured' });
  }

  try {
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/basketball_ncaab/odds/?apiKey=${apiKey}&regions=us&markets=spreads&bookmakers=fanduel&oddsFormat=american`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: 'Odds API error', detail: err });
    }

    const data = await response.json();

    // Transform into a simple lookup: "AWAY-HOME" -> spread (negative = home favored)
    const lines = {};
    for (const game of data) {
      const homeTeam = game.home_team;
      const awayTeam = game.away_team;

      const fanduel = game.bookmakers?.[0];
      if (!fanduel) continue;

      const spreadMarket = fanduel.markets?.find(m => m.key === 'spreads');
      if (!spreadMarket) continue;

      const homeOutcome = spreadMarket.outcomes.find(o => o.name === homeTeam);
      if (!homeOutcome) continue;

      // Store as: homeAbbr-awayAbbr -> spread (negative = home favored)
      lines[homeTeam + '|' + awayTeam] = homeOutcome.point;
    }

    // Also return raw games for schedule building
    const games = data.map(g => ({
      id: g.id,
      home: g.home_team,
      away: g.away_team,
      commence_time: g.commence_time,
    }));

    return res.status(200).json({ lines, games, remaining: response.headers.get('x-requests-remaining') });
  } catch (err) {
    console.error('Odds API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
