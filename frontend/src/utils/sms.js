// How a text is billed. Plain (GSM) texts fit 160 characters, or 153 per part when longer.
// Any other character, such as an emoji or ɛ, drops the whole text to 70, or 67 per part.

const GSM = '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà';
const GSM_DOUBLE = '^{}\\[~]|€'; // each takes two characters

export const countSmsParts = (text) => {
  const value = String(text || '');
  const characters = [...value];
  const isGsm = characters.every((character) => GSM.includes(character) || GSM_DOUBLE.includes(character));
  const length = isGsm
    ? characters.reduce((total, character) => total + (GSM_DOUBLE.includes(character) ? 2 : 1), 0)
    : value.length;
  const [single, multiple] = isGsm ? [160, 153] : [70, 67];
  return { length, isGsm, parts: length === 0 ? 0 : length <= single ? 1 : Math.ceil(length / multiple) };
};

/** Fill in the placeholders with example values. */
export const previewMessage = (template, placeholders = []) =>
  String(template || '').replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => placeholders.find((item) => item.key === key)?.sample ?? match);
