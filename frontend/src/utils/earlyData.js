/**
 * Requests started before the page that needs them has been downloaded, so the download and the
 * request happen side by side instead of one after the other. The page picks its request up with
 * fromEarly(). A request nobody picked up within 15 seconds is dropped and the page asks again.
 */
const MAX_AGE = 15000;
const started = new Map();

/** Starts `request` (an API function taking no arguments) unless it was started a moment ago. */
export const startEarly = (request) => {
  if (!request) return;
  const entry = started.get(request);
  if (entry && Date.now() - entry.at < MAX_AGE) return;
  const promise = request();
  // The page that picks it up handles a failure; one nobody picks up is not an error
  promise.catch(() => {});
  started.set(request, { promise, at: Date.now() });
};

/** The early answer for `request` if there is one, otherwise a new request. */
export const fromEarly = (request) => {
  const entry = started.get(request);
  started.delete(request);
  return entry && Date.now() - entry.at < MAX_AGE ? entry.promise : request();
};

/** Signing out: nothing asked for the last person is handed to the next. */
export const clearEarly = () => started.clear();
