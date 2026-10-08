
/*
 * Carrier List — renderização automática
 *
 * Arquivos necessários:
 *   levels.json
 *   points.json
 *   thumbs/
 *
 * Main: #1–#50
 * Extended: #51–#100
 */

const DATA_FILES = {
    levels: "levels.json",
    points: "points.json"
};

const LISTS = {
    main: {
        containerId: "mainList"
    },
    extended: {
        containerId: "extendedList"
    },
    legacy: {
        containerId: "legacyList"
    }
};

// Busca a pontuação exata da posição na tabela points.json.
function getPointForRank(pointsTable, rank) {
    if (Array.isArray(pointsTable)) {
        return pointsTable[rank - 1];
    }

    return pointsTable[String(rank)];
}

// Mantém o texto da pontuação exatamente como está no JSON.
function formatPoints(value) {
    if (value === undefined || value === null || value === "") {
        return "";
    }

    if (typeof value === "string") {
        return value;
    }

    return `${value} pontos (100%)`;
}

// Cria o card de um nível.
function makeLevelCard(level, rank, pointsValue) {
    const card = document.createElement("article");
    card.className = "card";

    if (level.new) {
        card.classList.add("new");
    }

    const image = document.createElement("img");
    image.className = "level-thumb";
    image.alt = `Thumbnail de ${level.name || "nível"}`;
    image.loading = "lazy";

    if (level.image) {
        image.src = `thumbs/${level.image}`;
    }

    image.addEventListener("error", () => {
        image.classList.add("image-missing");
        image.alt = `Imagem não encontrada: ${level.image || "sem imagem"}`;
    }, { once: true });

    const info = document.createElement("div");
    info.className = "info";

    const title = document.createElement("h2");
    title.append(
        document.createTextNode(`#${rank} – ${level.name || "Sem nome"}`)
    );

    if (level.new) {
        const badge = document.createElement("span");
        badge.className = "badge-new";
        badge.textContent = "NOVO";

        title.append(document.createTextNode(" "), badge);
    }

    const creator = document.createElement("p");
    creator.textContent = `by ${level.creator || "Desconhecido"}`;

    info.append(title, creator);

    if (pointsValue !== undefined && pointsValue !== null && pointsValue !== "") {
        const points = document.createElement("span");
        points.className = "points";
        points.textContent = formatPoints(pointsValue);

        info.append(points);
    }

    card.append(image, info);

    return card;
}

// Renderiza uma lista apenas se o contêiner existir nesta página.
function renderList(levels, pointsTable, listName) {
    const config = LISTS[listName];
    const container = document.getElementById(config.containerId);

    if (!container) {
        return;
    }

    const listLevels = levels.filter(
        level => level.list === listName
    );

    const fragment = document.createDocumentFragment();

    listLevels.forEach((level, index) => {
        let rank;

        if (Number.isInteger(level.rank)) {
            rank = level.rank;
        } else if (listName === "extended") {
            rank = 51 + index;
        } else {
            rank = index + 1;
        }

        const pointsValue = listName === "legacy"
            ? undefined
            : getPointForRank(pointsTable, rank);

        fragment.append(
            makeLevelCard(level, rank, pointsValue)
        );
    });

    container.replaceChildren(fragment);

    const countElement = document.getElementById(`count-${listName}`);

    if (countElement) {
        countElement.textContent = String(listLevels.length);
    }
}

// Pesquisa por nome, criador ou texto do card.
function setupSearch() {
    const searchInput = document.getElementById("searchInput");

    if (!searchInput) {
        return;
    }

    searchInput.addEventListener("input", () => {
        const query = searchInput.value
            .trim()
            .toLocaleLowerCase("pt-BR");

        document.querySelectorAll(".card").forEach(card => {
            const matches = card.textContent
                .toLocaleLowerCase("pt-BR")
                .includes(query);

            card.hidden = !matches;
        });
    });
}

// Exibe uma mensagem se os arquivos JSON não carregarem.
function showLoadError(error) {
    console.error("Erro ao carregar a Carrier List:", error);

    const container =
        document.getElementById("mainList") ||
        document.getElementById("extendedList") ||
        document.getElementById("legacyList");

    if (!container) {
        return;
    }

    const message = document.createElement("p");

    message.className = "load-error";
    message.textContent =
        "Não foi possível carregar a lista. Confira se levels.json e points.json estão na pasta correta e abra o site por um servidor local.";

    container.replaceChildren(message);
}

// Carrega os dois JSON e constrói as listas.
async function loadCarrierList() {
    try {
        const [levelsResponse, pointsResponse] = await Promise.all([
            fetch(DATA_FILES.levels),
            fetch(DATA_FILES.points)
        ]);

        if (!levelsResponse.ok) {
            throw new Error(
                `Falha ao carregar levels.json: HTTP ${levelsResponse.status}`
            );
        }

        if (!pointsResponse.ok) {
            throw new Error(
                `Falha ao carregar points.json: HTTP ${pointsResponse.status}`
            );
        }

        const [levels, pointsTable] = await Promise.all([
            levelsResponse.json(),
            pointsResponse.json()
        ]);

        if (!Array.isArray(levels)) {
            throw new TypeError(
                "levels.json precisa conter uma lista de níveis."
            );
        }

        renderList(levels, pointsTable, "main");
        renderList(levels, pointsTable, "extended");
        renderList(levels, pointsTable, "legacy");

        const totalElement = document.getElementById("count-total");

        if (totalElement) {
            totalElement.textContent = String(
                levels.filter(level => level.list !== "legacy").length
            );
        }

        setupSearch();

    } catch (error) {
        showLoadError(error);
    }
}

loadCarrierList();