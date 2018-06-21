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
* indexed collection
* from -- a utility

## install

    npm install @nichoth/observ


## api

### sorted collection

```js
var test = require('tape')
var createSortedCollection = require('../create-sorted-collection')

test('sorted collection', function (t) {
    var MyCollection = createSortedCollection({
        sortBy: 'hello',
        indexBy: 'id'
    })

    var state = MyCollection()
    t.deepEqual(state(), {
        sorted: [],
        indexed: {}
    }, 'should return initial state')

    MyCollection.get(state, [
        { hello: 'b', id: 2 },
        { hello: 'a', id: 1 }
    ])
    t.deepEqual(state(), {
        sorted: [
            { hello: 'a', id: 1 },
            { hello: 'b', id: 2 }
        ],
        indexed: {
            '1': { hello: 'a', id: 1 },
            '2': { hello: 'b', id: 2 }
        }
    }, 'get method')

    MyCollection.edit(state, { id: 1, hello: 'world' })
    t.deepEqual(state(), {
        sorted: [
            { hello: 'b', id: 2 },
            { hello: 'world', id: 1 }
        ],
        indexed: {
            '1': { hello: 'world', id: 1 },
            '2': { hello: 'b', id: 2 }
        }
    }, 'should re-sort if you edit the sortby field')

    MyCollection.add(state, { id: 3, hello: 'foo' })
    t.deepEqual(state(), {
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

    MyCollection.delete(state, { id: 3 })
    t.deepEqual(state(), {
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

