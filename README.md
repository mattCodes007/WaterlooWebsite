# The Waterloo — basic restaurant website

A local, responsive website built with plain HTML, CSS, and JavaScript. No package installation or framework is required for local development. A small build command prepares public files for Cloudflare Pages.

## Run in VS Code

Open this folder in VS Code, open its terminal, and run:

```sh
npm run dev
```

Visit <http://localhost:5173>. Stop the server with Ctrl+C. To use another port, run `PORT=5174 npm run dev`.

You can also open `index.html` directly in a browser. Menu data is loaded from a local script, so a server is optional.

## Included

- Home and restaurant background
- Full food and drink menus with prices, descriptions, category selection, and search
- A dedicated Happy Hour tab, followed by seven days of daily specials
- Gift card status and official gift card link
- Merchandise inquiry information
- Listed job positions and a link to the official application
- Address, hours, phone, email, social link, and directions

## Edit

- `index.html`: page structure, restaurant information, and external links
- `styles.css`: colors, typography, spacing, and responsive layout
- `app.js`: navigation, menu rendering, search, and daily specials refresh
- `schedule.js`: rolling seven-day specials in the America/Denver time zone
- `content.js`: generated menu items, descriptions, prices, specials, and photo references
- `menu-edits.json`: approved copy corrections and food photo sources
- `scripts/menu_editorial.py`: category splits, removed dishes, burger options, compact sides, and Happy Hour separation
- `assets/`: ten dish photos sourced from the restaurant’s original menu

Fonts are self-hosted under `assets/fonts/` with their open font licenses. Images, CSS, and scripts are also local; page rendering makes no Google Fonts requests.

## Refresh menus and specials

With Python 3 installed and internet access available:

```sh
npm run sync-content
```

This reads the public restaurant pages, applies `menu-edits.json` and `scripts/menu_editorial.py`, and replaces `content.js` only after all menus and seven days of specials are parsed successfully. Local menu changes are reapplied automatically, so refreshing does not restore removed dishes or undo copy corrections. Reload your browser after editing or refreshing content; the basic server does not provide automatic reload.

The original capture on November 9, 2026 had 96 food entries and 161 drink entries. The revised menu separates soups and salads, moves Taco Bowl to Plates & Bowls, and provides a dedicated Happy Hour page. Kids & Golden-Aged Guests welcomes kids 12 and under and seniors. Main sides and smaller-portion side choices use compact layouts. Burger cheese choices and topping prices appear in a separate customization panel.

Regular taco orders contain three tacos for the listed price; corn tortillas are standard with flour available, except Gringo tacos, which default to flour with corn available. Happy Hour à la carte tacos remain $3 per individual taco. Taco bowls have no tortillas. Pork Chop and Palisade are removed, including the pork chop daily special. Filet replaces Filet Frites and is served with seasonal vegetables and chimichurri, with its $30 price preserved.

Copy uses consistent ingredient names, capitalization, punctuation, units, and spelling. Playful names such as Bad @ss Wings, Bawk Bawk, and Bananananananana Cake remain. Every reference to corn chips is marked `(gf)` specifically for the chips. Other dietary tags are retained from the source where applicable. Multiple wine prices remain in their original order: glass, then bottle.

## Content sources and limits

