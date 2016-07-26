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

/**
 *
 * Backbone.DeepModel v0.10.4
 *
 * Copyright (c) 2013 Charles Davison, Pow Media Ltd
 *
 * https://github.com/powmedia/backbone-deep-model
 * Licensed under the MIT License
 */

/*
 *  Modified to use ES2015 features and Lodash 4.x methods.
**/

import _ from 'underscore';
import Backbone from 'backbone';

// Takes a nested object and returns a shallow object keyed with the path names
// e.g. { "level1.level2": "value" }
var objToPaths = (obj) => {
  var result = {};
  _.each(obj, (val, key) => {
    if (_.isPlainObject(val) && !_.isEmpty(val)) {
      //Recursion for embedded objects
      var obj2 = objToPaths(val);
      _.each(obj2, (val2, key2) => {
        result[key + '.' + key2] = val2;
      });
    } else {
      result[key] = val;
    }
  });
  return result;
};

var deepClone = (obj) => {
  // this custom method more than 10 times faster than _.cloneDeep lodash method
  if (!_.isObject(obj) || _.isFunction(obj)) return obj;
  if (obj instanceof Backbone.Collection || obj instanceof Backbone.Model) return obj;

  var isArray = _.isArray(obj);
  var func = (result, value, key) => {
    if (isArray) {
      result.push(deepClone(value));
    } else {
      result[key] = deepClone(value);
    }
    return result;
  };
  return _.reduce(obj, func, isArray ? [] : {});
};

var deepModelMixin = {
  constructor(attributes, options) {
    var attrs = attributes || {};
    this.cid = _.uniqueId('c');
    this.attributes = {};
    if (options && options.collection) this.collection = options.collection;
    if (options && options.parse) attrs = this.parse(attrs, options) || {};
    var defaults = _.result(this, 'defaults');
    //<custom code>
    attrs = _.merge(defaults, attrs);
    //</custom code>
    this.set(attrs, options);
    this.changed = {};
    this.initialize(...arguments);
  },

  toJSON() {
    return deepClone(this.attributes);
  },

  get(attr) {
    return _.get(this.attributes, attr);
  },

  set(key, val, options = {}) {
    if (key === null) return this;

    // Handle both `"key", value` and `{key: value}` -style arguments.
    var attrs;
    if (typeof key === 'object') {
      attrs = key;
      options = val || {};
    } else {
      (attrs = {})[key] = val;
    }

    // Run validation.
    if (!this._validate(attrs, options)) return false;

    // Extract attributes and options.
    var unset = options.unset;
    var silent = options.silent;
    var changes = [];
    var changing = this._changing;
    this._changing = true;

    if (!changing) {
      //<custom code>
      this._previousAttributes = deepClone(this.attributes);
      //</custom code>
      this.changed = {};
    }

    var current = this.attributes;
    var changed = this.changed;
    var prev = this._previousAttributes;

    //<custom code>
    attrs = objToPaths(attrs);

    _.each(attrs, (val, attr) => {
      if (!_.isEqual(_.get(current, attr), val)) changes.push(attr);
      if (!_.isEqual(_.get(prev, attr), val)) {
        _.setWith(changed, attr, val, Object);
      } else {
        _.unset(changed, attr);
      }
      if (unset) {
        _.unset(current, attr);
      } else {
        _.setWith(current, attr, val, Object);
      }
    });
    //</custom code>

    // Update the `id`.
    if (this.idAttribute in attrs) this.id = this.get(this.idAttribute);

    // Trigger all relevant attribute changes.
    if (!silent) {
      if (changes.length) this._pending = true;
      //<custom code>
      _.each(changes, (change) => {
        this.trigger('change:' + change, this, _.get(current, change), options);
        var fields = change.split('.');
        //Trigger change events for parent keys with wildcard (*) notation
        _.eachRight(fields, (field, key) => {
          if (key > 0) {
            var parentKey = _.take(fields, key).join('.');
            var wildcardKey = parentKey + '.*';
            this.trigger('change:' + wildcardKey, this, _.get(current, parentKey), options);
          }
        });
      });
      //</custom code>
    }

    // You might be wondering why there's a `while` loop here. Changes can
    // be recursively nested within `"change"` events.
    if (changing) return this;
    if (!silent) {
      while (this._pending) {
        options = this._pending;
        this._pending = false;
        this.trigger('change', this, options);
      }
    }
    this._pending = false;
    this._changing = false;
    return this;
  },

  // Clear all attributes on the model, firing `"change"` unless you choose
  // to silence it.
  clear(options) {
    var attrs = {};
    var shallowAttributes = objToPaths(this.attributes);
    _.each(shallowAttributes, (attr, key) => {
      attrs[key] = undefined;
    });
    return this.set(attrs, _.extend({}, options, {unset: true}));
  },

  // Determine if the model has changed since the last `"change"` event.
  // If you specify an attribute name, determine if that attribute has changed.
  hasChanged(attr) {
    if (_.isNull(attr)) return !_.isEmpty(this.changed);
    return !_.isUndefined(_.get(this.changed, attr));
  },

  // Return an object containing all the attributes that have changed, or
  // false if there are no changed attributes. Useful for determining what
  // parts of a view need to be updated and/or what attributes need to be
  // persisted to the server. Unset attributes will be set to undefined.
  // You can also pass an attributes object to diff against the model,
  // determining if there *would be* a change.
  changedAttributes(diff) {
    //<custom code>
    if (!diff) return this.hasChanged() ? objToPaths(this.changed) : false;
    //</custom code>
    var old = this._changing ? this._previousAttributes : this.attributes;

    //<custom code>
    diff = objToPaths(diff);
    old = objToPaths(old);

    var changed = false;
    _.each(diff, (val, attr) => {
      if (!_.isEqual(old[attr], val)) {
        (changed || (changed = {}))[attr] = val;
      }
    });
    //</custom code>
    return changed;
  },

  // Get the previous value of an attribute, recorded at the time the last
  // `"change"` event was fired.
  previous(attr) {
    if (attr === null || !this._previousAttributes) return null;
    //<custom code>
    return _.get(this._previousAttributes, attr);
    //</custom code>
  },

  // Get all of the attributes of the model at the time of the previous
  // `"change"` event.
  previousAttributes() {
    return deepClone(this._previousAttributes);
  },

  _validate(attrs, options) {
    if (!options.validate || !this.validate) return true;

    //<custom code>
    var attrsToValidate = deepClone(this.attributes);
    _.each(attrs, (val, attr) => {
      _.setWith(attrsToValidate, attr, val, Object);
    });
    var error = this.validationError = this.validate(attrsToValidate, options) || null;
    //</custom code>

    if (!error) return true;
    this.trigger('invalid', this, error, _.extend(options, {validationError: error}));
    return false;
  }
};

export default deepModelMixin;
