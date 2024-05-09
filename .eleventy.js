const _ = require('lodash');
const nconf = require('nconf');
const path = require('path');
const markdownItGithubHeading = require('markdown-it-github-headings');
const { EleventyRenderPlugin } = require('@11ty/eleventy');
const { Octokit } = require('@octokit/rest');

require('./config');

process.env.NODE_ENV ??= 'development';

const repoConfig = {
  owner: nconf.get('repo:owner'),
  repo: nconf.get('repo:name'),
};
const octokit = new Octokit({ auth: nconf.get('repo:token') });

const extendShipContent = async (ship) => {
  await Promise.all(
    _.map(
      ['changelog', 'faq', 'featureList', 'knownIssues', 'usage'],
      (field) =>
        (async () => {
          if (!ship[field]) return;
          const {
            data: { content },
          } = await octokit.rest.repos.getContent({
            ...repoConfig,
            path: path.join(ship.path, ship[field].path),
          });
          ship[field].content =
            '\n' + Buffer.from(content, 'base64').toString();
        })(),
    ),
  );
};

const getShipsData = async ({ pathPrefix }) => {
  const { data: files } = await octokit.rest.repos.getContent(repoConfig);

  const ships = await Promise.all(
    _(files)
      .filter({ type: 'dir' })
      .map((dir) =>
        (async () => {
          const shipFilePath = path.join(dir.path, 'ship.json');

          let ship;
          try {
            const { data: shipFile } = await octokit.rest.repos.getContent({
              ...repoConfig,
              path: shipFilePath,
            });

            ship = JSON.parse(
              Buffer.from(shipFile.content, 'base64').toString(),
            );
            await extendShipContent(ship);
            ship.webPath = `${pathPrefix}ships/${ship.slug}`;
          } catch {
            return [];
          }

          const premiumShipFilePath = path.join(
            dir.path,
            'premium',
            'ship.json',
          );

          let premiumShip;
          try {
            const { data: premiumShipFile } =
              await octokit.rest.repos.getContent({
                ...repoConfig,
                path: premiumShipFilePath,
              });

            premiumShip = JSON.parse(
              Buffer.from(premiumShipFile.content, 'base64').toString(),
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
    '../../others/egotech/logos': 'images/logos',
  });

  eleventyConfig.addGlobalData('environment', () => process.env.NODE_ENV);
  eleventyConfig.addGlobalData('pathPrefix', () => eleventyConfig.pathPrefix);
  eleventyConfig.addGlobalData('year', () => new Date().getFullYear());
  eleventyConfig.addGlobalData('ships', async () =>
    getShipsData(eleventyConfig),
  );
};
