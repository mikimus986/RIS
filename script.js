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

// ==================================================
// ČAS
// ==================================================

function time() {
    const t = new Date().toLocaleTimeString("cs-CZ", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });

    if ($("clock")) $("clock").textContent = t;
    if ($("displayClock")) $("displayClock").textContent = t;
}

time();
setInterval(time, 1000);

// ==================================================
// NAČTENÍ LINES.JSON
// ==================================================

const dataReady = fetch("lines.json")
    .then(response => {
        if (!response.ok) {
            throw new Error("Nepodařilo se načíst lines.json");
        }

        return response.json();
    })
    .then(data => {
        D = data;
    })
    .catch(error => {
        console.error(error);

        if (msg) {
            msg.textContent = "Nepodařilo se načíst lines.json.";
        }

        throw error;
    });

// ==================================================
// BARVY LINEK
// ==================================================

function lineColor(number) {
    const colors = {
        "1": "#A8D88A",
        "22": "#A8D88A",
        "2": "#F19AC2",
        "23": "#D6B58A",
        "76": "#D6B58A",
        "74": "#96613D",
        "77": "#96613D",
        "111": "#D92336",
        "112": "#D92336",
        "113": "#D6F0B0"
    };

    return colors[String(number)] || "#A8D88A";
}

// ==================================================
// SPÁROVÁNÍ ZAŘÍZENÍ
// ==================================================

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
        $("pairStatus").textContent = "Zadej dpma1 nebo dpma2.";
    }
}

// ==================================================
// PEERJS
// ==================================================

function createPeer(id, callback) {
    if (!window.Peer) {
        $("pairStatus").textContent =
            "Nepodařilo se načíst PeerJS. Zkontroluj internet.";
        return;
    }

    P = new Peer(id);

    P.on("open", callback);

    P.on("error", event => {
        console.error("PeerJS:", event);

        if (event.type === "unavailable-id") {
            $("pairStatus").textContent =
                "Toto ID už používá jiné zařízení. Zavři duplicitní stránku.";
        } else {
            $("pairStatus").textContent =
                "Chyba spojení: " + event.type;
        }
    });
}

// ==================================================
// DPMA1 – ŘIDIČSKÝ POČÍTAČ
// ==================================================

function driver() {
    R = "driver";

    pair.classList.add("hidden");
    menu.classList.remove("hidden");

    $("driverStatus").textContent = "Čekám na vnitřní tabuli…";

    createPeer("dpma1", () => {
        $("driverStatus").textContent =
            "DPMA1 AKTIVNÍ – ČEKÁM NA TABULI";

        P.on("connection", connection => {
            if (C) {
                C.close();
            }

            C = connection;

            C.on("open", () => {
                $("driverStatus").textContent = "TABULE PŘIPOJENA";
                send();
            });

            C.on("close", () => {
                $("driverStatus").textContent = "TABULE ODPOJENA";
            });

            C.on("error", () => {
                $("driverStatus").textContent = "CHYBA SPOJENÍ S TABULÍ";
            });
        });
    });
}

// ==================================================
// DPMA2 – VNITŘNÍ TABULE
// ==================================================

function board() {
    R = "board";

    pair.classList.add("hidden");
    display.classList.remove("hidden");

    $("displayConnection").textContent = "HLEDÁM DPMA1…";

    createPeer("dpma2", connect);
}

function connect() {
    if (!P || !P.open) return;

    if (C) {
        try {
            C.close();
        } catch (error) {
            console.warn(error);
        }
    }

    C = P.connect("dpma1", { reliable: true });

    C.on("open", () => {
        $("displayConnection").textContent = "TABULE PŘIPOJENA";
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
        rt = setTimeout(connect, 2500);
    });

    C.on("error", error => {
        console.error("Chyba tabule:", error);
    });
}

// ==================================================
// PŘÍPRAVA DAT PRO DPMA2
// ==================================================

function state() {
    if (serviceTrip) {
        return {
            active: true,
            service: true,
            line: "—",
            color: "#555555",
            dest: "SLUŽEBNÍ JÍZDA",
            stops: ["Služební jízda"],
            index: 0,
            no: false
        };
    }

    if (!L || !Dir || !D[L] || !D[L][Dir]) {
        return { active: false };
    }

    const direction = D[L][Dir];
    const number = direction.number || D[L].number;

    return {
        active: true,
        service: false,
        line: number,
        color: lineColor(number),
        dest: direction.name,
        stops: direction.stops,
        index: I,
        no: stop.classList.contains("no-boarding")
    };
}

// ==================================================
// ODESLÁNÍ STAVU NA TABULI
// ==================================================

function send() {
    if (R !== "driver" || !C || !C.open) return;

    C.send({
        type: "state",
        s: state()
    });
}

// ==================================================
// VYKRESLENÍ DPMA2
// MAXIMÁLNĚ 5 ZASTÁVEK
// AKTUÁLNÍ ZASTÁVKA JE VŽDY PRVNÍ
// PROJETÉ ZASTÁVKY A FAJKY SE NEZOBRAZUJÍ
// ==================================================

