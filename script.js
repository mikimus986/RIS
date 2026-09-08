let linesData = {};

let currentLine = null;
let currentDirection = null;
let currentStop = 0;


// =========================
// ELEMENTY
// =========================

const menuScreen = document.getElementById("menuScreen");
const codeScreen = document.getElementById("codeScreen");
const routeScreen = document.getElementById("routeScreen");

const selectLineButton =
    document.getElementById("selectLineButton");

const confirmCodeButton =
    document.getElementById("confirmCodeButton");

const backToMenuButton =
    document.getElementById("backToMenuButton");

const newLineButton =
    document.getElementById("newLineButton");

const nextStopButton =
    document.getElementById("nextStopButton");

const lineInput =
    document.getElementById("lineInput");

const lineNumber =
    document.getElementById("lineNumber");

const directionName =
    document.getElementById("directionName");

const stopCounter =
    document.getElementById("stopCounter");

const stopName =
    document.getElementById("stopName");

const nextStopName =
    document.getElementById("nextStopName");

const message =
    document.getElementById("codeMessage");

const clock =
    document.getElementById("clock");


// =========================
// HODINY
// =========================

function updateClock() {

    const now = new Date();

    clock.textContent =
        now.toLocaleTimeString(
            "cs-CZ",
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }
        );
}

updateClock();

setInterval(
    updateClock,
    1000
);


// =========================
// NAČTENÍ LINIÍ
// =========================

fetch("lines.json")
    .then(response => {

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
    })

    .catch(error => {

        console.error(error);

        message.textContent =
            "CHYBA: nepodařilo se načíst databázi linek.";
    });


// =========================
// TLAČÍTKA
// =========================

// Hlavní tlačítko VYBRAT LINKU
selectLineButton.addEventListener(
    "click",
    openCodeScreen
);

// ENTER
confirmCodeButton.addEventListener(
    "click",
    loadLine
);

// ZPĚT DO MENU
backToMenuButton.addEventListener(
    "click",
    openMenu
);

// VYBRAT LINKU během jízdy
newLineButton.addEventListener(
    "click",
    openCodeScreen
);

// DALŠÍ ZASTÁVKA
nextStopButton.addEventListener(
    "click",
    nextStop
);


// =========================
// ZADÁVÁNÍ KÓDU
// =========================

lineInput.addEventListener(
    "input",
    function () {

        // Povolit pouze čísla
        lineInput.value =
            lineInput.value.replace(
                /\D/g,
                ""
            );
    }
);


// ENTER V INPUTU

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

            // Funguje pouze během jízdy
            if (
                !routeScreen.classList.contains(
                    "hidden"
                )
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

    menuScreen.classList.add(
        "hidden"
    );

    routeScreen.classList.add(
        "hidden"
    );

    codeScreen.classList.remove(
        "hidden"
    );

    message.textContent = "";

    lineInput.value = "";

    // Automaticky aktivovat input
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

    menuScreen.classList.remove(
        "hidden"
    );

    codeScreen.classList.add(
        "hidden"
    );

    routeScreen.classList.add(
        "hidden"
    );


    currentLine = null;

    currentDirection = null;

    currentStop = 0;

    message.textContent = "";

    lineInput.value = "";
}


// =========================
// NAČTENÍ LINKY
// =========================

function loadLine() {

    const code =
        lineInput.value.trim();

    message.textContent = "";


    // =====================
    // SLUŽEBNÍ JÍZDA
    // =====================

    if (code === "99901") {

        currentLine = null;

        currentDirection = null;

        currentStop = 0;


        menuScreen.classList.add(
            "hidden"
        );

        codeScreen.classList.add(
            "hidden"
        );

        routeScreen.classList.remove(
            "hidden"
        );


        lineNumber.textContent =
            "—";

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
    // KONTROLA KÓDU
    // =====================

    if (
        !/^\d{5}$/.test(code)
    ) {

        message.textContent =
            "Zadejte 5místný kód, například 02201.";

        lineInput.focus();

        return;
    }


    // První 3 číslice = linka
    const lineCode =
        code.substring(0, 3);


    // Poslední 2 číslice = směr
    const directionCode =
        code.substring(3, 5);


    // =====================
    // KONTROLA LINKY
    // =====================

    if (
        !linesData[lineCode]
    ) {

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

    currentLine =
        lineCode;

    currentDirection =
        directionCode;

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


    // Přepnout na obrazovku jízdy
    menuScreen.classList.add(
        "hidden"
    );

    codeScreen.classList.add(
        "hidden"
    );

    routeScreen.classList.remove(
        "hidden"
    );


    // Zobrazit první zastávku
    showStop();
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
        linesData[
            currentLine
        ][
            currentDirection
        ];


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


    // Číslo zastávky
    stopCounter.textContent =
        `ZASTÁVKA ${currentStop + 1} / ${stops.length}`;


    // Další zastávka
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

    // Není aktivní žádná linka
    if (
        currentLine === null ||
        currentDirection === null
    ) {

        return;
    }


    const direction =
        linesData[
            currentLine
        ][
            currentDirection
        ];


    const stops =
        direction.stops;


    if (
        !stops ||
        stops.length === 0
    ) {

        return;
    }


    // Už jsme na konečné
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


    // =====================
    // DALŠÍ ZASTÁVKA
    // =====================

    currentStop++;

    showStop();
}
