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

import registerSuite from 'intern!object';
import Common from 'tests/functional/pages/common';
import ClusterPage from 'tests/functional/pages/cluster';
import NetworksLib from 'tests/functional/nightly/library/networks';

registerSuite(() => {
  var common, clusterPage, clusterName, storageNetwork, managementNetwork;

  return {
    name: 'Neutron VLAN segmentation',
    setup() {
      common = new Common(this.remote);
      clusterPage = new ClusterPage(this.remote);
      storageNetwork = new NetworksLib(this.remote, 'storage');
      managementNetwork = new NetworksLib(this.remote, 'management');
      clusterName = common.pickRandomName('VLAN Cluster');

      return this.remote
        .then(() => common.getIn())
        .then(() => common.createCluster(clusterName))
        .then(() => common.addNodesToCluster(1, ['Controller']))
        .then(() => common.addNodesToCluster(1, ['Compute']))
        .then(() => clusterPage.goToTab('Networks'));
    },
    'Storage Network "IP Ranges" testing'() {
      this.timeout = 45000;
      var correctIpRange = ['192.168.1.5', '192.168.1.10'];
      var newIpRange = ['192.168.1.25', '192.168.1.30'];
      return this.remote
        .then(() => storageNetwork.checkNetworkInitialState())
        .then(() => storageNetwork.checkIPRanges(correctIpRange, newIpRange));
    },
    'Management Network "IP Ranges" testing'() {
      this.timeout = 45000;
      var correctIpRange = ['192.168.0.55', '192.168.0.100'];
      var newIpRange = ['192.168.0.120', '192.168.0.170'];
      return this.remote
        .then(() => managementNetwork.checkNetworkInitialState())
        .then(() => managementNetwork.checkIPRanges(correctIpRange, newIpRange));
    },
    'Check intersections between all networks'() {
      this.timeout = 45000;
      /// Network values to cause intersection with other network: [CIDR, Start IP, End IP]
      var storageValues1 = ['192.168.0.0/24', '192.168.0.1', '192.168.0.254'];
      var storageValues2 = ['172.16.0.0/24', '172.16.0.5', '172.16.0.120'];
      var storageValues3 = ['172.16.0.0/24', '172.16.0.135', '172.16.0.170'];
      var managementValues1 = ['172.16.0.0/24', '172.16.0.5', '172.16.0.120'];
      var managementValues2 = ['172.16.0.0/24', '172.16.0.135', '172.16.0.170'];
      return this.remote
        .then(() => storageNetwork.checkNetworksIntersection('Management', storageValues1))
        .then(() => storageNetwork.checkNetworksIntersection('Public', storageValues2))
        .then(() => storageNetwork.checkNetworksIntersection('Public', storageValues3))
        .then(() => managementNetwork.checkNetworksIntersection('Public', managementValues1))
        .then(() => managementNetwork.checkNetworksIntersection('Public', managementValues2));
    }
  };
});

registerSuite(() => {
  var common, clusterPage, clusterName, storageNetwork, managementNetwork, privateNetwork;

  return {
    name: 'Neutron tunneling segmentation',
    setup() {
      common = new Common(this.remote);
      clusterPage = new ClusterPage(this.remote);
      storageNetwork = new NetworksLib(this.remote, 'storage');
      managementNetwork = new NetworksLib(this.remote, 'management');
      privateNetwork = new NetworksLib(this.remote, 'private');
      clusterName = common.pickRandomName('Tunneling Cluster');

      return this.remote
        .then(() => common.getIn())
        .then(
          () => common.createCluster(
            clusterName,
            {
              'Networking Setup'() {
                return this.remote
                  .clickByCssSelector('input[value*="neutron"][value$=":vlan"]')
                  .clickByCssSelector('input[value*="neutron"][value$=":tun"]');
              }
            }
          )
        )
        .then(() => common.addNodesToCluster(1, ['Controller']))
        .then(() => common.addNodesToCluster(1, ['Compute']))
        .then(() => clusterPage.goToTab('Networks'));
    },
    'Storage Network "IP Ranges" testing'() {
      this.timeout = 45000;
      var correctIpRange = ['192.168.1.5', '192.168.1.10'];
      var newIpRange = ['192.168.1.25', '192.168.1.30'];
      return this.remote
        .then(() => storageNetwork.checkNetworkInitialState())
        .then(() => storageNetwork.checkIPRanges(correctIpRange, newIpRange));
    },
    'Management Network "IP Ranges" testing'() {
      this.timeout = 45000;
      var correctIpRange = ['192.168.0.55', '192.168.0.100'];
      var newIpRange = ['192.168.0.120', '192.168.0.170'];
      return this.remote
        .then(() => managementNetwork.checkNetworkInitialState())
        .then(() => managementNetwork.checkIPRanges(correctIpRange, newIpRange));
    },
    'Private Network "IP Ranges" testing'() {
      this.timeout = 45000;
      var correctIpRange = ['192.168.2.190', '192.168.2.200'];
      var newIpRange = ['192.168.2.200', '192.168.2.230'];
      return this.remote
        .then(() => privateNetwork.checkNetworkInitialState())
        .then(() => privateNetwork.checkIPRanges(correctIpRange, newIpRange));
    },
    'Check intersections between all networks'() {
      this.timeout = 60000;
      // Network values to cause intersection with other network: [CIDR, Start IP, End IP]
      var storageValues1 = ['192.168.0.0/24', '192.168.0.1', '192.168.0.254'];
      var storageValues2 = ['192.168.2.0/24', '192.168.2.1', '192.168.2.254'];
      var storageValues3 = ['172.16.0.0/24', '172.16.0.5', '172.16.0.120'];
      var storageValues4 = ['172.16.0.0/24', '172.16.0.135', '172.16.0.170'];
      var managementValues1 = ['172.16.0.0/24', '172.16.0.5', '172.16.0.120'];
      var managementValues2 = ['172.16.0.0/24', '172.16.0.135', '172.16.0.170'];
      var privateValues1 = ['172.16.0.0/24', '172.16.0.5', '172.16.0.120'];
      var privateValues2 = ['172.16.0.0/24', '172.16.0.135', '172.16.0.170'];
      return this.remote
        .then(() => storageNetwork.checkNetworksIntersection('Management', storageValues1))
        .then(() => storageNetwork.checkNetworksIntersection('Private', storageValues2))
        .then(() => storageNetwork.checkNetworksIntersection('Public', storageValues3))
        .then(() => storageNetwork.checkNetworksIntersection('Public', storageValues4))
        .then(() => managementNetwork.checkNetworksIntersection('Public', managementValues1))
        .then(() => managementNetwork.checkNetworksIntersection('Public', managementValues2))
        .then(() => privateNetwork.checkNetworksIntersection('Public', privateValues1))
        .then(() => privateNetwork.checkNetworksIntersection('Public', privateValues2));
    }
  };
});
