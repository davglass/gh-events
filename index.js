'use strict';

const EventEmitter = require('events');
const GitHubApi = require('github');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

class GHEvents extends EventEmitter {
    constructor(config) {
        super();
        this.config = config || {};
        this.poll = 60 * 1000;
        this.lastEvent = 0;
        
        this.github = new GitHubApi({
            protocol: "https",
            headers: {
                "user-agent": this.config.userAgent || 'gh-events node module'
            },
            timeout: 5000
        });

        if (this.config.auth) {
            this.github.authenticate(this.config.auth);
        }
        if (fs.existsSync(this.saveFile)) {
            const json = require(this.saveFile);
            Object.keys(json).forEach(name => this[name] = json[name]);
        }
    }
    get fetchFn() {
        let fetchFn = 'getEvents';
        if (this.config.org) {
            fetchFn = 'getEventsForOrg';
        } else if (this.config.user && this.config.repo) {
            fetchFn = 'getEventsForRepo';
        } else if (this.config.user) {
            fetchFn = 'getEventsForUser';
        }
        return fetchFn;
    }
    get fetchConfig() {
        const fetchConfig = {};
        if (this.config.org) {
            fetchConfig.org = this.config.org;
        } else if (this.config.user || this.config.repo) {
            fetchConfig.user = this.config.user;
            fetchConfig.repo = this.config.repo;
        }
        if (this.etag) {
            fetchConfig.headers = {
                'if-none-match': this.etag
            };
        }
        return fetchConfig;
    }
    done (data) {
        const hasLastEvent = data && data.some(i => Number(i.id) === this.lastEvent);

        if (this.github.hasNextPage(data) && !hasLastEvent) {
            this.github.getNextPage(data, (e, d) => {
                /*istanbul ignore next - In case GH returns crap, which happens*/
                if (!Array.isArray(d)) {
                    d = [];
                }
                d.forEach(i => data.push(i));
                data.meta = d.meta;
                this.done(data);
            });
            return;
        }
        this.handler(data, () => {
            this.timer && clearTimeout(this.timer);
            this.timer = setTimeout(this.fetch.bind(this), this.poll);
        });
    }
    fetch() {
        this.github.activity[this.fetchFn](this.fetchConfig, (e, data) => {
            const meta = data && data.meta || {};
            if (data.data === '') {
                data = [];
                data.meta = meta;
            }
            if (meta.etag) {
                this.etag = meta.etag;
            }
            if (meta['x-poll-interval']) {
                this.poll = Number(meta['x-poll-interval']) * 1000;
            }
            this.done(data);
        });
    }
    handler(data, callback) {
        data.reverse();
        data.filter(e => Number(e.id) > this.lastEvent).forEach((evt) => {
            const id = Number(evt.id);
            const name = evt.type.replace('Event', '');
            [evt.type, evt.type.toLowerCase(), name, name.toLowerCase(), 'all'].forEach((name) => {
                if (this.listenerCount(name)) {
                    this.emit(name, evt.type, evt);
                }
            });
            this.lastEvent = id;
        });
        this.save(callback);
    }
    get saveFile() {
        const file = crypto.createHash('md5').update(JSON.stringify(this.config)).digest('hex');
        return path.join(os.tmpDir(), file + '.json');
    }
    save(callback) {
        const payload = {
            etag: this.etag,
            lastEvent: this.lastEvent,
            poll: this.poll
        };
        const file = this.saveFile;
        fs.writeFile(file, JSON.stringify(payload), 'utf8', callback);
    }
    start() {
        this.fetch();
    }
}

module.exports = GHEvents;
