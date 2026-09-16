const { sendError } = require('../utils/responseUtils');

// Keep package totals authoritative for both clients. Legacy single-package
// payloads remain supported until all installed mobile versions are updated.
module.exports = (req, res, next) => {
  const details = req.body.parcelDetails;
  if (!details || details.packages === undefined) return next();
  if (!Array.isArray(details.packages)) return sendError(res, 400, 'Packages must be an array');
  for (const pkg of details.packages) {
    if (!pkg || typeof pkg !== 'object' || Array.isArray(pkg)) return sendError(res, 400, 'Invalid package');
    for (const key of ['weight', 'estimatedPrice']) {
      if (pkg[key] !== undefined && pkg[key] !== null && (!Number.isFinite(Number(pkg[key])) || Number(pkg[key]) < 0)) {
        return sendError(res, 400, `Package ${key} must be a non-negative number`);
      }
    }
    for (const key of ['description', 'packageType']) {
      if (pkg[key] !== undefined && typeof pkg[key] !== 'string') return sendError(res, 400, `Invalid package ${key}`);
    }
  }
  if (details.packages.length) {
    details.quantity = details.packages.length;
    details.weight = details.packages.reduce((sum, pkg) => sum + Number(pkg.weight || 0), 0) || null;
    if (details.packages.some(pkg => pkg.estimatedPrice != null)) {
      details.value = Math.round(details.packages.reduce((sum, pkg) => sum + Number(pkg.estimatedPrice || 0), 0) * 100) / 100;
    }
  }
  next();
};
