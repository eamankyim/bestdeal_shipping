// A job's contents, as item lines: { description, packageType, quantity, weight, estimatedPrice }.
// `weight` (kg) and `estimatedPrice` (£) are for ONE item, so a line of 3 boxes weighs 3 × weight.
// Older lines without a quantity count as one item, so totals for them are unchanged.

const number = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

const round2 = (value) => Math.round(value * 100) / 100;

/** Clean item lines; empty lines are dropped. Other fields on a line (dimensions…) are kept. */
const normalizeLines = (lines) =>
  (Array.isArray(lines) ? lines : [])
    .filter((line) => line && typeof line === 'object')
    .map((line) => ({
      ...line,
      description: String(line.description || '').trim(),
      packageType: String(line.packageType || '').trim() || null,
      quantity: Math.max(1, Math.floor(Number(line.quantity) || 1)),
      weight: number(line.weight),
      estimatedPrice: number(line.estimatedPrice),
    }))
    .filter((line) => line.description || line.packageType || line.weight !== null || line.estimatedPrice !== null);

/** "3 × Sugar (box)" */
const lineLabel = (line) => {
  const what = line.description || line.packageType || 'Package';
  const type = line.description && line.packageType ? ` (${line.packageType.toLowerCase()})` : '';
  return `${line.quantity} × ${what}${type}`;
};

/** "3 × Sugar (box), 1 × Soap (box)" */
const describeLines = (lines) => normalizeLines(lines).map(lineLabel).join(', ');

/**
 * What the job's own fields should say for these lines: how many items, total weight, total
 * price (only when every line has a price), and the description.
 */
const lineTotals = (lines) => {
  const clean = normalizeLines(lines);
  const quantity = clean.reduce((sum, line) => sum + line.quantity, 0);
  const weighed = clean.filter((line) => line.weight !== null);
  const priced = clean.filter((line) => line.estimatedPrice !== null);
  return {
    quantity: quantity || 1,
    weight: weighed.length ? round2(weighed.reduce((sum, line) => sum + line.weight * line.quantity, 0)) : null,
    value: clean.length > 0 && priced.length === clean.length ? round2(priced.reduce((sum, line) => sum + line.estimatedPrice * line.quantity, 0)) : null,
    description: clean.map(lineLabel).join(', '),
  };
};

/**
 * Splits lines by how many of each go now (`going[i]` for line i). Returns { now, later }, or
 * { error } when the numbers don't fit. A line can be split too (2 of 3 boxes now, 1 later).
 */
const splitLines = (lines, going) => {
  const clean = normalizeLines(lines);
  if (clean.length === 0) return { error: 'This job has no item lines to split. Add its items first.' };
  if (!Array.isArray(going) || going.length !== clean.length) return { error: 'Say how many of each item go now' };
  const counts = going.map((value) => Number(value));
  for (const [index, count] of counts.entries()) {
    if (!Number.isInteger(count) || count < 0 || count > clean[index].quantity) {
      return { error: `"${lineLabel(clean[index])}": choose between 0 and ${clean[index].quantity}` };
    }
  }
  const now = clean.map((line, index) => ({ ...line, quantity: counts[index] })).filter((line) => line.quantity > 0);
  const later = clean.map((line, index) => ({ ...line, quantity: line.quantity - counts[index] })).filter((line) => line.quantity > 0);
  if (now.length === 0) return { error: 'Choose at least one item to send now' };
  return { now, later };
};

/**
 * A job's price split between the part that goes now and the part that waits: from the item
 * prices when every line has one, otherwise in proportion to weight (or to the number of items).
 */
const splitValue = (value, lines, now, later) => {
  const priced = lineTotals(now).value;
  if (priced !== null && lineTotals(later).value !== null) return { now: priced, later: lineTotals(later).value };
  if (value === null || value === undefined) return { now: null, later: null };
  const total = Number(value);
  const nowTotals = lineTotals(now);
  const allTotals = lineTotals(lines);
  const share = allTotals.weight && nowTotals.weight !== null
    ? nowTotals.weight / allTotals.weight
    : nowTotals.quantity / allTotals.quantity;
  const nowValue = round2(total * share);
  return { now: nowValue, later: round2(total - nowValue) };
};

module.exports = { normalizeLines, lineLabel, describeLines, lineTotals, splitLines, splitValue };
