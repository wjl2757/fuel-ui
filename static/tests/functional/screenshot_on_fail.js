/*
 * Copyright 2015 Mirantis, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License. You may obtain
 * a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 **/

import fs from 'intern/dojo/node!fs';

var ScreenshotOnFailReporter = function() {
  this.remotes = {};
};

ScreenshotOnFailReporter.prototype = {
  saveScreenshot(testOrSuite) {
    var remote = this.remotes[testOrSuite.sessionId];
    if (remote) {
      remote.takeScreenshot().then((buffer) => {
        var targetDir = process.env.ARTIFACTS || process.cwd();
        var filename = testOrSuite.id + ' - ' + new Date().toTimeString();
        filename = filename.replace(/[\s\*\?\\\/]/g, '_');
        filename = targetDir + '/' + filename + '.png';
        fs.writeFile(filename, buffer, (err) => {
          if (err) throw err;
          console.log('Saved screenshot to', filename); // eslint-disable-line no-console
        });
      });
    }
  },
  sessionStart(remote) {
    var sessionId = remote._session._sessionId;
    this.remotes[sessionId] = remote;
  },
  suiteError(suite) {
    this.saveScreenshot(suite);
  },
  testFail(test) {
    this.saveScreenshot(test);
  }
};

export default ScreenshotOnFailReporter;
