function normalize(str) {
  return str.trim().replace(/\r\n/g, "\n");
}

module.exports = {
  normalize,
}
