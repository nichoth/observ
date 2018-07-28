var xtend = require('xtend')
var obs = require('./')
var Requests = obs.Requests
var struct = obs.struct
var observ = obs.observ
var noop = function () {}

var _id = 0
function getId () {
    return _id++
}

// wrap a state machine with IO state, and bind async functions to static
// update functions
function Model (_opts) {
    var opts = xtend({
        state: null,
        // object of async functions -- (req, cb) => void
        io: null,
        // static functions -- (state, arg) => void
        update: null,
        // optional, called on response from IO functions
        parse: {}
    }, _opts)

    Object.keys(opts.io).forEach(function (k) {
        if (!opts.update[k]) throw new Error('Missing required parameter ' +
            'update.' + k)
    })

    var state = struct(xtend(opts.state, {
        hasFetched: observ(false),
        requests: Requests()
    }))

    var syncUpdateFns = Object.keys(opts.update).reduce(function (acc, k) {
        if (!opts.io[k]) acc[k] = function (arg) {
            opts.update[k](state, arg)
        }
        return acc
    }, {})

    var ioWithUpdates = Object.keys(opts.io).reduce(function (acc, k) {
        acc[k] = function (arg, cb) {
            cb = cb || noop
            var _req = {
                id: getId(),
                req: arg,
                type: k
            }

            Requests.start(state.requests, _req)
            opts.io[k](arg, function (err, res) {
                if (err) {
                    Requests.error(state.requests, {
                        req: _req.req,
                        type: k,
                        id: _req.id,
                        error: err
                    })

                    return cb(err)
                }

                Requests.resolve(state.requests, _req)

                var parsedResponse = opts.parse[k] ?
                    opts.parse[k](res) :
                    res

                opts.update[k](state, parsedResponse, {
                    req: _req,
                })

                cb(null, res)
            })
        }

        return acc
    }, {})

    return xtend({
        _state: state,
        _update: opts.update
    }, syncUpdateFns, ioWithUpdates)
}

Model.getState = function (model) {
    return model._state
}

Model.getUpdate = function (model) {
    return model._update
}

Model.Requests = Requests
module.exports = Model

