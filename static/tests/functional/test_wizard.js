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
import Common from 'tests/functional/pages/common';
import Modal from 'tests/functional/pages/modal';
import 'tests/functional/helpers';

registerSuite(() => {
  var common,
    modal;

  return {
    name: 'Wizard Page',
    setup() {
      common = new Common(this.remote);
      modal = new Modal(this.remote);
      return this.remote
        .then(() => common.getIn());
    },
    beforeEach() {
      var clusterName = common.pickRandomName('Temp');
      return this.remote
        .clickByCssSelector('.create-cluster')
        .then(() => modal.waitToOpen())
        .setInputValue('[name=name]', clusterName);
    },
    afterEach() {
      return this.remote
        .then(() => modal.close());
    },
    'Test steps manipulations'() {
      return this.remote
        .assertElementExists('.wizard-step.active',
          'There is only one active and available step at the beginning')
        // Compute
        .pressKeys('\uE007')
        // Network
        .pressKeys('\uE007')
        // Storage
        .pressKeys('\uE007')
        // Additional Services
        .pressKeys('\uE007')
        // Finish
        .pressKeys('\uE007')
        .assertElementsExist('.wizard-step.available', 5, 'All steps are available at the end')
        .clickLinkByText('Compute')
        .clickByCssSelector('input[name=hypervisor\\:qemu]')
        .assertElementExists('.wizard-step.available',
          'Only one step is available after changing hypervisor');
    },
    'Test Compute pane: next button is disabled by when no hypervisor selected'() {
      return this.remote
        .pressKeys('\uE007')
        .clickByCssSelector('input[name=hypervisor\\:qemu]')
        .assertElementExists('.wizard-compute-pane .alert.empty-choice',
          'There should be the warning when no hypervisors selected')
        .assertElementDisabled('.next-pane-btn', 'Next button should be disabled');
    }
  };
});
