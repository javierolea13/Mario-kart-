/**
 * ============================================
 * MARIO KART WORLD TRACKER - APPS SCRIPT
 * ============================================
 * INSTRUCCIONES:
 * 1. Pega TODO este codigo en Code.gs del Apps Script
 * 2. Selecciona la funcion "setupSheets" y dale Run (play)
 * 3. Autoriza los permisos cuando te pida
 * 4. Luego ve a Deploy > New deployment > Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copia la URL y pegala en la app web
 * ============================================
 */

// ---- SETUP (ejecutar UNA VEZ) ----

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let playersSheet = ss.getSheetByName('Players');
  if (!playersSheet) {
    playersSheet = ss.insertSheet('Players');
    playersSheet.appendRow(['player_id', 'name', 'avatar_color', 'created_at']);
    playersSheet.getRange('1:1').setFontWeight('bold');
  }

  let tournamentsSheet = ss.getSheetByName('Tournaments');
  if (!tournamentsSheet) {
    tournamentsSheet = ss.insertSheet('Tournaments');
    tournamentsSheet.appendRow(['tournament_id', 'date', 'cup_name', 'player_ids']);
    tournamentsSheet.getRange('1:1').setFontWeight('bold');
  }

  let racesSheet = ss.getSheetByName('Races');
  if (!racesSheet) {
    racesSheet = ss.insertSheet('Races');
    racesSheet.appendRow(['race_id', 'tournament_id', 'track_name', 'race_number']);
    racesSheet.getRange('1:1').setFontWeight('bold');
  }

  let resultsSheet = ss.getSheetByName('Results');
  if (!resultsSheet) {
    resultsSheet = ss.insertSheet('Results');
    resultsSheet.appendRow(['result_id', 'race_id', 'tournament_id', 'player_id', 'position', 'points']);
    resultsSheet.getRange('1:1').setFontWeight('bold');
  }

  const defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('Hoja 1');
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }

  SpreadsheetApp.getUi().alert('Setup completado! Las hojas Players, Tournaments, Races y Results estan listas.');
}

// ---- SISTEMA DE PUNTOS OFICIAL MARIO KART ----

const POINTS_TABLE = {
  1: 15, 2: 12, 3: 10, 4: 9, 5: 8, 6: 7,
  7: 6,  8: 5,  9: 4, 10: 3, 11: 2, 12: 1
};

// ---- UTILIDADES ----

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function sheetToArray(sheetName, filterFn) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  const rows = data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
  return filterFn ? rows.filter(filterFn) : rows;
}

// ---- PLAYERS ----

function getPlayers() {
  return sheetToArray('Players');
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
  return sheetToArray('Tournaments');
}

function addTournament(date, cupName, playerIds) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Tournaments');
  const id = generateId();
  sheet.appendRow([id, date, cupName, playerIds.join(',')]);
  return { tournament_id: id };
}

// ---- RACES ----

function getRaces(tournamentId) {
  return sheetToArray('Races', tournamentId ? r => r.tournament_id === tournamentId : null);
}

function addRace(tournamentId, trackName, raceNumber) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Races');
  const id = generateId();
  sheet.appendRow([id, tournamentId, trackName, raceNumber]);
  return { race_id: id };
}

// ---- RESULTS ----

function getResults(tournamentId) {
  return sheetToArray('Results', tournamentId ? r => r.tournament_id === tournamentId : null);
}

function getAllResults() {
  return sheetToArray('Results');
}

function addResult(raceId, tournamentId, playerId, position) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Results');
  const id = generateId();
  const points = POINTS_TABLE[position] || 0;
  sheet.appendRow([id, raceId, tournamentId, playerId, position, points]);
  return { result_id: id, points: points };
}

// ---- GUARDAR GRAND PRIX COMPLETO ----

function saveGrandPrix(gpData) {
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

  return { tournament_id: tournamentId, races: raceResults };
}

// ---- EXPORTAR TODOS LOS DATOS ----

function getAllData() {
  return {
    players: getPlayers(),
    tournaments: getTournaments(),
    races: getRaces(),
    results: getAllResults()
  };
}

// ---- API ENDPOINTS ----

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const params = e.parameter;
  const action = params.action;
  let result;

  try {
    switch (action) {
      case 'getPlayers':
        result = getPlayers();
        break;
      case 'addPlayer':
        result = addPlayer(params.name, params.avatarColor);
        break;
      case 'deletePlayer':
        result = deletePlayer(params.playerId);
        break;
      case 'getTournaments':
        result = getTournaments();
        break;
      case 'getRaces':
        result = getRaces(params.tournamentId);
        break;
      case 'getResults':
        result = getResults(params.tournamentId);
        break;
      case 'getAllData':
        result = getAllData();
        break;
      case 'saveGrandPrix':
        const postData = JSON.parse(e.postData.contents);
        result = saveGrandPrix(postData);
        break;
      default:
        result = { error: 'Unknown action: ' + action };
    }
  } catch (err) {
    result = { error: err.toString() };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
