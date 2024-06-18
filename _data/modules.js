const _ = require('lodash');

module.exports = async (data) => {
  const { modules } = data;

  return {
    list: modules,
    downloads: {
      current: _(modules)
        .filter(({ blueprints }) => !_.isEmpty(blueprints))
        .map(({ blueprints, name, photos, shortDescription, slug }) => {
          const current = _.find(blueprints, { current: true });
          current.module = { name, photos, shortDescription, slug };
          return current;
        })
        .value(),
    },
  };
};
