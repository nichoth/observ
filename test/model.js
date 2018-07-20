var test = require('tape')
var Model = require('../model')
var obs = require('../')
var observ = obs.observ
var struct = obs.struct

var echos = {
    foo: function (arg, cb) {
        process.nextTick(function () {
            cb(null, arg)
        })
    },

    bar: function (arg, cb) {
        process.nextTick(function () {
            cb(null, arg)
        })
    }
}

var state = struct({
    hello: observ('world')
})

var model

test('create a model', function (t) {
    try {
        model = Model({
            state: state,
            io: echos,
            update: {
                foo: function (state, res) {
                    state.hello.set(res)
                }
            }
        })
        t.fail('Should throw if an update key is missing')

    } catch(err) {
        t.equal(err.message, 'Missing required parameter update.bar',
            'Should throw if an update key is missing')

        model = Model({
            state: state,
            io: echos,
            update: {
                foo: function (state, res) {
                    state.hello.set(res)
                },

                bar: function (state, res) {
                    state.hello.set(res + 'bar')
                }
            }
        })
    }

    t.ok(model.foo)
    t.ok(model.bar)
    t.end()
})

test('methods', function (t) {
    var states = []
    var _state = Model.getState(model)
    _state(function onChange (newState) {
        states.push(newState)
    })

    model.foo('woo', function (res) {
        var wasResolving = states.findIndex(function (s) {
            return s.requests.isResolving
        })
        t.ok(wasResolving !== -1)
        t.equal(_state().requests.isResolving, false)
        t.equal(_state().data.hello, 'woo', 'should have updated state')
        t.end()
    })
})

test('parse responses', function (t) {
    var model = Model({
        state: state,
        io: echos,
        update: {
            foo: function (state, res) {
                state.hello.set(res)
            },

            bar: function (state, res) {
                state.hello.set(res + 'bar')
            }
        },

        // pass in parsers here
        parse: {
            foo: function (res) {
                return res + 'foo'
            }
        }
    })

    model.foo('ok', function (err, res) {
        t.equal(Model.getState(model)().data.hello, 'okfoo',
            'should call update with parsed response')
        t.end()
    })
})

test('update functions', function (t) {
    t.plan(2)

    var model = Model({
        state: state,
        io: echos,
        update: {
            foo: function (state, res, opts) {
                t.ok(opts.req, 'should call update with request arg')
                t.ok(opts.modelState,
                    'should call update with full model state')
                state.hello.set(res)
            },

            bar: function (state, res) {
                state.hello.set(res + 'bar')
            }
        }
    })

    model.foo('ok')
})

