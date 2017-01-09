'use babel';

import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import CSONParser from 'cson-parser';

import log from './log';

const PROJECT_CONFIG_FILE = 'hydrogen.cson';

function execInitFiles(kernel, files) {
  if (_.isEmpty(files)) return;

  const file = files.shift();
  fs.readFile(file, 'utf8', (e, code) => {
    if (e) log('init: error:', e);
    if (!code || e) return;

    kernel.execute(code, (result) => {
      log('init: result', result);
      execInitFiles(kernel, files);
    });
  });
}

export default function kernelInit(kernel) {
  _.map(atom.project.getPaths(), (projectRoot) => {
    let config;
    try {
      config = CSONParser.parse(fs.readFileSync(projectRoot + path.sep + PROJECT_CONFIG_FILE));
    } catch (e) {
      log(e);
      return;
    }
    const cfg = config.init[kernel.kernelSpec.display_name]
    cfg.files = _.map(cfg.files, f => projectRoot + path.sep + f);
    const { files, code } = config.init[kernel.kernelSpec.display_name];
    if (code) {
      kernel.execute(code, () => execInitFiles(kernel, files));
    } else {
      execInitFiles(kernel, files);
    }
  });
}