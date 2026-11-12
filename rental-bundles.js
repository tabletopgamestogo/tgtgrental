// rental-bundles.js — renders every Rental Bundle (Occasion/Category/Player
// Type/Themed/Fandom) as a real, checkable section of the page: resolves
// each game label against the live catalog (board-games-data.js) for its
// price/category/duration, builds the HTML, and wires up the Personal/
// Corporate toggle, the "Book this bundle" min-3 counters, and localStorage
// persistence so a client's ticks survive a reload.
(function () {
  const BOARD_GAMES = BoardGamesData.BOARD_GAMES;
  const CATEGORY_COLORS = BoardGamesData.CATEGORY_COLORS;
  const PKG = RentalBundlesData;

  // Games solely owned by Arce — not part of TGTG's own rentable stock, so
  // they're shown greyed out and un-tickable rather than left off the list
  // entirely (clients can still see what the bundle would normally include).
  // Kept here rather than as a field on board-games-data.js's catalog entries
  // since that file is resynced from the source sheet independently.
  const UNAVAILABLE_GAMES = new Set([
    "Azul (Mini)",
    "Batam",
    "Cover Your Assets",
    "Dixit: Disney Edition",
    "Get Bit",
    "GokYeSa: The Flying Artist",
    "Hanabi",
    "Harmonies",
    "Magical Athlete",
    "Monopoly: Animal Crossing-New Horizons",
    "Monopoly: Game of Thrones Edition",
    "Munchkin Harry Potter",
    "Orapa Mine",
    "Saboteur",
    "Scout",
    "Sea Salt and Paper",
    "Splendor + The Sun Never Sets",
    "Taco Cat Goat Cheese Pizza",
    "The Crew: Quest for Planet Nine",
    "Trio",
    "Uno: Show 'Em No Mercy",
  ]);

  const DURATION_COLORS = {
    Light: { bg: "#4FB477", fg: "#12241A" },
    Medium: { bg: "#F4A259", fg: "#1A1220" },
    Heavy: { bg: "#E6394A", fg: "#F7F1E6" },
  };
  const PTYPE_COLORS = {
    "The Architects": { bg: "#9B5DE5", fg: "#F7F1E6" },
    "The Conquerors": { bg: "#E6394A", fg: "#F7F1E6" },
    "The Dreamweavers": { bg: "#4FB477", fg: "#12241A" },
    "The Connectors": { bg: "#FFD23F", fg: "#1A1220" },
  };
  // Category/Player-Type bundle titles -> the real catalog key whose color
  // that bundle's bar should borrow, so a bundle's bar always matches the
  // same color used for that category/archetype everywhere else on the site.
  const CATEGORY_TITLE_MAP = {
    "Party & Group Fun": "Party & Group Fun",
    "Unmatched Category Arena": "Unmatched Battle Arena",
    "Family & Accessible Strategy": "Family & Accessible Strategy",
    "Quick Card Table": "Quick Card & Tabletop Fillers",
    "Cooperative Missions": "Cooperative Missions",
    "Strategy Showcase (By Category)": "Strategy Showcase",
    "Bluffing & Social Deduction": "Bluffing & Social Deduction",
  };
  const PLAYER_TYPE_TITLE_MAP = {
    "Architects Table": "The Architects",
    "Connectors Night": "The Connectors",
    "Conquerors Arena": "The Conquerors",
    "Dreamweavers Table": "The Dreamweavers",
  };
  // Bar color for bundles with no inherent category/archetype color (Occasion,
  // Themed, Fandom) — a muted plum rather than the vivid quiz-archetype
  // purple (PTYPE_COLORS["The Architects"]), so it doesn't compete with or
  // get mistaken for that specific color-coded meaning.
  const NEUTRAL_BAR = { bg: "#5D4178", fg: "#F7F1E6" };

  const CATALOG_BY_NAME = {};
  BOARD_GAMES.forEach((g) => { CATALOG_BY_NAME[g.name.toLowerCase()] = g; });

  // ---- alias map: bundle-doc label -> catalog game name ----
  const ALIASES = {
    "spot it": ["Spot it"],
    "spot it (any)": ["Spot it"],
    "spot it (any / mario / friends / harry potter)": ["Spot it"],
    "spot it (base)": ["Spot it"],
    "spot it: harry potter": ["Spot it - HP"],
    "spot it hp": ["Spot it - HP"],
    "spot it: mario": ["Spot it - Mario"],
    "spot it mario": ["Spot it - Mario"],
    "spot it: friends": ["Spot it - Friends"],
    "spot it friends": ["Spot it - Friends"],
    "deep sea": ["Deep Sea underwater"],
    "wingspan": ["Wingspan "],
    "horrified: universal monsters": ["Horrified : Universal Monsters"],
    "horrified universal monsters": ["Horrified : Universal Monsters"],
    "horrified": ["Horrified : Universal Monsters"],
    "dixit (+ quest)": ["Dixit + Quest Expansion"],
    "dixit + quest expansion": ["Dixit + Quest Expansion"],
    "dixit + quest": ["Dixit + Quest Expansion"],
    "dixit": ["Dixit + Quest Expansion"],
    "flip 7 (any edition)": ["Flip 7"],
    "flip 7 (any)": ["Flip 7"],
    "flip 7": ["Flip 7"],
    "coup (+ reformation)": ["Coup + Coup Reformation"],
    "coup": ["Coup + Coup Reformation"],
    "the resistance: avalon": ["The Resistance: Avalon"],
    "the resistance: avalon (5+ players)": ["The Resistance: Avalon"],
    "avalon": ["The Resistance: Avalon"],
    "avalon as “houses & secrets” (adults)": ["The Resistance: Avalon"],
    "cash 'n guns live (large groups)": ["Cash 'n Guns Live"],
    "cash 'n guns live": ["Cash 'n Guns Live"],
    "cash ’n guns live": ["Cash 'n Guns Live"],
    "5 minute dungeon (+ expansion)": ["5 minute Dungeon + Expansion"],
    "5 minute dungeon + expansion": ["5 minute Dungeon + Expansion"],
    "5 minute dungeon": ["5 minute Dungeon + Expansion"],
    "sky team + sky team turbulence (2p note)": ["Sky Team + Sky Team Turbulence"],
    "sky team + sky team turbulence (2p)": ["Sky Team + Sky Team Turbulence"],
    "sky team + sky team turbulence": ["Sky Team + Sky Team Turbulence"],
    "sky team + turbulence": ["Sky Team + Sky Team Turbulence"],
    "sky team": ["Sky Team + Sky Team Turbulence"],
    "the lord of the rings the fellowship of the ring trick-taking game": ["The Lord of the Rings The Fellowship of the Ring Trick-Taking Game"],
    "lotr fellowship trick-taking": ["The Lord of the Rings The Fellowship of the Ring Trick-Taking Game"],
    "lotr trick-taking": ["The Lord of the Rings The Fellowship of the Ring Trick-Taking Game"],
    "splendor (any: base / sun never sets / pokémon)": ["Splendor"],
    "splendor (any)": ["Splendor"],
    "splendor (base / sun never sets)": ["Splendor"],
    "splendor": ["Splendor"],
    "splendor: pokémon": ["Splendor Pokemon"],
    "splendor pokémon": ["Splendor Pokemon"],
    "unmatched (any set — all listed at 40 min)": ["Unmatched COBBLE AND FOG"],
    "unmatched (any set)": ["Unmatched COBBLE AND FOG"],
    "unmatched — surprise me (any set, picked for you)": ["Unmatched COBBLE AND FOG"],
    "unmatched (fantasy / legends sets)": ["Unmatched Battle of Legends Vol.1"],
    "unmatched (any combat set)": ["Unmatched COBBLE AND FOG"],
    "unmatched — cobble and fog": ["Unmatched COBBLE AND FOG"],
    "unmatched cobble and fog": ["Unmatched COBBLE AND FOG"],
    "unmatched tmnt with shredder and krang": ["Unmatched TMNT WITH SHREDDER AND KRANG"],
    "unmatched tmnt": ["Unmatched TMNT WITH SHREDDER AND KRANG"],
    "unmatched battle of legends (any vol.)": ["Unmatched Battle of Legends Vol.1"],
    "unmatched legends vol.1": ["Unmatched Battle of Legends Vol.1"],
    "cards against humanity (family edition)": ["Cards Against Humanity Family Edition"],
    "cah family": ["Cards Against Humanity Family Edition"],
    "cah": ["Cards Against Humanity Family Edition"],
    "cah (unless adult-only booking)": ["Cards Against Humanity Family Edition"],
    "dixit: disney edition": ["Dixit: Disney Edition"],
    "dixit disney": ["Dixit: Disney Edition"],
    "monopoly: animal crossing — new horizons": ["Monopoly: Animal Crossing-New Horizons"],
    "monopoly: animal crossing-new horizons": ["Monopoly: Animal Crossing-New Horizons"],
    "monopoly animal crossing": ["Monopoly: Animal Crossing-New Horizons"],
    "animal crossing monopoly": ["Monopoly: Animal Crossing-New Horizons"],
    "monopoly: game of thrones edition": ["Monopoly: Game of Thrones Edition"],
    "monopoly: game of thrones": ["Monopoly: Game of Thrones Edition"],
    "monopoly got": ["Monopoly: Game of Thrones Edition"],
    "monopoly: got": ["Monopoly: Game of Thrones Edition"],
    "catan (heavier pick)": ["Catan"],
    "catan (settle the realm)": ["Catan"],
    "the quacks of quedlinburg": ["Quacks"],
    "quacks of quedlinburg": ["Quacks"],
    "slay the spire: the board game": ["Slay the Spire"],
    "slay the spire (the board game)": ["Slay the Spire"],
    "sea salt and paper": ["Sea Salt and Paper"],
    "selfish dungeon": ["Selfish: Dungeon Edition"],
    "selfish": ["Selfish: Dungeon Edition"],
    "taco cat…": ["Taco Cat Goat Cheese Pizza"],
    "spirit island (optional heavy — island spirits vs invaders)": ["Spirit Island"],
    "spirit island (optional heavy — defend the land)": ["Spirit Island"],
    "spirit island (dreamweaver co-op / spirit power fantasy)": ["Spirit Island"],
    "spirit island (optional heavy — defend the island)": ["Spirit Island"],
    "spirit island (too heavy/intense for cute promise)": ["Spirit Island"],
    "pandemic (unless “save the city” co-op with pandemic as main)": ["Pandemic"],
    "avalon (unless adults-only late night)": ["The Resistance: Avalon"],
    "avalon (unless “who is the carrier” spicy variant)": ["The Resistance: Avalon"],
    "love letter (older students only)": ["Love Letter"],
    "dixit (+ quest) as “divination vibes”": ["Dixit + Quest Expansion"],
    "unmatched — surprise me (any set, picked for you)2": ["Unmatched COBBLE AND FOG"],
  };

  function stripAnnotations(label) {
    return label.replace(/\s*\([^)]*\)\s*$/g, "").trim();
  }
  function resolveGame(label) {
    const key = label.toLowerCase().trim();
    if (ALIASES[key]) return CATALOG_BY_NAME[ALIASES[key][0].toLowerCase()];
    if (CATALOG_BY_NAME[key]) return CATALOG_BY_NAME[key];
    const stripped = stripAnnotations(label).toLowerCase();
    if (ALIASES[stripped]) return CATALOG_BY_NAME[ALIASES[stripped][0].toLowerCase()];
    if (CATALOG_BY_NAME[stripped]) return CATALOG_BY_NAME[stripped];
    return null;
  }

  // ---------- small helpers ----------
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const slug = (s) => String(s).replace(/[^\w]+/g, "_");
  function formatPeso(n) { return "₱" + Number(n).toLocaleString("en-PH"); }
  function swatch(color) { return `<span class="sw" style="background:${color}"></span>`; }

  // ---------- rendering ----------
  function gameRow(label, bundleId, variant) {
    const game = resolveGame(label);
    const id = variant + "__" + bundleId + "__g_" + slug(label);
    if (!game) {
      // Must carry the same bundle-game-cb class as a resolved row — it's
      // what the min-3 counter, the clear-on-uncheck logic, and the saved
      // PDF all key off of. Missing it here meant an unresolved game ("no
      // catalog match", rendered as a "—" placeholder row) was tickable but
      // invisible to all three: it never counted, never got swept when the
      // bundle checkbox was unchecked, and never showed up in the PDF.
      return `<tr><td class="cb"><input type="checkbox" id="${id}" class="bundle-game-cb" data-bundle="${esc(bundleId)}"></td><td class="g-name"><label for="${id}">${esc(label)}</label></td><td colspan="8" class="muted">—</td></tr>`;
    }
    const unavailable = UNAVAILABLE_GAMES.has(game.name);
    if (unavailable) {
      return `<tr class="row-unavailable">
        <td class="cb"><input type="checkbox" id="${id}" class="bundle-game-cb" data-bundle="${esc(bundleId)}" disabled></td>
        <td class="g-name"><label for="${id}">${esc(label)}</label></td>
        <td colspan="7" class="unavailable-cell">Unavailable as of the moment</td>
      </tr>`;
    }
    const cc = CATEGORY_COLORS[game.category] || { bg: "#8C7FA0" };
    const dc = DURATION_COLORS[game.tgtgDuration] || { bg: "#8C7FA0" };
    const pc = PTYPE_COLORS[game.playerType] || { bg: "#8C7FA0" };
    const hasRate = game.d1 > 0 || game.d2 > 0 || game.d3 > 0;
    const rateCells = hasRate
      ? `<td class="g-price">${formatPeso(game.d1)}</td><td class="g-price">${formatPeso(game.d2)}</td><td class="g-price">${formatPeso(game.d3)}</td>`
      : `<td colspan="3" class="quote-cell">Ask for quote</td>`;
    return `<tr>
      <td class="cb"><input type="checkbox" id="${id}" class="bundle-game-cb" data-bundle="${esc(bundleId)}"></td>
      <td class="g-name"><label for="${id}">${esc(label)}</label></td>
      <td class="g-players">${esc(game.players || "—")}</td>
      <td class="g-cat">${swatch(cc.bg)}${esc(game.category)}</td>
      <td class="g-ptype">${swatch(pc.bg)}${esc((game.playerType || "—").replace("The ", ""))}</td>
      <td class="g-mech">${esc(game.primaryMechanic || "—")}</td>
      <td class="g-dur">${swatch(dc.bg)}${esc(game.tgtgDuration || "—")}</td>
      ${rateCells}
    </tr>`;
  }

  function gameTable(title, labelList, bundleId, variant) {
    if (!labelList || !labelList.length) return "";
    // A catch-all label ("Unmatched (any set)", "...Surprise Me...") can
    // resolve to the same catalog game as a specific title already listed
    // elsewhere in the same array — skip the repeat so it doesn't render
    // (and count toward the min-3 picker) twice.
    const seen = new Set();
    const dedupedList = labelList.filter((l) => {
      const game = resolveGame(l);
      if (!game) return true;
      if (seen.has(game.name)) return false;
      seen.add(game.name);
      return true;
    });
    const rows = dedupedList.map((l) => gameRow(l, bundleId, variant)).join("");
    return `
      <div class="tbl-label">${esc(title)}</div>
      <div class="gtable-wrap"><table class="gtable">
        <thead><tr><th></th><th>Game</th><th>Players</th><th>Category</th><th>Player Type</th><th>Mechanic</th><th>Duration</th><th>1-Day</th><th>2-Day</th><th>3-Day</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>`;
  }

  function textLine(label, list, cls) {
    if (!list || !list.length) return "";
    return `<p class="${cls || "line-also"}"><strong>${esc(label)}:</strong> ${list.map(esc).join(" · ")}</p>`;
  }
  function notesBlock(notes) {
    if (!notes || !notes.length) return "";
    return `<ul class="notes">${notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>`;
  }
  function kitLine(kit) {
    const lights = (kit.lights || []).join(", ");
    return `<div class="kit-line"><strong>${esc(kit.size)}</strong> — Main: ${esc(kit.main)}${lights ? `; Lights: ${esc(lights)}` : ""}</div>`;
  }
  function kitsBlock(kits) {
    if (!kits || !kits.length) return "";
    return `<div class="kits">${kits.map(kitLine).join("")}</div>`;
  }

  function barColorFor(pkg, sectionKey) {
    if (sectionKey === "B" && CATEGORY_TITLE_MAP[pkg.title]) {
      const c = CATEGORY_COLORS[CATEGORY_TITLE_MAP[pkg.title]];
      return { bg: c.bg, fg: c.fg };
    }
    if (sectionKey === "C" && PLAYER_TYPE_TITLE_MAP[pkg.title]) {
      return PTYPE_COLORS[PLAYER_TYPE_TITLE_MAP[pkg.title]];
    }
    return NEUTRAL_BAR;
  }

  function packageBlock(pkg, sectionKey, variant, isAddon) {
    const bar = isAddon ? NEUTRAL_BAR : barColorFor(pkg, sectionKey);
    const displayTitle = (!isAddon && variant === "corporate" && pkg.corporateTitle) ? pkg.corporateTitle : pkg.title;
    const displayTags = (!isAddon && variant === "corporate" && pkg.corporateTags) ? pkg.corporateTags : pkg.tags;
    const bundleId = isAddon ? slug(pkg.title) : (sectionKey + "_" + (pkg.id || pkg.title)).replace(/[^\w]+/g, "_");
    const bundleCbId = variant + "__" + bundleId;
    const barStyle = isAddon
      ? `background:${bar.bg};color:${bar.fg};border-left:5px solid var(--red);`
      : `background:${bar.bg};color:${bar.fg};`;
    let out = `<details class="pkg-card${isAddon ? " pkg-addon" : ""}">
      <summary class="pkg-bar" style="${barStyle}">
        <label class="pkg-check" onclick="event.stopPropagation()">
          <input type="checkbox" id="${bundleCbId}" class="bundle-cb" data-bundle="${esc(bundleId)}" data-variant="${variant}">
          <span class="pkg-check-txt">Book this bundle<br><small>(min. 3 games)</small></span>
        </label>
        <span class="pkg-title">${pkg.id ? `${esc(pkg.id)}. ` : ""}${esc(displayTitle)}</span>
        <span class="pkg-tags">${esc(displayTags)}</span>
        <span class="pkg-bar-end">
          <span class="pkg-count" data-count-for="${esc(bundleId)}">0 picked</span>
          <span class="chev" aria-hidden="true">▾</span>
        </span>
      </summary>
      <div class="pkg-body">`;
    if (pkg.pitch) out += `<p class="pkg-pitch">${esc(pkg.pitch)}</p>`;
    out += `
        ${gameTable("Mains", pkg.mains, bundleId, variant)}
        ${textLine("Also good mains", pkg.alsoMains)}
        ${gameTable("Lights", pkg.lights, bundleId, variant)}
        ${textLine("Also good Lights", pkg.alsoLights)}
        ${textLine("Avoid in this box", pkg.avoid, "line-avoid")}
        ${notesBlock(pkg.notes)}
        ${kitsBlock(pkg.kits)}
        ${pkg.note ? `<p class="pkg-note">${esc(pkg.note)}</p>` : ""}
      </div>
    </details>`;
    return out;
  }

  function sectionHTML(id, letter, title, intro, cards) {
    return `<section class="bundle-section" id="${id}">
      <div class="section-head"><h2>${esc(letter)}. ${esc(title)}</h2><p>${intro}</p></div>
      ${cards}
    </section>`;
  }

  function renderVariant(variant) {
    const occasionCards = PKG.OCCASION.map((p) => packageBlock(p, "A", variant) + (p.addon ? packageBlock(p.addon, "A", variant, true) : "")).join("");
    const categoryCards = PKG.CATEGORY.map((p) => packageBlock(p, "B", variant)).join("");
    const playerTypeCards = PKG.PLAYER_TYPE.map((p) => packageBlock(p, "C", variant)).join("");
    const targetedCards = PKG.TARGETED.map((p) => packageBlock(p, "D", variant) + (p.addon ? packageBlock(p.addon, "D", variant, true) : "")).join("");
    const fandomCards = PKG.FANDOM.map((p) => packageBlock(p, "E", variant)).join("");
    const mechanicCards = (PKG.MECHANIC || []).map((p) => packageBlock(p, "F", variant)).join("");

    const gm = variant === "corporate"
      ? "every bundle below is run by a Game Master as standard"
      : "a Game Master is optional — add one when you book";
    const gmIntro = variant === "corporate"
      ? "A Game Master is included with every corporate/organization booking — their fee is billed separately and added to your total, based on how many hours you book them for:"
      : "Want someone to teach and run the games for you? A Game Master is a paid add-on, billed separately from the game rental, based on how many hours you book them for:";

    return `
    <p class="tab-intro">Tick the Mains and Lights you want${variant === "corporate" ? " for your office or organization event" : " for your date night, birthday, or barkada session"} — your picks are saved in this browser so you can come back to them. ${variant === "corporate" ? "<strong>Every corporate booking includes a Game Master.</strong>" : ""}</p>

    <div class="legend-box">
      <h3>How Bundles Work</h3>
      <p>We suggest a spine of one Main game plus Light fillers to match your rental length:</p>
      <ul class="rlen-list"><li><strong>1 Day</strong> = 1 main + 3 Lights</li><li><strong>2 Days</strong> = 1 main + 5 Lights</li><li><strong>3 Days</strong> = 1 main + 7 Lights</li></ul>
      <p class="muted-note">"Also good" titles are solid swaps if your first pick is unavailable; "Avoid" lists are hard filters for themed boxes only. Every row's Category, Player Type, Duration, and rate is pulled live from our individual game catalog, and ${gm}.</p>
      <p class="muted-note">Each bundle's title bar has its own checkbox — tick it to book that bundle as a set, which means choosing at least 3 games total (Mains + Lights combined) from underneath it. The counter on the right tracks your picks live.</p>
    </div>

    <nav class="quicknav">
      <a href="#${variant}-sec-a">A. Occasion</a>
      <a href="#${variant}-sec-b">B. Category</a>
      <a href="#${variant}-sec-c">C. Player Type</a>
      <a href="#${variant}-sec-d">D. Themed</a>
      <a href="#${variant}-sec-e">E. Fandom</a>
      <a href="#${variant}-sec-f">F. Mechanic</a>
      <button type="button" class="clear-btn" data-clear="${variant}">Clear my picks</button>
    </nav>

    ${sectionHTML(`${variant}-sec-a`, "A", "By Occasion", "Pick one Main, then fill with Lights to match your rental length.", occasionCards)}
    ${sectionHTML(`${variant}-sec-b`, "B", "By Category", "One bundle per inventory Category — bar color matches that Category's real color everywhere else on the site.", categoryCards)}
    ${sectionHTML(`${variant}-sec-c`, "C", "By Player Type", "One bundle per quiz archetype — bar color matches each archetype's color from the quiz.", playerTypeCards)}
    ${sectionHTML(`${variant}-sec-d`, "D", "Themed Bundles", "Seasonal boxes with hard filters — Traitors ≠ Cute never mix.", targetedCards)}
    ${sectionHTML(`${variant}-sec-e`, "E", "Fandom &amp; Movie-Style Themes", "Built from titles actually in stock — where we don't own a heavy licensed game, we use the closest vibe.", fandomCards)}
    ${sectionHTML(`${variant}-sec-f`, "F", "By Primary Mechanic", "One bundle per shelf mechanic — picks here can overlap the other spines above.", mechanicCards)}

    <div class="legend-box gm-fees-box">
      <h3>Game Master Fees <span class="muted-note" style="display:inline;">(for your reference)</span></h3>
      <p class="muted-note" style="margin-bottom:10px;">${gmIntro}</p>
      <div class="gtable-wrap"><table class="gmtable">
        <thead><tr><th>Session Length</th><th>Fee</th></tr></thead>
        <tbody>
          <tr><td>2 hours</td><td>${formatPeso(2000)}</td></tr>
          <tr><td>3 hours</td><td>${formatPeso(2750)}</td></tr>
          <tr><td>4 hours</td><td>${formatPeso(3250)}</td></tr>
          <tr><td>5+ hours (planned)</td><td>${formatPeso(3250)} + ${formatPeso(750)}/additional hour</td></tr>
          <tr><td>Unplanned overtime</td><td>+${formatPeso(1000)}/hour beyond your booked GM time</td></tr>
        </tbody>
      </table></div>
      <p class="muted-note">GM session length is booked separately from your game rental length (1/2/3 Day) — it covers the hours the GM is actively teaching and running your table.</p>
    </div>`;
  }

  // ---------- confirm modal ----------
  // A real Yes/No modal (native confirm() can't relabel its buttons) — one
  // overlay built on demand and reused rather than created per call.
  let confirmOverlay = null;
  function showConfirmModal(message, yesLabel, noLabel) {
    return new Promise((resolve) => {
      if (!confirmOverlay) {
        confirmOverlay = document.createElement("div");
        confirmOverlay.className = "confirm-overlay";
        confirmOverlay.innerHTML = '<div class="confirm-card"><p class="confirm-msg"></p><div class="confirm-btns">'
          + '<button type="button" class="confirm-no"></button><button type="button" class="confirm-yes"></button>'
          + "</div></div>";
        document.body.appendChild(confirmOverlay);
      }
      confirmOverlay.querySelector(".confirm-msg").textContent = message;
      const yesBtn = confirmOverlay.querySelector(".confirm-yes");
      const noBtn = confirmOverlay.querySelector(".confirm-no");
      yesBtn.textContent = yesLabel;
      noBtn.textContent = noLabel;
      confirmOverlay.style.display = "flex";
      function close(result) {
        confirmOverlay.style.display = "none";
        yesBtn.onclick = null; noBtn.onclick = null; confirmOverlay.onclick = null;
        resolve(result);
      }
      yesBtn.onclick = () => close(true);
      noBtn.onclick = () => close(false);
      confirmOverlay.onclick = (e) => { if (e.target === confirmOverlay) close(false); };
    });
  }

  // A single-button "here's what's missing" popup — message plus an
  // optional bulleted list of specific issues, used to explain why Save
  // didn't go through instead of just silently refusing.
  let alertOverlay = null;
  function showAlertModal(message, issues) {
    return new Promise((resolve) => {
      if (!alertOverlay) {
        alertOverlay = document.createElement("div");
        alertOverlay.className = "confirm-overlay";
        alertOverlay.innerHTML = '<div class="confirm-card"><p class="confirm-msg"></p><ul class="alert-list"></ul><div class="confirm-btns">'
          + '<button type="button" class="confirm-yes alert-ok"></button>'
          + "</div></div>";
        document.body.appendChild(alertOverlay);
      }
      alertOverlay.querySelector(".confirm-msg").textContent = message;
      const list = alertOverlay.querySelector(".alert-list");
      list.innerHTML = "";
      if (issues && issues.length) {
        issues.forEach((i) => {
          const li = document.createElement("li");
          li.textContent = i;
          list.appendChild(li);
        });
        list.style.display = "block";
      } else {
        list.style.display = "none";
      }
      const okBtn = alertOverlay.querySelector(".alert-ok");
      okBtn.textContent = "OK, got it";
      alertOverlay.style.display = "flex";
      function close() {
        alertOverlay.style.display = "none";
        okBtn.onclick = null; alertOverlay.onclick = null;
        resolve();
      }
      okBtn.onclick = close;
      alertOverlay.onclick = (e) => { if (e.target === alertOverlay) close(); };
    });
  }

  // ---------- persistence ----------
  const STORAGE_PREFIX = "tgtg_bundles_";
  function loadChecked(input) {
    try {
      return localStorage.getItem(STORAGE_PREFIX + input.id) === "1";
    } catch (e) { return false; }
  }
  function saveChecked(input) {
    try {
      if (input.checked) localStorage.setItem(STORAGE_PREFIX + input.id, "1");
      else localStorage.removeItem(STORAGE_PREFIX + input.id);
    } catch (e) { /* storage unavailable (private mode, quota) — selections just won't persist */ }
  }

  // "Your Details" fields (Full Name/Org/Contact/Date/Attendees, Rental
  // Length) live outside #bundles-root as static markup
  // in each page, since they're fixed fields, not generated from PKG data.
  // Their storage keys are variant-prefixed — "field-date" and the rental
  // length radios share the same element ids on both pages, and without the
  // variant prefix a value typed on the Personal page would leak into the
  // Corporate page's fields (same localStorage, same origin).
  function detailsKey(variant, id) { return STORAGE_PREFIX + variant + "__" + id; }

  // Rentals need at least 2 days' lead time — the date picker simply can't
  // select anything earlier, rather than relying on a client to notice a
  // text hint and self-police it.
  function minRentalDateISO() {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function formatDateNice(iso) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-").map(Number);
    if (!y || !m || !d) return iso;
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
  }

  // Windows/macOS both forbid <>:"/\|?* in filenames — strip those plus any
  // stray whitespace runs (e.g. from the "3+ Days (needs PM to discuss)"
  // parenthetical, which this also trims off entirely since it's too long
  // for a filename component).
  function sanitizeFilenamePart(s) {
    return String(s || "")
      .split("(")[0]
      .replace(/[<>:"/\\|?*]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  // The Rental Desk reads these names back when an order PDF is imported, so
  // keep the shape: TGTGCO-[org]-[contact]-[date]-[length] /
  // TGTGPO-[full name]-[date]-[length] (date is yyyy-mm-dd).
  function buildPdfFilename(variant, details) {
    const date = sanitizeFilenamePart(details.date);
    const length = sanitizeFilenamePart(details.rentalLength);
    const parts = variant === "corporate"
      ? [sanitizeFilenamePart(details.orgName), sanitizeFilenamePart(details.contact), date, length]
      : [sanitizeFilenamePart(details.fullName), date, length];
    const prefix = variant === "corporate" ? "TGTGCO" : "TGTGPO";
    return `${prefix}-${parts.join("-")}.pdf`;
  }

  // These three feed straight into the saved PDF's hyphen-joined filename
  // (see buildPdfFilename) and the Rental Desk's filename parser splits on
  // hyphens to recover them — a dash in the value itself would corrupt that.
  const NO_DASH_FIELD_IDS = ["field-orgname", "field-contact", "field-fullname"];

  function bindDetailsFields(container, variant) {
    if (!container) return;
    const dateInput = container.querySelector("#field-date");
    if (dateInput) dateInput.min = minRentalDateISO();
    container.querySelectorAll('input[type="text"], input[type="date"]').forEach((input) => {
      try {
        const v = localStorage.getItem(detailsKey(variant, input.id));
        if (v !== null) input.value = v;
      } catch (e) { /* ignore */ }
      input.addEventListener("input", () => {
        if (NO_DASH_FIELD_IDS.includes(input.id) && input.value.includes("-")) {
          const pos = input.selectionStart - (input.value.slice(0, input.selectionStart).match(/-/g) || []).length;
          input.value = input.value.replace(/-/g, "");
          input.setSelectionRange(pos, pos);
        }
        try { localStorage.setItem(detailsKey(variant, input.id), input.value); } catch (e) { /* ignore */ }
      });
    });
    container.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach((input) => {
      try { input.checked = localStorage.getItem(detailsKey(variant, input.id)) === "1"; } catch (e) { /* ignore */ }
      input.addEventListener("change", () => {
        try {
          if (input.type === "radio") {
            container.querySelectorAll(`input[type="radio"][name="${input.name}"]`).forEach((r) => {
              localStorage.removeItem(detailsKey(variant, r.id));
            });
          }
          if (input.checked) localStorage.setItem(detailsKey(variant, input.id), "1");
          else localStorage.removeItem(detailsKey(variant, input.id));
        } catch (e) { /* ignore */ }
      });
    });
  }

  function collectDetails(container, variant) {
    if (!container) return {};
    const get = (id) => { const el = container.querySelector("#" + id); return el ? el.value.trim() : ""; };
    const checked = (id) => { const el = container.querySelector("#" + id); return !!(el && el.checked); };
    let rentalLength = "";
    [["rl-1day", "1 Day"], ["rl-2days", "2 Days"], ["rl-3days", "3 Days"], ["rl-3plus", "3+ Days (needs PM to discuss)"]].forEach(([id, label]) => {
      if (checked(id)) rentalLength = label;
    });
    if (variant === "corporate") {
      return {
        orgName: get("field-orgname"),
        contact: get("field-contact"),
        date: get("field-date"),
        attendees: get("field-attendees"),
        rentalLength,
      };
    }
    return {
      fullName: get("field-fullname"),
      date: get("field-date"),
      rentalLength,
    };
  }

  function updateCount(bundleId, root) {
    const boxes = root.querySelectorAll(`input.bundle-game-cb[data-bundle="${CSS.escape(bundleId)}"]`);
    let n = 0;
    boxes.forEach((b) => { if (b.checked) n++; });
    const badge = root.querySelector(`.pkg-count[data-count-for="${CSS.escape(bundleId)}"]`);
    if (badge) {
      const bundleCb = root.querySelector(`input.bundle-cb[data-bundle="${CSS.escape(bundleId)}"]`);
      const booked = !!(bundleCb && bundleCb.checked);
      badge.textContent = n + " picked";
      badge.classList.toggle("met", n >= 3);
      // Only flag "needs more" once they've actually ticked "Book this
      // bundle" — being under 3 is just the normal unfinished state
      // otherwise, not something to warn about.
      badge.classList.toggle("warn", booked && n < 3);
    }
  }

  // ---------- save picks as PDF ----------
  // Reads straight off the rendered table cells (not the catalog) so the PDF
  // always matches exactly what's on screen — no risk of it drifting from a
  // resolveGame() lookup done separately.
  function collectPicks(panel) {
    const bundles = [];
    panel.querySelectorAll(".pkg-card").forEach((card) => {
      const bundleCb = card.querySelector("input.bundle-cb");
      const games = Array.from(card.querySelectorAll("input.bundle-game-cb:checked")).map((cb) => {
        const tr = cb.closest("tr");
        const text = (sel) => (tr.querySelector(sel) ? tr.querySelector(sel).textContent.trim() : "");
        const prices = Array.from(tr.querySelectorAll(".g-price")).map((td) => td.textContent.trim());
        return {
          name: text(".g-name label") || text(".g-name"),
          players: text(".g-players"),
          category: text(".g-cat"),
          ptype: text(".g-ptype"),
          mechanic: text(".g-mech"),
          duration: text(".g-dur"),
          price: prices.length ? prices.join(" / ") : text(".quote-cell"),
        };
      });
      if ((bundleCb && bundleCb.checked) || games.length) {
        bundles.push({
          title: card.querySelector(".pkg-title").textContent.trim(),
          booked: !!(bundleCb && bundleCb.checked),
          games,
        });
      }
    });
    return bundles;
  }

  // Everything that must be true before a PDF is allowed to save, gathered
  // into one list rather than stopping at the first problem — the client
  // fixes everything in one pass instead of hitting a new popup each time
  // they resolve one issue.
  function collectValidationIssues(panel, variant, details, bundles) {
    const issues = [];
    if (variant === "corporate") {
      if (!details.orgName) issues.push("Organization / Company Name is blank");
      if (!details.contact) issues.push("Contact Person is blank");
      if (!details.date) issues.push("Preferred Rental Date(s) is blank");
    } else {
      if (!details.fullName) issues.push("Full Name is blank");
      if (!details.date) issues.push("Preferred Rental Date(s) is blank");
    }
    if (!details.rentalLength) issues.push("No Rental Length (1/2/3 Day) selected");

    // A bundle ticked "Book this bundle" is a promise of at least 3 games —
    // it needs to actually be true, not just produce a PDF that understates
    // what "booked as a set" means.
    const shortBundles = bundles.filter((b) => b.booked && b.games.length < 3);
    shortBundles.forEach((b) => {
      issues.push(`“${b.title}” is booked as a set but only has ${b.games.length}/3 games ticked`);
    });

    return { issues, shortBundles };
  }

  function savePicksPdf(panel, variant, detailsContainer) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      showAlertModal("Couldn't load the PDF tool (check your internet connection) — please try again.");
      return;
    }
    const bundles = collectPicks(panel);
    const details = collectDetails(detailsContainer, variant);
    const { issues, shortBundles } = collectValidationIssues(panel, variant, details, bundles);
    if (issues.length) {
      showAlertModal("Can't save yet — here's what's missing:", issues);
      if (shortBundles.length) {
        const firstCard = Array.from(panel.querySelectorAll(".pkg-card"))
          .find((c) => c.querySelector(".pkg-title").textContent.trim() === shortBundles[0].title);
        if (firstCard) { firstCard.open = true; firstCard.scrollIntoView({ behavior: "smooth", block: "center" }); }
      }
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const marginX = 40;
    const pageTitle = variant === "corporate" ? "Corporate & Group Rental Bundle Picks" : "Personal Rental Bundle Picks";

    doc.setFont("helvetica", "bold"); doc.setFontSize(16);
    doc.text("TGTG — " + pageTitle, marginX, 44);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(110);
    doc.text("Tabletop Games To Go · saved " + new Date().toLocaleDateString(), marginX, 60);
    doc.setTextColor(0);

    let y = 84;
    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    doc.text("Your Details", marginX, y);
    y += 16;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    const detailLines = variant === "corporate"
      ? [
          "Organization / Company: " + (details.orgName || "—"),
          "Contact Person: " + (details.contact || "—"),
          "Preferred Rental Date(s): " + (formatDateNice(details.date) || "—"),
          "Number of Attendees: " + (details.attendees || "—"),
          "Rental Length: " + (details.rentalLength || "(not selected)"),
          "Game Master: included with every corporate booking",
        ]
      : [
          "Full Name: " + (details.fullName || "—"),
          "Preferred Rental Date(s): " + (formatDateNice(details.date) || "—"),
          "Rental Length: " + (details.rentalLength || "(not selected)"),
        ];
    detailLines.forEach((line) => { doc.text(line, marginX, y); y += 15; });
    y += 12;

    if (!bundles.length) {
      doc.setFont("helvetica", "italic"); doc.setFontSize(11);
      doc.text("Nothing ticked yet — go back and tick some boxes, then save again.", marginX, y);
    } else {
      bundles.forEach((b) => {
        if (y > 760) { doc.addPage(); y = 44; }
        doc.setFont("helvetica", "bold"); doc.setFontSize(12);
        doc.text(b.title + (b.booked ? "  — booked as a set (min. 3 games)" : ""), marginX, y);
        y += 14;
        if (b.games.length) {
          doc.autoTable({
            startY: y,
            margin: { left: marginX, right: marginX },
            head: [["Game", "Players", "Category", "Player Type", "Mechanic", "Duration", "Price (1/2/3-Day)"]],
            // jsPDF's built-in fonts only cover WinAnsi/Latin-1 — the peso
            // sign (₱) isn't in that set and silently renders as a
            // garbled "±" with broken spacing. Swap it for plain "P"
            // here only; the live page keeps the real ₱ symbol.
            body: b.games.map((g) => [g.name, g.players, g.category, g.ptype, g.mechanic, g.duration, g.price.replace(/₱/g, "P")]),
            styles: { fontSize: 8, cellPadding: 4 },
            headStyles: { fillColor: [93, 65, 120], textColor: 255 },
            theme: "striped",
          });
          y = doc.lastAutoTable.finalY + 20;
        } else {
          doc.setFont("helvetica", "italic"); doc.setFontSize(9);
          doc.text("(bundle checked as a set — no individual games ticked)", marginX + 10, y);
          y += 22;
        }
      });
    }

    // ---- staff-only section ----
    // A blank Transaction ID field for TGTG staff to fill in by hand once the
    // order is logged — never pre-filled by the client's browser.
    let yStaff = y + 10;
    const pageHeight = doc.internal.pageSize.getHeight();
    const staffBoxHeight = 50;
    if (yStaff + staffBoxHeight > pageHeight - 40) { doc.addPage(); yStaff = 44; }
    doc.setDrawColor(230, 57, 74);
    doc.setLineWidth(1);
    doc.rect(marginX, yStaff, 515, staffBoxHeight);
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(230, 57, 74);
    doc.text("FOR TGTG EMPLOYEE USE ONLY", marginX + 10, yStaff + 16);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(0);
    doc.text("Transaction ID:", marginX + 10, yStaff + 36);
    doc.setDrawColor(0);
    doc.line(marginX + 95, yStaff + 37, marginX + 505, yStaff + 37);

    doc.save(buildPdfFilename(variant, details));
  }

  // Each HTML page is a single variant (set via <body data-variant="personal|
  // corporate">) rendering into its own #bundles-root — no in-page tab
  // switching, Personal and Corporate are separate pages/URLs.
  function initPanel(panel, variant) {
    panel.innerHTML = renderVariant(variant);
    // restore saved state
    panel.querySelectorAll('input[type="checkbox"]').forEach((input) => {
      input.checked = loadChecked(input);
    });
    panel.querySelectorAll('[data-count-for]').forEach((badge) => {
      updateCount(badge.getAttribute("data-count-for"), panel);
    });
    // A bundle that's already ticked (from a previous visit) should open
    // showing its games, not sit collapsed — keeps "checked" and "open" in
    // sync whether the tick just happened or was restored from storage.
    panel.querySelectorAll('input.bundle-cb').forEach((input) => {
      if (input.checked) {
        const details = input.closest("details.pkg-card");
        if (details) details.open = true;
      }
    });
    panel.addEventListener("change", (e) => {
      const input = e.target;
      if (input.type !== "checkbox") return;

      if (input.classList.contains("bundle-cb") && !input.checked) {
        const details = input.closest("details.pkg-card");
        const checkedGames = details ? Array.from(details.querySelectorAll("input.bundle-game-cb:checked")) : [];
        if (checkedGames.length) {
          // Unchecking this would silently wipe out games they already
          // picked — put it back on and ask first instead of just doing it.
          input.checked = true;
          showConfirmModal(
            "There " + (checkedGames.length === 1 ? "is" : "are") + " already " + checkedGames.length
            + (checkedGames.length === 1 ? " board game" : " board games")
            + " selected under this bundle. Unchecking it will remove all the ticks under it — is that okay?",
            "Yes, uncheck it", "No"
          ).then((yes) => {
            if (!yes) return;
            input.checked = false;
            saveChecked(input);
            checkedGames.forEach((gcb) => { gcb.checked = false; saveChecked(gcb); });
            if (details) details.open = false;
            updateCount(input.getAttribute("data-bundle"), panel);
          });
          return;
        }
      }

      saveChecked(input);
      const bundleId = input.getAttribute("data-bundle");
      if (input.classList.contains("bundle-cb")) {
        const details = input.closest("details.pkg-card");
        if (input.checked) {
          // Checking "Book this bundle" is a promise to pick at least 3
          // games — open it right away so that's the obvious next step.
          if (details) details.open = true;
        } else if (details) {
          // Unchecked with nothing picked under it yet — nothing to confirm,
          // just fold it back closed.
          details.open = false;
        }
      }
      if (bundleId) updateCount(bundleId, panel);
    });
    const clearBtn = panel.querySelector(`[data-clear="${variant}"]`);
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        if (!confirm("Clear all your ticked boxes on this page?")) return;
        panel.querySelectorAll('input[type="checkbox"]').forEach((input) => {
          input.checked = false;
          saveChecked(input);
        });
        panel.querySelectorAll('[data-count-for]').forEach((badge) => {
          updateCount(badge.getAttribute("data-count-for"), panel);
        });
      });
    }
  }

  function init() {
    const variant = document.body.getAttribute("data-variant") === "corporate" ? "corporate" : "personal";
    const panel = document.getElementById("bundles-root");
    const details = document.getElementById("your-details");
    initPanel(panel, variant);
    bindDetailsFields(details, variant);
    const saveBtn = document.getElementById("save-pdf-btn");
    if (saveBtn) saveBtn.addEventListener("click", () => savePicksPdf(panel, variant, details));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
