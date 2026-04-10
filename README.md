# 🏎️ Mario Kart World Tracker

Aplicacion web para registrar y trackear torneos de **Mario Kart World** (Nintendo Switch 2) entre amigos.

## Funcionalidades

- **Registro de jugadores** con nombres y colores personalizados
- **Grand Prix** de 4 carreras con sistema de puntos oficial de Mario Kart
- **Ranking general** con puntos totales, GPs jugados y promedios
- **Estadisticas tipo beisbol**:
  - Win rate y porcentaje de podios
  - Head-to-head entre cada par de jugadores
  - Rachas de victorias y podios
  - Estadisticas por pista (mejor/peor pista, promedios)
- **Historial** completo de todos los Grand Prix
- **Sincronizacion con Google Sheets** para respaldo en la nube

## Sistema de Puntos (Oficial Mario Kart)

| Posicion | 1o | 2o | 3o | 4o | 5o | 6o | 7o | 8o | 9o | 10o | 11o | 12o |
|----------|----|----|----|----|----|----|----|----|----|----|-----|-----|
| Puntos   | 15 | 12 | 10 | 9  | 8  | 7  | 6  | 5  | 4  | 3   | 2   | 1   |

## Setup Rapido (Solo Frontend)

La app funciona **sin servidor** usando `localStorage`. Simplemente abre `index.html` en tu navegador o haz deploy en GitHub Pages.

### GitHub Pages

1. Ve a **Settings** > **Pages** en tu repositorio
2. En Source, selecciona `main` branch y carpeta `/ (root)`
3. Guarda. Tu app estara disponible en `https://tu-usuario.github.io/mario-kart-tracker/`

## Setup con Google Sheets (Opcional - Datos en la Nube)

Para sincronizar datos entre multiples dispositivos y tener un respaldo en Google Sheets:

### Paso 1: Crear el Google Sheet

1. Ve a [Google Sheets](https://sheets.google.com) y crea un nuevo spreadsheet
2. Ponle nombre: "Mario Kart World Tracker"

### Paso 2: Crear el Apps Script

1. En tu Google Sheet, ve a **Extensiones** > **Apps Script**
2. Elimina el contenido por defecto de `Code.gs`
3. Crea 3 archivos copiando el contenido de la carpeta `apps-script/`:
   - `Code.gs` - Copia el contenido de `apps-script/Code.gs`
   - `Sheets.gs` - Click en "+" > "Script", nombralo `Sheets` y copia `apps-script/Sheets.gs`
   - `Setup.gs` - Click en "+" > "Script", nombralo `Setup` y copia `apps-script/Setup.gs`

### Paso 3: Crear las hojas

1. En el editor de Apps Script, selecciona la funcion `setupSheets` del dropdown
2. Click en **Ejecutar** (boton de play)
3. Autoriza los permisos cuando se te pida
4. Se crearan las 4 hojas: Players, Tournaments, Races, Results

### Paso 4: Deploy como Web App

1. En Apps Script, click en **Implementar** > **Nueva implementacion**
2. Tipo: **Aplicacion web**
3. Ejecutar como: **Yo** (tu cuenta)
4. Quien tiene acceso: **Cualquier persona**
5. Click en **Implementar**
6. Copia la URL que te da (algo como `https://script.google.com/macros/s/.../exec`)

### Paso 5: Configurar en la App

1. Abre la app web
2. En el Dashboard, pega la URL de tu Apps Script en el campo de configuracion
3. Click "Guardar URL"
4. Click "Sincronizar" para verificar la conexion

## Estructura del Proyecto

```
mario-kart-tracker/
├── index.html              # Pagina principal
├── css/
│   └── styles.css          # Estilos responsive
├── js/
│   ├── app.js              # Logica principal y routing
│   ├── api.js              # Comunicacion con Google Sheets
│   ├── stats.js            # Calculos de estadisticas
│   └── ui.js               # Componentes de UI
├── apps-script/
│   ├── Code.gs             # API endpoints
│   ├── Sheets.gs           # Operaciones CRUD
│   └── Setup.gs            # Setup inicial de hojas
└── README.md
```

## Como Usar

1. **Agrega jugadores** en la seccion "Jugadores"
2. **Inicia un Grand Prix** seleccionando 2-4 jugadores
3. **Registra cada carrera** seleccionando la posicion de cada jugador
4. **Revisa estadisticas** en la seccion "Stats"
5. **Consulta el historial** de todos tus Grand Prix

## Tecnologias

- HTML5, CSS3, JavaScript vanilla (sin dependencias)
- Google Apps Script (backend opcional)
- Google Sheets (base de datos en la nube)
- GitHub Pages (hosting gratuito)
