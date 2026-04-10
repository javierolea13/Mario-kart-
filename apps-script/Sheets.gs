/**
 * Mario Kart World Tracker - CRUD Operations
 */

const POINTS_TABLE = {
  1: 15, 2: 12, 3: 10, 4: 9, 5: 8, 6: 7,
  7: 6,  8: 5,  9: 4, 10: 3, 11: 2, 12: 1
};

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ---- PLAYERS ----

function getPlayers() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Players');
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function addPlayer(name, avatarColor) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Players');
  const id = generateId();
  const now = new Date().toISOString();
  sheet.appendRow([id, name, avatarColor || '#E52521', now]);
  return { player_id: id, name: name, avatar_color: avatarColor || '#E52521', created_at: now };
}

function deletePlayer(playerId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Players');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === playerId) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, error: 'Player not found' };
}

// ---- TOURNAMENTS ----

function getTournaments() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Tournaments');
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function addTournament(date, cupName, playerIds) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Tournaments');
  const id = generateId();
  sheet.appendRow([id, date, cupName, playerIds.join(',')]);
  return { tournament_id: id };
}

// ---- RACES ----

function getRaces(tournamentId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Races');
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1)
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      return obj;
    })
    .filter(r => !tournamentId || r.tournament_id === tournamentId);
}

function addRace(tournamentId, trackName, raceNumber) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Races');
  const id = generateId();
  sheet.appendRow([id, tournamentId, trackName, raceNumber]);
  return { race_id: id };
}

// ---- RESULTS ----

function getResults(tournamentId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Results');
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1)
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      return obj;
    })
    .filter(r => !tournamentId || r.tournament_id === tournamentId);
}

function getAllResults() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Results');
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function addResult(raceId, tournamentId, playerId, position) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Results');
  const id = generateId();
  const points = POINTS_TABLE[position] || 0;
  sheet.appendRow([id, raceId, tournamentId, playerId, position, points]);
  return { result_id: id, points: points };
}

// ---- FULL GRAND PRIX SAVE ----

function saveGrandPrix(gpData) {
  // gpData = { date, cup_name, player_ids, races: [{ track_name, results: [{ player_id, position }] }] }
  const tournament = addTournament(gpData.date, gpData.cup_name, gpData.player_ids);
  const tournamentId = tournament.tournament_id;

  const raceResults = [];
  gpData.races.forEach((race, index) => {
    const raceRecord = addRace(tournamentId, race.track_name, index + 1);
    const results = [];
    race.results.forEach(r => {
      const result = addResult(raceRecord.race_id, tournamentId, r.player_id, r.position);
      results.push({ ...r, ...result });
    });
    raceResults.push({ race_id: raceRecord.race_id, track_name: race.track_name, results });
  });

  return {
    tournament_id: tournamentId,
    races: raceResults
  };
}

// ---- FULL DATA EXPORT ----

function getAllData() {
  return {
    players: getPlayers(),
    tournaments: getTournaments(),
    races: getRaces(),
    results: getAllResults()
  };
}
