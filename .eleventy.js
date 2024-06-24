const _ = require('lodash');
const fs = require('fs');
const nconf = require('nconf');
const path = require('path');
const markdownItGithubHeading = require('markdown-it-github-headings');
const { EleventyRenderPlugin } = require('@11ty/eleventy');

require('./config');

process.env.NODE_ENV ??= 'development';

const shipsBasePath = path.join(__dirname, nconf.get('ships:basePath'));

const extendShipContent = async (ship) => {
  await Promise.all(
    _.map(
      ['changelog', 'faq', 'featureList', 'knownIssues', 'usage'],
      (field) =>
        (async () => {
          if (!ship[field]) return;
          const content = fs.readFileSync(
            path.join(shipsBasePath, ship.path, ship[field].path),
          );

          let contentString = Buffer.from(content, 'base64').toString();
          ship[field].content = '\n' + contentString;
        })(),
    ),
  );
};

const getShipsData = async ({ pathPrefix }) => {
  const files = fs.readdirSync(shipsBasePath, { withFileTypes: true });

  const ships = await Promise.all(
    _(files)
      .filter((file) => file.isDirectory())
      .map((dir) =>
        (async () => {
          const shipFilePath = path.join(shipsBasePath, dir.name, 'ship.json');

          let ship;
          try {
            const shipFile = fs.readFileSync(shipFilePath);

            ship = JSON.parse(Buffer.from(shipFile, 'base64').toString());
            await extendShipContent(ship);
            ship.webPath = `${pathPrefix}ships/${ship.slug}`;
          } catch {
            return [];
          }

          const premiumShipFilePath = path.join(
            shipsBasePath,
            dir.name,
            'premium',
            'ship.json',
          );

          let premiumShip;
          try {
            const premiumShipFile = fs.readFileSync(premiumShipFilePath);

            premiumShip = JSON.parse(
              Buffer.from(premiumShipFile, 'base64').toString(),
            );
            await extendShipContent(premiumShip);
            premiumShip.webPath = `${pathPrefix}ships/${premiumShip.slug}`;
            return [ship, premiumShip];
          } catch {
            return [ship];
          }
        })(),
      )
      .value(),
  );
  return _(ships).flatten().compact().orderBy('name').value();
};

const getModulesData = async ({ pathPrefix }) => {
  const modulesPath = path.join(shipsBasePath, nconf.get('ships:modulesPath'));
  const files = fs.readdirSync(modulesPath, { withFileTypes: true });

  const modules = await Promise.all(
    _(files)
      .filter((file) => file.isDirectory())
      .map((dir) =>
        (async () => {
          const shipFilePath = path.join(modulesPath, dir.name, 'ship.json');

          let module;
          try {
            const shipFile = fs.readFileSync(shipFilePath);

            module = JSON.parse(Buffer.from(shipFile, 'base64').toString());
            module.webPath = `${pathPrefix}modules/${module.slug}`;
          } catch {
            return;
          }
          return module;
        })(),
      )
      .value(),
  );
  return _(modules).compact().orderBy('name').value();
};

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(EleventyRenderPlugin);

  eleventyConfig.amendLibrary('md', (mdLib) =>
    mdLib.use(markdownItGithubHeading, {
      prefixHeadingIds: false,
      enableHeadingLinkIcons: false,
    }),
  );

  eleventyConfig.addPassthroughCopy({
    './_includes/assets/CNAME': 'CNAME',

    './node_modules/@nordhealth/css/lib/nord.min.css': 'css/nord.min.css',
    './node_modules/@nordhealth/themes/lib/nord-dark.css': 'css/nord-dark.css',
    './node_modules/@splidejs/splide/dist/css/splide.min.css':
      'css/splide.min.css',
    './node_modules/@nordhealth/fonts/lib/': 'css/fonts',

    './_includes/assets/js/nord-components.js': 'js/nord-components.js',
    './node_modules/@splidejs/splide/dist/js/splide.min.js': 'js/splide.min.js',
    './node_modules/@fortawesome/fontawesome-free/js/all.min.js':
      'js/fontawesome.min.js',
    './node_modules/qs/dist/qs.js': 'js/qs.js',

    './_includes/assets/css/custom.css': 'css/custom.css',

    './_includes/images': 'images',
  });

  eleventyConfig.addGlobalData('environment', () => process.env.NODE_ENV);
  eleventyConfig.addGlobalData('pathPrefix', () => eleventyConfig.pathPrefix);
  eleventyConfig.addGlobalData('year', () => new Date().getFullYear());
  eleventyConfig.addGlobalData('specIcons', () => ({
    crafting: 'fa-solid fa-wrench',
    flight: 'fa-solid fa-space-shuttle',
    utility: 'fa-solid fa-gear',
  }));
  eleventyConfig.addGlobalData('ships', async () =>
    getShipsData(eleventyConfig),
  );
  eleventyConfig.addGlobalData('modules', async () =>
    getModulesData(eleventyConfig),
  );
};
