/**
 * Mario Kart World Tracker - Stats Module
 * Calculos de estadisticas estilo beisbol
 */

const Stats = (() => {

  function computeAll(data) {
    const { players, tournaments, races, results } = data;
    if (!players.length || !results.length) return null;

    const playerMap = {};
    players.forEach(p => { playerMap[p.player_id] = p; });

    const raceMap = {};
    races.forEach(r => { raceMap[r.race_id] = r; });

    return {
      rankings: computeRankings(players, results, tournaments),
      headToHead: computeH2H(players, results, races),
      streaks: computeStreaks(players, results, tournaments, races),
      trackStats: computeTrackStats(players, results, races)
    };
  }

  // ---- RANKINGS ----
  function computeRankings(players, results, tournaments) {
    const stats = {};

    players.forEach(p => {
      stats[p.player_id] = {
        player: p,
        totalPoints: 0,
        totalRaces: 0,
        gpsPlayed: new Set(),
        wins: 0,       // 1st place
        podiums: 0,     // top 3
        topFive: 0,     // top 5
        positions: []
      };
    });

    results.forEach(r => {
      const s = stats[r.player_id];
      if (!s) return;
      const pts = typeof r.points === 'number' ? r.points : parseInt(r.points) || 0;
      const pos = typeof r.position === 'number' ? r.position : parseInt(r.position) || 12;

      s.totalPoints += pts;
      s.totalRaces++;
      s.gpsPlayed.add(r.tournament_id);
      s.positions.push(pos);

      if (pos === 1) s.wins++;
      if (pos <= 3) s.podiums++;
      if (pos <= 5) s.topFive++;
    });

    return Object.values(stats)
      .filter(s => s.totalRaces > 0)
      .map(s => ({
        ...s,
        gpsPlayed: s.gpsPlayed.size,
        avgPoints: s.totalRaces > 0 ? (s.totalPoints / s.totalRaces).toFixed(1) : '0',
        avgPosition: s.totalRaces > 0 ? (s.positions.reduce((a, b) => a + b, 0) / s.positions.length).toFixed(1) : '-',
        winRate: s.totalRaces > 0 ? ((s.wins / s.totalRaces) * 100).toFixed(1) : '0',
        podiumRate: s.totalRaces > 0 ? ((s.podiums / s.totalRaces) * 100).toFixed(1) : '0',
        avgPerGP: s.gpsPlayed.size > 0 ? (s.totalPoints / s.gpsPlayed.size).toFixed(1) : '0'
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints);
  }

  // ---- HEAD TO HEAD ----
  function computeH2H(players, results, races) {
    // Group results by race
    const raceResults = {};
    results.forEach(r => {
      if (!raceResults[r.race_id]) raceResults[r.race_id] = [];
      raceResults[r.race_id].push(r);
    });

    const h2h = {};
    players.forEach(p1 => {
      players.forEach(p2 => {
        if (p1.player_id >= p2.player_id) return;
        const key = `${p1.player_id}_${p2.player_id}`;
        h2h[key] = {
          player1: p1,
          player2: p2,
          p1Wins: 0,
          p2Wins: 0,
          ties: 0,
          total: 0
        };
      });
    });

    Object.values(raceResults).forEach(raceRes => {
      const participants = {};
      raceRes.forEach(r => {
        participants[r.player_id] = typeof r.position === 'number' ? r.position : parseInt(r.position) || 12;
      });

      const pIds = Object.keys(participants);
      for (let i = 0; i < pIds.length; i++) {
        for (let j = i + 1; j < pIds.length; j++) {
          const [a, b] = [pIds[i], pIds[j]].sort();
          const key = `${a}_${b}`;
          if (!h2h[key]) continue;

          h2h[key].total++;
          const posA = participants[a];
          const posB = participants[b];

          if (posA < posB) {
            h2h[key][a === h2h[key].player1.player_id ? 'p1Wins' : 'p2Wins']++;
          } else if (posB < posA) {
            h2h[key][b === h2h[key].player1.player_id ? 'p1Wins' : 'p2Wins']++;
          } else {
            h2h[key].ties++;
          }
        }
      }
    });

    return Object.values(h2h).filter(m => m.total > 0);
  }

  // ---- STREAKS ----
  function computeStreaks(players, results, tournaments, races) {
    // Sort tournaments by date
    const sortedTournaments = [...tournaments].sort((a, b) =>
      new Date(a.date) - new Date(b.date)
    );

    const tournamentRaces = {};
    races.forEach(r => {
      if (!tournamentRaces[r.tournament_id]) tournamentRaces[r.tournament_id] = [];
      tournamentRaces[r.tournament_id].push(r);
    });

    const raceResults = {};
    results.forEach(r => {
      if (!raceResults[r.race_id]) raceResults[r.race_id] = [];
      raceResults[r.race_id].push(r);
    });

    const streaks = {};
    players.forEach(p => {
      streaks[p.player_id] = {
        player: p,
        currentWinStreak: 0,
        bestWinStreak: 0,
        currentPodiumStreak: 0,
        bestPodiumStreak: 0,
        last5: []
      };
    });

    // Process in chronological order
    sortedTournaments.forEach(t => {
      const tRaces = (tournamentRaces[t.tournament_id] || [])
        .sort((a, b) => (a.race_number || 0) - (b.race_number || 0));

      tRaces.forEach(race => {
        const res = raceResults[race.race_id] || [];
        res.forEach(r => {
          const s = streaks[r.player_id];
          if (!s) return;
          const pos = typeof r.position === 'number' ? r.position : parseInt(r.position) || 12;

          s.last5.push(pos);
          if (s.last5.length > 5) s.last5.shift();

          if (pos === 1) {
            s.currentWinStreak++;
            s.bestWinStreak = Math.max(s.bestWinStreak, s.currentWinStreak);
          } else {
            s.currentWinStreak = 0;
          }

          if (pos <= 3) {
            s.currentPodiumStreak++;
            s.bestPodiumStreak = Math.max(s.bestPodiumStreak, s.currentPodiumStreak);
          } else {
            s.currentPodiumStreak = 0;
          }
        });
      });
    });

    return Object.values(streaks)
      .filter(s => s.last5.length > 0)
      .map(s => ({
        ...s,
        last5Avg: (s.last5.reduce((a, b) => a + b, 0) / s.last5.length).toFixed(1)
      }));
  }

  // ---- TRACK STATS ----
  function computeTrackStats(players, results, races) {
    const raceMap = {};
    races.forEach(r => { raceMap[r.race_id] = r; });

    // Per player, per track
    const trackData = {};

    results.forEach(r => {
      const race = raceMap[r.race_id];
      if (!race) return;
      const track = race.track_name;
      const pos = typeof r.position === 'number' ? r.position : parseInt(r.position) || 12;

      if (!trackData[r.player_id]) trackData[r.player_id] = {};
      if (!trackData[r.player_id][track]) {
        trackData[r.player_id][track] = { positions: [], best: 13 };
      }

      trackData[r.player_id][track].positions.push(pos);
      trackData[r.player_id][track].best = Math.min(trackData[r.player_id][track].best, pos);
    });

    // Convert to array format
    const playerTrackStats = {};
    Object.entries(trackData).forEach(([playerId, tracks]) => {
      playerTrackStats[playerId] = Object.entries(tracks)
        .map(([trackName, data]) => ({
          track: trackName,
          best: data.best,
          avg: (data.positions.reduce((a, b) => a + b, 0) / data.positions.length).toFixed(1),
          races: data.positions.length,
          wins: data.positions.filter(p => p === 1).length
        }))
        .sort((a, b) => parseFloat(a.avg) - parseFloat(b.avg));
    });

    // Global track leaderboard
    const globalTracks = {};
    results.forEach(r => {
      const race = raceMap[r.race_id];
      if (!race) return;
      const track = race.track_name;
      if (!globalTracks[track]) globalTracks[track] = [];
      globalTracks[track].push({
        player_id: r.player_id,
        position: typeof r.position === 'number' ? r.position : parseInt(r.position) || 12
      });
    });

    const trackLeaderboard = Object.entries(globalTracks)
      .map(([trackName, data]) => ({
        track: trackName,
        avgPosition: (data.reduce((a, b) => a + b.position, 0) / data.length).toFixed(1),
        timesPlayed: data.length
      }))
      .sort((a, b) => b.timesPlayed - a.timesPlayed);

    return { playerTrackStats, trackLeaderboard };
  }

  // ---- GP RESULTS ----
  function getGPStandings(data, tournamentId) {
    const gpResults = data.results.filter(r => r.tournament_id === tournamentId);
    const playerTotals = {};

    gpResults.forEach(r => {
      if (!playerTotals[r.player_id]) {
        playerTotals[r.player_id] = { points: 0, positions: [] };
      }
      const pts = typeof r.points === 'number' ? r.points : parseInt(r.points) || 0;
      const pos = typeof r.position === 'number' ? r.position : parseInt(r.position) || 12;
      playerTotals[r.player_id].points += pts;
      playerTotals[r.player_id].positions.push(pos);
    });

    const playerMap = {};
    data.players.forEach(p => { playerMap[p.player_id] = p; });

    return Object.entries(playerTotals)
      .map(([pid, totals]) => ({
        player: playerMap[pid] || { name: '??', avatar_color: '#666' },
        totalPoints: totals.points,
        positions: totals.positions
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints);
  }

  return {
    computeAll,
    computeRankings,
    getGPStandings
  };
})();
