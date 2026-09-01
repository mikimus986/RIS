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


// ===============================
// NAČTENÍ DATABÁZE
// ===============================

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
    })
    .catch(error => {
        console.error(error);

        message.textContent =
            "Chyba: nepodařilo se načíst databázi linek.";
    });


// ===============================
// ENTER = POTVRDIT LINKU
// ===============================

lineInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {

        event.preventDefault();

        loadLine();
    }

});


// ===============================
// KLÁVESNICE
// ===============================

document.addEventListener("keydown", function(event) {

    // -------------------------------
    // + = DALŠÍ ZASTÁVKA
    // -------------------------------

    if (
        event.key === "+" ||
        event.code === "NumpadAdd"
    ) {

        event.preventDefault();

        nextStop();
    }


    // -------------------------------
    // * = NENASTUPUJTE
    // -------------------------------

    if (
        event.key === "*" ||
        event.code === "NumpadMultiply"
    ) {

        event.preventDefault();

        showNoBoarding();
    }

});


// ===============================
// NAČTENÍ LINKY
// ===============================

function loadLine() {

    const code = lineInput.value.trim();

    message.textContent = "";


    // Musí být přesně 5 číslic

    if (!/^\d{5}$/.test(code)) {

        message.textContent =
            "Zadej kód ve formátu 02201.";

        return;
    }


    // První 3 číslice = linka

    const lineCode = code.substring(0, 3);


    // Poslední 2 číslice = směr

    const directionCode = code.substring(3, 5);


    // Kontrola linky

    if (!linesData[lineCode]) {

        message.textContent =
            "Tato linka není v databázi.";

        return;
    }


    // Kontrola směru

    if (!linesData[lineCode][directionCode]) {

        message.textContent =
            "Tento směr není u linky veden.";

        return;
    }


    // Uložení aktuální linky

    currentLine = lineCode;

    currentDirection = directionCode;

    currentStop = 0;


    // Získání údajů

    const line =
        linesData[lineCode];

    const direction =
        line[directionCode];


    // Zobrazení linky

    lineNumber.textContent =
        line.number;


    directionName.textContent =
        direction.name;


    // Zobrazení panelů

    lineInfo.classList.remove("hidden");

    stopPanel.classList.remove("hidden");


    // Odstranění případného NENASTUPUJTE

    stopName.classList.remove("no-boarding");


    // Zobrazení první zastávky

    showStop();
}


// ===============================
// ZOBRAZENÍ ZASTÁVKY
// ===============================

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


// ===============================
// DALŠÍ ZASTÁVKA
// ===============================

function nextStop() {

    // Není vybraná linka

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


    // Přechod na další zastávku

    if (currentStop < stops.length - 1) {

        currentStop++;

    } else {

        // Pokud jsme na konečné,
        // vrátíme se na první zastávku

        currentStop = 0;
    }


    showStop();
}


// ===============================
// NENASTUPUJTE
// ===============================

function showNoBoarding() {

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


    // Funguje pouze na poslední zastávce

    if (currentStop !== stops.length - 1) {

        return;
    }


    // Zobrazení NENASTUPUJTE

    stopName.textContent =
        "NENASTUPUJTE";


    stopName.classList.add("no-boarding");


    stopCounter.textContent =
        "KONEČNÁ ZASTÁVKA";
}
