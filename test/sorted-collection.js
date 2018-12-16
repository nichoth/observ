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
        order: 'asc',
        sortBy: 'hello',
        sorted: [],
        indexed: {}
    }, 'should return initial state')
    t.end()
})

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

