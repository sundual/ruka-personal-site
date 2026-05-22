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

function categoryLabel(category) {
  const labels = {
    math: "数学",
    physics: "物理",
    "learning-plan": "计划"
  };

  return labels[category] || category || "笔记";
}

function categoryPagePath(category) {
  const paths = {
    math: "math.html",
    physics: "physics.html",
    "learning-plan": "plan.html"
  };

  return paths[category] || "math.html";
}

function categoryPageTitle(category) {
  const titles = {
    math: "数学",
    physics: "物理",
    "learning-plan": "计划"
  };

  return titles[category] || "笔记";
}

function categoryNotes(notes, category) {
  return (notes || [])
    .filter((note) => (note.category || "math") === category)
    .map((note, index) => ({
      ...note,
      id: note.id || noteId(note, index)
    }));
}

function itemCard(item, options = {}) {
  const article = document.createElement("article");
  article.className = "item";

  const title = document.createElement("h3");
  title.textContent = item.title || "Untitled";

  if (options.compact) {
    const meta = document.createElement("p");
    meta.className = "item-meta";
    meta.textContent = item.category ? categoryLabel(item.category) : "Project";

    article.append(title, meta);

    const href = item.url || options.defaultUrl;
    if (href) {
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.textContent = options.linkText || "Open";
      article.append(anchor);
    }

    return article;
  }

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
  if (item.id) {
    article.id = item.id;
  }

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

  if (item.url) {
    const anchor = document.createElement("a");
    anchor.className = "section-link";
    anchor.href = item.url;
    anchor.textContent = "Open";
    article.append(anchor);
  }

  return article;
}

function notePager(item, previous, next, basePath = "") {
  const nav = document.createElement("nav");
  nav.className = "note-pager";
  nav.setAttribute("aria-label", `${item.title || "Note"} pagination`);

  const previousLink = document.createElement(previous ? "a" : "span");
  previousLink.className = "note-pager-link previous";
  previousLink.textContent = previous ? `上一篇：${previous.title}` : "上一篇：无";
  if (previous) previousLink.href = `${basePath}#${previous.id}`;

  const nextLink = document.createElement(next ? "a" : "span");
  nextLink.className = "note-pager-link next";
  nextLink.textContent = next ? `下一篇：${next.title}` : "下一篇：无";
  if (next) nextLink.href = `${basePath}#${next.id}`;

  nav.append(previousLink, nextLink);
  return nav;
}

function noteIndex(notes, currentId, basePath) {
  const nav = document.createElement("nav");
  nav.className = "note-index";
  nav.setAttribute("aria-label", "Article list");

  const title = document.createElement("p");
  title.className = "note-index-title";
  title.textContent = "篇目列表";
  nav.append(title);

  const list = document.createElement("ol");
  list.className = "note-index-list";

  notes.forEach((note) => {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = `${basePath}#${note.id}`;
    link.textContent = note.title || "Untitled";
    if (note.id === currentId) {
      link.setAttribute("aria-current", "page");
    }
    item.append(link);
    list.append(item);
  });

  nav.append(list);

  if (notes.length) {
    const last = document.createElement("a");
    last.className = "note-index-last";
    last.href = `${basePath}#${notes[notes.length - 1].id}`;
    last.textContent = `最后一页：${notes[notes.length - 1].title || "Untitled"}`;
    nav.append(last);
  }

  return nav;
}

