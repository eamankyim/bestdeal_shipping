// Work that must not hold up the answer to the person who clicked (customer texts and emails,
// staff notifications) starts right after the response is sent. A failure is logged and never
// affects the change itself, which is already saved.

const pending = new Set();

/** Runs `task` after the current request has answered. */
const runLater = (label, task) => {
  const promise = new Promise((resolve) => setImmediate(resolve))
    .then(task)
    .catch((error) => console.error(`⚠️ ${label} failed:`, error?.message || error))
    .finally(() => pending.delete(promise));
  pending.add(promise);
};

/** Waits until every background task has finished (on shutdown, and in tests). */
const drain = async () => {
  while (pending.size > 0) await Promise.all([...pending]);
};

module.exports = { runLater, drain };
