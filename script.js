let linesData = {};

let currentLine = null;
let currentDirection = null;
let currentStop = 0;


// =========================
// ELEMENTY Z TVÉHO INDEX.HTML
// =========================

const menuScreen = document.getElementById("menu");
const codeScreen = document.getElementById("code");
const routeScreen = document.getElementById("route");

const selectLineButton = document.getElementById("choose");
const confirmCodeButton = document.getElementById("enter");
const backToMenuButton = document.getElementById("back");
const newLineButton = document.getElementById("new");
const nextStopButton = document.getElementById("plus");

const lineInput = document.getElementById("input");

const lineNumber = document.getElementById("line");
const directionName = document.getElementById("direction");
const stopCounter = document.getElementById("counter");
const stopName = document.getElementById("stop");
const nextStopName = document.getElementById("next");

const message = document.getElementById("error");

const clock = document.getElementById("clock");


// =========================
// HODINY
// =========================

function updateClock() {

    const now = new Date();

    clock.textContent = now.toLocaleTimeString(
        "cs-CZ",
        {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }
    );
}

updateClock();

setInterval(updateClock, 1000);


// =========================
// NAČTENÍ LINES.JSON
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

    })
    .catch(error => {

        console.error(error);

        message.textContent =
            "CHYBA: Nepodařilo se načíst lines.json.";

    });


// =========================
// VYBRAT LINKU – HLAVNÍ MENU
// =========================

selectLineButton.addEventListener(
    "click",
    openCodeScreen
);


// =========================
// ENTER
// =========================

confirmCodeButton.addEventListener(
    "click",
    loadLine
);


// =========================
// ZPĚT DO MENU
// =========================

backToMenuButton.addEventListener(
    "click",
    openMenu
);


// =========================
// VYBRAT LINKU BĚHEM JÍZDY
// =========================

newLineButton.addEventListener(
    "click",
    openCodeScreen
);


// =========================
// DALŠÍ ZASTÁVKA
// =========================

nextStopButton.addEventListener(
    "click",
    nextStop
);


// =========================
// VSTUP – POUZE ČÍSLA
// =========================

lineInput.addEventListener(
    "input",
    function () {

        lineInput.value =
            lineInput.value.replace(/\D/g, "");

    }
);


// =========================
// ENTER V INPUTU
// =========================

lineInput.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Enter") {

            event.preventDefault();

            loadLine();
        }

    }
);


// =========================
// KLÁVESNICE
// =========================

document.addEventListener(
    "keydown",
    function (event) {

        // =====================
        // * = VYBRAT LINKU
        // =====================

        if (event.key === "*") {

            event.preventDefault();

            openCodeScreen();

            return;
        }


        // =====================
        // + = DALŠÍ ZASTÁVKA
        // =====================

        if (
            event.key === "+" ||
            event.code === "NumpadAdd"
        ) {

            if (
                !routeScreen.classList.contains("hidden")
            ) {

                event.preventDefault();

                nextStop();
            }
        }

    }
);


// =========================
// OTEVŘÍT ZADÁNÍ LINKY
// =========================

function openCodeScreen() {

    menuScreen.classList.add("hidden");

    routeScreen.classList.add("hidden");

    codeScreen.classList.remove("hidden");

    message.textContent = "";

    lineInput.value = "";

    setTimeout(
        function () {

            lineInput.focus();

        },
        50
    );
}


// =========================
// ZPĚT DO HLAVNÍHO MENU
// =========================

function openMenu() {

    menuScreen.classList.remove("hidden");

    codeScreen.classList.add("hidden");

    routeScreen.classList.add("hidden");

    currentLine = null;

    currentDirection = null;

    currentStop = 0;

    message.textContent = "";

    lineInput.value = "";
}


// =========================
// NAČÍST LINKU
// =========================

function loadLine() {

    const code = lineInput.value.trim();

    message.textContent = "";


    // =====================
    // SLUŽEBNÍ JÍZDA
    // 99901
    // =====================

    if (code === "99901") {

        currentLine = null;

        currentDirection = null;

        currentStop = 0;

        menuScreen.classList.add("hidden");

        codeScreen.classList.add("hidden");

        routeScreen.classList.remove("hidden");

        lineNumber.textContent = "—";

        directionName.textContent =
            "SLUŽEBNÍ JÍZDA";

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


    // =====================
    // KONTROLA 5 ČÍSLIC
    // =====================

    if (!/^\d{5}$/.test(code)) {

        message.textContent =
            "Zadejte 5místný kód, například 02201.";

        lineInput.focus();

        return;
    }


    // =====================
    // ROZDĚLENÍ KÓDU
    // =====================

    // první 3 čísla = linka
    const lineCode = code.substring(0, 3);

    // poslední 2 čísla = směr
    const directionCode = code.substring(3, 5);


    // =====================
    // KONTROLA LINKY
    // =====================

    if (!linesData[lineCode]) {

        message.textContent =
            "Tato linka není v databázi.";

        lineInput.focus();

        return;
    }


    // =====================
    // KONTROLA SMĚRU
    // =====================

    if (
        !linesData[lineCode][directionCode]
    ) {

        message.textContent =
            "Tento směr není u linky veden.";

        lineInput.focus();

        return;
    }


    // =====================
    // NASTAVENÍ JÍZDY
    // =====================

    currentLine = lineCode;

    currentDirection = directionCode;

    currentStop = 0;


    const line =
        linesData[lineCode];

    const direction =
        line[directionCode];


    lineNumber.textContent =
        line.number;

    directionName.textContent =
        direction.name;


    stopName.classList.remove(
        "no-boarding"
    );


    // =====================
    // PŘEPNUTÍ NA JÍZDU
    // =====================

    menuScreen.classList.add("hidden");

    codeScreen.classList.add("hidden");

    routeScreen.classList.remove("hidden");


    // =====================
    // PRVNÍ ZASTÁVKA
    // =====================

    showStop();
}


// =========================
// ZOBRAZIT ZASTÁVKU
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


    // =====================
    // AKTUÁLNÍ ZASTÁVKA
    // =====================

    stopName.textContent =
        stops[currentStop];


    // =====================
    // POČÍTADLO
    // =====================

    stopCounter.textContent =
        `ZASTÁVKA ${currentStop + 1} / ${stops.length}`;


    // =====================
    // DALŠÍ ZASTÁVKA
    // =====================

    if (
        currentStop < stops.length - 1
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


    // =====================
    // UŽ JE NENASTUPUJTE
    // =====================

    if (
        stopName.classList.contains(
            "no-boarding"
        )
    ) {

        return;
    }


    // =====================
    // KONEČNÁ
    // =====================

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

        nextStopName.textContent =
            "VOZIDLO KONČÍ JÍZDU";

        return;
    }


    // =====================
    // POSUN O JEDNU ZASTÁVKU
    // =====================

    currentStop++;

    showStop();
}
