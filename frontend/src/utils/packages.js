// Item lines as the forms show them while you type. The backend (backend/src/utils/packages.js)
// works out the saved totals; this only previews them. Weight and price are for ONE item.

const number = (value) => (value === null || value === undefined || value === '' || Number.isNaN(Number(value)) ? null : Number(value));

export const lineLabel = (line) => {
  const what = line?.description || line?.packageType || 'Package';
  const type = line?.description && line?.packageType ? ` (${String(line.packageType).toLowerCase()})` : '';
  return `${Number(line?.quantity) || 1} × ${what}${type}`;
};

/** { items, weight, value } for the preview; value only when every line has a price. */
export const previewTotals = (lines = []) => {
  const filled = (lines || []).filter((line) => line && (line.description || line.packageType || number(line.weight) !== null));
  const items = filled.reduce((sum, line) => sum + (Math.floor(Number(line.quantity)) || 1), 0);
  const weighed = filled.filter((line) => number(line.weight) !== null);
  const weight = weighed.reduce((sum, line) => sum + number(line.weight) * (Math.floor(Number(line.quantity)) || 1), 0);
  const priced = filled.length > 0 && filled.every((line) => number(line.estimatedPrice) !== null);
  const value = priced ? filled.reduce((sum, line) => sum + number(line.estimatedPrice) * (Math.floor(Number(line.quantity)) || 1), 0) : null;
  return { items, weight: weighed.length ? weight : null, value };
};

/** How many items a job holds in all (from its lines, or its item count when it has none). */
export const itemCount = (job) => {
  const lines = Array.isArray(job?.packages) ? job.packages : [];
  return lines.length ? lines.reduce((sum, line) => sum + (Number(line.quantity) || 1), 0) : Number(job?.quantity) || 1;
};

/** A job's lines, or one line made from its description for jobs saved before lines existed. */
export const linesOf = (job) => {
  if (Array.isArray(job?.packages) && job.packages.length > 0) return job.packages;
  const quantity = Number(job?.quantity) || 1;
  return [{
    description: job?.description || '',
    quantity,
    weight: job?.weight ? Math.round((Number(job.weight) / quantity) * 100) / 100 : undefined,
    estimatedPrice: job?.value ? Math.round((Number(job.value) / quantity) * 100) / 100 : undefined,
  }];
};
