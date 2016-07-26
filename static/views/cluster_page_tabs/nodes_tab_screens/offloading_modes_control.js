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
import _ from 'underscore';
import i18n from 'i18n';
import React from 'react';
import utils from 'utils';

var ns = 'cluster_page.nodes_tab.configure_interfaces.';

var OffloadingModesControl = React.createClass({
  propTypes: {
    interface: React.PropTypes.object
  },
  setModeState(mode, state) {
    mode.state = state;
    _.each(mode.sub, (mode) => this.setModeState(mode, state));
  },
  checkModes(mode, sub) {
    var changedState = sub.reduce((state, childMode) => {
      if (!_.isEmpty(childMode.sub)) {
        this.checkModes(childMode, childMode.sub);
      }
      return (state === 0 || state === childMode.state) ? childMode.state : -1;
    },
    0
    );
    var oldState;

    if (mode && mode.state !== changedState) {
      oldState = mode.state;
      mode.state = oldState === false ? null : (changedState === false ? false : oldState);
    }
  },
  findMode(name, modes) {
    var result, mode;
    var index = 0;
    var modesLength = modes.length;
    for (; index < modesLength; index++) {
      mode = modes[index];
      if (mode.name === name) {
        return mode;
      } else if (!_.isEmpty(mode.sub)) {
        result = this.findMode(name, mode.sub);
        if (result) {
          break;
        }
      }
    }
    return result;
  },
  onModeStateChange(name, state) {
    var modes = _.cloneDeep(this.props.interface.get('offloading_modes') || []);
    var mode = this.findMode(name, modes);

    return () => {
      if (mode) {
        this.setModeState(mode, state);
        this.checkModes(null, modes);
      } else {
        // handle All Modes click
        _.each(modes, (mode) => this.setModeState(mode, state));
      }
      this.props.interface.set('offloading_modes', modes);
    };
  },

  renderChildModes(modes, level) {
    return modes.map((mode) => {
      var lines = [
        <tr key={mode.name} className={'level' + level}>
          <td>{mode.name}</td>
          {[true, false, null].map((modeState) => {
            var styles = {
              'btn-link': true,
              active: mode.state === modeState
            };
            return (
              <td key={mode.name + modeState}>
                <button
                  className={utils.classNames(styles)}
                  disabled={this.props.disabled}
                  onClick={this.onModeStateChange(mode.name, modeState)}>
                  <i className='glyphicon glyphicon-ok'></i>
                </button>
              </td>
            );
          })}
        </tr>
      ];
      if (mode.sub) {
        return _.union([lines, this.renderChildModes(mode.sub, level + 1)]);
      }
      return lines;
    });
  },
  render() {
    var modes = [];
    var ifcModes = this.props.interface.get('offloading_modes');
    if (ifcModes) {
      modes.push({
        name: i18n(ns + 'all_modes'),
        state: _.uniq(_.map(ifcModes, 'state')).length === 1 ? ifcModes[0].state : undefined,
        sub: ifcModes
      });
    }

    return (
      <div className='offloading-modes'>
        <table className='table'>
          <thead>
            <tr>
              <th>{i18n(ns + 'offloading_mode')}</th>
              <th>{i18n('common.enabled')}</th>
              <th>{i18n('common.disabled')}</th>
              <th>{i18n(ns + 'offloading_default')}</th>
            </tr>
          </thead>
          <tbody>
            {this.renderChildModes(modes, 1)}
          </tbody>
        </table>
      </div>
    );
  }
});

export default OffloadingModesControl;
