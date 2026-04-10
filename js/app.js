/**
 * Mario Kart World Tracker - Main App
 * SPA routing and event handling
 */

const App = (() => {
  const app = document.getElementById('app');
  let currentPage = 'dashboard';
  let data = { players: [], tournaments: [], races: [], results: [] };

  // Auth state
  const AUTH_KEY = 'mktracker_auth';
  const USERS = {
    '1234': { name: 'Javier Olea', role: 'admin' },
    '5678': { name: 'Invitado', role: 'guest' }
  };
  let currentUser = null; // { name, role }

  function getStoredAuth() {
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored) {
      try { return JSON.parse(stored); } catch { return null; }
    }
    return null;
  }

  function isAdmin() {
    return currentUser && currentUser.role === 'admin';
  }

  function logout() {
    localStorage.removeItem(AUTH_KEY);
    currentUser = null;
    showLogin();
  }

  function showLogin() {
    app.innerHTML = UI.renderLogin();
    // Hide nav and header for login
    document.querySelector('.bottom-nav').style.display = 'none';
    document.querySelector('.app-header').style.display = 'none';

    document.getElementById('login-btn').addEventListener('click', handleLogin);
    document.getElementById('login-password').addEventListener('keydown', e => {
      if (e.key === 'Enter') handleLogin();
    });
  }

  function handleLogin() {
    const pw = document.getElementById('login-password').value;
    const user = USERS[pw];
    if (user) {
      currentUser = user;
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      document.querySelector('.bottom-nav').style.display = 'flex';
      document.querySelector('.app-header').style.display = 'flex';
      navigate(window.location.hash.slice(1) || 'dashboard');
    } else {
      const err = document.getElementById('login-error');
      err.style.display = 'block';
      document.getElementById('login-password').value = '';
    }
  }

  // GP Wizard state
  let gpState = {
    selectedPlayers: [],
    cupName: '',
    selectedCup: null, // { name, tracks[], emoji } or null for custom
    currentRace: 0,
    raceResults: [{}, {}, {}, {}],  // positions for each race
    trackNames: ['', '', '', '']
  };

  let statsTab = 'general';

  // ---- INIT ----
  async function init() {
    // Check stored auth
    const storedAuth = getStoredAuth();
    if (storedAuth && USERS[Object.keys(USERS).find(k => USERS[k].role === storedAuth.role)]) {
      currentUser = storedAuth;
    }

    if (!currentUser) {
      showLogin();
      return;
    }

    // Load local data instantly, then sync in background
    data = API.getLocalData();
    setupRouting();
    navigate(window.location.hash.slice(1) || 'dashboard');

    // Sync from API in background (don't block UI)
    if (API.isConfigured()) {
      API.syncFromApi().then(ok => {
        if (ok) {
          data = API.getLocalData();
          render();
        }
      });
    }
  }

  // ---- ROUTING ----
  function setupRouting() {
    window.addEventListener('hashchange', () => {
      navigate(window.location.hash.slice(1) || 'dashboard');
    });
  }

  function navigate(page) {
    // Guests can't access edit pages
    if (!isAdmin() && (page === 'players' || page === 'new-gp')) {
      page = 'dashboard';
    }
    currentPage = page;
    updateNav();
    render();
  }

  function updateNav() {
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === currentPage);
    });
    // Hide edit nav items for guests
    document.querySelectorAll('.nav-item[data-page="players"], .nav-item[data-page="new-gp"]').forEach(el => {
      el.style.display = isAdmin() ? 'flex' : 'none';
    });
    // Show user role in header
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.style.display = currentUser ? 'block' : 'none';
    }
  }

  // ---- RENDER ----
  async function render() {
    data = API.getLocalData();

    let html = '';

    // User badge
    if (currentUser) {
      html += `<div class="user-badge">${currentUser.role === 'admin' ? '👑' : '👀'} ${currentUser.name}</div>`;
    }

    // Config banner on dashboard (admin only)
    if (currentPage === 'dashboard' && isAdmin()) {
      html += UI.renderConfigBanner();
    }

    switch (currentPage) {
      case 'dashboard':
        html += UI.renderDashboard(data);
        break;
      case 'players':
        html += UI.renderPlayers(data.players);
        break;
      case 'new-gp':
        html += renderGPPage();
        break;
      case 'stats':
        html += UI.renderStats(data, statsTab);
        break;
      case 'history':
        html += UI.renderHistory(data);
        break;
      default:
        html = UI.renderDashboard(data);
    }

    app.innerHTML = html;
    attachEventListeners();
  }

  function renderGPPage() {
    if (gpState.currentRace === 0) {
      return UI.renderGPSelectPlayers(data.players);
    } else if (gpState.currentRace <= 4) {
      return UI.renderGPRace(
        gpState.currentRace,
        gpState.selectedPlayers,
        gpState.raceResults[gpState.currentRace - 1],
        gpState.raceResults.slice(0, gpState.currentRace - 1),
        gpState.selectedCup
      );
    } else {
      return UI.renderGPSummary(
        gpState.selectedPlayers,
        gpState.raceResults,
        gpState.trackNames,
        gpState.cupName
      );
    }
  }

  // ---- EVENT LISTENERS ----
  function attachEventListeners() {
    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', logout);
    }

    // Config
    const saveConfigBtn = document.getElementById('save-config-btn');
    if (saveConfigBtn) {
      saveConfigBtn.addEventListener('click', () => {
        const url = document.getElementById('api-url-input').value;
        API.setApiUrl(url);
        render();
      });
    }

    const syncBtn = document.getElementById('sync-btn');
    if (syncBtn) {
      syncBtn.addEventListener('click', async () => {
        syncBtn.textContent = 'Sincronizando...';
        const ok = await API.syncFromApi();
        syncBtn.textContent = ok ? 'Listo!' : 'Error';
        if (ok) {
          data = API.getLocalData();
          setTimeout(render, 500);
        }
      });
    }

    // Players page
    const addPlayerBtn = document.getElementById('add-player-btn');
    if (addPlayerBtn) {
      addPlayerBtn.addEventListener('click', handleAddPlayer);
      document.getElementById('player-name').addEventListener('keydown', e => {
        if (e.key === 'Enter') handleAddPlayer();
      });
    }

    // Color picker
    document.querySelectorAll('#color-picker .player-dot').forEach(el => {
      el.addEventListener('click', () => {
        document.querySelectorAll('#color-picker .player-dot').forEach(d => {
          d.style.borderColor = 'transparent';
          d.classList.remove('selected');
        });
        el.style.borderColor = 'white';
        el.classList.add('selected');
      });
    });

    // Delete player
    document.querySelectorAll('.delete-player-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        await API.deletePlayer(id);
        render();
      });
    });

    // GP: Player selection
    document.querySelectorAll('#player-chips .player-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        chip.classList.toggle('selected');
        updateStartGPButton();
      });
    });

    // GP: Cup selection
    document.querySelectorAll('#cup-grid .cup-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cupId = btn.dataset.cupId;

        // Deselect all
        document.querySelectorAll('#cup-grid .cup-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');

        const customInput = document.getElementById('custom-cup-input');
        const cupPreview = document.getElementById('cup-preview');

        if (cupId === 'random') {
          const randomCup = MK_CUPS[Math.floor(Math.random() * MK_CUPS.length)];
          gpState.selectedCup = randomCup;
          gpState.cupName = randomCup.name;
          gpState.trackNames = [...randomCup.tracks];
          if (customInput) customInput.style.display = 'none';
          if (cupPreview) {
            cupPreview.style.display = 'block';
            cupPreview.innerHTML = `<div class="cup-preview-title">${randomCup.emoji} ${randomCup.name}</div>` +
              randomCup.tracks.map((t, i) => `<div class="cup-preview-track">${i + 1}. ${t}</div>`).join('');
          }
        } else if (cupId === 'custom') {
          gpState.selectedCup = null;
          gpState.cupName = '';
          gpState.trackNames = ['', '', '', ''];
          if (customInput) customInput.style.display = 'block';
          if (cupPreview) cupPreview.style.display = 'none';
        } else {
          const cup = MK_CUPS.find(c => c.id === cupId);
          if (cup) {
            gpState.selectedCup = cup;
            gpState.cupName = cup.name;
            gpState.trackNames = [...cup.tracks];
            if (customInput) customInput.style.display = 'none';
            if (cupPreview) {
              cupPreview.style.display = 'block';
              cupPreview.innerHTML = `<div class="cup-preview-title">${cup.emoji} ${cup.name}</div>` +
                cup.tracks.map((t, i) => `<div class="cup-preview-track">${i + 1}. ${t}</div>`).join('');
            }
          }
        }
        updateStartGPButton();
      });
    });

    // GP: Start GP
    const startGPBtn = document.getElementById('start-gp-btn');
    if (startGPBtn) {
      startGPBtn.addEventListener('click', () => {
        const selected = document.querySelectorAll('#player-chips .player-chip.selected');
        gpState.selectedPlayers = Array.from(selected).map(chip => {
          const pid = chip.dataset.id;
          return data.players.find(p => p.player_id === pid);
        }).filter(Boolean);
        const cupNameInput = document.getElementById('cup-name');
        if (cupNameInput && !gpState.selectedCup) {
          gpState.cupName = cupNameInput.value || 'Copa Personalizada';
        }
        gpState.currentRace = 1;
        gpState.raceResults = [{}, {}, {}, {}];
        if (!gpState.selectedCup) {
          gpState.trackNames = ['', '', '', ''];
        }
        render();
      });
    }

    // GP: Position buttons
    document.querySelectorAll('.position-btn:not(.taken)').forEach(btn => {
      btn.addEventListener('click', () => {
        const playerId = btn.dataset.player;
        const pos = parseInt(btn.dataset.pos);
        const raceIdx = gpState.currentRace - 1;

        // If clicking same position, deselect
        if (gpState.raceResults[raceIdx][playerId] === pos) {
          delete gpState.raceResults[raceIdx][playerId];
        } else {
          gpState.raceResults[raceIdx][playerId] = pos;
        }
        render();
      });
    });

    // GP: Next race
    const nextRaceBtn = document.getElementById('next-race-btn');
    if (nextRaceBtn) {
      nextRaceBtn.addEventListener('click', () => {
        const trackInput = document.getElementById('track-name');
        gpState.trackNames[gpState.currentRace - 1] = trackInput.value || `Pista ${gpState.currentRace}`;
        gpState.currentRace++;
        render();
      });
    }

    // GP: Save
    const saveGPBtn = document.getElementById('save-gp-btn');
    if (saveGPBtn) {
      saveGPBtn.addEventListener('click', async () => {
        saveGPBtn.textContent = 'Guardando...';
        saveGPBtn.disabled = true;

        const gpData = {
          date: new Date().toISOString().split('T')[0],
          cup_name: gpState.cupName || 'Grand Prix',
          player_ids: gpState.selectedPlayers.map(p => p.player_id),
          races: gpState.trackNames.map((track, i) => ({
            track_name: track,
            results: gpState.selectedPlayers.map(p => ({
              player_id: p.player_id,
              position: gpState.raceResults[i][p.player_id] || 12
            }))
          }))
        };

        await API.saveGrandPrix(gpData);

        // Reset state
        gpState = {
          selectedPlayers: [],
          cupName: '',
          selectedCup: null,
          currentRace: 0,
          raceResults: [{}, {}, {}, {}],
          trackNames: ['', '', '', '']
        };

        window.location.hash = '#dashboard';
      });
    }

    // GP: Discard
    const discardBtn = document.getElementById('discard-gp-btn');
    if (discardBtn) {
      discardBtn.addEventListener('click', () => {
        gpState = {
          selectedPlayers: [],
          cupName: '',
          selectedCup: null,
          currentRace: 0,
          raceResults: [{}, {}, {}, {}],
          trackNames: ['', '', '', '']
        };
        render();
      });
    }

    // Stats tabs
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        statsTab = tab.dataset.tab;
        render();
      });
    });

    // History expand
    document.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', () => {
        const tid = item.dataset.tournament;
        const detail = document.getElementById('detail-' + tid);
        if (detail) detail.classList.toggle('show');
      });
    });
  }

  function handleAddPlayer() {
    const nameInput = document.getElementById('player-name');
    const name = nameInput.value.trim();
    if (!name) return;

    const selectedColor = document.querySelector('#color-picker .player-dot.selected');
    const color = selectedColor ? selectedColor.dataset.color : '#E52521';

    API.addPlayer(name, color);
    render();
  }

  function updateStartGPButton() {
    const selected = document.querySelectorAll('#player-chips .player-chip.selected');
    const cupSelected = document.querySelector('#cup-grid .cup-btn.selected');
    const btn = document.getElementById('start-gp-btn');
    if (btn) {
      const hasPlayers = selected.length >= 2 && selected.length <= 4;
      const hasCup = !!cupSelected;
      btn.disabled = !hasPlayers || !hasCup;
      btn.textContent = selected.length > 0
        ? `Iniciar Grand Prix (${selected.length} jugadores)`
        : 'Iniciar Grand Prix';
    }
  }

  // Reset GP state when navigating to new-gp
  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#new-gp' && gpState.currentRace > 4) {
      gpState = {
        selectedPlayers: [],
        cupName: '',
        currentRace: 0,
        raceResults: [{}, {}, {}, {}],
        trackNames: ['', '', '', '']
      };
    }
    // Initialize GP wizard at player selection
    if (window.location.hash === '#new-gp' && gpState.selectedPlayers.length === 0) {
      gpState.currentRace = 0;
    }
  });

  return { init };
})();

// Start the app
document.addEventListener('DOMContentLoaded', App.init);
