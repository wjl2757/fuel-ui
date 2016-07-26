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
    name: 'Hypervisors',
    setup() {
      common = new Common(this.remote);
      modal = new Modal(this.remote);
      return this.remote
       .then(() => common.getIn());
    },
    afterEach() {
      return this.remote
        .then(() => modal.close())
        .catch(() => true)
        .then(() => modal.waitToClose());
    },
    'Test description of components in wizard with qemu'() {
      return this.remote
        .updatePlugin('dvs_default test_hyperv_green_light_1')
        .newClusterFillName(modal)

        .pressKeys('\uE007')  // go to Compute
        .clickByCssSelector('input[value=hypervisor\\:vmware]')  // Enable vcenter
        .assertNextButtonEnabled()
        .pressKeys('\uE007')  // Networking

        // Select Neutron with NSXv plugin and check that it has green light
        .clickByCssSelector('input[value=network\\:neutron\\:core\\:nsx]')
        .assertElementsExist('i.tooltip-icon.glyphicon-ok-sign[data-original-title=' +
                             '"The component was tested with all the selected components"]',
                             2, 'Neutron with NSXv plugin has no green light');
    },
    'Test description of components in wizard without qemu'() {
      return this.remote
        .updatePlugin('dvs_default test_hyperv_green_light_2')
        .newClusterFillName(modal)

        .pressKeys('\uE007')  // go to Compute
        .clickByCssSelector('input[value=hypervisor\\:vmware]')  // enable vCenter
        .assertNextButtonEnabled()
        .pressKeys('\uE007')  // Networking

        // Select Neutron with NSXv plugin and check that it has green light
        .clickByCssSelector('input[value=network\\:neutron\\:core\\:nsx]')
        .assertElementsExist('i.tooltip-icon.glyphicon-info-sign[data-original-title=' +
                             '"This component was not tested with the following ' +
                             'components: QEMU-KVM"]', 1,
                             'Neutron with NSXv plugin has green light with QEMU-KVM');
    },
    'Test hypervisor:libvirt, -xen'() {
      var rain = 'input[name=hypervisor\\:libvirt\\:rain]';
      var xen = 'input[name=hypervisor\\:xen]';

      return this.remote
        .updatePlugin('dvs_default test_hyperv_rain')
        .newClusterFillName(modal)

        .pressKeys('\uE007')  // go to Compute

        // Enable xen, check that rain is disabled
        .clickByCssSelector(xen)
        .assertElementDisabled(rain, 'Rain checkbox is enabled with xen')

        // Disable xen, enable rain, check that xen is disabled
        .clickByCssSelector(xen)
        .clickByCssSelector(rain)
        .assertElementDisabled(xen, 'Xen checkbox is enabled with rain')

        // Create cluster with rain hypervisor
        .assertNextButtonEnabled()
        .pressKeys('\uE007')  // Networking
        .assertNextButtonEnabled()
        .pressKeys('\uE007')  // Storage
        .pressKeys('\uE007')  // Additional Services
        .pressKeys('\uE007')  // Finish
        .pressKeys('\uE007')  // Create
        .then(() => modal.waitToClose())

        // Delete created environment
        .deleteCluster(modal);
    },
    'Test hypervisor:libvirt, -qemu, -xen'() {
      return this.remote
        .updatePlugin('dvs_default test_hyperv_rain1')
        .newClusterFillName(modal)

        .pressKeys('\uE007')  // go to Compute

        // Check that rain and xen hypervisors are displayed as checkboxes
        .assertElementExists('input[name=hypervisor\\:xen][type="checkbox"]',
                             'Xen is not displayed as a checkbox')
        .assertElementExists('input[name=hypervisor\\:libvirt\\:rain1][type="checkbox"]',
                             'Rain is not displayed as a checkbox');
    },
    'Test hypervisor:libvirt, -qemu'() {
      var sun = 'input[value=hypervisor\\:libvirt\\:sun]';
      var qemu = 'input[value=hypervisor\\:qemu]';

      return this.remote
        .updatePlugin('dvs_default test_hyperv_sun')
        .newClusterFillName(modal)

        .pressKeys('\uE007')  // go to Compute

        // Check that sun hypervisor is disabled when qemu is enabled (by default)
        .assertElementDisabled(sun, 'Sun checkbox is enabled with qemu')

        // Disable qemu, enable sun and check that qemu is disabled
        .clickByCssSelector(qemu)
        .clickByCssSelector(sun)
        .assertElementDisabled(qemu, 'Qemu checkbox is enabled with sun')

        // Create cluster with sun hypervisor
        .assertNextButtonEnabled()
        .pressKeys('\uE007')  // Networking
        .assertNextButtonEnabled()
        .pressKeys('\uE007')  // Storage
        .pressKeys('\uE007')  // Additional Services
        .pressKeys('\uE007')  // Finish
        .pressKeys('\uE007')  // Create
        .then(() => modal.waitToClose())

        // Delete created environment
        .deleteCluster(modal);
    },
    'Test hypervisor, -vmware, !qemu'() {
      var vmware = 'input[name=hypervisor\\:vmware]';
      var xen = 'input[name=hypervisor\\:xen]';

      return this.remote
        .updatePlugin('dvs_default test_hyperv_xen')
        .newClusterFillName(modal)

        .pressKeys('\uE007')  // go to Compute

        // Enable vCenter and check that xen is disabled
        .clickByCssSelector(vmware)
        .assertElementDisabled(xen, 'Xen checkbox is enabled with vCenter')

        // Disable vCenter, enable xen and check that vCenter is disabled
        .clickByCssSelector(vmware)
        .clickByCssSelector(xen)
        .assertElementDisabled(vmware, 'vCenter checkbox is enabled with xen')

        // Create cluster with xen hypervisor
        .assertNextButtonEnabled()
        .pressKeys('\uE007')  // Networking
        .assertNextButtonEnabled()
        .pressKeys('\uE007')  // Storage
        .pressKeys('\uE007')  // Additional Services
        .pressKeys('\uE007')  // Finish
        .pressKeys('\uE007')  // Create
        .then(() => modal.waitToClose())

        // Delete created environment
        .deleteCluster(modal);
    },
    'Test hypervisor, -hyperv*, !Murano, +Ceilometer'() {
      var sun = 'input[value=hypervisor\\:test\\:sun]';
      var rain = 'input[value=hypervisor\\:test\\:rain]';
      var xen = 'input[value=hypervisor\\:xen]';

      return this.remote
        .updatePlugin('dvs_default test_hyperv_xen_sun')
        .newClusterFillName(modal)

        .pressKeys('\uE007')  // go to Compute

        // Check that xen is not compatible with sun and rain hypervisors
        .clickByCssSelector(sun)
        .assertElementDisabled(xen, 'Xen checkbox is enabled with sun')
        .clickByCssSelector(rain)
        .assertElementDisabled(xen, 'Xen checkbox is enabled with sun + rain')
        .clickByCssSelector(sun)
        .assertElementDisabled(xen, 'Xen checkbox is enabled with rain')
        .clickByCssSelector(rain)

        .clickByCssSelector(xen)
        .assertElementDisabled(sun, 'Sun checkbox is enabled with xen')
        .assertElementDisabled(rain, 'Rain checkbox is enabled with xen')

        // Try to create cluster with xen without Murano
        .assertNextButtonEnabled()
        .pressKeys('\uE007')  // Networking
        .assertNextButtonEnabled()
        .pressKeys('\uE007')  // Storage
        .pressKeys('\uE007')  // Additional Services
        .pressKeys('\uE007')  // Finish
        .pressKeys('\uE007')  // Create
        .then(() => modal.waitToClose())
        .assertElementTextEquals('div.text-error', 'Component \'hypervisor:xen\' requires ' +
                                 'any of components from [u\'additional_service:murano\'] set.',
                                 'Error was not displayed');
    },
    'Test create cluster with xen + Murano + Ceilometer'() {
      return this.remote
        .updatePlugin('dvs_default test_hyperv_xen_sun')
        .newClusterFillName(modal)

        // Create cluster with xen + Murano + Ceilometer
        .pressKeys('\uE007')  // go to Compute
        .clickByCssSelector('input[value=hypervisor\\:xen]')
        .assertNextButtonEnabled()
        .pressKeys('\uE007')  // Networking
        .assertNextButtonEnabled()
        .pressKeys('\uE007')  // Storage
        .pressKeys('\uE007')  // Additional Services
        .clickByCssSelector('input[value=additional_service\\:murano]')
        .clickByCssSelector('input[value=additional_service\\:ceilometer]')
        .pressKeys('\uE007')  // Finish
        .pressKeys('\uE007')  // Create
        .then(() => modal.waitToClose())

        // Delete created environment
        .deleteCluster(modal);
    }
  };
});
