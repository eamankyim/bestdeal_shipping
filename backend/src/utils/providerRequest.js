// One HTTP call to a messaging provider, with a time limit and errors an admin can understand.

const TIMEOUT_MS = 10000;

const providerRequest = async (provider, url, options) => {
  let response;
  try {
    response = await fetch(url, { ...options, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (error) {
    throw new Error(
      error.name === 'TimeoutError'
        ? `${provider} did not answer in time, so this message may or may not have been sent`
        : `Could not reach ${provider}`
    );
  }
  const data = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, data };
};

module.exports = { providerRequest };
