# observ
Several building blocks for creating observable application state

-----------------------------------

notes

* immutable updates -- operations return/emit new objects

-----------------------------------

modules

* observ
* observ-struct
* sorted collection
* from -- a utility
* Model -- compose IO and state changes

## install

    npm install @nichoth/observ


## api

### sorted collection

```js
var test = require('tape')
var createSortedCollection = require('../sorted-collection')

var MyCollection = createSortedCollection({
    sortBy: 'hello',
    indexBy: 'id'
})
var state

test('create state', function (t) {
    state = MyCollection()
    t.deepEqual(state(), {
        sortBy: 'hello',
        sorted: [],
        indexed: {}
    }, 'should return initial state')
    t.end()
})

test('.get', function (t) {
    MyCollection.get(state, [
        { hello: 'b', id: 2 },
        { hello: 'a', id: 1 }
    ])
    t.deepEqual(state(), {
        sortBy: 'hello',
        sorted: [
            { hello: 'a', id: 1 },
            { hello: 'b', id: 2 }
        ],
        indexed: {
            '1': { hello: 'a', id: 1 },
            '2': { hello: 'b', id: 2 }
        }
    }, 'should set state')

    t.end()
})


test('.edit', function (t) {
    MyCollection.edit(state, { id: 1, hello: 'world' })

    t.deepEqual(state(), {
        sortBy: 'hello',
        sorted: [
            { hello: 'b', id: 2 },
            { hello: 'world', id: 1 }
        ],
        indexed: {
            '1': { hello: 'world', id: 1 },
            '2': { hello: 'b', id: 2 }
        }
    }, 'should re-sort if you edit the field it\'s sorted by')

    t.end()
})

test('.add', function (t) {
    MyCollection.add(state, { id: 3, hello: 'foo' })
    t.deepEqual(state(), {
        sortBy: 'hello',
        sorted: [
            { hello: 'b', id: 2 },
            { hello: 'foo', id: 3 },
            { hello: 'world', id: 1 }
        ],
        indexed: {
            '1': { hello: 'world', id: 1 },
            '2': { hello: 'b', id: 2 },
            '3': { hello: 'foo', id: 3 }
        }
    }, 'should add items in the right sort position')

    t.end()
})

test('.delete', function (t) {
    MyCollection.delete(state, { id: 3 })

    t.deepEqual(state(), {
        sortBy: 'hello',
        sorted: [
            { hello: 'b', id: 2 },
            { hello: 'world', id: 1 }
        ],
        indexed: {
            '1': { hello: 'world', id: 1 },
            '2': { hello: 'b', id: 2 }
        }
    }, 'should delete items by their index field')

    t.end()
})

```

### from
Take a plain data type and wrap it in an observable

```js
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
```

## model
Compose async functions with state changes

```js
var Model = require('@nichoth/observ/model')

var model = Model({
    state: {
        hello: observ('world')
    },
    io: {
        foo: function (data, cb) {
            // echo
            process.nextTick(() => cb(null, data))
        }
    },
    update: {
        // every key in `io` must have a corresponding key under `update`.
        // these functions are called on any non-error response.
        // however, you can also include synchronous functions here
        foo: function (state, res) {
            state.hello.set(res)
        }
    }
})

var state = Model.getState(model)

// the given state is extended with two keys, `hasFetched` and `requests`
assert.deepEqual(state(), {
    hello: 'world',
    hasFetched: false,
    requests: {
        isResolving: false,
        resolving: {},
        error: null
    }
})

model.foo('ok', function (err, res) {
    // this is called after the request is done and the state
    // has been updated
    assert.equal(res, 'ok')
    assert.equal(state().hello, 'ok')
})
```

