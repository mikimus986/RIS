let linesData = {};

let currentLine = null;
let currentDirection = null;
let currentStop = 0;


// ========================================
// HTML PRVKY
// ========================================

const lineInput = document.getElementById("lineInput");

const lineInfo = document.getElementById("lineInfo");
const lineNumber = document.getElementById("lineNumber");
const directionName = document.getElementById("directionName");

const stopPanel = document.getElementById("stopPanel");
const stopCounter = document.getElementById("stopCounter");
const stopName = document.getElementById("stopName");

const message = document.getElementById("message");

const nextStopButton = document.getElementById("nextStopButton");


// ========================================
// NAČTENÍ DATABÁZE
// ========================================

fetch("lines.json")
    .then(response => {
        if (!response.ok) {
            throw new Error("Nelze načíst lines.json");
        }

        return response.json();
    })
    .then(data => {
        linesData = data;

        console.log("Databáze linek načtena.");

        lineInput.focus();
    })
    .catch(error => {
        console.error(error);

        message.textContent =
            "Chyba: nepodařilo se načíst databázi linek.";
    });


// ========================================
// ENTER = POTVRDIT LINKU
// ========================================

lineInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {

        event.preventDefault();

        loadLine();
    }

});


// ========================================
// + NA KLÁVESNICI
// ========================================

document.addEventListener("keydown", function(event) {

    if (
        event.key === "+" ||
        event.code === "NumpadAdd"
    ) {

        event.preventDefault();

        nextStop();
    }

});


// ========================================
// + NA MOBILU
// ========================================

if (nextStopButton) {

    nextStopButton.addEventListener("click", function() {

        nextStop();

    });

}


// ========================================
// NAČTENÍ LINKY
// ========================================

function loadLine() {

    const code = lineInput.value.trim();

    message.textContent = "";


    // ====================================
    // SLUŽEBNÍ JÍZDA
    // ====================================

    if (code === "99901") {

        currentLine = null;
        currentDirection = null;
        currentStop = 0;

        lineInfo.classList.add("hidden");

        stopPanel.classList.remove("hidden");

        stopCounter.textContent = "";

        stopName.textContent = "Služební jízda";

        stopName.classList.remove("no-boarding");

        return;
    }


    // ====================================
    // KONTROLA KÓDU
    // ====================================

    if (!/^\d{5}$/.test(code)) {

        message.textContent =
            "Zadej kód ve formátu 02201.";

        return;
    }


    // ====================================
    // ROZDĚLENÍ KÓDU
    // ====================================

    const lineCode = code.substring(0, 3);

    const directionCode = code.substring(3, 5);


    // ====================================
    // KONTROLA LINKY
    // ====================================

    if (!linesData[lineCode]) {

        message.textContent =
            "Tato linka není v databázi.";

        return;
    }


    // ====================================
    // KONTROLA SMĚRU
    // ====================================

    if (!linesData[lineCode][directionCode]) {

        message.textContent =
            "Tento směr není u linky veden.";

        return;
    }


    // ====================================
    // NASTAVENÍ
    // ====================================

    currentLine = lineCode;

    currentDirection = directionCode;

    currentStop = 0;


    const line = linesData[lineCode];

    const direction = line[directionCode];


    // ====================================
    // RESET NENASTUPUJTE
    // ====================================

    stopName.classList.remove("no-boarding");


    // ====================================
    // INFORMACE O LINCE
    // ====================================

    lineNumber.textContent = line.number;

    directionName.textContent = direction.name;


    lineInfo.classList.remove("hidden");

    stopPanel.classList.remove("hidden");


    // ====================================
    // PRVNÍ ZASTÁVKA
    // ====================================

    showStop();
}


// ========================================
// ZOBRAZENÍ ZASTÁVKY
// ========================================

function showStop() {

    if (
        currentLine === null ||
        currentDirection === null
    ) {

        return;
    }


    const direction =
        linesData[currentLine][currentDirection];

    const stops = direction.stops;


    if (
        !stops ||
        stops.length === 0
    ) {

        return;
    }


    stopName.classList.remove("no-boarding");


    stopName.textContent =
        stops[currentStop];


    stopCounter.textContent =
        `ZASTÁVKA ${currentStop + 1} / ${stops.length}`;
}


// ========================================
// DALŠÍ ZASTÁVKA
// ========================================

function nextStop() {

    // Služební jízda
    if (
        currentLine === null &&
        currentDirection === null
    ) {

        return;
    }


    // Není vybraná linka
    if (
        !currentLine ||
        !currentDirection
    ) {

        return;
    }


    const direction =
        linesData[currentLine][currentDirection];

    const stops = direction.stops;


    if (
        !stops ||
        stops.length === 0
    ) {

        return;
    }


    // Už je NENASTUPUJTE
    if (
        stopName.classList.contains("no-boarding")
    ) {

        return;
    }


    // ====================================
    // POSLEDNÍ ZASTÁVKA
    // ====================================

    if (
        currentStop >= stops.length - 1
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


    // ====================================
    // DALŠÍ ZASTÁVKA
    // ====================================

    currentStop++;

    showStop();
}

