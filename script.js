async function loadContent() {
  const response = await fetch("content.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to load content.json: ${response.status}`);
  }
  return response.json();
}

function setText(selector, value) {
  document.querySelectorAll(selector).forEach((element) => {
    element.textContent = value || "";
  });
}

function linkList(items) {
  return (items || [])
    .filter((item) => item.label && item.url)
    .map((item) => {
      const anchor = document.createElement("a");
      anchor.className = "button-link";
      anchor.href = item.url;
      anchor.textContent = item.label;
      return anchor;
    });
}

function itemCard(item) {
  const article = document.createElement("article");
  article.className = "item";

  const title = document.createElement("h3");
  title.textContent = item.title || "Untitled";

  const description = document.createElement("p");
  description.textContent = item.description || "";

  article.append(title, description);

  const definitions = definitionList(item);
  if (definitions) {
    article.append(definitions);
  }

  (item.body || []).forEach((text) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    article.append(paragraph);
  });

  if (item.formula) {
    const formula = document.createElement("p");
    formula.className = "formula";
    formula.textContent = item.formula;
    article.append(formula);
  }

  if (item.url) {
    const anchor = document.createElement("a");
    anchor.href = item.url;
    anchor.textContent = "Open";
    article.append(anchor);
  }

  return article;
}

function definitionList(item) {
  if (!item.definitions?.length) return null;

  const definitions = document.createElement("dl");
  definitions.className = "definition-list";

  item.definitions.forEach((definition) => {
    const wrapper = document.createElement("div");
    wrapper.className = "definition-item";

    const term = document.createElement("dt");
    term.textContent = definition.term || "";

    const detail = document.createElement("dd");
    detail.textContent = [
      definition.symbol,
      definition.meaning,
      definition.unit ? `单位：${definition.unit}` : ""
    ].filter(Boolean).join("；");

    wrapper.append(term, detail);
    definitions.append(wrapper);
  });

  return definitions;
}

function noteArticle(item) {
  const article = document.createElement("article");
  article.className = "note-article";

  const title = document.createElement("h2");
  title.textContent = item.title || "Untitled";

  const description = document.createElement("p");
  description.className = "note-description";
  description.textContent = item.description || "";

  article.append(title, description);

  const definitions = definitionList(item);
  if (definitions) {
    article.append(definitions);
  }

  (item.body || []).forEach((text) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    article.append(paragraph);
  });

  (item.math || []).forEach((text) => {
    const formula = document.createElement("div");
    formula.className = "math-block";
    formula.textContent = text;
    article.append(formula);
  });

  if (item.formula) {
    const formula = document.createElement("p");
    formula.className = "formula";
    formula.textContent = item.formula;
    article.append(formula);
  }

  return article;
}

function notesByCategory(notes) {
  const categories = [
    {
      id: "math",
      title: "数学"
    },
    {
      id: "physics",
      title: "物理"
    }
  ];

  return categories
    .map((category) => {
      const items = notes.filter((note) => (note.category || "math") === category.id);
      if (!items.length) return null;

      const section = document.createElement("section");
      section.className = "note-category";
      section.id = `notes-${category.id}`;

      const heading = document.createElement("h2");
      heading.textContent = category.title;

      const list = document.createElement("div");
      list.className = "note-list";
      list.append(...items.map(noteArticle));

      section.append(heading, list);
      return section;
    })
    .filter(Boolean);
}

function typesetMath() {
  if (window.MathJax?.typesetPromise) {
    window.MathJax.typesetPromise();
  }
}

window.addEventListener("load", typesetMath);

function renderList(selector, nodes) {
  const container = document.querySelector(selector);
  if (!container) return;
  container.replaceChildren(...nodes);
}

function renderContent(content) {
  const profile = content.profile || {};

  document.title = profile.name ? `${profile.name} - Personal Site` : "Personal Site";

  setText('[data-field="name"]', profile.name);
  setText('[data-field="domain"]', profile.domain);
  setText('[data-field="tagline"]', profile.tagline);
  setText('[data-field="status"]', profile.status);
  setText('[data-field="footer-name"]', profile.name);
  setText('[data-field="contact-intro"]', content.contact?.intro);

  renderList('[data-list="profile-links"]', linkList(profile.links));
  renderList('[data-list="notes"]', (content.notes || []).map(itemCard));
  renderList('[data-list="notes-preview"]', (content.notes || []).slice(0, 3).map(itemCard));
  renderList('[data-list="notes-full"]', notesByCategory(content.notes || []));
  renderList('[data-list="projects"]', (content.projects || []).map(itemCard));
  renderList('[data-list="about"]', (content.about || []).map((text) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    return paragraph;
  }));
  renderList('[data-list="contact-links"]', linkList(content.contact?.links));

  typesetMath();
}

loadContent()
  .then(renderContent)
  .catch((error) => {
    console.error(error);
    const main = document.querySelector("main");
    if (main) {
      main.insertAdjacentHTML(
        "afterbegin",
        '<p class="status">Could not load content.json. Check that the local server is running.</p>'
      );
    }
  });
