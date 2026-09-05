# DEAD O’CLOCK: The Halloween Massacre

Uno sparatutto in prima persona 2.5D originale per browser con motore raycaster DDA scritto in Vanilla JavaScript moderno (ES6) ed estetica Amiga 1200 AGA (pixel art, risoluzione 320×180 upscaled 16:9, illuminazione d'atmosfera gothic-horror).

---

## 🎮 Come Avviare il Gioco

Il gioco non richiede alcuna installazione di pacchetti, npm o bundler. Funziona immediatamente tramite qualsiasi server statico locale:

### Metodo 1: Python HTTP Server (Consigliato)
Apri un terminale nella cartella del gioco (`deado-clock`) ed esegui:
```bash
python -m http.server 8080
```
Quindi apri il browser all'indirizzo:
[http://localhost:8080](http://localhost:8080)

### Metodo 2: Node.js (npx serve / http-server)
```bash
npx serve .
```

### Metodo 3: Estensione VSCode / Antigravity "Live Server"
Fai clic destro su `index.html` e seleziona **"Open with Live Server"**.

---

## 🕹️ Comandi Disponibili

### Desktop
* **W / S** oppure **Freccia Su / Giù**: Movimento avanti e indietro
* **A / D**: Passo laterale (Strafe)
* **Mouse** oppure **Freccia Sinistra / Destra**: Rotazione visuale (supporta Pointer Lock per mira fluida con mouse)
* **Click Sinistro** oppure **Ctrl**: Attacco / Sparo
* **E** oppure **Spazio**: Interagisci / Apri porte / Premi leve / Rileva passaggi segreti
* **Shift**: Corsa rapida
* **1, 2, 3, 4, 5** oppure **Rotella Mouse**: Selezione armi (Ascia, Rivoltella, Fucile a Pompa, Doppietta, Balestra Gotica)
* **M**: Mostra/Nasconde la Minimappa tattica di esplorazione
* **F3**: Pannello statistiche di Debug e Prestazioni (FPS, Coordinate, Angolo, Nemici attivi, Proiettili, Draw Calls)
* **Esc**: Menu di Pausa

### Dispositivi Mobile & Tablet
I controlli touch appaiono automaticamente sui dispositivi touchscreen:
* **Joystick virtuale sinistro**: Movimento libero e strafe
* **Area tattile destra**: Rotazione fluida della visuale
* **Pulsante FUOCO**: Attacco continuo
* **Pulsante USA**: Interazione con porte e interruttori
* **Pulsante ARMA**: Cambio rapido ciclico dell'arsenale
* **Pulsante PAUSA**: Accesso immediato al menu

---

## 🎨 Asset e Sostituzione Grafica

Il gioco include un generatore procedurale interno ad alta fedeltà che ricrea l'autentica palette Amiga AGA a 256 colori per tutte le texture 128×128, i muri, i soffitti, i billboard sprite dei nemici e delle armi.

### Inserire Asset Personalizzati
1. Inserisci le immagini nella cartella `assets/`.
2. Il registro centrale [`js/game/assets.js`](file:///c:/Users/green/Desktop/IIITeam/WOX%20ENGINE%20FIERA%202026/TOOLS%20MAKERS/INDIESTORE/deado-clock/js/game/assets.js) gestisce la risoluzione:
   * Le texture dei muri richiedono proporzioni quadrate (es. 128×128 pixel in formato PNG).
   * Gli sprite devono avere sfondo trasparente (PNG-32).
3. Se un file non viene trovato o fallisce il caricamento, il gioco **non va in crash**: ricorre automaticamente ai generatori integrati, preservando l'esperienza di gioco.

---

## 🗺️ Creazione di Nuove Mappe

Tutte le mappe sono definite come matrici JavaScript indipendenti nel file [`js/game/maps.js`](file:///c:/Users/green/Desktop/IIITeam/WOX%20ENGINE%20FIERA%202026/TOOLS%20MAKERS/INDIESTORE/deado-clock/js/game/maps.js):

### Parametri della Mappa
* `id`: Identificativo univoco (es. `L05_CATACOMBS_DEPTHS`).
* `name`: Titolo mostrato nel briefing e nell'HUD.
* `width`, `height`: Dimensioni della griglia (es. 24×24 o 32×32).
* `playerStart`: Posizione iniziale (`x`, `y`, `angle`).
* `grid`: Matrice bidimensionale di interi:
  * `0`: Spazio calpestabile vuoto.
  * `1`: Parete Bosco / Radici.
  * `2`: Muratura di Pietra / Cripta / Catacombe.
  * `3`: Muro segreto interagibile (apribile con `E` o interruttore).
  * `10`: Porta speciale con serratura colorata (Blu, Arancione, Rossa, Viola).
  * `11`: Porta di legno apribile standard.
* `heights`: Aree con elevazione del pavimento (ad es. `floor: 0.3` per rilievi o `floor: -0.4` per fosse ribassate). La visuale del giocatore sale e scende con interpolazione morbida.
* `doors`: Elenco delle porte animate e relative chiavi richieste.
* `switches`: Interruttori che sbloccano porte o svelano pareti segrete.
* `enemies`: Posizionamento di lupi, zombie, scheletri, maghi zucca e boss.
* `pickups`: Posizionamento di fiale di vita, medkit, corazza, cartucce e chiavi.
* `secretsTotal`: Numero di passaggi segreti contati a fine livello.

---

## 🐺 Nemici, Boss e IA

I nemici sono governati da una Finite State Machine (FSM):
* **Lupo Mannaro**: Scattante, attacca con artigli ravvicinati.
* **Zombie**: Lento ma resistente, infligge danni consistenti da vicino.
* **Scheletro Armato**: Combattente con lama d'acciaio rugginoso.
* **Fantasma**: Traslucido, immune ad alcune collisioni di settore.
* **Pumpkin Mage**: Scaglia proiettili magici infuocati.
* **Boss dei Livelli**:
  1. *Lupo Mannaro Alfa* (Bosco) - Ingrandito del 35%, rapido, rilascia la Chiave del Corvo Blu.
  2. *Re Zucca* (Cimitero) - Scaglia palle di fuoco a forma di zucca, rilascia la Chiave Zucca Arancione.
  3. *Cavaliere Senza Testa* (Cripta) - Armato di falce pesante, rilascia la Chiave Teschio Rossa.
  4. *Clock Reaper* (Catacombe) - Boss finale con attacchi ad area e sfere temporali oscure.

---

## ⚙️ Architettura del Codice

* `index.html` - Struttura Canvas, HUD e finestre di dialogo responsive.
* `styles.css` - Stile gotico Amiga AGA, aspect ratio fisso 16:9, controlli touch.
* `js/config.js` - Costanti di gioco, palette esadecimale e testi in italiano.
* `js/engine/renderer.js` - Raycaster DDA, depth buffer, sky rotante e rendering sprite ordinati per profondità.
* `js/engine/input.js` - Gestione unificata di tastiera, Pointer Lock e virtual joystick touch.
* `js/engine/audio.js` - Sintetizzatore audio procedurale via Web Audio API (nessun file WAV/MP3 esterno necessario).
* `js/game/assets.js` - Registro texture e sprite Amiga AGA procedurali.
* `js/game/state.js` - Macchina di stato globale (transizione tra livelli, inventario persistente, danni e salute).
* `js/game/maps.js` - Definizione completa dei 4 livelli percorribili.
* `js/game/entities.js` - Gestione e logica di nemici, proiettili, pickup e cadaveri persistenti.
* `js/game/combat.js` - Calcoli di gittata per attacchi melee, hitscan con rosata e proiettili.
* `js/game/weapons.js` - Specifiche e tempi di rinculo dell'arsenale (Ascia, Pistola, Fucili, Balestra).
* `js/game/ui.js` - Rendering dell'HUD anni '90, espressioni dinamiche del volto, minimappa e debug overlay.
* `js/game/save.js` - Salvataggio e ripristino dei progressi tramite `localStorage`.
* `js/main.js` - Loop principale a 60 FPS con timestep fisso.
