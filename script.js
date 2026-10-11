let D = {};
let L = null;
let Dir = null;
let I = 0;
let R = null;
let P = null;
let C = null;
let rt = null;
let serviceTrip = false;

const $ = id => document.getElementById(id);

const pair = $("pair");
const menu = $("menu");
const code = $("code");
const route = $("route");
const display = $("display");

const msg = $("error");
const stop = $("stop");
const counter = $("counter");
const next = $("next");

// Čas na obou zařízeních
function time() {
    const t = new Date().toLocaleTimeString("cs-CZ", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });

    $("clock").textContent = t;
    $("displayClock").textContent = t;
}

time();
setInterval(time, 1000);

// Načtení databáze linek
fetch("lines.json")
    .then(response => {
        if (!response.ok) {
            throw new Error("Nepodařilo se načíst lines.json");
        }
        return response.json();
    })
    .then(data => {
        D = data;
    })
    .catch(() => {
        msg.textContent = "Nepodařilo se načíst lines.json.";
    });

// Výběr zařízení
$("pairButton").onclick = pairStart;

$("pairInput").onkeydown = event => {
    if (event.key === "Enter") {
        pairStart();
    }
};

function pairStart() {
    const value = $("pairInput").value.trim().toLowerCase();

    if (value === "dpma1") {
        driver();
    } else if (value === "dpma2") {
        board();
    } else {
        $("pairStatus").textContent =
            "Zadej dpma1 nebo dpma2.";
    }
}

// Připojení PeerJS
function createPeer(id, callback) {
    if (!window.Peer) {
        $("pairStatus").textContent =
            "Chybí internetové spojení ke knihovně PeerJS.";
        return;
    }

    P = new Peer(id);

    P.on("open", callback);

    P.on("error", event => {
        if (event.type === "unavailable-id") {
            $("pairStatus").textContent =
                "Toto ID už někdo používá. Zavři duplicitní zařízení.";
        } else {
            $("pairStatus").textContent =
                "Chyba spojení: " + event.type;
        }
    });
}

// DPMA1 – řidičský počítač
function driver() {
    R = "driver";

    pair.classList.add("hidden");
    menu.classList.remove("hidden");

    $("driverStatus").textContent =
        "Čekám na vnitřní tabuli…";

    createPeer("dpma1", () => {
        $("driverStatus").textContent =
            "DPMA1 AKTIVNÍ – ČEKÁM NA TABULI";

        P.on("connection", connection => {
            if (C) {
                C.close();
            }

            C = connection;

            C.on("open", () => {
                $("driverStatus").textContent =
                    "TABULE PŘIPOJENA";
                send();
            });

            C.on("close", () => {
                $("driverStatus").textContent =
                    "TABULE ODPOJENA";
            });

            C.on("error", () => {
                $("driverStatus").textContent =
                    "CHYBA SPOJENÍ S TABULÍ";
            });
        });
    });
}

// DPMA2 – vnitřní informační tabule
function board() {
    R = "board";

    pair.classList.add("hidden");
    display.classList.remove("hidden");

    $("displayConnection").textContent =
        "HLEDÁM DPMA1…";

    createPeer("dpma2", connect);
}

// Připojení DPMA2 k DPMA1
function connect() {
    if (!P || !P.open) {
        return;
    }

    C = P.connect("dpma1", {
        reliable: true
    });

    C.on("open", () => {
        $("displayConnection").textContent =
            "TABULE PŘIPOJENA";

        $("displayConnection").classList.add("ok");
    });

    C.on("data", data => {
        if (data && data.type === "state") {
            paint(data.s);
        }
    });

    C.on("close", () => {
        $("displayConnection").textContent =
            "SPOJENÍ PŘERUŠENO – OBNOVUJI";

        $("displayConnection").classList.remove("ok");

        clearTimeout(rt);
        rt = setTimeout(connect, 2000);
    });
}

// Stav, který se posílá na vnitřní tabuli
function state() {
    if (serviceTrip) {
        return {
            active: true,
            service: true,
            line: "—",
            dest: "SLUŽEBNÍ JÍZDA",
            stops: ["Služební jízda"],
            index: 0,
            no: false
        };
    }

    if (!L || !Dir || !D[L] || !D[L][Dir]) {
        return {
            active: false
        };
    }

    const direction = D[L][Dir];

    return {
        active: true,
        service: false,
        line: direction.number || D[L].number,
        dest: direction.name,
        stops: direction.stops,
        index: I,
        no: stop.classList.contains("no-boarding")
    };
}

// Odeslání aktuálního stavu
function send() {
    if (R === "driver" && C && C.open) {
        C.send({
            type: "state",
            s: state()
        });
    }
}

