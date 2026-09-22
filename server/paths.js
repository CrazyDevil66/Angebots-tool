const path = require('path');

function dataDir() {
  return process.env.DATA_DIR || path.join(__dirname, '..', 'data');
}

const DIST_DIR = path.join(__dirname, '..', 'dist');

module.exports = { dataDir, DIST_DIR };
