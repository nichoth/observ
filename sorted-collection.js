var xtend = require('xtend')
var struct = require('observ-struct')
var observ = require('observ')
var _ = {
    orderBy: require('lodash.orderby'),
    findIndex: require('@f/find-index'),
    sortedIndexBy: require('lodash.sortedindexby'),
    sortedLastIndexBy: require('lodash.sortedlastindexby')
}

// indexBy
// sortBy
function createSortedCollection (opts) {
    var sortPredicate = typeof opts.sortBy === 'function' ?
        opts.sortBy :
        function (x) { return opts.sortBy ? x[opts.sortBy] : x }

    function SortedCollection () {
        return struct({
            // asc or desc
            order: observ(opts.order || 'asc'),
            sortBy: observ(typeof opts.sortBy === 'function' ?
                opts.sortBy.name : opts.sortBy),
            sorted: observ([]),
            indexed: struct({})
        })
    }
    SortedCollection._indexBy = opts.indexBy
    SortedCollection._predicate = sortPredicate

    Object.keys(sortedCollectionFns).forEach(function (k) {
        SortedCollection[k] = sortedCollectionFns[k]
    })

    return SortedCollection
}

// @TODO this seems bad to use a reference to `this`
// you could also patch the returned `struct` with some properties for
// the predicate and indexBy. That might be nicer
var sortedCollectionFns = {
    sortBy: function (state, sort) {
        if (sort === this._predicate) return

        var sortPredicate = typeof sort === 'function' ?
            sort :
            function (x) { return sort ? x[sort] : x }

        this._predicate = sortPredicate
        state.sortBy.set(typeof sort === 'function' ?  sort.name : sort)
        var newList = _.orderBy(state.sorted(), sortPredicate,
            state().order)
        state.sorted.set(newList)
    },

    orderBy: function (state, order) {
        if (order === state.order()) return
        var newList = _.orderBy(state.sorted(), this._predicate, order)
        state.order.set(order)
        state.sorted.set(newList)
    },

    // data is an array
    get: function (state, data) {
        var self = this
        var newList = _.orderBy(data, self._predicate, state().order)
        var newData = data.reduce(function (acc, item) {
            acc[item[self._indexBy]] = item
            return acc
        }, {})

        state.set({
            order: state().order,
            sortBy: state().sortBy,
            sorted: newList,
            indexed: newData
        })
    },

    // do a shallow merge of one element
    edit: function (state, item) {
        var self = this
        var i = _.findIndex(state().sorted, function (_item) {
            return _item[self._indexBy] === item[self._indexBy]
        })

        var oldItem = state.indexed()[item[this._indexBy]]
        var newItem = xtend(oldItem, item)
        var reSort = this._predicate(item) !== this._predicate(oldItem)

        var newIndexedState = {}
        newIndexedState[newItem[self._indexBy]] = newItem

        var arr = state().sorted
        var _newList = ([]).concat(state.sorted())
        _newList[i] = newItem
        // _newList = newItem
        // var _newList = arr.slice(0,i).concat([newItem])
        //     .concat(arr.slice(i + 1, arr.length))

        var newList = reSort ?
            _.orderBy(_newList, self._predicate, state().order) :
            _newList

        state.set({
            order: state().order,
            sortBy: state().sortBy,
            sorted: newList,
            indexed: xtend(state().indexed, newIndexedState)
        })
    },

    add: function (state, item) {
        var findIndex = state.order() === 'asc' ?
            _.sortedIndexBy :
            _.sortedLastIndexBy
        var i = findIndex(state().sorted, item, this._predicate)
        var newList = state().sorted.slice(0, i).concat([item])
            .concat(state().sorted.slice(i, state().sorted.length))

        var newData = {}
        newData[item[this._indexBy]] = item

        state.set({
            order: state().order,
            sortBy: state().sortBy,
            sorted: newList,
            indexed: xtend(state().indexed, newData)
        })
    },

    delete: function (state, item) {
        var self = this
        var i = _.findIndex(state().sorted, function (_item) {
            return _item[self._indexBy] === item[self._indexBy]
        })
        var newList = state().sorted.slice(0,i).concat(
            state().sorted.slice(i + 1, state().sorted.length))

        var newData = xtend(state().indexed)
        delete newData[item[self._indexBy]]

        state.set({
            order: state().order,
            sortBy: state().sortBy,
            sorted: newList,
            indexed: newData
        })
    }
}

module.exports = createSortedCollection