// Zobrazení na DPMA2
function paint(s) {
    if (!s || !s.active) {
        $("displayLine").textContent = "--";

        $("displayDestination").textContent =
            "ČEKÁNÍ NA JÍZDU";

        $("displayStops").innerHTML =
            '<div class="waiting">' +
            "ČEKÁNÍ NA DATA Z PALUBNÍHO POČÍTAČE" +
            "</div>";

        return;
    }

    $("displayLine").textContent = s.line;
    $("displayDestination").textContent = s.dest;

    if (s.no) {
        $("displayStops").innerHTML =
            '<div class="waiting" ' +
            'style="color:red;font-size:32px">' +
            "NENASTUPUJTE" +
            "</div>";

        return;
    }

    if (s.service) {
        $("displayStops").innerHTML =
            '<div class="dstop current">' +
            '<span class="arrow">→</span>' +
            '<span class="stoptext">Služební jízda</span>' +
            "</div>";

        return;
    }

    const stops = s.stops || [];
    const current = s.index || 0;

    let html = "";

    const start = Math.max(0, current - 2);
    const end = Math.min(stops.length - 1, current + 5);

    for (let i = start; i <= end; i++) {
        let className = "dstop";

        if (i === current) {
            className += " current";
        } else if (i < current) {
            className += " passed";
        }

        const arrow =
            i === current ? "→" :
            i < current ? "✓" : "";

        html +=
            '<div class="' + className + '">' +
            '<span class="arrow">' + arrow + "</span>" +
            '<span class="stoptext">' +
            esc(stops[i]) +
            "</span>" +
            "</div>";
    }

    $("displayStops").innerHTML = html;
}

// Bezpečné vložení názvů zastávek do HTML
function esc(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// Ovládací tlačítka
$("choose").onclick = openCode;
$("new").onclick = openCode;
$("enter").onclick = load;
$("back").onclick = back;
$("plus").onclick = advance;

$("disconnectDriver").onclick = () => {
    if (C) {
        C.close();
    }

    $("driverStatus").textContent =
        "TABULE ODPOJENA";
};

// Opraveno: správné odstranění nečíselných znaků
$("input").oninput = () => {
    $("input").value =
        $("input").value.replace(/\D/g, "").slice(0, 5);
};

$("input").onkeydown = event => {
    if (event.key === "Enter") {
        load();
    }
};

// Klávesové zkratky
document.addEventListener("keydown", event => {
    if (R !== "driver") {
        return;
    }

    if (event.key === "*" &&
        !display.classList.contains("hidden")) {
        return;
    }

    if (event.key === "*") {
        openCode();
    }

    if (
        (event.key === "+" || event.code === "NumpadAdd") &&
        !route.classList.contains("hidden")
    ) {
        advance();
    }
});

// Otevření zadávání kódu
function openCode() {
    menu.classList.add("hidden");
    route.classList.add("hidden");
    code.classList.remove("hidden");

    msg.textContent = "";
    $("input").value = "";
    $("input").focus();
}

// Návrat do menu
function back() {
    menu.classList.remove("hidden");
    code.classList.add("hidden");
    route.classList.add("hidden");

    L = null;
    Dir = null;
    I = 0;
    serviceTrip = false;

    send();
}

// Potvrzení kódu linky
function load() {
    const c = $("input").value.trim();

    msg.textContent = "";

    // Služební jízda
    if (c === "99901") {
        L = null;
        Dir = null;
        I = 0;
        serviceTrip = true;

        menu.classList.add("hidden");
        code.classList.add("hidden");
        route.classList.remove("hidden");

        $("line").textContent = "—";
        $("direction").textContent = "SLUŽEBNÍ JÍZDA";
        counter.textContent = "SLUŽEBNÍ JÍZDA";
        stop.classList.remove("no-boarding");
        stop.textContent = "Služební jízda";
        next.textContent = "—";

        send();
        return;
    }

    // OPRAVA: regulární výraz pro přesně pět číslic
    if (!/^\d{5}$/.test(c)) {
        msg.textContent = "Zadej pětimístný kód.";
        return;
    }

    const lineCode = c.slice(0, 3);
    const directionCode = c.slice(3);

    if (
        !D[lineCode] ||
        !D[lineCode][directionCode] ||
        !Array.isArray(D[lineCode][directionCode].stops) ||
        D[lineCode][directionCode].stops.length === 0
    ) {
        msg.textContent =
            "Linka nebo směr není v databázi.";
        return;
    }

    L = lineCode;
    Dir = directionCode;
    I = 0;
    serviceTrip = false;

    $("line").textContent =
        D[L].number || L;

    $("direction").textContent =
        D[L][Dir].name;

    menu.classList.add("hidden");
    code.classList.add("hidden");
    route.classList.remove("hidden");

    show();
}

// Aktualizace aktuální zastávky
function show() {
    if (serviceTrip || !L || !Dir) {
        return;
    }

    const stops = D[L][Dir].stops;

    stop.classList.remove("no-boarding");
    stop.textContent = stops[I];

    counter.textContent =
        `ZASTÁVKA ${I + 1} / ${stops.length}`;

    next.textContent =
        I < stops.length - 1
            ? stops[I + 1]
            : "KONEČNÁ ZASTÁVKA";

    send();
}

// Posun na další zastávku
function advance() {
    if (serviceTrip || !L || !Dir) {
        return;
    }

    if (stop.classList.contains("no-boarding")) {
        return;
    }

    const stops = D[L][Dir].stops;

    if (I === stops.length - 1) {
        stop.textContent = "NENASTUPUJTE";
        stop.classList.add("no-boarding");

        counter.textContent = "KONEČNÁ ZASTÁVKA";
        next.textContent = "VOZIDLO KONČÍ JÍZDU";

        send();
        return;
    }

    I++;
    show();
}
```
