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

import pollUntil from 'intern/dojo/node!leadfoot/helpers/pollUntil';
import 'tests/functional/helpers';

class ModalWindow {
  constructor(remote) {
    this.remote = remote;
    this.modalSelector = '#modal-container > .modal';
  }

  waitToOpen() {
    return this.remote
      .waitForCssSelector(this.modalSelector, 2000)
      .then(
        pollUntil(
          (modalSelector) => window.$(modalSelector).css('opacity') === '1' || null,
          [this.modalSelector],
          3000
        )
      );
  }

  checkTitle(expectedTitle) {
    return this.remote
      .assertElementContainsText(this.modalSelector + ' h4.modal-title', expectedTitle,
        'Unexpected modal window title');
  }

  close() {
    return this.remote
      .clickByCssSelector(this.modalSelector + ' .modal-header button.close')
      .then(() => this.waitToClose());
  }

  clickFooterButton(buttonText) {
    return this.remote
      .findAllByCssSelector(this.modalSelector + ' .modal-footer button')
        .then(
          (buttons) => buttons.reduce(
            (result, button) => button.getVisibleText()
              .then((buttonTitle) => {
                if (buttonTitle === buttonText) {
                  return button.isEnabled()
                    .then((isEnabled) => {
                      if (isEnabled) {
                        return button.click();
                      } else {
                        throw Error('Unable to click disabled button "' + buttonText + '"');
                      }
                    });
                }
                return result;
              }),
            null
          )
        );
  }

  waitToClose() {
    return this.remote
      .waitForElementDeletion(this.modalSelector, 10000);
  }
}

export default ModalWindow;
