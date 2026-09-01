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


// Načtení databáze
fetch("lines.json")
    .then(response => {
        if (!response.ok) {
            throw new Error("Nelze načíst lines.json");
        }

        return response.json();
    })
    .then(data => {
        linesData = data;
    })
    .catch(error => {
        console.error(error);

        message.textContent =
            "Chyba: nepodařilo se načíst databázi linek.";
    });


// Enter = potvrzení kódu
lineInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
        event.preventDefault();
        loadLine();
    }

});


// Ovládání klávesnice
document.addEventListener("keydown", function(event) {

    // + na hlavní klávesnici
    // + na numerické klávesnici
    if (
        event.key === "+" ||
        event.code === "NumpadAdd"
    ) {
        event.preventDefault();
        nextStop();
    }

});


// Načtení linky
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


    // Kontrola existence linky
    if (!linesData[lineCode]) {

        message.textContent =
            "Tato linka není v databázi.";

        return;
    }


    // Kontrola existence směru
    if (!linesData[lineCode][directionCode]) {

        message.textContent =
            "Tento směr není u linky veden.";

        return;
    }


    currentLine = lineCode;
    currentDirection = directionCode;
    currentStop = 0;


    const line = linesData[lineCode];
    const direction = line[directionCode];


    // Zobrazení linky
    lineNumber.textContent = line.number;
    directionName.textContent = direction.name;


    lineInfo.classList.remove("hidden");
    stopPanel.classList.remove("hidden");


    showStop();
}


// Zobrazení aktuální zastávky
function showStop() {

    const direction =
        linesData[currentLine][currentDirection];

    const stops = direction.stops;

    if (!stops || stops.length === 0) {
        return;
    }


    stopName.textContent =
        stops[currentStop];


    stopCounter.textContent =
        `ZASTÁVKA ${currentStop + 1} / ${stops.length}`;
}


// Další zastávka
function nextStop() {

    // Pokud ještě nebyla vybrána linka
    if (
        currentLine === null ||
        currentDirection === null
    ) {
        return;
    }


    const stops =
        linesData[currentLine][currentDirection].stops;


    // Pokud jsme na poslední zastávce,
    // vrátíme se na první.
    if (currentStop < stops.length - 1) {

        currentStop++;

    } else {

        currentStop = 0;

    }


    showStop();
}
