'use strict';

const assert = require('assert');
const mockery = require('mockery');

describe('gh-events::config', () => {
    
    let GHEvents = null;

    before(() => {
        mockery.registerMock('fs', {
            existsSync: function(name) {
                mockery.registerMock(name, {
                    foo: true
                });
                return true;
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
        
    
    describe('fetchConfig', () => {
        it('should pull an empty config', () => {
            const evts = new GHEvents();
            const config = evts.fetchConfig;
            assert.ok(config);
            assert.equal(typeof config, 'object');
            assert.equal(Object.keys(config).length, 0);
            assert.equal(evts.foo, true);
        });
        
        it('should pull an org config', () => {
            const evts = new GHEvents({
                auth: {},
                org: 'yahoo',
                user: 'foo',
                repo: 'bar'
            });
            const config = evts.fetchConfig;
            assert.ok(config);
            assert.equal(typeof config, 'object');
            assert.equal(Object.keys(config).length, 1);
            assert.equal(config.org, 'yahoo');
            assert.equal(config.repo, undefined);
        });
    
        it('should pull a repo config', () => {
            const evts = new GHEvents({
                user: 'foo',
                repo: 'bar'
            });
            const config = evts.fetchConfig;
            assert.ok(config);
            assert.equal(typeof config, 'object');
            assert.equal(Object.keys(config).length, 2);
            assert.equal(config.org, undefined);
            assert.equal(config.user, 'foo');
            assert.equal(config.repo, 'bar');
        });
    
        it('should set etag header', () => {
            const evts = new GHEvents();
            evts.etag = '1234567890';
            const config = evts.fetchConfig;
            assert.ok(config);
            assert.equal(typeof config, 'object');
            assert.equal(Object.keys(config).length, 1);
            assert.equal(config.org, undefined);
            assert.ok(config.headers);
            assert.ok(config.headers['if-none-match']);
            assert.equal(config.headers['if-none-match'], '1234567890');
        });
    
    });

    describe('fetchFn', () => {
        
        it('should return default function', () => {
            const evts = new GHEvents();
            assert.equal(evts.fetchFn, 'getEvents');
        });

        it('should return org function', () => {
            const evts = new GHEvents({ org: 'yahoo' });
            assert.equal(evts.fetchFn, 'getEventsForOrg');
        });

        it('should return repo function', () => {
            const evts = new GHEvents({ user: 'foo', repo: 'bar' });
            assert.equal(evts.fetchFn, 'getEventsForRepo');
        });

        it('should return user function', () => {
            const evts = new GHEvents({ user: 'foo' });
            assert.equal(evts.fetchFn, 'getEventsForUser');
        });
    });

});
