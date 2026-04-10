/**
 * Mario Kart World Tracker - UI Components
 */

const UI = (() => {
  const COLORS = ['#E52521', '#049CD8', '#43B047', '#FBD000', '#7B5EA7', '#F5A623', '#FF6B9D', '#00BCD4'];

  function getInitial(name) {
    return name.charAt(0).toUpperCase();
  }

  // ---- LOGIN SCREEN ----
  function renderLogin() {
    return `
      <div class="login-screen">
        <div class="login-logo">🏎️</div>
        <h1 class="login-title">MK World Tracker</h1>
        <p class="login-subtitle">Mario Kart World - Nintendo Switch 2</p>
        <div class="card" style="margin-top:24px">
          <div class="form-group">
            <label class="form-label">Contraseña</label>
            <input type="password" id="login-password" class="form-input" placeholder="Ingresa la contraseña" autocomplete="off">
          </div>
          <div id="login-error" style="color:var(--red);font-size:0.85rem;margin-bottom:12px;display:none">Contraseña incorrecta</div>
          <button id="login-btn" class="btn btn-primary btn-block">Entrar</button>
        </div>
        <div class="login-hint">
          <p>👑 Admin: editar y registrar</p>
          <p>👀 Invitado: solo ver</p>
        </div>
      </div>
    `;
  }

  function positionEmoji(pos) {
    if (pos === 1) return '🥇';
    if (pos === 2) return '🥈';
    if (pos === 3) return '🥉';
    return `${pos}o`;
  }

  // ---- DASHBOARD / RANKINGS ----
  function renderDashboard(data) {
    const allStats = Stats.computeAll(data);

    if (!allStats) {
      return `
        <div class="section-header">🏆 Ranking</div>
        <div class="empty-state">
          <div class="empty-state-icon">🏎️</div>
          <div class="empty-state-text">No hay carreras registradas aun.<br>Registra jugadores y corre un Grand Prix!</div>
          <a href="#new-gp" class="btn btn-primary">Iniciar Grand Prix</a>
        </div>
      `;
    }

    const rankings = allStats.rankings;
    const rows = rankings.map((r, i) => {
      const posClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
      const posDisplay = i < 3 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}`;
      return `
        <li class="ranking-item">
          <div class="ranking-position ${posClass}">${posDisplay}</div>
          <div class="ranking-avatar" style="background:${r.player.avatar_color}">${getInitial(r.player.name)}</div>
          <div class="ranking-info">
            <div class="ranking-name">${r.player.name}</div>
            <div class="ranking-meta">${r.gpsPlayed} GPs | ${r.rivalsCount} rivales | Win: ${r.winRate}%</div>
          </div>
          <div class="ranking-points">${r.avgPerGP}<span style="font-size:0.6rem;color:var(--text-muted)"> pts/GP</span></div>
        </li>
      `;
    }).join('');

    return `
      <div class="section-header">🏆 Ranking General</div>
      <div class="section-subtitle">${data.tournaments.length} Grand Prix jugados</div>
      <div class="card">
        <ul class="ranking-list">${rows}</ul>
      </div>
    `;
  }

  // ---- PLAYERS ----
  function renderPlayers(players) {
    const playerRows = players.map(p => `
      <div class="ranking-item">
        <div class="ranking-avatar" style="background:${p.avatar_color}">${getInitial(p.name)}</div>
        <div class="ranking-info">
          <div class="ranking-name">${p.name}</div>
          <div class="ranking-meta">Registrado ${new Date(p.created_at).toLocaleDateString('es')}</div>
        </div>
        <button class="btn btn-icon btn-secondary delete-player-btn" data-id="${p.player_id}" title="Eliminar">🗑️</button>
      </div>
    `).join('');

    return `
      <div class="section-header">👥 Jugadores</div>
      <div class="card">
        <div class="form-group">
          <label class="form-label">Nombre</label>
          <div class="flex gap-8">
            <input type="text" id="player-name" class="form-input" placeholder="Nombre del jugador" maxlength="20">
            <button id="add-player-btn" class="btn btn-primary btn-sm">Agregar</button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Color</label>
          <div class="flex flex-wrap gap-8" id="color-picker">
            ${COLORS.map((c, i) => `
              <div class="player-dot ${i === 0 ? 'selected' : ''}" data-color="${c}"
                   style="width:32px;height:32px;border-radius:50%;background:${c};cursor:pointer;border:3px solid ${i === 0 ? 'white' : 'transparent'}"
              ></div>
            `).join('')}
          </div>
        </div>
      </div>
      ${players.length > 0 ? `
        <div class="card">
          <div class="card-title">Jugadores registrados (${players.length})</div>
          ${playerRows}
        </div>
      ` : `
        <div class="empty-state">
          <div class="empty-state-icon">👤</div>
          <div class="empty-state-text">Agrega jugadores para empezar</div>
        </div>
      `}
    `;
  }

  // ---- NEW GP WIZARD ----
  function renderGPSelectPlayers(players) {
    if (players.length < 2) {
      return `
        <div class="section-header">🏁 Nuevo Grand Prix</div>
        <div class="empty-state">
          <div class="empty-state-icon">👥</div>
          <div class="empty-state-text">Necesitas al menos 2 jugadores registrados</div>
          <a href="#players" class="btn btn-primary">Ir a Jugadores</a>
        </div>
      `;
    }

    const chips = players.map(p => `
      <div class="player-chip" data-id="${p.player_id}">
        <span class="player-dot" style="background:${p.avatar_color}"></span>
        ${p.name}
      </div>
    `).join('');

    return `
      <div class="section-header">🏁 Nuevo Grand Prix</div>
      <div class="wizard-progress">
        <div class="wizard-step active"></div>
        <div class="wizard-step"></div>
        <div class="wizard-step"></div>
        <div class="wizard-step"></div>
        <div class="wizard-step"></div>
      </div>
      <div class="card">
        <div class="card-title">Selecciona jugadores (2-4)</div>
        <div class="flex flex-wrap gap-8 mb-16" id="player-chips">${chips}</div>
      </div>
      <div class="card">
        <div class="card-title">Selecciona la copa</div>
        <div class="cup-grid" id="cup-grid">
          ${MK_CUPS.map(cup => `
            <button class="cup-btn" data-cup-id="${cup.id}">
              <span class="cup-emoji">${cup.emoji}</span>
              <span class="cup-name">${cup.name}</span>
            </button>
          `).join('')}
          <button class="cup-btn cup-btn-random" data-cup-id="random">
            <span class="cup-emoji">🎲</span>
            <span class="cup-name">Aleatoria</span>
          </button>
          <button class="cup-btn cup-btn-custom" data-cup-id="custom">
            <span class="cup-emoji">✏️</span>
            <span class="cup-name">Personalizada</span>
          </button>
        </div>
        <div id="custom-cup-input" class="form-group mt-16" style="display:none">
          <label class="form-label">Nombre de la copa</label>
          <input type="text" id="cup-name" class="form-input" placeholder="Ej: Mi Copa Custom...">
        </div>
        <div id="cup-preview" class="cup-preview mt-8" style="display:none"></div>
        <button id="start-gp-btn" class="btn btn-primary btn-block mt-16" disabled>
          Iniciar Grand Prix
        </button>
      </div>
    `;
  }

  function renderGPRace(raceNum, selectedPlayers, currentResults, allRaceResults, selectedCup, predictions) {
    // Calculate running totals from previous races
    const runningTotals = {};
    selectedPlayers.forEach(p => { runningTotals[p.player_id] = 0; });

    allRaceResults.forEach(raceRes => {
      Object.entries(raceRes).forEach(([pid, pos]) => {
        if (runningTotals[pid] !== undefined) {
          runningTotals[pid] += API.getPoints(pos);
        }
      });
    });

    const steps = [0, 1, 2, 3, 4].map((_, i) => {
      const cls = i === 0 ? 'done' : i <= raceNum ? 'active' : '';
      return `<div class="wizard-step ${cls}"></div>`;
    }).join('');

    // Which positions are taken for this race
    const takenPositions = Object.values(currentResults);

    const playerSections = selectedPlayers.map(p => {
      const currentPos = currentResults[p.player_id];
      const buttons = Array.from({ length: 24 }, (_, i) => i + 1).map(pos => {
        const isSelected = currentPos === pos;
        const isTaken = takenPositions.includes(pos) && !isSelected;
        return `<button class="position-btn ${isSelected ? 'selected' : ''} ${isTaken ? 'taken' : ''}"
                  data-player="${p.player_id}" data-pos="${pos}">${pos}</button>`;
      }).join('');

      const currentPts = currentPos ? API.getPoints(currentPos) : 0;
      const totalSoFar = runningTotals[p.player_id] + currentPts;

      return `
        <div class="mb-16">
          <div class="flex items-center gap-8 mb-8">
            <span class="player-dot" style="background:${p.avatar_color};width:12px;height:12px;border-radius:50%;display:inline-block"></span>
            <strong>${p.name}</strong>
            <span class="text-muted" style="margin-left:auto;font-size:0.8rem">
              ${currentPos ? positionEmoji(currentPos) + ' +' + currentPts + 'pts' : 'Sin posicion'}
            </span>
          </div>
          <div class="position-grid">${buttons}</div>
        </div>
      `;
    }).join('');

    const allFilled = selectedPlayers.every(p => currentResults[p.player_id]);

    // Live scores
    const liveScores = selectedPlayers.map(p => {
      const currentPts = currentResults[p.player_id] ? API.getPoints(currentResults[p.player_id]) : 0;
      const total = runningTotals[p.player_id] + currentPts;
      return `
        <div class="live-score">
          <span class="player-dot" style="background:${p.avatar_color};width:8px;height:8px;border-radius:50%;display:inline-block"></span>
          <span>${p.name}</span>
          <span class="live-score-pts">${total}pts</span>
        </div>
      `;
    }).join('');

    return `
      <div class="section-header">🏁 Carrera ${raceNum} de 4</div>
      <div class="wizard-progress">${steps}</div>
      ${raceNum === 1 && predictions ? renderPredictions(predictions) : ''}
      <div class="card">
        <div class="form-group">
          <label class="form-label">Nombre de la pista</label>
          ${selectedCup && selectedCup.tracks ? `
            <div class="track-preset">${selectedCup.tracks[raceNum - 1] || 'Pista ' + raceNum}</div>
            <input type="hidden" id="track-name" value="${selectedCup.tracks[raceNum - 1] || ''}">
          ` : `
            <input type="text" id="track-name" class="form-input" placeholder="Ej: Circuito de Mario, Playa Koopa..."
                   value="" autocomplete="off">
          `}
        </div>
        ${playerSections}
        <div class="race-points-live">${liveScores}</div>
        <button id="next-race-btn" class="btn btn-success btn-block mt-16" ${allFilled ? '' : 'disabled'}>
          ${raceNum < 4 ? 'Siguiente Carrera →' : 'Ver Resultados 🏆'}
        </button>
      </div>
    `;
  }

  function renderGPSummary(selectedPlayers, allRaceResults, trackNames, cupName) {
    // Calculate totals
    const totals = {};
    selectedPlayers.forEach(p => { totals[p.player_id] = 0; });

    allRaceResults.forEach(raceRes => {
      Object.entries(raceRes).forEach(([pid, pos]) => {
        if (totals[pid] !== undefined) {
          totals[pid] += API.getPoints(pos);
        }
      });
    });

    // Sort by points
    const sorted = selectedPlayers
      .map(p => ({ player: p, points: totals[p.player_id] }))
      .sort((a, b) => b.points - a.points);

    // Podium
    const podiumOrder = [sorted[1], sorted[0], sorted[2]].filter(Boolean);
    const podiumBars = podiumOrder.map((s, i) => {
      const realPos = sorted.indexOf(s);
      const barClass = realPos === 0 ? 'first' : realPos === 1 ? 'second' : 'third';
      return `
        <div class="podium-place">
          <div class="podium-name">${s.player.name}</div>
          <div class="podium-pts">${s.points} pts</div>
          <div class="podium-bar ${barClass}">${positionEmoji(realPos + 1)}</div>
        </div>
      `;
    }).join('');

    // Race details
    const raceDetails = allRaceResults.map((raceRes, i) => {
      const rows = selectedPlayers
        .map(p => ({ player: p, pos: raceRes[p.player_id] || 12 }))
        .sort((a, b) => a.pos - b.pos)
        .map(r => `
          <div class="history-result">
            <span>${positionEmoji(r.pos)} ${r.player.name}</span>
            <span>${API.getPoints(r.pos)} pts</span>
          </div>
        `).join('');

      return `
        <div class="history-race">
          <div class="history-race-title">Carrera ${i + 1}: ${trackNames[i] || 'Pista ' + (i + 1)}</div>
          ${rows}
        </div>
      `;
    }).join('');

    return `
      <div class="section-header">🏆 Resultados${cupName ? ' - ' + cupName : ''}</div>
      <div class="wizard-progress">
        <div class="wizard-step done"></div>
        <div class="wizard-step done"></div>
        <div class="wizard-step done"></div>
        <div class="wizard-step done"></div>
        <div class="wizard-step active"></div>
      </div>
      <div class="summary-podium">${podiumBars}</div>
      <div class="card">
        <div class="card-title">Detalle por carrera</div>
        ${raceDetails}
      </div>
      <div class="flex gap-8 mt-16">
        <button id="save-gp-btn" class="btn btn-success btn-block">Guardar Grand Prix 💾</button>
      </div>
      <div class="mt-8">
        <button id="discard-gp-btn" class="btn btn-secondary btn-block btn-sm">Descartar</button>
      </div>
    `;
  }

  // ---- STATS ----
  function renderStats(data, activeTab) {
    const allStats = Stats.computeAll(data);

    if (!allStats) {
      return `
        <div class="section-header">📊 Estadisticas</div>
        <div class="empty-state">
          <div class="empty-state-icon">📈</div>
          <div class="empty-state-text">Necesitas al menos un Grand Prix para ver estadisticas</div>
        </div>
      `;
    }

    const tabs = [
      { id: 'general', label: 'General' },
      { id: 'h2h', label: 'H2H' },
      { id: 'streaks', label: 'Rachas' },
      { id: 'tracks', label: 'Por Pista' }
    ];

    const tabsHtml = tabs.map(t =>
      `<button class="tab ${activeTab === t.id ? 'active' : ''}" data-tab="${t.id}">${t.label}</button>`
    ).join('');

    let content;
    switch (activeTab) {
      case 'h2h':
        content = renderH2H(allStats.headToHead);
        break;
      case 'streaks':
        content = renderStreaks(allStats.streaks);
        break;
      case 'tracks':
        content = renderTrackStats(allStats.trackStats, data.players);
        break;
      default:
        content = renderGeneralStats(allStats.rankings);
    }

    return `
      <div class="section-header">📊 Estadisticas</div>
      <div class="tabs">${tabsHtml}</div>
      ${content}
    `;
  }

  function renderGeneralStats(rankings) {
    const rows = rankings.map(r => {
      const cupRows = (r.cupStatsArr || []).map(c => `
        <div class="track-stat">
          <div class="track-name">${c.cup}</div>
          <div class="flex gap-8 items-center">
            <span class="text-muted" style="font-size:0.75rem">${c.timesPlayed}x</span>
            <span class="track-avg">${c.avgPoints} pts/GP</span>
          </div>
        </div>
      `).join('');

      return `
      <div class="card">
        <div class="flex items-center gap-8 mb-8">
          <div class="ranking-avatar" style="background:${r.player.avatar_color};width:32px;height:32px;font-size:0.85rem">${getInitial(r.player.name)}</div>
          <strong>${r.player.name}</strong>
          <span class="text-muted" style="margin-left:auto;font-size:0.75rem">${r.rivalsCount} rivales</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center">
          <div>
            <div class="text-muted" style="font-size:0.65rem">GPs JUGADOS</div>
            <div style="font-weight:800">${r.gpsPlayed}</div>
          </div>
          <div>
            <div class="text-muted" style="font-size:0.65rem">PROM PTS/GP</div>
            <div style="font-weight:800;color:var(--yellow)">${r.avgPerGP}</div>
          </div>
          <div>
            <div class="text-muted" style="font-size:0.65rem">PROM LUGAR</div>
            <div style="font-weight:800">${r.avgPosition}o</div>
          </div>
          <div>
            <div class="text-muted" style="font-size:0.65rem">WIN%</div>
            <div style="font-weight:800;color:var(--green)">${r.winRate}%</div>
          </div>
          <div>
            <div class="text-muted" style="font-size:0.65rem">PODIO%</div>
            <div style="font-weight:800;color:var(--blue)">${r.podiumRate}%</div>
          </div>
          <div>
            <div class="text-muted" style="font-size:0.65rem">TOTAL PTS</div>
            <div style="font-weight:800">${r.totalPoints}</div>
          </div>
        </div>
        ${cupRows ? `<div style="margin-top:12px;border-top:1px solid var(--border);padding-top:8px">
          <div class="text-muted" style="font-size:0.7rem;margin-bottom:4px">PROMEDIO POR COPA</div>
          ${cupRows}
        </div>` : ''}
      </div>
    `}).join('');

    return rows;
  }

  function renderH2H(matchups) {
    if (!matchups.length) {
      return '<div class="empty-state"><div class="empty-state-text">No hay datos head-to-head</div></div>';
    }

    return `<div class="card">${matchups.map(m => `
      <div class="h2h-matchup">
        <div class="h2h-player">
          <span class="player-dot" style="background:${m.player1.avatar_color};width:10px;height:10px;border-radius:50%;display:inline-block"></span>
          ${m.player1.name}
        </div>
        <div class="h2h-record">${m.p1Wins} - ${m.p2Wins}</div>
        <div class="h2h-player" style="text-align:right">
          ${m.player2.name}
          <span class="player-dot" style="background:${m.player2.avatar_color};width:10px;height:10px;border-radius:50%;display:inline-block"></span>
        </div>
      </div>
    `).join('')}</div>`;
  }

  function renderStreaks(streaks) {
    return streaks.map(s => `
      <div class="card">
        <div class="flex items-center gap-8 mb-8">
          <div class="ranking-avatar" style="background:${s.player.avatar_color};width:32px;height:32px;font-size:0.85rem">${getInitial(s.player.name)}</div>
          <strong>${s.player.name}</strong>
        </div>
        <div class="streak-card">
          <span class="streak-icon">🔥</span>
          <div class="streak-info">
            <div class="streak-label">Racha actual de victorias</div>
            <div class="streak-value">${s.currentWinStreak}</div>
          </div>
        </div>
        <div class="streak-card">
          <span class="streak-icon">⭐</span>
          <div class="streak-info">
            <div class="streak-label">Mejor racha de victorias</div>
            <div class="streak-value">${s.bestWinStreak}</div>
          </div>
        </div>
        <div class="streak-card">
          <span class="streak-icon">🏅</span>
          <div class="streak-info">
            <div class="streak-label">Racha actual de podios</div>
            <div class="streak-value">${s.currentPodiumStreak}</div>
          </div>
        </div>
        <div class="streak-card">
          <span class="streak-icon">📈</span>
          <div class="streak-info">
            <div class="streak-label">Promedio ultimas 5 carreras</div>
            <div class="streak-value">${s.last5Avg} pos</div>
          </div>
        </div>
      </div>
    `).join('');
  }

  function renderTrackStats(trackStats, players) {
    const { trackLeaderboard, playerTrackStats } = trackStats;

    const trackList = trackLeaderboard.map(t => `
      <div class="track-stat">
        <div class="track-name">${t.track}</div>
        <div class="text-muted" style="font-size:0.8rem">${t.timesPlayed} carreras</div>
      </div>
    `).join('');

    const playerSections = players
      .filter(p => playerTrackStats[p.player_id])
      .map(p => {
        const tracks = playerTrackStats[p.player_id];
        const best = tracks[0];
        const worst = tracks[tracks.length - 1];
        return `
          <div class="card">
            <div class="flex items-center gap-8 mb-8">
              <div class="ranking-avatar" style="background:${p.avatar_color};width:32px;height:32px;font-size:0.85rem">${getInitial(p.name)}</div>
              <strong>${p.name}</strong>
            </div>
            ${best ? `<div class="track-stat">
              <div><span style="color:var(--green)">Mejor:</span> ${best.track}</div>
              <div class="track-avg">${best.avg} avg</div>
            </div>` : ''}
            ${worst && worst !== best ? `<div class="track-stat">
              <div><span style="color:var(--red)">Peor:</span> ${worst.track}</div>
              <div class="track-avg">${worst.avg} avg</div>
            </div>` : ''}
            ${tracks.map(t => `
              <div class="track-stat">
                <div class="track-name">${t.track}</div>
                <div class="flex gap-8 items-center">
                  <span class="text-muted" style="font-size:0.75rem">${t.races}x</span>
                  <span class="badge badge-gold">Best: ${t.best}</span>
                  <span class="track-avg">${t.avg}</span>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }).join('');

    return `
      <div class="card">
        <div class="card-title">Pistas jugadas</div>
        ${trackList || '<div class="text-muted text-center" style="padding:12px">Sin datos</div>'}
      </div>
      ${playerSections}
    `;
  }

  // ---- HISTORY ----
  function renderHistory(data) {
    if (!data.tournaments.length) {
      return `
        <div class="section-header">📋 Historial</div>
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-text">No hay Grand Prix registrados</div>
        </div>
      `;
    }

    const playerMap = {};
    data.players.forEach(p => { playerMap[p.player_id] = p; });

    const racesByTournament = {};
    data.races.forEach(r => {
      if (!racesByTournament[r.tournament_id]) racesByTournament[r.tournament_id] = [];
      racesByTournament[r.tournament_id].push(r);
    });

    const resultsByRace = {};
    data.results.forEach(r => {
      if (!resultsByRace[r.race_id]) resultsByRace[r.race_id] = [];
      resultsByRace[r.race_id].push(r);
    });

    const sorted = [...data.tournaments].sort((a, b) => new Date(b.date) - new Date(a.date));

    const items = sorted.map(t => {
      const pIds = typeof t.player_ids === 'string' ? t.player_ids.split(',') : [];
      const standings = Stats.getGPStandings(data, t.tournament_id);

      const chips = pIds.map(pid => {
        const p = playerMap[pid];
        return p ? `<span class="player-dot" style="background:${p.avatar_color};width:16px;height:16px;border-radius:50%;display:inline-block" title="${p.name}"></span>` : '';
      }).join('');

      const standingRows = standings.map((s, i) => `
        <div class="history-result">
          <span>${positionEmoji(i + 1)} ${s.player.name}</span>
          <span style="font-weight:800;color:var(--yellow)">${s.totalPoints} pts</span>
        </div>
      `).join('');

      const tRaces = (racesByTournament[t.tournament_id] || [])
        .sort((a, b) => (a.race_number || 0) - (b.race_number || 0));

      const raceDetails = tRaces.map(race => {
        const res = (resultsByRace[race.race_id] || [])
          .sort((a, b) => (a.position || 12) - (b.position || 12));
        const rows = res.map(r => {
          const p = playerMap[r.player_id];
          return `<div class="history-result">
            <span>${positionEmoji(r.position)} ${p ? p.name : '??'}</span>
            <span>${r.points} pts</span>
          </div>`;
        }).join('');
        return `<div class="history-race">
          <div class="history-race-title">Carrera ${race.race_number}: ${race.track_name}</div>
          ${rows}
        </div>`;
      }).join('');

      return `
        <div class="card history-item" data-tournament="${t.tournament_id}">
          <div class="history-header">
            <div>
              <div class="history-cup">${t.cup_name || 'Grand Prix'}</div>
              <div class="history-players mt-8">${chips}</div>
            </div>
            <div class="history-date">${new Date(t.date).toLocaleDateString('es')}</div>
          </div>
          <div class="mt-8">${standingRows}</div>
          <div class="history-detail" id="detail-${t.tournament_id}">
            ${raceDetails}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="section-header">📋 Historial</div>
      <div class="section-subtitle">${data.tournaments.length} Grand Prix totales</div>
      ${items}
    `;
  }

  // ---- CONFIG BANNER ----
  function renderConfigBanner() {
    const url = API.getApiUrl();
    return `
      <div class="config-banner">
        <h3>⚙️ Configurar Google Sheets</h3>
        <p>Pega la URL de tu Google Apps Script para sincronizar datos en la nube.</p>
        <input type="text" id="api-url-input" class="config-input"
               placeholder="https://script.google.com/macros/s/..." value="${url}">
        <button id="save-config-btn" class="btn btn-sm mt-8" style="background:rgba(255,255,255,0.2);color:white">
          ${url ? 'Actualizar' : 'Guardar'} URL
        </button>
        ${url ? '<button id="sync-btn" class="btn btn-sm mt-8" style="background:rgba(255,255,255,0.2);color:white;margin-left:8px">Sincronizar 🔄</button>' : ''}
      </div>
    `;
  }

  // ---- PREDICTIONS ----
  function renderPredictions(predictions) {
    if (!predictions || predictions.length === 0) return '';

    const rows = predictions.map((p, i) => {
      const trendIcon = p.trend === 'up' ? '📈' : p.trend === 'down' ? '📉' : '➡️';
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}o`;
      return `
        <div class="ranking-item">
          <div class="ranking-position">${medal}</div>
          <div class="ranking-avatar" style="background:${p.color || '#666'};width:32px;height:32px;font-size:0.8rem">${getInitial(p.name)}</div>
          <div class="ranking-info">
            <div class="ranking-name">${p.name} ${trendIcon}</div>
            <div class="ranking-meta">${p.avgPerGP} pts/GP prom | ${p.gpsPlayed} GPs</div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="card" style="border-color:var(--purple)">
        <div class="card-title">🔮 Prediccion</div>
        <div class="ranking-list">${rows}</div>
      </div>
    `;
  }

  return {
    renderLogin,
    renderDashboard,
    renderPlayers,
    renderGPSelectPlayers,
    renderGPRace,
    renderGPSummary,
    renderStats,
    renderHistory,
    renderConfigBanner,
    renderPredictions,
    COLORS
  };
})();
