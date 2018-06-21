var State = require('../')
var assert = require('assert')

// data types are defined by functions that return a plain object
function MyDataType () {
    return {
        foo: 'bar',
        hello: 'world'
    }
}

// operations on data are static functions assigned as properties on
// the type constructor
MyDataType.edit = function (data, update) {
    // shallow extend
    return Object.keys(data).reduce((acc, k) => {
        acc[k] = update[k] || data[k]
        return acc
    }, {})
}

// take a constructor for data, and return a constructor for
// observable data
var MyState = State.from(MyDataType)

// create an instance of state
var state = MyState()

// operators are wrapped and exposed by keys on the observ constructor
// this calls `MyDataType.edit` and sets the state with the return value
MyState.edit(state, { hello: 'woooo' })

assert.deepEqual(state(), {
    hello: 'woooo',
    foo: 'bar'
})
console.log(state())

