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


lineInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {

        event.preventDefault();

        loadLine();
    }
});


document.addEventListener("keydown", function(event) {

    if (
        event.key === "+" ||
        event.code === "NumpadAdd"
    ) {

        event.preventDefault();

        nextStop();
    }
});


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


    if (!linesData[lineCode]) {

        message.textContent =
            "Tato linka není v databázi.";

        return;
    }


    if (!linesData[lineCode][directionCode]) {

        message.textContent =
            "Tento směr není u linky veden.";

        return;
    }


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
}


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


    stopName.textContent =
        stops[currentStop];


    stopCounter.textContent =
        `ZASTÁVKA ${currentStop + 1} / ${stops.length}`;


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


    // Po zobrazení NENASTUPUJTE
    // už další + nic nedělá.

    if (
        stopName.classList.contains(
            "no-boarding"
        )
    ) {
        return;
    }


    // Poslední zastávka

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


    currentStop++;

    showStop();
}
