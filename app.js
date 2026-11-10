'use strict';

const data = window.WATERLOO_DATA;
const views = [...document.querySelectorAll('[data-view]')];
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));

function renderPrice(item) {
  if (item.priceLabels?.length === item.prices.length) {
    return `<span class="prices prices-sized">${item.prices.map((price, index) => `<span class="sized-price"><small>${escapeHTML(item.priceLabels[index])}</small>${escapeHTML(price)}</span>`).join('')}</span>`;
  }
  const price = item.prices.map(escapeHTML).join(' / ');
  return price ? `<span class="prices">${price}${item.priceNote ? `<small>${escapeHTML(item.priceNote)}</small>` : ''}</span>` : '';
}

function renderItem(item, compact = false) {
  return `<article class="menu-item${compact ? ' menu-item-compact' : ''}${item.image && !compact ? ' has-photo' : ''}">${item.image && !compact ? `<img class="dish-photo" src="${escapeHTML(item.image.src)}" alt="${escapeHTML(item.image.alt)}" width="112" height="96" loading="lazy" decoding="async">` : ''}<div class="item-copy"><div class="item-heading"><h3>${escapeHTML(item.name)}</h3>${renderPrice(item)}</div>${item.description ? `<p>${item.heatLabel ? `<em class="heat-note">${escapeHTML(item.heatLabel)}</em> · ` : ''}${escapeHTML(item.description)}</p>` : ''}</div></article>`;
}

function renderCustomization(customization) {
  if (!customization) return '';
  return `<aside class="customization" aria-label="Burger and sandwich options"><div class="customization-heading"><span class="eyebrow">BURGER &amp; SANDWICH OPTIONS</span><h3>${escapeHTML(customization.title)}</h3></div><div class="customization-grid"><div><h4>Cheese choices</h4><ul class="cheese-choices">${customization.cheeses.map(cheese => `<li>${escapeHTML(cheese)}</li>`).join('')}</ul></div><div><h4>Add a topping</h4><dl class="topping-choices">${customization.toppings.map(topping => `<div><dt>${escapeHTML(topping.name)}</dt><dd>${escapeHTML(topping.price)}</dd></div>`).join('')}</dl></div></div></aside>`;
}

function renderSaladOptions(options) {
  if (!options) return '';
  return `<aside class="salad-options" aria-label="Salad dressings and proteins"><div class="salad-options-grid"><section><h3>Sauces &amp; Dressings</h3><ul class="dressing-choices">${options.dressings.map(dressing => `<li>${escapeHTML(dressing)}</li>`).join('')}</ul><p class="salad-options-note">${escapeHTML(options.description)}</p></section><section><h3>Protein Options</h3><dl class="topping-choices">${options.proteins.map(protein => `<div><dt>${escapeHTML(protein.name)}</dt><dd>${escapeHTML(protein.price)}</dd></div>`).join('')}</dl><div class="salad-extras"><h4>Extras</h4>${options.extras.map(extra => `<p>${escapeHTML(extra.name)} <strong>${escapeHTML(extra.price)}</strong></p>`).join('')}</div></section></div></aside>`;
}

function renderSideOptions(items) {
  if (!items?.length) return '';
  return `<div class="side-options"><h3>Side choices</h3><dl class="compact-options">${items.map(item => `<div><dt>${escapeHTML(item.name)}</dt>${item.prices.length ? `<dd>${item.prices.map(escapeHTML).join(' / ')}</dd>` : ''}</div>`).join('')}</dl></div>`;
}

