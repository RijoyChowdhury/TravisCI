const { clearHash } = require('../services/cache');

module.exports = async (req, res, next) => {
  // this will allow the route handler
  // to run first and then come back
  // to this point
  await next();
  clearHash(req.user.id);
};
