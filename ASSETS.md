# JWST cover images

All three candidate images were supplied by the organiser and compared for the homepage. The default is **Leo P**, selected for its dark areas and blue star field. Only the chosen background is loaded by the homepage; no carousel or flashing effects are used.

The original downloaded JPEGs are unchanged. The page crops them to fit and applies CSS brightness/saturation filters plus a dark gradient beneath the text. The cover shows a concise institution-only Credit line. It links to `/en/credits`, where full original attribution, source links, licence links and display-adjustment details remain available.

| Local file | Official source | Required credit |
| --- | --- | --- |
| `public/images/jwst-leo-p.jpg` | [Leo P](https://esawebb.org/images/LeoP/) | NASA, ESA, CSA, K. McQuinn (STScI), J. DePasquale (STScI) |
| `public/images/jwst-carina.jpg` | [Carina Nebula Jets](https://esawebb.org/images/carinanebula3/) | NASA, ESA, CSA, and STScI, J. DePasquale (STScI) |
| `public/images/jwst-macs0454.jpg` | [MACS J0454.1-0300](https://esawebb.org/images/potm2609a/) | ESA/Webb, NASA & CSA, L. Furtak, S. Fujimoto |

License: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), under the [ESA/Webb usage conditions](https://esawebb.org/copyright/). Downloaded 2026-11-15 from each page's official Screensize JPEG link (`https://cdn.esawebb.org/archives/images/screen/`). No ESA/Webb logos are used.

To change the background, select `heroBackgrounds.leoP`, `.carina`, or `.macs0454` in `src/lib/hero.ts`. The image, full credit, source link and crop position switch together. Recheck text readability after changing the selection. Display filters are defined in the final cover-image section of `src/app/[locale]/globals.css`.
