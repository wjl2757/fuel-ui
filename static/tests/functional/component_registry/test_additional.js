/*
 * Copyright 2016 Mirantis, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License. You may obtain
 * a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
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
import 'tests/functional/component_registry/component_helpers';

registerSuite(() => {
  var common, modal;

  return {
    name: 'Additional components',
    setup() {
      common = new Common(this.remote);
      modal = new Modal(this.remote);
      return this.remote
       .then(() => common.getIn());
    },
    afterEach() {
      return this.remote
        .pressKeys('\uE007') // Create
        .then(() => modal.waitToClose())

        // Delete created environment
        .deleteCluster(modal)
        .catch(() => modal.close().then(() => modal.waitToClose()));
    },
    'Test additional, -network, !vmware, !dvs, +Sahara'() {
      var smile = 'input[value=additional_service\\:smile]';
      var ml2 = 'input[value=network\\:neutron\\:core\\:ml2]';
      var vlan = 'input[value=network\\:neutron\\:ml2\\:vlan]';

      return this.remote
       .updatePlugin('dvs_default test_addit_smile')
       .newClusterFillName(modal)

       .pressKeys('\uE007') // go to Compute
       .clickByCssSelector('input[value=hypervisor\\:vmware]')
       .assertNextButtonEnabled()
       .pressKeys('\uE007') // Networking

        //Check that smile is disabled when Nova network is enabled
       .clickByCssSelector('input[value=network\\:nova_network]')
       .assertNextButtonEnabled()
       .pressKeys('\uE007') // Storage
       .pressKeys('\uE007') // Additional Services
       .assertElementDisabled(smile, 'Smile checkbox is enabled with Nova network')

       .clickByCssSelector('button.prev-pane-btn') // back to Storage
       .clickByCssSelector('button.prev-pane-btn') // back to Networking

       // Check that smile is disabled when dvs network is disabled
       .clickByCssSelector(ml2)
       .clickByCssSelector(vlan)
       .assertNextButtonEnabled()
       .pressKeys('\uE007') // Storage
       .pressKeys('\uE007') // Additional Services
       .assertElementDisabled(smile, 'Smile checkbox is enabled without dvs network')

       .clickByCssSelector('button.prev-pane-btn') // back to Storage
       .clickByCssSelector('button.prev-pane-btn') // back to Networking

       // Create cluster with vCenter + Neutron with ML2 plugin + dvs + Sahara + smile
       .clickByCssSelector(ml2)
       .clickByCssSelector(vlan)
       .clickByCssSelector('input[value=network\\:neutron\\:ml2\\:dvs]')
       .assertNextButtonEnabled()
       .pressKeys('\uE007') // Storage
       .pressKeys('\uE007') // Additional Services
       .clickByCssSelector('input[value=additional_service\\:sahara]')
       .clickByCssSelector(smile)
       .pressKeys('\uE007'); // Finish
    },
    'Test additional, -Ceilometer, !Murano, +Sahara'() {
      var smile = 'input[value=additional_service\\:smile]';
      var ceilometer = 'input[value=additional_service\\:ceilometer]';

      return this.remote
        .updatePlugin('dvs_default test_addit_smile_ceil')
        .newClusterFillName(modal)

        .pressKeys('\uE007') // go to Compute
        .assertNextButtonEnabled()
        .pressKeys('\uE007') // Networking
        .assertNextButtonEnabled()
        .pressKeys('\uE007') // Storage
        .pressKeys('\uE007') // Additional Services

        // Check that smile is disabled when Murano is not enabled (by default)
        .assertElementDisabled(smile, 'Smile is enabled without Murano')

        // Check that smile is not compatible with Ceilometer
        .clickByCssSelector('input[value=additional_service\\:murano]') // enable required Murano
        .clickByCssSelector(ceilometer)
        .assertElementDisabled(smile, 'Smile is enabled with Ceilometer')
        .clickByCssSelector(ceilometer) // disable Ceilometer
        .clickByCssSelector(smile)
        .assertElementDisabled(ceilometer, 'Ceilometer is enabled with smile')
        .assertElementsExist('i.tooltip-icon.glyphicon-warning-sign' +
                   '[data-original-title="Not compatible with smile"]', 1,
                   'No warning that Ceilometer is not compatible with smile')

        // Create cluster with smile + murano
        .pressKeys('\uE007'); // Finish
    },
    'Test additional, -Ironic, !Sahara, +Murano'() {
      var smile = 'input[value=additional_service\\:smile]';
      var ironic = 'input[value=additional_service\\:ironic]';

      return this.remote
        .updatePlugin('dvs_default test_addit_smile_ironic')
        .newClusterFillName(modal)

        .pressKeys('\uE007')  // go to Compute
        .assertNextButtonEnabled()
        .pressKeys('\uE007')  // Networking
        .assertNextButtonEnabled()
        .pressKeys('\uE007')  // Storage
        .pressKeys('\uE007')  // Additional Services

        // Check that smile is disabled when Sahara is not enabled (by default)
        .assertElementDisabled(smile, 'Smile is enabled without Sahara')

        // Check that smile is not compatible with Ironic
        .clickByCssSelector('input[value=additional_service\\:sahara]')  // enable required Sahara
        .clickByCssSelector(ironic)
        .assertElementDisabled(smile, 'Smile is enabled with Ironic')
        .clickByCssSelector(ironic)  // disable Ironic
        .clickByCssSelector(smile)
        .assertElementDisabled(ironic, 'Ironic is enabled with smile')
        .assertElementExists('i.tooltip-icon.glyphicon-warning-sign' +
                             '[data-original-title="Not compatible with smile"]',
                             1, 'No warning that Ironic is incompatible with smile')

        // Create cluster with smile + Sahara
        .pressKeys('\uE007');  // Finish
    },
    'Test additional, -ml2:tun, -vmware, !Sahara, +block:ceph'() {
      var smile = 'input[value=additional_service\\:smile]';
      var vmware = 'input[value=hypervisor\\:vmware]';
      var vlan = 'input[value=network\\:neutron\\:ml2\\:vlan]';
      var tun = 'input[value=network\\:neutron\\:ml2\\:tun]';
      var sahara = 'input[value=additional_service\\:sahara]';

      return this.remote
        .updatePlugin('dvs_default test_addit_smile_sahara')
        .newClusterFillName(modal)

        .pressKeys('\uE007')  // go to Compute

        // Check that smile is disabled when vCenter is enabled
        .clickByCssSelector(vmware)
        .assertNextButtonEnabled()
        .pressKeys('\uE007')  // Networking
        .assertNextButtonEnabled()
        .pressKeys('\uE007')  // Storage
        .pressKeys('\uE007')  // Additional Services
        .clickByCssSelector(sahara)
        .assertElementDisabled(smile, 'Smile checkbox is enabled with vCenter')

        .clickByCssSelector('button.prev-pane-btn') // back to Storage
        .clickByCssSelector('button.prev-pane-btn') // back to Networking
        .clickByCssSelector('button.prev-pane-btn') // back to Compute
        .clickByCssSelector(vmware)
        .assertNextButtonEnabled()
        .pressKeys('\uE007')  // Networking

        // Check that smile is disabled when Neutron with tunneling segmentation is enabled
        .clickByCssSelector(vlan)
        .clickByCssSelector(tun)
        .assertNextButtonEnabled()
        .pressKeys('\uE007')  // Storage
        .pressKeys('\uE007')  // Additional Services
        .clickByCssSelector(sahara)
        .assertElementDisabled(smile, 'Smile checkbox is enabled with tunneling segmentation')

        .clickByCssSelector('button.prev-pane-btn') // back to Storage
        .clickByCssSelector('button.prev-pane-btn') // back to Networking

        // Create cluster with VLAN + Ceph Block Storage + Sahara + smile
        .clickByCssSelector(tun)
        .clickByCssSelector(vlan)
        .assertNextButtonEnabled()
        .pressKeys('\uE007')  // Storage
        .clickByCssSelector('input[value=storage\\:block\\:ceph]')
        .pressKeys('\uE007')  // Additional Services
        .clickByCssSelector(sahara)
        .clickByCssSelector(smile)
        .pressKeys('\uE007');  // Finish
    }
  };
});
