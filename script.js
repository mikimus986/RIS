let linesData = {};

let currentLine = null;
let currentDirection = null;
let currentStop = 0;

const lineInput = document.getElementById("lineInput");

const loginScreen = document.getElementById("loginScreen");

const lineInfo = document.getElementById("lineInfo");
const lineNumber = document.getElementById("lineNumber");
const directionName = document.getElementById("directionName");

const stopPanel = document.getElementById("stopPanel");
const stopCounter = document.getElementById("stopCounter");
const stopName = document.getElementById("stopName");
const nextStopName = document.getElementById("nextStopName");

const message = document.getElementById("message");


// =========================
// NAČTENÍ DATABÁZE
// =========================

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
            "CHYBA: nepodařilo se načíst databázi linek.";
    });


// =========================
// ENTER
// =========================

lineInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {

        event.preventDefault();

        loadLine();
    }
});


// =========================
// +
// =========================

document.addEventListener("keydown", function(event) {

    if (
        event.key === "+" ||
        event.code === "NumpadAdd"
    ) {

        event.preventDefault();

        nextStop();
    }
});


// =========================
// NAČTENÍ LINKY
// =========================

function loadLine() {

    const code =
        lineInput.value.trim();

    message.textContent = "";


    // =========================
    // SLUŽEBNÍ JÍZDA
    // =========================

    if (code === "99901") {

        currentLine = null;
        currentDirection = null;
        currentStop = 0;

        loginScreen.classList.add("hidden");

        lineInfo.classList.add("hidden");

        stopPanel.classList.remove("hidden");

        stopCounter.textContent =
            "SLUŽEBNÍ JÍZDA";

        stopName.textContent =
            "Služební jízda";

        nextStopName.textContent =
            "—";

        stopName.classList.remove(
            "no-boarding"
        );

        lineInput.value = "";

        return;
    }


    // =========================
    // KONTROLA KÓDU
    // =========================

    if (!/^\d{5}$/.test(code)) {

        message.textContent =
            "Zadej kód ve formátu 02201.";

        return;
    }


    const lineCode =
        code.substring(0, 3);

    const directionCode =
        code.substring(3, 5);


    // =========================
    // KONTROLA LINKY
    // =========================

    if (!linesData[lineCode]) {

        message.textContent =
            "Tato linka není v databázi.";

        return;
    }


    // =========================
    // KONTROLA SMĚRU
    // =========================

    if (!linesData[lineCode][directionCode]) {

        message.textContent =
            "Tento směr není u linky veden.";

        return;
    }


    // =========================
    // NOVÁ JÍZDA
    // =========================

    currentLine = lineCode;

    currentDirection = directionCode;

    currentStop = 0;


    const line =
        linesData[lineCode];

    const direction =
        line[directionCode];


    stopName.classList.remove(
        "no-boarding"
    );


    lineNumber.textContent =
        line.number;

    directionName.textContent =
        direction.name;


    loginScreen.classList.add(
        "hidden"
    );

    lineInfo.classList.remove(
        "hidden"
    );

    stopPanel.classList.remove(
        "hidden"
    );


    showStop();


    // Vyčistit vstup
    lineInput.value = "";
}


// =========================
// ZOBRAZENÍ ZASTÁVKY
// =========================

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


    if (
        !stops ||
        stops.length === 0
    ) {

        return;
    }


    stopName.classList.remove(
        "no-boarding"
    );


    // Aktuální zastávka

    stopName.textContent =
        stops[currentStop];


    // Počet zastávek

    stopCounter.textContent =
        `ZASTÁVKA ${currentStop + 1} / ${stops.length}`;


    // =========================
    // DALŠÍ ZASTÁVKA
    // =========================

    if (
        currentStop <
        stops.length - 1
    ) {

        nextStopName.textContent =
            stops[currentStop + 1];

    } else {

        nextStopName.textContent =
            "KONEČNÁ ZASTÁVKA";
    }
}


// =========================
// DALŠÍ ZASTÁVKA
// =========================

function nextStop() {

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


    if (
        !stops ||
        stops.length === 0
    ) {

        return;
    }


    // =========================
    // NENASTUPUJTE
    // =========================

    if (
        stopName.classList.contains(
            "no-boarding"
        )
    ) {

        return;
    }


    // =========================
    // KONEČNÁ
    // =========================

    if (
        currentStop ===
        stops.length - 1
    ) {

        stopName.textContent =
            "NENASTUPUJTE";

        stopName.classList.add(
            "no-boarding"
        );

        stopCounter.textContent =
            "KONEČNÁ ZASTÁVKA";

        nextStopName.textContent =
            "VOZIDLO KONČÍ JÍZDU";

        return;
    }


    // =========================
    // POSUN NA DALŠÍ ZASTÁVKU
    // =========================

    currentStop++;

    showStop();
}


// =========================
// KLIKNUTÍ DO TERMINÁLU
// =========================

// Po načtení jízdy můžeš kdykoliv
// kliknout do políčka a zadat nový kód.

document.addEventListener("click", function(event) {

    if (
        event.target === lineInput
    ) {

        lineInput.select();
    }
});
