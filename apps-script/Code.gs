/**
 * Mario Kart World Tracker - API Endpoints
 * Deploy como Web App con acceso "Anyone".
 */

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