function paint(s) {
    const lineEl = $("displayLine");
    const destinationEl = $("displayDestination");
    const stopsEl = $("displayStops");

    if (!s || !s.active) {
        lineEl.textContent = "--";
        lineEl.style.backgroundColor = "#20252b";

        display.style.setProperty("--line-color", "#A8D88A");

        destinationEl.textContent = "ČEKÁNÍ NA JÍZDU";

        stopsEl.innerHTML =
            '<div class="waiting">' +
            'ČEKÁNÍ NA DATA Z PALUBNÍHO POČÍTAČE' +
            '</div>';

        return;
    }

    const color = s.color || "#A8D88A";

    lineEl.textContent = s.line;
    lineEl.style.backgroundColor = color;
    display.style.setProperty("--line-color", color);

    destinationEl.textContent = s.dest;

    if (s.no) {
        stopsEl.innerHTML =
            '<div class="waiting" ' +
            'style="color:#ff3030;font-size:clamp(28px,5vw,52px);font-weight:900">' +
            'NENASTUPUJTE' +
            '</div>';

        return;
    }

    if (s.service) {
        stopsEl.innerHTML =
            '<div class="dstop current">' +
            '<span class="arrow"></span>' +
            '<span class="stoptext">Služební jízda</span>' +
            '</div>';

        return;
    }

    const stops = Array.isArray(s.stops) ? s.stops : [];

    if (stops.length === 0) {
        stopsEl.innerHTML = '<div class="waiting">ŽÁDNÉ ZASTÁVKY</div>';
        return;
    }

    const current = Math.max(
        0,
        Math.min(Number(s.index) || 0, stops.length - 1)
    );

    // Vykreslí se pouze aktuální zastávka a maximálně 4 následující.
    // Po stisknutí + přijde nový index a seznam se posune.
    const end = Math.min(current + 5, stops.length);
    let html = "";

    for (let i = current; i < end; i++) {
        const isCurrent = i === current;
        const className = isCurrent ? "dstop current" : "dstop";

        html +=
            '<div class="' + className + '">' +
            '<span class="arrow">' + (isCurrent ? "→" : "") + '</span>' +
            '<span class="stoptext">' +
            esc(stops[i]) +
            '</span>' +
            '</div>';
    }

    stopsEl.innerHTML = html;
}

// ==================================================
// BEZPEČNÉ VLOŽENÍ TEXTU
// ==================================================

function esc(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// ==================================================
// OVLÁDÁNÍ ŘIDIČSKÉHO POČÍTAČE
// ==================================================

$("choose").onclick = openCode;
$("new").onclick = openCode;
$("enter").onclick = load;
$("back").onclick = back;
$("plus").onclick = advance;

$("disconnectDriver").onclick = () => {
    if (C) {
        C.close();
        C = null;
    }

    $("driverStatus").textContent = "TABULE ODPOJENA";
};

$("input").oninput = () => {
    $("input").value = $("input").value
        .replace(/\D/g, "")
        .slice(0, 5);
};

$("input").onkeydown = event => {
    if (event.key === "Enter") {
        load();
    }
};

// Klávesové zkratky
document.addEventListener("keydown", event => {
    if (R !== "driver") return;

    if (event.key === "*" && !code.classList.contains("hidden")) {
        return;
    }

    if (event.key === "*") {
        event.preventDefault();
        openCode();
    }

    if (
        (event.key === "+" || event.code === "NumpadAdd") &&
        !route.classList.contains("hidden")
    ) {
        event.preventDefault();
        advance();
    }
});

// ==================================================
// ZADÁNÍ LINKY
// ==================================================

function openCode() {
    menu.classList.add("hidden");
    route.classList.add("hidden");
    code.classList.remove("hidden");

    msg.textContent = "";
    $("input").value = "";
    $("input").focus();
}

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

// ==================================================
// POTVRZENÍ KÓDU
// ==================================================

async function load() {
    try {
        await dataReady;
    } catch {
        msg.textContent = "Nepodařilo se načíst lines.json.";
        return;
    }

    const c = $("input").value.trim();
    msg.textContent = "";

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
        msg.textContent = "Linka nebo směr není v databázi.";
        return;
    }

    L = lineCode;
    Dir = directionCode;
    I = 0;
    serviceTrip = false;

    $("line").textContent = D[L].number || L;
    $("direction").textContent = D[L][Dir].name;

    menu.classList.add("hidden");
    code.classList.add("hidden");
    route.classList.remove("hidden");

    show();
}

// ==================================================
// AKTUALIZACE ŘIDIČSKÉ OBRAZOVKY
// ==================================================

function show() {
    if (serviceTrip || !L || !Dir) return;

    const stops = D[L][Dir].stops;

    stop.classList.remove("no-boarding");
    stop.textContent = stops[I];

    counter.textContent = `ZASTÁVKA ${I + 1} / ${stops.length}`;

    next.textContent =
        I < stops.length - 1
            ? stops[I + 1]
            : "KONEČNÁ ZASTÁVKA";

    send();
}

// ==================================================
// DALŠÍ ZASTÁVKA
// ==================================================

function advance() {
    if (serviceTrip || !L || !Dir) return;

    if (stop.classList.contains("no-boarding")) return;

    const stops = D[L][Dir].stops;

    if (I >= stops.length - 1) {
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

// ==================================================
// REŽIM CELÉ OBRAZOVKY – DPMA2
// ==================================================

const fullscreenButton = $("fullscreenButton");

if (fullscreenButton) {
    fullscreenButton.addEventListener("click", async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (error) {
            alert(
                "Celou obrazovku se nepodařilo zapnout. " +
                "Zkus to znovu nebo povol režim celé obrazovky."
            );
        }
    });
}

document.addEventListener("fullscreenchange", () => {
    const active = Boolean(document.fullscreenElement);

    document.body.classList.toggle("display-fullscreen", active);

    if (fullscreenButton) {
        fullscreenButton.textContent = active
            ? "⛶ UKONČIT CELOU OBRAZOVKU"
            : "⛶ CELÁ OBRAZOVKA";
    }
});
