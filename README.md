Github Events Emitter
=====================

[![npm Version][npm-badge]][npm]
[![Build Status][travis-badge]][travis]
[![Dependency Status][david-badge]][david]

This module will poll the [Events API](https://developer.github.com/v3/activity/events/) and `emit` events as it sees them.

This is useful for places where you can't have a public webhook to consume these events.

install
-------

`npm i gh-events --save`

usage
-----

```js
const GHEvents = require('./index');

const evts = new GHEvents({
    org: 'yahoo',
    auth: { //optional
        type: 'basic',
        username: '<username>',
        password: '<token>'
    }
});

evts.start();

evts.on('fork', (event, payload) => {
    console.log(event, payload);
});

evts.on('all', (event, payload) => {
    console.log(event, payload);
});
```

authentication
--------------

Supports the authentication used in the [github module](https://github.com/mikedeboer/node-github#authentication).
The `auth` config `Object` should be the value passed to the `authenticate` method. If no auth is given then your script
will be subject to the stricter rate limiting rules.

configuration
-------------

All options are optional. If `org`, `repo` and `user` are all omitted then all github events will be polled.

   * `org` - Listen for org level events
   * `user`- Listen for user level events
   * `repo` - Listen for user/repo events (requires user)
   * `auth` - See above
   * `userAgent` - A string to use as the userAgent when talking to the api

events
------

The module will emit 5 types of events, mostly named after the event it is consuming. In this example we will use the `PushEvent`.
More details on the events from Github can be found in their [docs](https://developer.github.com/v3/activity/events/types/).

   * `PushEvent`
   * `Push`
   * `pushevent`
   * `push`
   * `all`

The module will try to clean up the event name and emit the event any way that it can. You can listen to the `all` event to
receive events for every event that is found.

caching
-------

The module will abide by Github's rules for polling. It uses the `X-Poll-Interval` header that it receives to limit the amount 
of time between polls to ensure that it stays as a "good api citizen". It also stores the latest `etag` header and sends that
along on the following requests and only acts on data that is new.

It also stores the etag, poll time and latest event id to disk after each fetch so that if the script is restarted it will
continue on from where it left off. This will keep events from being fired off twice.

license
-------

This software is free to use under the Yahoo Inc. BSD license.
See the [LICENSE file][] for license text and copyright information.

[npm]: https://www.npmjs.org/package/gh-events
[npm-badge]: https://img.shields.io/npm/v/gh-events.svg?style=flat-square
[david]: https://david-dm.org/yahoo/gh-events
[david-badge]: https://img.shields.io/david/davglass/gh-events.svg?style=flat-square
[travis]: https://travis-ci.org/davglass/gh-events
[travis-badge]: https://img.shields.io/travis/davglass/gh-events/master.svg?style=flat-square
