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
  renderList('[data-list="projects"]', (content.projects || []).map(itemCard));
  renderList('[data-list="about"]', (content.about || []).map((text) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    return paragraph;
  }));
  renderList('[data-list="contact-links"]', linkList(content.contact?.links));
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
