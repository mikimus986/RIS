let linesData = {};

let currentLine = null;
let currentDirection = null;
let currentStop = 0;

// ========================================
// HTML PRVKY
// ========================================

const lineInput =
document.getElementById("lineInput");

const lineInfo =
document.getElementById("lineInfo");

const lineNumber =
document.getElementById("lineNumber");

const directionName =
document.getElementById("directionName");

const stopPanel =
document.getElementById("stopPanel");

const stopCounter =
document.getElementById("stopCounter");

const stopName =
document.getElementById("stopName");

const message =
document.getElementById("message");

const nextStopButton =
document.getElementById("nextStopButton");

// ========================================
// NAČTENÍ LINES.JSON
// ========================================

fetch("lines.json")
.then(response => {

```
    if (!response.ok) {
        throw new Error(
            "Nelze načíst lines.json"
        );
    }

    return response.json();
})
.then(data => {

    linesData = data;

    console.log(
        "Databáze linek načtena."
    );

    lineInput.focus();
})
.catch(error => {

    console.error(error);

    message.textContent =
        "Chyba: nepodařilo se načíst databázi linek.";
});
```

// ========================================
// ENTER = POTVRDIT KÓD
// ========================================

lineInput.addEventListener(
"keydown",
function(event) {

```
    if (event.key === "Enter") {

        event.preventDefault();

        loadLine();
    }

}
```

);

// ========================================
// KLÁVESNICE
// ========================================

document.addEventListener(
"keydown",
function(event) {

```
    // =================================
    // + = DALŠÍ ZASTÁVKA
    // =================================

    if (
        event.key === "+" ||
        event.code === "NumpadAdd"
    ) {

        event.preventDefault();

        nextStop();
    }

}
```

);

// ========================================
// MOBILNÍ TLAČÍTKO +
// ========================================

nextStopButton.addEventListener(
"click",
function() {

```
    nextStop();

}
```

);

// ========================================
// NAČTENÍ LINKY
// ========================================

function loadLine() {

```
const code =
    lineInput.value.trim();


message.textContent = "";


// =================================
// 99901 = SLUŽEBNÍ JÍZDA
// =================================

if (code === "99901") {

    currentLine = null;

    currentDirection = null;

    currentStop = 0;


    // Skrytí informací o lince

    lineInfo.classList.add(
        "hidden"
    );


    // Zobrazení panelu

    stopPanel.classList.remove(
        "hidden"
    );


    // Žádné číslo zastávky

    stopCounter.textContent = "";


    // Služební jízda

    stopName.textContent =
        "Služební jízda";


    stopName.classList.remove(
        "no-boarding"
    );


    return;
}


// =================================
// KONTROLA FORMÁTU
// =================================

if (!/^\d{5}$/.test(code)) {

    message.textContent =
        "Zadej kód ve formátu 02201.";

    return;
}


// =================================
// ROZDĚLENÍ KÓDU
// =================================

// 3 číslice = linka

const lineCode =
    code.substring(0, 3);


// 2 číslice = směr

const directionCode =
    code.substring(3, 5);


// =================================
// KONTROLA LINKY
// =================================

if (!linesData[lineCode]) {

    message.textContent =
        "Tato linka není v databázi.";

    return;
}


// =================================
// KONTROLA SMĚRU
// =================================

if (
    !linesData[lineCode][directionCode]
) {

    message.textContent =
        "Tento směr není u linky veden.";

    return;
}


// =================================
// NASTAVENÍ LINKY
// =================================

currentLine =
    lineCode;


currentDirection =
    directionCode;


// Začít od první zastávky

currentStop = 0;


const line =
    linesData[lineCode];


const direction =
    line[directionCode];


// =================================
// RESET NENASTUPUJTE
// =================================

stopName.classList.remove(
    "no-boarding"
);


// =================================
// ZOBRAZENÍ LINKY
// =================================

lineNumber.textContent =
    line.number;


directionName.textContent =
    direction.name;


// =================================
// ZOBRAZENÍ PANELŮ
// =================================

lineInfo.classList.remove(
    "hidden"
);


stopPanel.classList.remove(
    "hidden"
);


// =================================
// PRVNÍ ZASTÁVKA
// =================================

showStop();
```

}

// ========================================
// ZOBRAZENÍ ZASTÁVKY
// ========================================

function showStop() {

```
// Kontrola vybrané linky

if (
    currentLine === null ||
    currentDirection === null
) {

    return;
}


const direction =
    linesData[currentLine]
    [currentDirection];


const stops =
    direction.stops;


if (
    !stops ||
    stops.length === 0
) {

    return;
}


// Odstranění NENASTUPUJTE

stopName.classList.remove(
    "no-boarding"
);


// Zobrazení názvu

stopName.textContent =
    stops[currentStop];


// Zobrazení pořadí

stopCounter.textContent =
    `ZASTÁVKA ${currentStop + 1} / ${stops.length}`;
```

}

// ========================================
// DALŠÍ ZASTÁVKA
// ========================================

function nextStop() {

```
// =================================
// SLUŽEBNÍ JÍZDA
// =================================

if (
    currentLine === null &&
    currentDirection === null
) {

    return;
}


// =================================
// KONTROLA
// =================================

if (
    !currentLine ||
    !currentDirection
) {

    return;
}


const stops =
    linesData[currentLine]
    [currentDirection].stops;


if (
    !stops ||
    stops.length === 0
) {

    return;
}


// =================================
// NENASTUPUJTE
// =================================

// Pokud už je NENASTUPUJTE,
// dál se nepokračuje.

if (
    stopName.classList.contains(
        "no-boarding"
    )
) {

    return;
}


// =================================
// KONEČNÁ
// =================================

if (
    currentStop === stops.length - 1
) {

    stopName.textContent =
        "NENASTUPUJTE";


    stopName.classList.add(
        "no-boarding"
    );


    stopCounter.textContent =
        "KONEČNÁ ZASTÁVKA";


    return;
}


// =================================
// DALŠÍ ZASTÁVKA
// =================================

currentStop++;


showStop();
```

}