function slugify(text, fallback) {
  const slug = String(text || "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

  return slug || fallback;
}

function noteId(note, index) {
  return `note-${note.category || "math"}-${slugify(note.title, index + 1)}`;
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
    },
    {
      id: "learning-plan",
      title: "计划"
    }
  ];

  return categories
    .map((category) => {
      const items = notes
        .filter((note) => (note.category || "math") === category.id)
        .map((note, index) => ({
          ...note,
          id: note.id || noteId(note, index)
        }));
      if (!items.length) return null;

      const section = document.createElement("section");
      section.className = "note-category";
      section.id = `notes-${category.id}`;

      const heading = document.createElement("h2");
      heading.textContent = category.title;

      const list = document.createElement("div");
      list.className = "note-list";
      list.append(...items.map((item, index) => {
        const article = noteArticle(item);
        article.append(notePager(item, items[index - 1], items[index + 1], `${categoryPagePath(category.id)}`));
        return article;
      }));

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

function formatUpdateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "";

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function renderUpdateWidget(value) {
  document.querySelectorAll('[data-field="last-updated"]').forEach((element) => {
    element.textContent = formatUpdateTime(value);
    if (value) element.dateTime = value;
  });
}

function inlineMarkdown(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function renderMarkdown(markdown) {
  const fragment = document.createDocumentFragment();
  const lines = markdown.split(/\r?\n/);
  let list = null;

  function closeList() {
    if (list) {
      fragment.append(list);
      list = null;
    }
  }

  lines.forEach((line) => {
    if (!line.trim()) {
      closeList();
      return;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      closeList();
      const level = Math.min(heading[1].length, 4);
      const element = document.createElement(`h${level}`);
      element.innerHTML = inlineMarkdown(heading[2]);
      fragment.append(element);
      return;
    }

    const listItem = line.match(/^-\s+(.+)$/);
    if (listItem) {
      if (!list) {
        list = document.createElement("ul");
      }
      const item = document.createElement("li");
      item.innerHTML = inlineMarkdown(listItem[1]);
      list.append(item);
      return;
    }

    closeList();
    const paragraph = document.createElement("p");
    paragraph.innerHTML = inlineMarkdown(line);
    fragment.append(paragraph);
  });

  closeList();
  return fragment;
}

async function renderMarkdownPages() {
  const pages = document.querySelectorAll("[data-markdown]");
  await Promise.all(Array.from(pages).map(async (page) => {
    const source = page.getAttribute("data-markdown");
    const response = await fetch(source, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Unable to load ${source}: ${response.status}`);
    }
    const markdown = await response.text();
    page.replaceChildren(renderMarkdown(markdown));
  }));
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
  renderUpdateWidget(profile.lastUpdated);

  renderList('[data-list="profile-links"]', linkList(profile.links));
  renderList('[data-list="note-entrances"]', [
    "math",
    "physics",
    "learning-plan"
  ].map((category) => {
    const latest = categoryNotes(content.notes || [], category)[0];
    return itemCard(
      {
        title: categoryPageTitle(category),
        category,
        description: latest
          ? `Latest: ${latest.title}`
          : `Latest page for ${categoryPageTitle(category)}.`,
        url: latest ? `${categoryPagePath(category)}#${latest.id}` : categoryPagePath(category)
      },
      {
        compact: true,
        linkText: "Open"
      }
    );
  }));
  renderList('[data-list="notes-full"]', notesByCategory(content.notes || []));
  renderList('[data-list="projects"]', (content.projects || []).map((project) => itemCard(project, {
    compact: true,
    linkText: project.url ? "Open project" : "Project"
  })));
  renderList('[data-list="about"]', (content.about || []).map((text) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    return paragraph;
  }));
  renderList('[data-list="contact-links"]', linkList(content.contact?.links));

  typesetMath();
}

function currentCategoryPage() {
  const path = window.location.pathname.split("/").pop() || "";
  if (path === "math.html" || path === "physics.html" || path === "plan.html") {
    return path;
  }
  return "";
}

function renderCategoryPage(content) {
  const path = currentCategoryPage();
  if (!path) return;

  const categories = {
    "math.html": "math",
    "physics.html": "physics",
    "plan.html": "learning-plan"
  };
  const category = categories[path];
  const notes = categoryNotes(content.notes || [], category);

  document.title = `${categoryPageTitle(category)} - Ruka`;

  const heroTitle = document.querySelector("[data-category-title]");
  if (heroTitle) heroTitle.textContent = categoryPageTitle(category);

  const heroIntro = document.querySelector("[data-category-intro]");
  if (heroIntro) {
    heroIntro.textContent = `One article at a time. Use the list at the end to switch between ${categoryPageTitle(category)} entries.`;
  }

  const reader = document.querySelector("[data-category-reader]");
  if (reader) {
    const selectedId = decodeURIComponent(window.location.hash.slice(1) || "");
    const selected = notes.find((note) => note.id === selectedId) || notes[0];
    if (!selected) {
      reader.replaceChildren();
      return;
    }
    const index = notes.findIndex((note) => note.id === selected.id);
    const article = noteArticle(selected);
    article.append(notePager(selected, notes[index - 1], notes[index + 1], path));
    article.append(noteIndex(notes, selected.id, path));
    reader.replaceChildren(article);
  }
}

let siteContent = null;

Promise.all([loadContent(), renderMarkdownPages()])
  .then(([content]) => {
    siteContent = content;
    renderContent(content);
    renderCategoryPage(content);
    typesetMath();
  })
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

window.addEventListener("hashchange", () => {
  if (siteContent) {
    renderCategoryPage(siteContent);
    typesetMath();
  }
});
