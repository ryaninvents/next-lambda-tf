import ConsumerModel from './Consumer';

const models = {
  Consumer: ConsumerModel
};

if (process.env.NODE_ENV !== 'production') {
  // Dynamically require development models.
  // It's an ugly hack, but it allows for easier local
  // development without adding to final bundle size.
  Object.keys(models).forEach((modelName) => {
    console.log(modelName);
    models[modelName] = require(`./dev/${modelName}`).default;
    if (typeof models[modelName].init === 'function') {
      models[modelName].init();
    }
  });
}

export const Consumer = models.Consumer;
