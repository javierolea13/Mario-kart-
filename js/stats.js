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
      headToHead: computeH2H(players, results, races, tournaments),
      streaks: computeStreaks(players, results, tournaments, races),
      trackStats: computeTrackStats(players, results, races)
    };
  }

  // ---- RANKINGS ----
  function computeRankings(players, results, tournaments) {
    const stats = {};

    // Build tournament map for cup names
    const tournamentMap = {};
    tournaments.forEach(t => { tournamentMap[t.tournament_id] = t; });

    players.forEach(p => {
      stats[p.player_id] = {
        player: p,
        totalPoints: 0,
        totalRaces: 0,
        gpsPlayed: new Set(),
        gpPoints: {},    // tournament_id -> total points in that GP
        wins: 0,         // 1st place in a race
        podiums: 0,      // top 3
        topFive: 0,      // top 5
        positions: [],
        rivals: new Set(), // player IDs they've raced against
        cupStats: {}     // cup_name -> { points, races, gps }
      };
    });

    results.forEach(r => {
      const s = stats[r.player_id];
      if (!s) return;
      const pts = typeof r.points === 'number' ? r.points : parseInt(r.points) || 0;
      const pos = typeof r.position === 'number' ? r.position : parseInt(r.position) || 24;

      s.totalPoints += pts;
      s.totalRaces++;
      s.gpsPlayed.add(r.tournament_id);
      s.positions.push(pos);

      // Track points per GP
      if (!s.gpPoints[r.tournament_id]) s.gpPoints[r.tournament_id] = 0;
      s.gpPoints[r.tournament_id] += pts;

      // Track rivals in same tournament
      const tournament = tournamentMap[r.tournament_id];
      if (tournament) {
        const pids = typeof tournament.player_ids === 'string' ? tournament.player_ids.split(',') : [];
        pids.forEach(pid => { if (pid !== r.player_id) s.rivals.add(pid); });

        // Cup stats
        const cupName = tournament.cup_name || 'Sin copa';
        if (!s.cupStats[cupName]) s.cupStats[cupName] = { points: 0, races: 0, gps: new Set() };
        s.cupStats[cupName].points += pts;
        s.cupStats[cupName].races++;
        s.cupStats[cupName].gps.add(r.tournament_id);
      }

      if (pos === 1) s.wins++;
      if (pos <= 3) s.podiums++;
      if (pos <= 5) s.topFive++;
    });

    return Object.values(stats)
      .filter(s => s.totalRaces > 0)
      .map(s => {
        const gpPointsArr = Object.values(s.gpPoints);
        const avgPerGP = gpPointsArr.length > 0 ? (gpPointsArr.reduce((a, b) => a + b, 0) / gpPointsArr.length) : 0;

        // Convert cup stats
        const cupStatsArr = Object.entries(s.cupStats).map(([name, data]) => ({
          cup: name,
          avgPoints: (data.points / data.gps.size).toFixed(1),
          timesPlayed: data.gps.size
        })).sort((a, b) => parseFloat(b.avgPoints) - parseFloat(a.avgPoints));

        return {
          ...s,
          gpsPlayed: s.gpsPlayed.size,
          avgPointsPerRace: s.totalRaces > 0 ? (s.totalPoints / s.totalRaces).toFixed(1) : '0',
          avgPosition: s.totalRaces > 0 ? (s.positions.reduce((a, b) => a + b, 0) / s.positions.length).toFixed(1) : '-',
          winRate: s.totalRaces > 0 ? ((s.wins / s.totalRaces) * 100).toFixed(1) : '0',
          podiumRate: s.totalRaces > 0 ? ((s.podiums / s.totalRaces) * 100).toFixed(1) : '0',
          avgPerGP: avgPerGP.toFixed(1),
          rivalsCount: s.rivals.size,
          cupStatsArr
        };
      })
      .sort((a, b) => parseFloat(b.avgPerGP) - parseFloat(a.avgPerGP));
  }

  // ---- HEAD TO HEAD ----
  function computeH2H(players, results, races, tournaments) {
    const raceMap = {};
    races.forEach(r => { raceMap[r.race_id] = r; });
    const tournamentMap = {};
    (tournaments || []).forEach(t => { tournamentMap[t.tournament_id] = t; });

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
          total: 0,
          details: [] // { track, cup, p1Pos, p2Pos, winner }
        };
      });
    });

    Object.entries(raceResults).forEach(([raceId, raceRes]) => {
      const race = raceMap[raceId];
      const trackName = race ? race.track_name : '??';
      const tournament = race ? tournamentMap[race.tournament_id] : null;
      const cupName = tournament ? tournament.cup_name : '';

      const participants = {};
      raceRes.forEach(r => {
        participants[r.player_id] = typeof r.position === 'number' ? r.position : parseInt(r.position) || 24;
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
          let winner = 'tie';

          if (posA < posB) {
            h2h[key][a === h2h[key].player1.player_id ? 'p1Wins' : 'p2Wins']++;
            winner = a === h2h[key].player1.player_id ? 'p1' : 'p2';
          } else if (posB < posA) {
            h2h[key][b === h2h[key].player1.player_id ? 'p1Wins' : 'p2Wins']++;
            winner = b === h2h[key].player1.player_id ? 'p1' : 'p2';
          } else {
            h2h[key].ties++;
          }

          h2h[key].details.push({
            track: trackName,
            cup: cupName,
            p1Pos: a === h2h[key].player1.player_id ? posA : posB,
            p2Pos: a === h2h[key].player1.player_id ? posB : posA,
            winner
          });
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

  // ---- PREDICTIONS ----
  function getPredictions(data, selectedPlayerIds) {
    const allStats = computeAll(data);
    if (!allStats || !allStats.rankings.length) return null;

    const predictions = selectedPlayerIds.map(pid => {
      const ranking = allStats.rankings.find(r => r.player.player_id === pid);
      if (!ranking) return { player_id: pid, name: '??', avgPerGP: 0, avgPos: 24, trend: 'neutral' };

      // Check recent trend (last 3 GPs)
      const recentPositions = ranking.positions.slice(-12); // last ~3 GPs worth
      const oldPositions = ranking.positions.slice(0, -12);
      const recentAvg = recentPositions.length > 0 ? recentPositions.reduce((a,b) => a+b, 0) / recentPositions.length : 24;
      const oldAvg = oldPositions.length > 0 ? oldPositions.reduce((a,b) => a+b, 0) / oldPositions.length : 24;
      let trend = 'neutral';
      if (recentPositions.length >= 4 && oldPositions.length >= 4) {
        if (recentAvg < oldAvg - 1) trend = 'up';
        else if (recentAvg > oldAvg + 1) trend = 'down';
      }

      return {
        player_id: pid,
        name: ranking.player.name,
        color: ranking.player.avatar_color,
        avgPerGP: parseFloat(ranking.avgPerGP),
        avgPos: parseFloat(ranking.avgPosition),
        winRate: parseFloat(ranking.winRate),
        gpsPlayed: ranking.gpsPlayed,
        trend
      };
    }).sort((a, b) => b.avgPerGP - a.avgPerGP);

    return predictions;
  }

  return {
    computeAll,
    computeRankings,
    getGPStandings,
    getPredictions
  };
})();
