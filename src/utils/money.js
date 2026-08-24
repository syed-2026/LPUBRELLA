// All money is stored and manipulated as integer paise (1 INR = 100 paise).
// Never use floating point for currency.

function paiseToRupeesDisplay(paise) {
  if (!Number.isInteger(paise)) {
    throw new TypeError('paise must be an integer');
  }
  const rupees = Math.trunc(paise / 100);
  const remainder = Math.abs(paise % 100)
    .toString()
    .padStart(2, '0');
  return `₹${rupees}.${remainder}`;
}

function isValidPaise(value) {
  return Number.isInteger(value) && value >= 0;
}

module.exports = { paiseToRupeesDisplay, isValidPaise };
