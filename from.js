var struct = require('observ-struct')

// take a plain function and operators, and wrap it in an observable
function from (fn) {
    var initState = fn()

    function createState () {
        return struct(initState)
    }

    Object.keys(fn).forEach(function (k) {
        // fns that operate on the observable
        createState[k] = function () {
            var args = Array.prototype.slice.call(arguments)
            // var state = args[args.length - 1]
            // var fnArgs = args.slice(0, -1)
            // // call with state arg last
            // var newState = fn[k].apply(fn, fnArgs.concat([state()]))

            var state = args[0]
            var fnArgs = args.slice(1)
            var newState = fn[k].apply(fn, [state()].concat(fnArgs))
            if (newState !== undefined) state.set(newState)
            return state
        }
    })

    return createState
}

module.exports = from

