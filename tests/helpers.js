function normalize(str) {
  return str.trim().replace(/\r?\n|\r/g, '');
}

module.exports = {
  normalize,
}
