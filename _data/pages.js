const _ = require('lodash');

const pages = [
  {
    id: 'systems',
    label: 'Ship Systems',
    title: 'Ship Systems',
    subPages: [
      {
        id: 'systems/power',
        label: 'Power and Fuel Systems',
        title: 'Power and Fuel Systems',
        slug: 'systems/power',
        keywords:
          'refuel power fuel rod backup fueltime generator min gen shutdown battery tank',
      },
      {
        id: 'systems/propellant',
        label: 'Propellant Systems',
        title: 'Propellant Systems',
        slug: 'systems/propellant',
        keywords: 'refill propellant resource bridge flow in out proptime tank',
      },
      {
        id: 'systems/utility',
        label: 'Utility Systems',
        title: 'Utility Systems',
        slug: 'systems/utility',
        keywords: 'timer odometer transponder ping',
      },
    ],
  },
  {
    id: 'commissions',
    label: 'Ship Commissions',
    title: 'Ship Commissions',
    slug: 'commissions',
  },
  {
    id: 'rentals',
    label: 'Ship Rentals',
    title: 'Ship Rentals',
    slug: 'rentals',
  },
  { id: 'faq', label: 'FAQ', title: 'Frequently Asked Questions', slug: 'faq' },
];

module.exports = ({ pathPrefix }) => {
  return {
    list: _.map(pages, (page) => {
      page.webPath = `${pathPrefix}pages/${page.slug}`;
      return page;
    }),
    full: _(pages)
      .flatMap((page) => page.subPages || [page])
      .map((page) => {
        page.webPath = `${pathPrefix}pages/${page.slug}`;
        return page;
      })
      .value(),
  };
};
