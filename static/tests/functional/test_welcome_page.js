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

import registerSuite from 'intern!object';
import LoginPage from 'tests/functional/pages/login';
import WelcomePage from 'tests/functional/pages/welcome';
import 'tests/functional/helpers';

registerSuite(() => {
  var loginPage,
    welcomePage;

  return {
    name: 'Welcome page',
    setup() {
      loginPage = new LoginPage(this.remote);
      welcomePage = new WelcomePage(this.remote);
    },
    'Skip welcome page'() {
      return this.remote
      .then(() => loginPage.login())
      .then(() => welcomePage.skip(true))
      .assertElementNotExists('.welcome-button-box button', 'Welcome screen skipped');
    }
  };
});
