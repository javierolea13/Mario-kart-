/**
 * Mario Kart World Tracker - Setup
 * Ejecutar esta funcion UNA VEZ para crear la estructura de hojas.
 */

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Crear hoja Players
  let playersSheet = ss.getSheetByName('Players');
  if (!playersSheet) {
    playersSheet = ss.insertSheet('Players');
    playersSheet.appendRow(['player_id', 'name', 'avatar_color', 'created_at']);
    playersSheet.getRange('1:1').setFontWeight('bold');
  }

  // Crear hoja Tournaments
  let tournamentsSheet = ss.getSheetByName('Tournaments');
  if (!tournamentsSheet) {
    tournamentsSheet = ss.insertSheet('Tournaments');
    tournamentsSheet.appendRow(['tournament_id', 'date', 'cup_name', 'player_ids']);
    tournamentsSheet.getRange('1:1').setFontWeight('bold');
  }

  // Crear hoja Races
  let racesSheet = ss.getSheetByName('Races');
  if (!racesSheet) {
    racesSheet = ss.insertSheet('Races');
    racesSheet.appendRow(['race_id', 'tournament_id', 'track_name', 'race_number']);
    racesSheet.getRange('1:1').setFontWeight('bold');
  }

  // Crear hoja Results
  let resultsSheet = ss.getSheetByName('Results');
  if (!resultsSheet) {
    resultsSheet = ss.insertSheet('Results');
    resultsSheet.appendRow(['result_id', 'race_id', 'tournament_id', 'player_id', 'position', 'points']);
    resultsSheet.getRange('1:1').setFontWeight('bold');
  }

  // Borrar la hoja por defecto si existe
  const defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('Hoja 1');
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }

  SpreadsheetApp.getUi().alert('Setup completado. Las hojas estan listas.');
}
