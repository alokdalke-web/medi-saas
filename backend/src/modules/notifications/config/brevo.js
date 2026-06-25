const { BrevoClient } = require('@getbrevo/brevo');

// We use a getter function to instantiate the client lazily 
// ensuring process.env variables are fully loaded beforehand.
const getBrevoClient = () => {
  return new BrevoClient({ apiKey: process.env.BREVO_API_KEY || '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' });
};

module.exports = {
  getBrevoClient
};
