var test = require('tape')
var createSortedCollection = require('../sorted-collection')

var MyCollection = createSortedCollection({
    sortBy: 'hello',
    indexBy: 'id'
})

// return initial state, an instance of `observ-struct`
var state = MyCollection()

test('create state', function (t) {
    t.deepEqual(state(), {
        order: 'asc',
        sortBy: 'hello',
        sorted: [],
        indexed: {}
    }, 'should return initial state')
    t.end()
})

// here the name of the sort function is used when serializing state
test('pass in a function to sort things', function (t) {
    t.plan(2)
    var Foos = createSortedCollection({
        sortBy: function hello (foo) {
            return foo.hello.toLowerCase()
        },
        indexBy: 'id'
    })

    var state = Foos()
    Foos.get(state, [
        { hello: 'b', id: 2 },
        { hello: 'a', id: 1 },
        { hello: 'C', id: 3 }
    ])

    var _state = state()
    t.equal(_state.sortBy, 'hello',
        'should use function name as sortBy state')

    t.deepEqual(_state.sorted, [
        { hello: 'a', id: 1 },
        { hello: 'b', id: 2 },
        { hello: 'C', id: 3 }
    ], 'should use the predicate to sort things')
})

// change how items are sorted
test('.sortBy', function (t) {
    t.plan(2)

    var Foos = createSortedCollection({
        sortBy: function hello (foo) {
            return foo.hello.toLowerCase()
        },
        indexBy: 'id'
    })

    var state = Foos()
    Foos.get(state, [
        { hello: 'a', foo: 'e', id: 1 },
        { hello: 'b', foo: 'd', id: 2 },
        { hello: 'C', foo: 'f', id: 3 }
    ])

    Foos.sortBy(state, 'foo')
    t.deepEqual(state.sorted(), [
        { hello: 'b', foo: 'd', id: 2 },
        { hello: 'a', foo: 'e', id: 1 },
        { hello: 'C', foo: 'f', id: 3 }
    ], 'should re-sort collection')

    t.equal(state.sortBy(), 'foo')
})

// change ascending or descending
test('.orderBy', function (t) {
    t.plan(2)

    var Foos = createSortedCollection({
        sortBy: function hello (foo) {
            return foo.hello.toLowerCase()
        },
        indexBy: 'id'
    })

    var state = Foos()
    Foos.get(state, [
        { hello: 'b', id: 2 },
        { hello: 'a', id: 1 },
        { hello: 'C', id: 3 }
    ])

    Foos.orderBy(state, 'desc')
    t.deepEqual([
        { hello: 'C', id: 3 },
        { hello: 'b', id: 2 },
        { hello: 'a', id: 1 }
    ], state.sorted(), 'should reverse the order')
    t.equal(state.order(), 'desc')
})

// set the collection of items. The method name `get` is confusing. It's an
// artifact from the api call to a /get endpoint
test('.get', function (t) {
    MyCollection.get(state, [
        { hello: 'b', id: 2 },
        { hello: 'a', id: 1 }
    ])
    t.deepEqual(state(), {
        order: 'asc',
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

// pass in the `order` option
test('sort descending', function (t) {
    var MyCollection = createSortedCollection({
        order: 'desc',
        sortBy: 'hello',
        indexBy: 'id'
    })
    var state = MyCollection()

    MyCollection.get(state, [
        { hello: 'b', id: 2 },
        { hello: 'a', id: 1 }
    ])

    t.deepEqual(state(), {
        order: 'desc',
        sortBy: 'hello',
        sorted: [
            { hello: 'b', id: 2 },
            { hello: 'a', id: 1 }
        ],
        indexed: {
            '1': { hello: 'a', id: 1 },
            '2': { hello: 'b', id: 2 }
        }
    }, 'should set state sorted descending')

    t.end()
})

// update an existing item
test('.edit', function (t) {
    MyCollection.edit(state, { id: 1, hello: 'world' })

    t.deepEqual(state(), {
        order: 'asc',
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

// add an element in the correct sort position
test('.add', function (t) {
    MyCollection.add(state, { id: 3, hello: 'foo' })

    t.deepEqual(state(), {
        order: 'asc',
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
        order: 'asc',
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