function renderMenu(kind) {
  const host = document.getElementById(`${kind}-menu`);
  const sections = data[kind];
  host.innerHTML = `<div class="menu-tools"><label for="${kind}-search">SEARCH THE MENU<input id="${kind}-search" type="search" placeholder="Search ${kind === 'food' ? 'dishes or ingredients' : 'drinks or ingredients'}…" autocomplete="off"></label><label for="${kind}-category">CATEGORY<select id="${kind}-category"><option value="">All categories</option>${sections.map((section, index) => `<option value="${index}">${escapeHTML(section.name)}</option>`).join('')}</select></label><p class="result-count" role="status" id="${kind}-count"></p></div><div id="${kind}-results"></div>`;
  const search = document.getElementById(`${kind}-search`);
  const category = document.getElementById(`${kind}-category`);
  const results = document.getElementById(`${kind}-results`);
  const count = document.getElementById(`${kind}-count`);
  function filter() {
    const query = search.value.trim().toLocaleLowerCase();
    let matches = 0;
    results.innerHTML = sections.map((section, index) => {
      if (category.value !== '' && Number(category.value) !== index) return '';
      const optionsText = [...(section.customization ? [...section.customization.cheeses, ...section.customization.toppings.map(option => option.name)] : []), ...(section.saladOptions ? [...section.saladOptions.dressings, ...section.saladOptions.proteins.map(option => option.name), ...section.saladOptions.extras.map(option => option.name)] : [])].join(' ');
      const optionsMatch = Boolean((section.customization || section.saladOptions) && optionsText.toLocaleLowerCase().includes(query));
      const items = section.items.filter(item => optionsMatch || `${item.name} ${item.description} ${(item.priceLabels || []).join(" ")} ${section.name}`.toLocaleLowerCase().includes(query));
      const sides = (section.sideOptions || []).filter(item => `${item.name} ${section.name}`.toLocaleLowerCase().includes(query));
      matches += items.length + sides.length;
      if (!items.length && !sides.length) return '';
      const showCustomization = section.customization && (!query || optionsMatch || items.length);
      return `<section class="menu-section${section.theme === 'cash-list' ? ' cash-list-section' : ''}${section.layout === 'compact' ? ' compact-section' : ''}" aria-labelledby="${kind}-section-${index}"><h2 id="${kind}-section-${index}">${section.theme === 'cash-list' ? '<span class="cash-title-the">The</span><span class="cash-title-cash">Cash</span><span class="cash-title-list">List</span>' : escapeHTML(section.name)}</h2>${section.description ? `<p class="category-note">${escapeHTML(section.description)}</p>` : ''}${showCustomization ? renderCustomization(section.customization) : ''}${section.saladOptions ? renderSaladOptions(section.saladOptions) : ''}<div class="menu-items${section.layout === 'compact' ? ' menu-items-compact' : ''}">${items.map(item => renderItem(item, section.layout === 'compact')).join('')}</div>${renderSideOptions(sides)}${section.theme === 'cash-list' ? '<p class="cash-signoff">God bless Johnny Cash.</p>' : ''}</section>`;
    }).join('');
    count.textContent = `${matches} ${matches === 1 ? 'item' : 'items'}`;
    if (!matches) results.innerHTML = '<p class="no-results">No matches. Try another search or choose a different category.</p>';
  }
  search.addEventListener('input', filter);
  category.addEventListener('change', filter);
  filter();
}

function renderDailyOffers(offers) {
  const groups = new Map();
  for (const offer of offers) {
    if (!groups.has(offer.text)) groups.set(offer.text, []);
    groups.get(offer.text).push(offer.day);
  }
  return [...groups].map(([text, days]) => {
    const label = days.join(', ') === 'Sunday, Monday, Tuesday, Wednesday, Thursday, Friday' ? 'Sunday–Friday' : days.join(', ');
    return `<p><strong>${escapeHTML(label)}:</strong> ${escapeHTML(text)}</p>`;
  }).join('');
}