- [Original website](https://waterloolouisville.com/)
- [Food menu](https://waterloolouisville.com/louisville-the-waterloo-food-menu)
- [Drinks](https://waterloolouisville.com/louisville-the-waterloo-drink-menu)
- [Specials](https://waterloolouisville.com/louisville-the-waterloo-happy-hours-specials)
- [Gift cards](https://waterloolouisville.com/louisville-the-waterloo-gift-cards)
- [Jobs application](https://tmt.spotapps.co/job-listings?spot_id=86296&source=footer)
- [About](https://waterloolouisville.com/louisville-the-waterloo-about)

The source gift card page says digital gift cards are coming soon. No merchandise catalog or prices were found, so this site directs merchandise inquiries to the restaurant. The website jobs list includes Busser and Hostess as requested; the external careers form is managed separately.

This is a static website draft prepared for Cloudflare Pages. Gift card purchases and job applications use the restaurant’s existing pages. There is no checkout, application storage, or backend. The public site is https://waterloo-louisville.pages.dev/. Updates are deployed through the existing Cloudflare Pages project.

## Validate

```sh
npm run check
npm test
```

## Soup sizes and salad options

All four main soups offer Cup $8.00 and Bowl $10.00, labeled individually. The smaller-portions side of tomato bisque retains its separate $2 price. Infamous Poppers displays an italic **Extremely Hot** label. Salads have dressings on the left and priced protein options on the right, with avocado listed separately under Extras. These approved changes survive source refreshes.

## Automatic specials dates

Specials are a recurring weekly schedule. `schedule.js` maps weekday offers onto today and the next six calendar dates in `America/Denver`, starting with Today. The page schedules its next refresh at midnight in Louisville and also checks when the tab becomes visible or focused. A tab left open overnight rotates the seven-day queue, with today first and yesterday last. It handles DST, month/year changes, and Sunday/Monday transitions without a backend, scheduled task, or new deployment.

Only the displayed dates and weekday ordering update automatically. Food offers and prices do not get invented or fetched on every visit. To change actual offers, update the content or run `npm run sync-content`, then rebuild and redeploy. The menu-refreshed date remains separate from the displayed calendar dates.

## Cloudflare Pages (free static hosting)

```sh
npm run check
npm test
npm run build
```

Upload only `dist/`. It contains the public website files and image assets. The build includes the supplied logo, matching favicons, food photos, and restaurant photos. It excludes the repository, Python scripts, Node development server, editorial configuration, documentation, and credentials.

Suggested project name: `waterloo-louisville`. The intended free address is `waterloo-louisville.pages.dev`, subject to availability at project creation. This project is deployed and the address is live. A custom domain requires a domain you control.

For dashboard Direct Upload, create a Pages project and upload the `dist/` folder or a ZIP of its contents. For a Git-connected Pages project, use build command `npm run build` and output directory `dist`. The build itself does not need network access or a package installation. Cloudflare Direct Upload projects cannot later switch to Git integration; choose Git integration initially if automatic deployments on pushes are desired.

For CLI upload after authenticating to the intended Cloudflare account:

```sh
npx wrangler login
npm run deploy:cloudflare
```

The project name is set in `wrangler.jsonc` and the deploy script. If unavailable, choose another name in both places. The project was initially published through Cloudflare’s dashboard Direct Upload workflow. The CLI commands are an optional alternative for future updates.


Official documentation: [Pages Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/), [Free plan limits](https://developers.cloudflare.com/pages/platform/limits/), and [custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/).

## Brand and mobile refinements

The header and footer use the Waterloo logo supplied by the user; favicon and touch-icon files come from the same original restaurant site. Food photos, the bar interior, and the exterior are stored locally. Warm paper colors, denim accents, a record motif, and photo treatments add Texas and music cues while retaining the desktop layout. No third-party Johnny Cash portrait was added; the candidate checked had conflicting reuse notes.

At widths up to 700 px, navigation uses an expandable Explore menu and a fixed Menu / Drinks / Specials / Visit bar, with safe-area spacing, 44 px or larger primary touch targets, and 16 px search/select fields. Desktop navigation remains visible at wider widths. Google Maps and Apple Maps buttons open pins at 817 Main Street, Louisville, CO 80027.

Happy hour house margaritas are $5 Sunday–Friday during happy hour and all day Saturday. Monday’s $1 discount applies to house and specialty margaritas and excludes happy hour pricing. The daily specials display no offer time ranges; happy hour retains its separate 3–6 PM schedule.

## Photographed menus — November 10, 2026

`photo-menus.json` is now authoritative for all drink sections, happy hour food, and daily specials. It contains 20 drink categories with 188 entries and 22 happy hour food/taco entries. Drinks not pictured were removed. The old website is no longer used to repopulate drinks or daily specials when `npm run sync-content` runs; only the general food menu is imported before local editorial changes are reapplied.

The Cash List uses a pink cover-style heading, dark panels, cream lettering, and script typography. Its five photographed cocktails are included. Fire Cracker lists orange in The Cash List and lemon in Old Fashioneds; both recipes are preserved as printed. Draft, bottle/can, and cider prices are unlisted because the photographs show none. Spirit/flavor names sharing a printed price are grouped together, with no additional flavors carried over.

The photographed happy hour menu replaces the old well/wine/draft deal cards. It includes $5 sliders, individually priced bites, and six $3 à la carte tacos. The previously confirmed $5 house margarita offer remains Sunday–Friday during happy hour, and all day Saturday. The obsolete $5/$7 house wine discrepancy notice was removed because neither old wine deal is carried over.

Daily specials follow the photographed weekday list. Tuesday’s quesabirria special is two tacos; this does not change the three-taco servings on the main menu. Sunday brunch is 10 AM–2 PM as printed in the new photo, while the other specials retain no separate time rows. Weekday queue rotation still runs at Louisville midnight.

Busser and Hostess appear on the website’s jobs list. The application link still goes to the restaurant’s externally managed careers form; the page directs applicants to mention those roles in the cover letter or call if a checkbox is missing.

`npm test` now runs both the calendar checks and photo-menu regression checks. The photo tests protect against restoring retired drinks, inventing beer prices, changing individual taco portions, or losing the weekday keys.

## Security and privacy

The site stays public without visitor accounts. `_headers` applies the browser security
policy on Cloudflare Pages, and the development server mirrors it for verification.
The Privacy link explains hosting and external services without adding tracking.

Run `npm run backup` before a reviewed deployment to save editable source and a validated
public build. Run `npm run security:live` after deployment or for an on-demand availability
and integrity check against your current build. See `SECURITY.md` for account protection,
rollback instructions, private-file exclusions, and the limits of local backups.
