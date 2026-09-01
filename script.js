let linesData = {};

let currentLine = null;
let currentDirection = null;
let currentStop = 0;

const lineInput = document.getElementById("lineInput");

const lineInfo = document.getElementById("lineInfo");
const lineNumber = document.getElementById("lineNumber");
const directionName = document.getElementById("directionName");

const stopPanel = document.getElementById("stopPanel");
const stopCounter = document.getElementById("stopCounter");
const stopName = document.getElementById("stopName");

const message = document.getElementById("message");


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
// ENTER = POTVRDIT KÓD
// ========================================

lineInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {

        event.preventDefault();

        loadLine();
    }

});


// ========================================
// KLÁVESNICE
// ========================================

document.addEventListener("keydown", function(event) {

    // ====================================
    // + = DALŠÍ ZASTÁVKA
    // ====================================

    if (
        event.key === "+" ||
        event.code === "NumpadAdd"
    ) {

        event.preventDefault();

        nextStop();
    }

});


// ========================================
// NAČTENÍ LINKY
// ========================================

function loadLine() {

    const code = lineInput.value.trim();

    message.textContent = "";


    // Kontrola formátu
    // 3 číslice linka + 2 číslice směr

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
    // NOVÁ LINKA / SMĚR
    // ====================================

    currentLine = lineCode;

    currentDirection = directionCode;

    // Vždy začít od první zastávky
    currentStop = 0;


    const line =
        linesData[lineCode];

    const direction =
        line[directionCode];


    // ====================================
    // RESET NENASTUPUJTE
    // ====================================

    stopName.classList.remove("no-boarding");


    // ====================================
    // ZOBRAZENÍ LINKY
    // ====================================

    lineNumber.textContent =
        line.number;


    directionName.textContent =
        direction.name;


    // ====================================
    // ZOBRAZENÍ PANELŮ
    // ====================================

    lineInfo.classList.remove("hidden");

    stopPanel.classList.remove("hidden");


    // ====================================
    // ZOBRAZENÍ PRVNÍ ZASTÁVKY
    // ====================================

    showStop();
}


// ========================================
// ZOBRAZENÍ AKTUÁLNÍ ZASTÁVKY
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


    const stops =
        direction.stops;


    if (!stops || stops.length === 0) {

        return;
    }


    // Odstranění NENASTUPUJTE

    stopName.classList.remove("no-boarding");


    // Název zastávky

    stopName.textContent =
        stops[currentStop];


    // Počet zastávek

    stopCounter.textContent =
        `ZASTÁVKA ${currentStop + 1} / ${stops.length}`;
}


// ========================================
// DALŠÍ ZASTÁVKA
// ========================================

function nextStop() {

    if (
        currentLine === null ||
        currentDirection === null
    ) {

        return;
    }


    const stops =
        linesData[currentLine][currentDirection].stops;


    if (!stops || stops.length === 0) {

        return;
    }


    // ====================================
    // POKUD UŽ JE NENASTUPUJTE
    // ====================================

    if (
        stopName.classList.contains("no-boarding")
    ) {

        // Už nikam nepokračovat.
        // Musí se znovu zadat kód linky.

        return;
    }


    // ====================================
    // KONEČNÁ ZASTÁVKA
    // ====================================

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


    // ====================================
    // DALŠÍ ZASTÁVKA
    // ====================================

    currentStop++;

    showStop();
}
