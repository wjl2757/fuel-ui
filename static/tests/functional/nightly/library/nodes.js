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

import 'tests/functional/helpers';
import ModalWindow from 'tests/functional/pages/modal';
import ClusterPage from 'tests/functional/pages/cluster';
import ClustersPage from 'tests/functional/pages/clusters';
import GenericLib from 'tests/functional/nightly/library/generic';

class NodesLib {
  constructor(remote) {
    this.remote = remote;
    this.modal = new ModalWindow(remote);
    this.clusterPage = new ClusterPage(remote);
    this.clustersPage = new ClustersPage(remote);
    this.genericLib = new GenericLib(remote);

    this.popupSelector = 'div.popover';
    this.btnCancelSelector = 'button[class$="btn-default"]';
    this.warningIconSelector = ' i.glyphicon-warning-sign';
    this.nodeGroupSelector = 'div.nodes-group';
  }

  cleanAllPopups() {
    return this.remote
      .then(() => this.genericLib.moveCursorTo(this.btnCancelSelector))
      .assertElementNotExists(this.popupSelector, 'All popups are disappeared');
  }

  waitForPopup(roleSelector) {
    return this.remote
      .then(() => this.genericLib.moveCursorTo(roleSelector))
      .assertElementAppears(this.popupSelector, 1500, 'Popup appears');
  }

  checkRoleIntersections(roleName, intersectionNames, roleSelectors, rolePopups, warningRoles) {
    var allP = '[\\s\\S]*';
    var shouldPopup = allP + '.*should be enabled in the environment settings';
    var interPopup = allP + 'This role cannot be combined with the selected roles' + allP;
    var selectedRole = '.selected';
    var btnRole = ' div.role';
    var roleSelector = roleSelectors[roleName];
    var chain = this.remote;

    chain = chain.clickByCssSelector(roleSelector + btnRole)
    .assertElementsExist(roleSelector + selectedRole, roleName + ' role is selected');
    for (let i = 0; i < intersectionNames.length; i++) {
      var popupValue = '';
      if (warningRoles.indexOf(intersectionNames[i]) !== -1) {
        popupValue = shouldPopup;
      }
      popupValue = RegExp(popupValue + interPopup + rolePopups[intersectionNames[i]] + allP, 'i');
      chain = chain.findByCssSelector(roleSelectors[intersectionNames[i]])
        .then((element) => this.remote.moveMouseTo(element))
        .end()
      .waitForCssSelector(this.popupSelector, 1500)
      .assertElementsExist(roleSelectors[intersectionNames[i]] + this.warningIconSelector,
        intersectionNames[i] + ' role correctly include warning icon for intersection')
      .assertElementMatchesRegExp(this.popupSelector, popupValue, intersectionNames[i] +
        ' role popup is observed with correct intersection message: ' + popupValue)
      .then(() => this.cleanAllPopups());
    }
    chain = chain.clickByCssSelector(roleSelector + btnRole)
    .assertElementNotExists(roleSelector + selectedRole, roleName + ' role is not selected')
    .then(() => this.cleanAllPopups());
    return chain;
  }

  checkDeployResults(controller1Name, controller1Status, controller2Name, controller2Status,
    computeName, computeStatus, clusterName, clusterStatus) {
    var nodeSelector = 'div.node.';
    var controller1Selector = this.nodeGroupSelector + ':first-child ' + nodeSelector +
      controller1Status + ':first-child';
    var controller2Selector = this.nodeGroupSelector + ':first-child ' + nodeSelector +
      controller2Status + ':last-child';
    var computeSelector = this.nodeGroupSelector + ':last-child ' + nodeSelector +
      computeStatus + ':first-child';
    var nameSelector = ' div.name';
    var statusSelector = ' div.status';
    var clusterSelector = 'a.clusterbox';
    return this.remote
      .then(() => this.clusterPage.goToTab('Nodes'))
      .assertElementsAppear(this.nodeGroupSelector, 1000, '"Nodes" subpage is not empty')
      .assertElementsExist(controller1Selector, controller1Status + ' conroller node #1 exists')
      .assertElementsExist(controller2Selector, controller2Status + ' conroller node #2 exists')
      .assertElementsExist(computeSelector, computeStatus + ' compute node exists')
      .assertElementContainsText(controller1Selector + nameSelector, controller1Name,
        controller1Status + ' conroller node #1 has correct name')
      .assertElementContainsText(controller2Selector + nameSelector, controller2Name,
        controller2Status + ' conroller node #2 has correct name')
      .assertElementContainsText(computeSelector + nameSelector, computeName,
        computeStatus + ' compute node has correct name')
      .then(() => this.genericLib.gotoPage('Environments'))
      .assertElementsAppear(clusterSelector, 1000, '"Environments" page is not empty')
      .assertElementContainsText(clusterSelector + nameSelector, clusterName,
        'Cluster has correct name')
      .assertElementContainsText(clusterSelector + statusSelector, clusterStatus,
        'Cluster has correct status')
      .then(() => this.clustersPage.goToEnvironment(clusterName));
  }

  removeNodeFromCluster() {
    var nodeInputSelector = this.nodeGroupSelector + ' div.node:last-child input[type="checkbox"]';
    var buttonDeleteNodes = 'button.btn-delete-nodes';
    return this.remote
      .then(() => this.clusterPage.goToTab('Nodes'))
      .assertElementsAppear(this.nodeGroupSelector, 3000, '"Nodes" subpage appears')
      .assertElementsExist(nodeInputSelector, 'Last node selector checkbox exists')
      .clickByCssSelector(nodeInputSelector)
      .assertElementsAppear(buttonDeleteNodes, 1000, '"Delete" button appears')
      .clickByCssSelector(buttonDeleteNodes)
      .then(() => this.modal.waitToOpen())
      .then(() => this.modal.clickFooterButton('Delete'))
      .then(() => this.modal.waitToClose())
      .waitForElementDeletion(buttonDeleteNodes, 3000)
      .sleep(500);
  }
}

export default NodesLib;
