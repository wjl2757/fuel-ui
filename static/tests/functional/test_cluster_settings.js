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
import assert from 'intern/chai!assert';
import Common from 'tests/functional/pages/common';
import ClusterPage from 'tests/functional/pages/cluster';
import SettingsPage from 'tests/functional/pages/settings';
import ModalWindow from 'tests/functional/pages/modal';
import 'tests/functional/helpers';

registerSuite(() => {
  var common,
    clusterPage,
    settingsPage,
    modal,
    clusterName;

  return {
    name: 'Settings tab',
    setup() {
      common = new Common(this.remote);
      clusterPage = new ClusterPage(this.remote);
      settingsPage = new SettingsPage(this.remote);
      modal = new ModalWindow(this.remote);
      clusterName = common.pickRandomName('Test Cluster');

      return this.remote
        .then(() => common.getIn())
        .then(() => common.createCluster(clusterName))
        .then(() => clusterPage.goToTab('Settings'))
        // go to Storage subtab to use checkboxes for tests
        .clickLinkByText('Storage');
    },
    'Settings tab is rendered correctly'() {
      return this.remote
        .getCurrentUrl()
          .then((url) => {
            assert.include(
              url,
              'settings/storage',
              'Subtab url exists in the page location string'
            );
          })
        .clickLinkByText('Security')
        .getCurrentUrl()
          .then((url) => {
            assert.include(url, 'settings/security', 'Settings tab subtabs are routable');
          })
        .clickLinkByText('Storage')
        .assertElementNotExists('.nav .subtab-link-network',
          'Subtab for Network settings is not presented in navigation')
        .assertElementEnabled('.btn-load-defaults', 'Load defaults button is enabled')
        .assertElementDisabled('.btn-revert-changes', 'Cancel Changes button is disabled')
        .assertElementDisabled('.btn-apply-changes', 'Save Settings button is disabled');
    },
    'Check Save Settings button'() {
      return this.remote
        // introduce change
        .clickByCssSelector('input[type=checkbox]')
        .assertElementAppears('.btn-apply-changes:not(:disabled)', 200,
          'Save Settings button is enabled if there are changes')
        // reset the change
        .clickByCssSelector('input[type=checkbox]')
        .assertElementAppears('.btn-apply-changes:disabled', 200,
          'Save Settings button is disabled if there are no changes');
    },
    'Check Cancel Changes button'() {
      return this.remote
        // introduce change
        .clickByCssSelector('input[type=checkbox]')
        .waitForCssSelector('.btn-apply-changes:not(:disabled)', 200)
        // try to move out of Settings tab
        .clickLinkByText('Dashboard')
        // check if Discard Chasnges dialog appears
        .then(() => modal.waitToOpen())
        .then(() => modal.close())
        // reset changes
        .clickByCssSelector('.btn-revert-changes')
        .assertElementDisabled('.btn-apply-changes',
          'Save Settings button is disabled after changes were cancelled');
    },
    'Check changes saving'() {
      return this.remote
        .clickByCssSelector('input[type=checkbox]')
        .waitForCssSelector('.btn-apply-changes:not(:disabled)', 200)
        .clickByCssSelector('.btn-apply-changes')
        .then(() => settingsPage.waitForRequestCompleted())
        .assertElementDisabled('.btn-revert-changes',
          'Cancel Changes button is disabled after changes were saved successfully');
    },
    'Check loading of defaults'() {
      return this.remote
        .clickByCssSelector('.btn-load-defaults')
        .then(() => settingsPage.waitForRequestCompleted())
        .assertElementEnabled('.btn-apply-changes',
          'Save Settings button is enabled after defaults were loaded')
        .assertElementEnabled('.btn-revert-changes',
          'Cancel Changes button is enabled after defaults were loaded')
        .clickByCssSelector('.btn-revert-changes');
    },
    'The choice of subgroup is preserved when user navigates through the cluster tabs'() {
      return this.remote
        .clickLinkByText('Logging')
        .then(() => clusterPage.goToTab('Dashboard'))
        .then(() => clusterPage.goToTab('Settings'))
        .assertElementExists('.nav-pills li.active a.subtab-link-logging',
          'The choice of subgroup is preserved when user navigates through the cluster tabs');
    },
    'The page reacts on invalid input'() {
      return this.remote
        .clickLinkByText('General')
        // "nova" is forbidden username
        .setInputValue('[type=text][name=user]', 'nova')
        .assertElementAppears('.setting-section .form-group.has-error', 200,
          'Invalid field marked as error')
        .assertElementExists('.settings-tab .nav-pills > li.active i.glyphicon-danger-sign',
          'Subgroup with invalid field marked as invalid')
        .assertElementDisabled('.btn-apply-changes',
          'Save Settings button is disabled in case of validation error')
        // revert the change
        .clickByCssSelector('.btn-revert-changes')
        .assertElementNotExists('.setting-section .form-group.has-error',
          'Validation error is cleared after resetting changes')
        .assertElementNotExists('.settings-tab .nav-pills > li.active i.glyphicon-danger-sign',
          'Subgroup menu has default layout after resetting changes');
    },
    'Test repositories custom control'() {
      var repoAmount;
      return this.remote
        .clickLinkByText('General')
        // get amount of default repositories
        .findAllByCssSelector('.repos .form-inline')
          .then((elements) => {
            repoAmount = elements.length;
          })
          .end()
        .assertElementNotExists('.repos .form-inline:nth-of-type(1) .btn-link',
          'The first repo can not be deleted')
        // delete some repo
        .clickByCssSelector('.repos .form-inline .btn-link')
        .then(
          () => this.remote.assertElementsExist(
            '.repos .form-inline',
            repoAmount - 1,
            'Repo was deleted'
          )
        )
        // add new repo
        .clickByCssSelector('.btn-add-repo')
        .then(
          () => this.remote.assertElementsExist(
            '.repos .form-inline',
            repoAmount,
            'New repo placeholder was added'
          )
        )
        .assertElementExists('.repos .form-inline .repo-name.has-error',
          'Empty repo marked as invalid')
        .clickByCssSelector('.btn-revert-changes');
    }
  };
});
