'use strict';

const assert = require('assert');
const mockery = require('mockery');

describe('gh-events::general', () => {
    let GHEvents = null;

    before(() => {
        mockery.registerMock('fs', {
            existsSync: function() {
                return false;
            },
            writeFile: function(name, data, t, callback) {
                callback(null, JSON.parse(data));
            }
        });

        mockery.registerMock('github', function() {
            return {
                authenticate: function() {},
                activity: {}
            };
        });

        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false,
            useCleanCache: true
        });
        GHEvents = require('../');
    });

    after(() => {
        mockery.disable();
    });

    describe('save', () => {
        it('should save the config', () => {
            const evts = new GHEvents();
            evts.poll = 1234;
            evts.etag = 'ETAG';
            evts.lastEvent = 54321;
            evts.save((e, data) => {
                assert.equal(data.etag, 'ETAG');
                assert.equal(data.poll, 1234);
                assert.equal(data.lastEvent, 54321);
            });
        });
    });

    describe('start', () => {
        
        it('should call fetch on start', () => {
            const evts = new GHEvents();
            let called = false;
            evts.fetch = () => {
                called = true;
            };
            assert.equal(called, false);
            evts.start();
            assert.equal(called, true);
        });

    });

    describe('handler', () => {
        
        it('should shoule emit events', () => {
            const evts = new GHEvents();
            evts.save = (callback) => {
                callback();
            };
            evts.listenerCount = (name) => {
                if (name.toLowerCase().indexOf('issues') > -1) {
                    return false;
                }
                return true;
            };
            evts.emit = (name, type, payload) => {
                events.push({
                    name: name,
                    type: type,
                    payload: payload
                });
            };

            const events = [];

            evts.handler([
                { id: '1234', type: 'PushEvent' },
                { id: '12345', type: 'IssuesEvent' }
            ], () => {
                /*
                 * PushEvent, Push, pushevent, push, all - PushEvent
                 * all - IssuesEvent
                 */
                assert.equal(events.length, 6);
            });
        });
            
    });


});
