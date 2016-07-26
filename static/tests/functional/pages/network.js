/*
 * Copyright 2016 Mirantis, Inc.
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

import ModalWindow from 'tests/functional/pages/modal';
import 'tests/functional/helpers';

class NetworkPage {
  constructor(remote) {
    this.remote = remote;
    this.modal = new ModalWindow(this.remote);
  }

  addNodeNetworkGroup(name) {
    return this.remote
      .clickByCssSelector('.add-nodegroup-btn')
      .then(() => this.modal.waitToOpen())
      .setInputValue('[name=node-network-group-name]', name)
      .then(() => this.modal.clickFooterButton('Add Group'))
      .then(() => this.modal.waitToClose())
      .waitForCssSelector('.network-group-name[data-name=' + name + ']', 2000);
  }

  renameNodeNetworkGroup(oldName, newName) {
    return this.remote
      .then(() => this.goToNodeNetworkGroup(oldName))
      .clickByCssSelector('.glyphicon-pencil')
      .waitForCssSelector('.network-group-name input[type=text]', 2000)
      .findByCssSelector('.node-group-renaming input[type=text]')
        .clearValue()
        .type(newName)
        // Enter
        .type('\uE007')
        .end()
      .waitForCssSelector('.network-group-name[data-name=' + newName + ']', 2000);
  }

  goToNodeNetworkGroup(name) {
    return this.remote
      .findByCssSelector('ul.node_network_groups')
        .clickLinkByText(name)
        .end()
      .waitForCssSelector('.network-group-name[data-name=' + name + ']', 2000);
  }

  removeNodeNetworkGroup(name) {
    return this.remote
      .clickByCssSelector('.network-group-name[data-name=' + name + '] .glyphicon-remove')
      .then(() => this.modal.waitToOpen())
      .then(() => this.modal.clickFooterButton('Delete'))
      .then(() => this.modal.waitToClose())
      .waitForElementDeletion('.network-group-name[data-name=' + name + ']', 2000)
      .sleep(3000); // unconditionally sleep to wait until update_dnsmasq task is finished
  }
}

export default NetworkPage;
