var struct = require('observ-struct')
var observ = require('observ')
var xtend = require('xtend')

function Requests () {
    return struct({
        isResolving: observ(false),
        error: observ(null),
        resolving: struct({})
    })
}

Requests.error = function (state, err) {
    Requests.resolve(state, err)
    state.error.set(err)
}

Requests.clearError = function (state) {
    state.error.set(null)
}

Requests.start = function (state, req) {
    var newReq = {}
    newReq[req.id] = req
    state.set(xtend(state(), {
        isResolving: true,
        resolving: xtend(state().resolving, newReq)
    }))
}

Requests.resolve = function (state, req) {
    var reqs = xtend(state().resolving)
    delete reqs[req.id]
    state.set(xtend(state(), {
        isResolving: !!Object.keys(reqs).length,
        resolving: reqs
    }))
}

module.exports = Requests

