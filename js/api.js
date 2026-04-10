/**
 * Mario Kart World Tracker - API Module
 * Comunicacion con Google Apps Script + localStorage fallback
 */

const API = (() => {
  const CONFIG_KEY = 'mktracker_api_url';
  const CACHE_KEY = 'mktracker_data';

  function getApiUrl() {
    return localStorage.getItem(CONFIG_KEY) || '';
  }

  function setApiUrl(url) {
    localStorage.setItem(CONFIG_KEY, url.trim());
  }

  function isConfigured() {
    return !!getApiUrl();
  }

  // Local storage data management (works offline / before API setup)
  function getLocalData() {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) {
      return { players: [], tournaments: [], races: [], results: [] };
    }
    return JSON.parse(raw);
  }

  function saveLocalData(data) {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  // Points table
  const POINTS = {
    1: 15, 2: 12, 3: 10, 4: 9, 5: 8, 6: 7,
    7: 6,  8: 5,  9: 4, 10: 3, 11: 2, 12: 1
  };

  function getPoints(position) {
    return POINTS[position] || 0;
  }

  // ---- API calls (with local fallback) ----

  async function fetchFromApi(action, params = {}) {
    const url = getApiUrl();
    if (!url) return null;

    try {
      const queryParams = new URLSearchParams({ action, ...params });
      const res = await fetch(`${url}?${queryParams}`, {
        redirect: 'follow',
        headers: { 'Accept': 'application/json' }
      });
      const text = await res.text();
      try { return JSON.parse(text); } catch { return null; }
    } catch (e) {
      console.warn('API call failed, using local data:', e);
      return null;
    }
  }

  async function postToApi(action, body) {
    const url = getApiUrl();
    if (!url) return null;

    try {
      const res = await fetch(`${url}?action=${action}`, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      try { return JSON.parse(text); } catch { return null; }
    } catch (e) {
      console.warn('API POST failed, using local data:', e);
      return null;
    }
  }

  // ---- Public CRUD Methods ----

  async function getPlayers() {
    const apiData = await fetchFromApi('getPlayers');
    if (apiData) {
      const data = getLocalData();
      data.players = apiData;
      saveLocalData(data);
      return apiData;
    }
    return getLocalData().players;
  }

  async function addPlayer(name, avatarColor) {
    const player = {
      player_id: generateId(),
      name,
      avatar_color: avatarColor || '#E52521',
      created_at: new Date().toISOString()
    };

    // Save locally
    const data = getLocalData();
    data.players.push(player);
    saveLocalData(data);

    // Try API
    await fetchFromApi('addPlayer', { name, avatarColor: player.avatar_color });

    return player;
  }

  async function deletePlayer(playerId) {
    const data = getLocalData();
    data.players = data.players.filter(p => p.player_id !== playerId);
    saveLocalData(data);
    await fetchFromApi('deletePlayer', { playerId });
  }

  async function saveGrandPrix(gpData) {
    const data = getLocalData();
    const tournamentId = generateId();

    // Save tournament
    const tournament = {
      tournament_id: tournamentId,
      date: gpData.date,
      cup_name: gpData.cup_name,
      player_ids: gpData.player_ids.join(',')
    };
    data.tournaments.push(tournament);

    // Save races and results
    gpData.races.forEach((race, index) => {
      const raceId = generateId();
      data.races.push({
        race_id: raceId,
        tournament_id: tournamentId,
        track_name: race.track_name,
        race_number: index + 1
      });

      race.results.forEach(r => {
        data.results.push({
          result_id: generateId(),
          race_id: raceId,
          tournament_id: tournamentId,
          player_id: r.player_id,
          position: r.position,
          points: getPoints(r.position)
        });
      });
    });

    saveLocalData(data);

    // Try API
    await postToApi('saveGrandPrix', gpData);

    return { tournament_id: tournamentId };
  }

  async function getAllData() {
    const apiData = await fetchFromApi('getAllData');
    if (apiData && apiData.players) {
      saveLocalData(apiData);
      return apiData;
    }
    return getLocalData();
  }

  async function syncFromApi() {
    if (!isConfigured()) return false;
    const apiData = await fetchFromApi('getAllData');
    if (apiData && apiData.players) {
      saveLocalData(apiData);
      return true;
    }
    return false;
  }

  return {
    getApiUrl,
    setApiUrl,
    isConfigured,
    getLocalData,
    getPoints,
    POINTS,
    getPlayers,
    addPlayer,
    deletePlayer,
    saveGrandPrix,
    getAllData,
    syncFromApi
  };
})();
