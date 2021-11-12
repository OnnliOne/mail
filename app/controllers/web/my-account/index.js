const createDomainBilling = require('./create-domain-billing');
const listAliases = require('./list-aliases');
const listBilling = require('./list-billing');
const listDomains = require('./list-domains');
const manageBilling = require('./manage-billing');
const retrieveBilling = require('./retrieve-billing');
const retrieveDomainBilling = require('./retrieve-domain-billing');
const updateProfile = require('./update-profile');

module.exports = {
  createDomainBilling,
  listAliases,
  listBilling,
  listDomains,
  manageBilling,
  retrieveBilling,
  retrieveDomainBilling,
  updateProfile
};