if (data) {
  renderMenu('food');
  renderMenu('drinks');
  const happyHour = data.happyHour;
  document.getElementById('happy-hour-menu').innerHTML = `<div class="happy-hour-schedule"><strong>Every day</strong><span>3–6 PM</span><small>Dine-in only</small></div><p class="dietary-key"><span>(gf) Gluten-free</span><span>(gfo) Gluten-free option</span><span>(ngf) Not gluten-free</span></p><div class="happy-hour-food">${happyHour.sections.map(section => `<section class="happy-hour-group"><h2>${escapeHTML(section.name)}</h2>${section.description ? `<p class="category-note">${escapeHTML(section.description)}</p>` : ''}<div class="menu-items">${section.items.map(item => renderItem(item)).join('')}</div></section>`).join('')}</div><div class="happy-hour-extras"><h2>A little extra, by the day.</h2>${renderDailyOffers(happyHour.dailyOffers)}</div>`;
  let lastSpecialsDate = '';
  let midnightTimer;
  function refreshSpecials() {
    const today = window.WaterlooSchedule.dateKey();
    window.clearTimeout(midnightTimer);
    midnightTimer = window.setTimeout(refreshSpecials, window.WaterlooSchedule.millisecondsToMidnight() + 50);
    if (today === lastSpecialsDate) return;
    const days = window.WaterlooSchedule.upcomingDays(data.specials);
    document.getElementById('specials-list').innerHTML = days.map(day => `<article class="special-day${day.isToday ? ' is-today' : ''}">${day.isToday ? '<span class="today-badge">Today</span>' : ''}<h2><time datetime="${escapeHTML(day.date)}">${escapeHTML(day.label)}</time></h2>${day.entries.map(entry => `<div class="special-entry"><p>${escapeHTML(entry.text)}</p></div>`).join('')}</article>`).join('');
    const updated = new Date(data.photoMenuDate ? `${data.photoMenuDate}T12:00:00Z` : data.updatedAt).toLocaleDateString('en-US', {timeZone: window.WaterlooSchedule.timeZone, month: 'long', day: 'numeric', year: 'numeric'});
    document.getElementById('specials-updated').textContent = `Daily specials repeat each week. Menu last refreshed ${updated}. Offers may change.`;
    lastSpecialsDate = today;
  }
  refreshSpecials();

  window.addEventListener('focus', refreshSpecials);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshSpecials();
  });
} else {
  for (const kind of ['food', 'drinks', 'happy-hour']) document.getElementById(`${kind}-menu`).innerHTML = '<p>Menu content could not load. Please reload the page or visit <a href="https://waterloolouisville.com/">our main website</a>.</p>';
}

const navigationToggle = document.querySelector('.nav-toggle');
const siteNavigation = document.getElementById('site-nav');
function closeMobileNavigation() {
  navigationToggle.setAttribute('aria-expanded', 'false');
  siteNavigation.classList.remove('is-open');
}
navigationToggle.addEventListener('click', () => {
  const open = navigationToggle.getAttribute('aria-expanded') !== 'true';
  navigationToggle.setAttribute('aria-expanded', String(open));
  siteNavigation.classList.toggle('is-open', open);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navigationToggle.getAttribute('aria-expanded') === 'true') {
    closeMobileNavigation();
    navigationToggle.focus();
  }
});
document.querySelectorAll('nav a').forEach(link => link.addEventListener('click', () => {
  closeMobileNavigation();
  if (link.hash === location.hash) window.scrollTo(0, 0);
}));

function showPage(focus = true) {
  const requested = location.hash.slice(1) || 'home';
  const page = views.some(view => view.dataset.view === requested) ? requested : 'home';
  for (const view of views) view.hidden = view.dataset.view !== page;
  document.querySelectorAll('nav a').forEach(link => {
    if (link.hash === `#${page}`) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  const titles = {home: 'Louisville, CO', food: 'Food Menu', drinks: 'Drink Menu', 'happy-hour': 'Happy Hour', specials: 'Specials', gifts: 'Gift Cards & Merch', jobs: 'Jobs', visit: 'Visit Us', privacy: 'Privacy'};
  document.title = `The Waterloo | ${titles[page]}`;
  closeMobileNavigation();
  if (focus) {
    window.scrollTo(0, 0);
    document.getElementById('main').focus({preventScroll: true});
  }
}
window.addEventListener('hashchange', () => {
  if (location.hash !== '#main') showPage();
});
showPage(false);
