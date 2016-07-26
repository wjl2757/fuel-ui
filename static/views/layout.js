/*
 * Copyright 2014 Mirantis, Inc.
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

import $ from 'jquery';
import _ from 'underscore';
import i18n from 'i18n';
import Backbone from 'backbone';
import React from 'react';
import utils from 'utils';
import models from 'models';
import {backboneMixin, pollingMixin, dispatcherMixin} from 'component_mixins';
import {Popover, Link} from 'views/controls';
import {ChangePasswordDialog, ShowNodeInfoDialog} from 'views/dialogs';

export var Navbar = React.createClass({
  mixins: [
    dispatcherMixin('updateNodeStats', 'updateNodeStats'),
    dispatcherMixin('updateNotifications', 'updateNotifications'),
    backboneMixin('user'),
    backboneMixin('version'),
    backboneMixin('statistics'),
    backboneMixin('notifications', 'update change:status'),
    pollingMixin(20)
  ],
  togglePopover(popoverName) {
    return _.memoize((visible) => {
      this.setState((previousState) => {
        var nextState = {};
        var key = popoverName + 'PopoverVisible';
        nextState[key] = _.isBoolean(visible) ? visible : !previousState[key];
        return nextState;
      });
    });
  },
  setActive(url) {
    this.setState({activeElement: url});
  },
  shouldDataBeFetched() {
    return this.props.user.get('authenticated');
  },
  fetchData() {
    return Promise.all([
      this.props.statistics.fetch(),
      this.props.notifications.fetch({limit: this.props.notificationsDisplayCount})
    ]);
  },
  updateNodeStats() {
    return this.props.statistics.fetch();
  },
  updateNotifications() {
    return this.props.notifications.fetch({limit: this.props.notificationsDisplayCount});
  },
  componentDidMount() {
    this.props.user.on('change:authenticated', (model, value) => {
      if (value) {
        this.startPolling();
      } else {
        this.stopPolling();
        this.props.statistics.clear();
        this.props.notifications.reset();
      }
    });
  },
  getDefaultProps() {
    return {
      notificationsDisplayCount: 5,
      elements: [
        {label: 'environments', url: '/clusters'},
        {label: 'equipment', url: '/equipment'},
        {label: 'releases', url: '/releases'},
        {label: 'plugins', url: '/plugins'},
        {label: 'support', url: '/support'}
      ]
    };
  },
  getInitialState() {
    return {};
  },
  scrollToTop() {
    $('html, body').animate({scrollTop: 0}, 'fast');
  },
  render() {
    var unreadNotificationsCount = this.props.notifications.filter({status: 'unread'}).length;
    var authenticationEnabled = this.props.version.get('auth_required') &&
      this.props.user.get('authenticated');

    return (
      <div className='navigation-box'>
        <div className='navbar-bg'></div>
        <nav className='navbar navbar-default' role='navigation'>
          <div className='row'>
            <div className='navbar-header col-xs-2'>
              <Link className='navbar-logo' to='/' />
            </div>
            <div className='col-xs-6'>
              <ul className='nav navbar-nav pull-left'>
                {_.map(this.props.elements, (element) => {
                  return (
                    <li
                      className={utils.classNames({
                        active: this.props.activeElement === element.url.slice(1)
                      })}
                      key={element.label}
                    >
                      <Link to={element.url}>
                        {i18n('navbar.' + element.label, {defaultValue: element.label})}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className='col-xs-4'>
              <ul className={utils.classNames({
                'nav navbar-icons pull-right': true,
                'with-auth': authenticationEnabled,
                'without-auth': !authenticationEnabled
              })}>
                <li
                  key='language-icon'
                  className='language-icon'
                  onClick={this.togglePopover('language')}
                >
                  <div className='language-text'>{i18n.getLocaleName(i18n.getCurrentLocale())}</div>
                </li>
                <li
                  key='statistics-icon'
                  className={
                    'statistics-icon ' +
                    (this.props.statistics.get('unallocated') ? '' : 'no-unallocated')
                  }
                  onClick={this.togglePopover('statistics')}
                >
                  {!!this.props.statistics.get('unallocated') &&
                    <div className='unallocated'>{this.props.statistics.get('unallocated')}</div>
                  }
                  <div className='total'>{this.props.statistics.get('total')}</div>
                </li>
                {authenticationEnabled &&
                  <li
                    key='user-icon'
                    className='user-icon'
                    onClick={this.togglePopover('user')}
                  ></li>
                }
                <li
                  key='notifications-icon'
                  className='notifications-icon'
                  onClick={this.togglePopover('notifications')}
                >
                  <span
                    className={utils.classNames({badge: true, visible: unreadNotificationsCount})}
                  >
                    {unreadNotificationsCount}
                  </span>
                </li>

                {this.state.languagePopoverVisible &&
                  <LanguagePopover
                    key='language-popover'
                    toggle={this.togglePopover('language')}
                  />
                }
                {this.state.statisticsPopoverVisible &&
                  <StatisticsPopover
                    key='statistics-popover'
                    statistics={this.props.statistics}
                    toggle={this.togglePopover('statistics')}
                  />
                }
                {this.state.userPopoverVisible &&
                  <UserPopover
                    key='user-popover'
                    user={this.props.user}
                    toggle={this.togglePopover('user')}
                  />
                }
                {this.state.notificationsPopoverVisible &&
                  <NotificationsPopover
                    key='notifications-popover'
                    notifications={this.props.notifications}
                    displayCount={this.props.notificationsDisplayCount}
                    toggle={this.togglePopover('notifications')}
                  />
                }
              </ul>
            </div>
          </div>
        </nav>
        <div className='page-up' onClick={this.scrollToTop} />
      </div>
    );
  }
});

var LanguagePopover = React.createClass({
  changeLocale(locale, e) {
    e.preventDefault();
    this.props.toggle(false);
    _.defer(() => {
      i18n.setLocale(locale);
      location.reload();
    });
  },
  render() {
    var currentLocale = i18n.getCurrentLocale();
    return (
      <Popover {...this.props} className='language-popover'>
        <ul className='nav nav-pills nav-stacked'>
          {_.map(i18n.getAvailableLocales(), (locale) => {
            return (
              <li key={locale} className={utils.classNames({active: locale === currentLocale})}>
                <a onClick={_.partial(this.changeLocale, locale)}>
                  {i18n.getLanguageName(locale)}
                </a>
              </li>
            );
          })}
        </ul>
      </Popover>
    );
  }
});

var StatisticsPopover = React.createClass({
  mixins: [backboneMixin('statistics')],
  render() {
    return (
      <Popover {...this.props} className='statistics-popover'>
        <div className='list-group'>
          <li className='list-group-item'>
            <span className='badge'>{this.props.statistics.get('unallocated')}</span>
            {i18n('navbar.stats.unallocated', {count: this.props.statistics.get('unallocated')})}
          </li>
          <li className='list-group-item text-success font-semibold'>
            <span className='badge bg-green'>{this.props.statistics.get('total')}</span>
            <Link to='/equipment'>
              {i18n('navbar.stats.total', {count: this.props.statistics.get('total')})}
            </Link>
          </li>
        </div>
      </Popover>
    );
  }
});

var UserPopover = React.createClass({
  mixins: [backboneMixin('user')],
  showChangePasswordDialog() {
    this.props.toggle(false);
    ChangePasswordDialog.show();
  },
  logout() {
    this.props.toggle(false);
    app.logout();
  },
  render() {
    return (
      <Popover {...this.props} className='user-popover'>
        <div className='username'>{i18n('common.username')}:</div>
        <h3 className='name'>{this.props.user.get('username')}</h3>
        <div className='clearfix'>
          <button
            className='btn btn-default btn-sm pull-left'
            onClick={this.showChangePasswordDialog}
          >
            <i className='glyphicon glyphicon-user'></i>
            {i18n('common.change_password')}
          </button>
          <button className='btn btn-info btn-sm pull-right btn-logout' onClick={this.logout}>
            <i className='glyphicon glyphicon-off'></i>
            {i18n('common.logout')}
          </button>
        </div>
      </Popover>
    );
  }
});

var NotificationsPopover = React.createClass({
  mixins: [backboneMixin('notifications')],
  showNodeInfo(id) {
    this.props.toggle(false);
    var node = new models.Node({id});
    node.fetch();
    ShowNodeInfoDialog.show({node});
  },
  markAsRead() {
    var notificationsToMark = new models.Notifications(
      this.props.notifications.filter({status: 'unread'})
    );
    if (notificationsToMark.length) {
      this.setState({unreadNotificationsIds: notificationsToMark.map('id')});
      notificationsToMark.toJSON = function() {
        return notificationsToMark.map((notification) => {
          notification.set({status: 'read'});
          return _.pick(notification.attributes, 'id', 'status');
        });
      };
      Backbone.sync('update', notificationsToMark);
    }
  },
  componentDidMount() {
    this.markAsRead();
  },
  getInitialState() {
    return {unreadNotificationsIds: []};
  },
  renderNotification(notification) {
    var nodeId = notification.get('node_id');
    var notificationClasses = {
      notification: true,
      clickable: nodeId,
      unread: notification.get('status') === 'unread' ||
        _.includes(this.state.unreadNotificationsIds, notification.id)
    };
    var iconClass = {
      error: 'glyphicon-exclamation-sign text-danger',
      warning: 'glyphicon-warning-sign text-warning',
      discover: 'glyphicon-bell'
    }[notification.get('topic')] || 'glyphicon-info-sign';
    // show not more than 200 symbols of notification text
    var MAX_NOTIFICATION_LENGTH = 200;
    var message = _.truncate(notification.get('message'), {
      length: MAX_NOTIFICATION_LENGTH,
      separator: ' '
    });

    return (
      <div key={notification.id} className={utils.classNames(notificationClasses)}>
        <i className={utils.classNames('glyphicon', iconClass)} />
        <p
          dangerouslySetInnerHTML={{__html: utils.urlify(_.escape(message))}}
          onClick={nodeId && _.partial(this.showNodeInfo, nodeId)}
        />
      </div>
    );
  },
  render() {
    var showMore = Backbone.history.getHash() !== 'notifications';
    var notifications = this.props.notifications.take(this.props.displayCount);
    return (
      <Popover {...this.props} className='notifications-popover'>
        {_.map(notifications, this.renderNotification)}
        {showMore &&
          <div className='show-more'>
            <Link to='/notifications'>{i18n('notifications_popover.view_all_button')}</Link>
          </div>
        }
      </Popover>
    );
  }
});

export var Footer = React.createClass({
  mixins: [backboneMixin('version')],
  render() {
    var version = this.props.version;
    return (
      <div className='footer'>
        <div key='version'>{i18n('common.version')}: {version.get('release')}</div>
      </div>
    );
  }
});

export var PageLoadProgressBar = React.createClass({
  mixins: [
    dispatcherMixin('pageLoadStarted', 'showProgressBar'),
    dispatcherMixin('pageLoadFinished', 'hideProgressBar')
  ],
  getDefaultProps() {
    return {
      initialProgress: 10,
      maxProgress: 94,
      progressStep: 2,
      stepDelay: 300
    };
  },
  getInitialState() {
    return {
      visible: false,
      progress: this.props.initialProgress
    };
  },
  showProgressBar() {
    this.setState({progress: this.props.initialProgress, visible: true});
    this.activeInterval = setInterval(() => {
      if (this.state.progress < this.props.maxProgress) {
        this.setState({progress: this.state.progress + this.props.progressStep});
      }
    }, this.props.stepDelay);
  },
  hideProgressBar() {
    clearInterval(this.activeInterval);
    this.setState({progress: 100, visible: false}, () => {
      setTimeout(() => this.setState({progress: this.props.initialProgress}), 400);
    });
  },
  componentWillUnmount() {
    clearInterval(this.activeInterval);
  },
  render() {
    return (
      <div className='page-load-progress' style={{opacity: this.state.visible ? 1 : 0}}>
        <div
          className='page-load-progress-bar'
          style={{width: this.state.progress + '%'}}
        />
      </div>
    );
  }
});

export var Breadcrumbs = React.createClass({
  mixins: [
    dispatcherMixin('updatePageLayout', 'refresh')
  ],
  getInitialState() {
    return {path: this.getBreadcrumbsPath()};
  },
  getBreadcrumbsPath() {
    var page = this.props.Page;
    return _.isFunction(page.breadcrumbsPath) ? page.breadcrumbsPath(this.props.pageOptions) :
      page.breadcrumbsPath;
  },
  refresh() {
    this.setState({path: this.getBreadcrumbsPath()});
  },
  render() {
    return (
      <ol className='breadcrumb'>
        {_.map(this.state.path, (breadcrumb, index) => {
          if (!_.isArray(breadcrumb)) breadcrumb = [breadcrumb, null, {active: true}];
          var text = breadcrumb[0];
          var link = breadcrumb[1];
          var options = breadcrumb[2] || {};
          if (!options.skipTranslation) {
            text = i18n('breadcrumbs.' + text, {defaultValue: text});
          }
          if (options.active) {
            return <li key={index} className='active'>{text}</li>;
          } else {
            return <li key={index}><Link to={link}>{text}</Link></li>;
          }
        })}
      </ol>
    );
  }
});

export var DefaultPasswordWarning = React.createClass({
  render() {
    return (
      <div className='alert global-alert alert-warning'>
        <button className='close' onClick={this.props.close}>&times;</button>
        {i18n('common.default_password_warning')}
      </div>
    );
  }
});

export var BootstrapError = React.createClass({
  render() {
    return (
      <div className='alert global-alert alert-danger'>
        {this.props.text}
      </div>
    );
  }
});
