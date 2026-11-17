export const heroBackgrounds = {
  leoP: {src: '/images/jwst-leo-p.jpg', title: 'Leo P · JWST / NIRCam', source: 'https://esawebb.org/images/LeoP/', institutions: 'NASA, ESA, CSA, STScI', credit: 'NASA, ESA, CSA, K. McQuinn (STScI), J. DePasquale (STScI)', position: 'center 65%'},
  carina: {src: '/images/jwst-carina.jpg', title: 'Carina Nebula · JWST / NIRCam', source: 'https://esawebb.org/images/carinanebula3/', institutions: 'NASA, ESA, CSA, STScI', credit: 'NASA, ESA, CSA, and STScI, J. DePasquale (STScI)', position: 'center 55%'},
  macs0454: {src: '/images/jwst-macs0454.jpg', title: 'MACS J0454.1-0300 · JWST / NIRCam', source: 'https://esawebb.org/images/potm2609a/', institutions: 'ESA/Webb, NASA, CSA', credit: 'ESA/Webb, NASA & CSA, L. Furtak, S. Fujimoto', position: 'center 45%'}
} as const;
// Change this selection to try another locally stored, credited image.
export const heroBackground = heroBackgrounds.leoP;
