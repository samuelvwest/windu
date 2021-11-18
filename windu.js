window.windu = {
    randomKey: function (p) {
        function randomCharacter() {
            var char = '';
            if (Math.floor(1 + Math.random() * 2) === 1) {
                char = String.fromCharCode(Math.floor(65 + Math.random() * 23));
            } else {
                char = String.fromCharCode(Math.floor(97 + Math.random() * 23));
            }
            return char;
        };
        var ol = p || 24,
            init = Math.floor((1 + Math.random()) * 0x10000) * Date.now(),
            iS = init.toString(),
            iCN = Math.floor(12 + Math.random() * 42);
        for (i = 0; i < iCN; i++) {
            var iL = iS.length,
                iP = Math.floor(1 + Math.random() * iL);
            iS = [iS.slice(0, iP), randomCharacter(), iS.slice(iP)].join('');
        }
        sub = Math.floor(1 + Math.random() * (iS.length - ol));
        use = iS.substring(sub, sub + ol);
        return use;
    },
    consoleLogOn: false,
    consoleLog: function () {
        if (arguments[0]) {
            console.log.apply(this, [].slice.call(arguments, 1));
        }
    },
    simplifyString: function (str, connector) {
        var c = typeof connector === 'undefined' ? '-' : connector;
        return str.replace(/[^\w]/gi, c).replace(/-{,}/g, c);
    },
    data: {},
    updateData: function (status, json) {
        json.status = status;
        window.windu.data[json.name] = json;
    },
    create: function (jsonOrStr, doFunction) {
        if (typeof jsonOrStr === 'string') {
            if (typeof doFunction === 'function') {
                var json = {
                    selector: jsonOrStr,
                    attach: doFunction
                }
            } else {
                console.warn('If Windu shorthand is being used, than the second parameter must be both provided & a function.');
            }
        } else {
            var json = jsonOrStr;
        };
        json.detectType = !!json.detectType ? this.simplifyString(json.detectType) : 'mutation';
        json.name = !!json.name ? this.simplifyString(json.name) : 'zz_' + json.detectType + '_' + this.randomKey(10);
        if (json.detectType === 'mutation') {
            if (!!json.attach) {
                var showIndex = false;
                if (typeof json.attach === 'function') {
                    var newJson = {
                        selector: json.selector,
                        do: json.attach
                    };
                    if (!!json.maxTimes) {
                        newJson.maxTimes = json.maxTimes;
                    }
                    json.attach = [newJson];
                } else if (typeof json.attach.length === 'undefined') {
                    json.attach = [json.attach]
                } else {
                    showIndex = json.attach.length > 1;
                };
                json.attach.forEach(function (obj, index) {
                    obj.name = json.name + '_attach' + (showIndex ? '_' + index : '');
                    obj.alreadyAttachedSelector = 'windu_' + obj.name;
                    obj.excludeSelector = ':not(.' + obj.alreadyAttachedSelector + ')';
                    window.windu.mutations.attachToElem.setup(obj);
                });
                this.consoleLog(json.consoleLog, json.name + ': setup attachToElem mutation function');
            }
            if (!!json.when && !!json.do) {
                json.name = json.name + '_whenDo';
                if (!!json.pollFirst) {
                    var pollWhen = typeof json.pollFirst === 'function' ? json.pollFirst : json.when,
                        pollDo = function () {
                            json.pollFirst = false;
                            json.detectType = 'mutation';
                            window.windu.updateData('polling finished', json);
                            window.windu.mutations.whenDo.setup(json);
                            window.windu.consoleLog(json.consoleLog, json.name + ': ran polling function');
                        };
                    this.create({
                        name: json.name,
                        when: pollWhen,
                        do: pollDo,
                        detectType: 'poll'
                    });
                    this.consoleLog(json.consoleLog, json.name + ': setup whenDo mutation poll function first');
                } else {
                    window.windu.mutations.whenDo.setup(json);
                    this.consoleLog(json.consoleLog, json.name + ': setup whenDo mutation function');
                }
            }
        } else if (/poll|script|((u|U)(r|R)(l|L))/.test(json.detectType)) {
            json.reInit = json.reInit || false;
            if (!this.data[json.name]) {
                var cE = json.checkEvery ? json.checkEvery : 500;
                this.data[json.name] = {
                    count: 0,
                    do: json.do,
                    test: json.when,
                    checkEvery: cE,
                    stopAfter: json.stopAfter ? (json.stopAfter / cE) : (15000 / cE),
                    status: 'initiated',
                    ifTimeOut: json.ifTimeOut ? json.ifTimeOut : 'standard',
                    run: function () {
                        if (window.windu.data[json.name].test()) {
                            try {
                                window.windu.data[json.name].do();
                                window.windu.data[json.name].status = 'completed';
                            } catch (err) {
                                console.log(json.name + ' poll err:', err.message);
                                window.windu.data[json.name].status = 'error: ' + err.message;
                            };
                            clearInterval(window.windu.data[json.name].interval);
                        } else if (window.windu.data[json.name].count > window.windu.data[json.name].stopAfter) {
                            clearInterval(window.windu.data[json.name].interval);
                            window.windu.data[json.name].status = 'timed out';
                            var tO = window.windu.data[json.name].ifTimeOut;
                            if (typeof tO === 'function') {
                                window.windu.consoleLog(json.consoleLog, json.name + ' is running provided timed out function');
                                tO();
                            } else if (tO === 'goforit') {
                                window.windu.consoleLog(json.consoleLog, json.name + ' is going for it anyway!');
                                window.windu.data[json.name].do();
                            } else if (tO === 'standard') {
                                window.windu.consoleLog(json.consoleLog, json.name + '  timed out.');
                            } else {
                                window.windu.consoleLog(json.consoleLog, tO);
                            }
                        } else {
                            window.windu.data[json.name].count++;
                        }
                    }
                };
                if (json.after) {
                    if (!!this.data[json.after]) {
                        var fCache = this.data[json.after].do;
                        this.data[json.after].do = function () {
                            fCache();
                            this.data[json.name].interval = setInterval(this.data[json.name].run, this.data[json.name].checkEvery);
                        };
                    } else {
                        this.consoleLog(json.consoleLog, json.after + ' interval is not defined and could not be chained');
                    }
                } else {
                    this.data[json.name].interval = setInterval(this.data[json.name].run, this.data[json.name].checkEvery);
                }
            } else if (this.data[json.name].status === 'completed' && reInit) {
                this.data[json.name].interval = setInterval(this.data[json.name].run, this.data[json.name].checkEvery);
                this.consoleLog(json.consoleLog, json.name + ' interval is already defined and complete, but was reinitiated');
            } else {
                this.consoleLog(json.consoleLog, json.name + ' interval is already defined, ' + this.data[json.name].status + ', and was not reinitiated');
            }
        }
    },
    mutations: {
        attachToElem: {
            array: [],
            active: false,
            consoleLogOn: false,
            setup: function (json) {
                if (!!this.array.find(function (obj) {
                        return obj.name === json.name
                    })) {
                    console.log('"' + json.name + '" matching element attachment already exists.');
                } else {
                    if (!json.alreadyAttachedSelector) {
                        json.alreadyAttachedSelector = 'winduS_' + json.name;
                        json.excludeSelector = ':not(.' + json.alreadyAttachedSelector + ')';
                    }
                    json.timesRun = 0;
                    json.maxTimes = json.maxTimes || 10000;
                    json.fromMutation = true;
                    json.useSelector = json.selector.replace(/,/g, json.excludeSelector + ',') + json.excludeSelector;
                    window.windu.updateData('attaching during setup', json);
                    Array.prototype.slice.call(document.querySelectorAll(json.useSelector)).forEach(function (elem) {
                        if (!!elem) {
                            json.do(elem);
                            elem.classList.add(json.alreadyAttachedSelector);
                            json.timesRun++;
                            window.windu.consoleLog(json.consoleLog, json.name + ' : ran do() function during attachToElem mutation setup : ' + elem);
                        }
                    });
                    if (json.timesRun < json.maxTimes) {
                        this.array.push(json);
                        window.windu.updateData('active in attach mutation observer', json);
                        window.windu.consoleLog(json.consoleLog, json.name + ' : added to attachToElem mutation observer list');
                    } else {
                        window.windu.updateData('active in attach mutation observer', json);
                    }
                    if (this.array.length > 0 && !this.active) {
                        this.mutation.observe(document.body, {
                            childList: true,
                            subtree: true
                        });
                        this.active = true;
                        window.windu.consoleLog(json.consoleLog, 'setup "attachToElem" mutation observer');
                    }
                }
            },
            mutation: new MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {
                    mutation.addedNodes.forEach(function (node) {
                        window.windu.mutations.attachToElem.array.forEach(function (json, i) {
                            var elements = [];
                            if (!!node.matches && node.matches(json.useSelector)) {
                                elements.push(node);
                            }
                            if (!!node.querySelectorAll) {
                                elements = elements.concat([].slice.call(node.querySelectorAll(json.useSelector)));
                            }
                            elements.forEach(function (elem) {
                                if (!!elem) {
                                    json.do(elem);
                                    elem.classList.add(json.alreadyAttachedSelector);
                                    window.windu.consoleLog(json.consoleLog, json.name + ': ran do() function attached to ' + json.selector);
                                    json.timesRun++;
                                }
                            });
                            if (json.timesRun > json.maxTimes) {
                                if (!!json.consoleLog) {
                                    window.windu.mutations.attachToElem.consoleLogOn = true;
                                }
                                window.windu.mutations.attachToElem.array.splice(i, 1);
                                window.windu.updateData('completedMaxTimes_' + json.maxTimes, json);
                            }
                        });
                    });
                })
                if (window.windu.mutations.attachToElem.array.length === 0 && window.winduLog.attachToElem.active) {
                    window.windu.mutations.attachToElem.mutation.disconnect();
                    window.windu.mutations.attachToElem.active = false;
                    window.windu.consoleLog(window.windu.mutations.attachToElem.consoleLogOn, 'disconnected "attachToElem" mutation observer');
                }
            })
        },
        whenDo: {
            array: [],
            active: false,
            consoleLogOn: false,
            setup: function (json) {
                if (!!this.array.find(function (obj) {
                        return obj.name === json.name
                    })) {
                    console.log('"' + json.name + '" whenDo function already exists.');
                } else {
                    json.timesRun = 0;
                    json.maxTimes = json.maxTimes || 1;
                    json.lastTrue = false;
                    json.timesFalse = 0;
                    json.bipolar = json.bipolar || false;
                    json.bipolarState = true;
                    json.status = 'running';
                    var test = json.when();
                    if (json.bipolar) {
                        test = test === json.bipolarState;
                    }
                    if (test) {
                        try {
                            json.do(json);
                        } catch (err) {
                            console.log('windu/whendo error: ', err);
                        }
                        json.lastTrue = true;
                        json.timesRun++;
                        if (json.bipolar) {
                            json.bipolarState = !json.bipolarState;
                            window.windu.consoleLog(json.consoleLog, json.name + ': bipolar reversed to "' + json.bipolarState + '"');
                        }
                        window.windu.consoleLog(json.consoleLog, json.name + ' : ran do() function during whenDo mutation setup');
                    }
                    if (json.timesRun < json.maxTimes) {
                        this.array.push(json);
                        window.windu.updateData('active in when/do mutation observer', json)
                        if (!this.active) {
                            this.mutation.observe(document.body, {
                                childList: true,
                                subtree: true,
                                attributes: true
                            });
                            this.active = true;
                            window.windu.consoleLog(json.consoleLog, 'setup "whenDo" mutation observer');
                        }
                    } else {
                        window.windu.updateData('completedMaxTimes_' + json.maxTimes, json);
                    }
                }
            },
            mutation: new MutationObserver(function (mutations) {
                window.windu.mutations.whenDo.array.forEach(function (json, i) {
                    var test = json.when();
                    if (json.bipolar) {
                        test = test === json.bipolarState;
                    }
                    if (test) {
                        try {
                            json.do(json);
                        } catch (err) {
                            console.log('windu/whendo error: ', err);
                        }
                        json.lastTrue = true;
                        json.timesRun++;
                        if (json.bipolar) {
                            json.bipolarState = !json.bipolarState;
                            window.windu.consoleLog(json.consoleLog, json.name + ': bipolar reversed to "' + json.bipolarState + '"');
                        }
                    } else {
                        json.lastTrue = false;
                        json.timesFalse++;
                    }
                    if (json.timesRun >= json.maxTimes) {
                        if (!!json.consoleLog) {
                            window.windu.mutations.whenDo.consoleLogOn = true;
                        }
                        window.windu.mutations.whenDo.array.splice(i, 1);
                        window.windu.updateData('completedMaxTimes_' + json.maxTimes, json);
                    }
                    window.windu.data[json.name] = json;
                });
                if (window.windu.mutations.whenDo.array.length < 1 && window.windu.mutations.whenDo.active) {
                    window.windu.mutations.whenDo.mutation.disconnect();
                    window.windu.mutations.whenDo.active = false;
                    window.windu.consoleLog(window.windu.mutations.whenDo.consoleLogOn, 'disconnected "whenDo" mutation observer');
                }
            })
        }
    }
}