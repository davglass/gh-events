'use strict';

const assert = require('assert');
const mockery = require('mockery');

describe('gh-events::fetch', () => {
    let GHEvents = null;
    let hasNextPage = false;
    let nextPageData = [];
    let getData = [];

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
                activity: {
                    getEvents: function(config, callback) {
                        callback(null, getData);
                    }
                },
                hasNextPage: function() {
                    return hasNextPage;
                },
                getNextPage: function(data, callback) {
                    callback(null, nextPageData);
                }
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

    describe('fetch', () => {

        it('should call done with no data', () => {
            const evts = new GHEvents();
            let called = false;
            evts.done = () => {
                called = true;
            };
            assert.equal(called, false);
            evts.fetch();
            assert.equal(called, true);
        });
    
        it('should call done with blank data', () => {
            getData = {
                data: ''
            };
            const evts = new GHEvents();
            let called = false;
            evts.done = () => {
                called = true;
            };
            assert.equal(called, false);
            evts.fetch();
            assert.equal(called, true);
        });
    
        it('should call done with meta data', () => {
            getData = [];
            getData.meta = {
                etag: 'ETAG',
                'x-poll-interval': '65'
            };
            const evts = new GHEvents();
            let called = false;
            evts.done = () => {
                called = true;
            };
            assert.equal(called, false);
            evts.fetch();
            assert.equal(called, true);
            assert.equal(evts.poll, 65 * 1000);
            assert.equal(evts.etag, 'ETAG');
        });
    });

    describe('done', () => {

        it('should call handler with no data', () => {
            const evts = new GHEvents();
            let called = false;
            evts.handler = (data, callback) => {
                called = true;
                callback();
            };
            evts.timer = 1;
            assert.equal(called, false);
            evts.done([]);
            assert.equal(called, true);
        });

        it('should call handler with data ', () => {
            const evts = new GHEvents();
            let called = false;
            evts.handler = (data, callback) => {
                called = true;
                callback();
            };
            hasNextPage = true;
            nextPageData = [{
                id: 12345
            }];
            evts.lastEvent = 12345;
            evts.timer = 1;
            assert.equal(called, false);
            evts.done([{
                id: '1234'
            }]);
            assert.equal(called, true);
        });

    });


});

