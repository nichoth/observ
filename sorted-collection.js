var xtend = require('xtend')
var struct = require('observ-struct')
var observ = require('observ')
var _ = {
    orderBy: require('lodash.orderby'),
    findIndex: require('@f/find-index'),
    sortedIndexBy: require('lodash.sortedindexby')
}

// indexBy
// sortBy
function createSortedCollection (opts) {
    function SortedCollection () {
        return struct({
            order: observ(opts.order || 'asc'),
            sortBy: observ(opts.sortBy),
            sorted: observ([]),
            indexed: struct({})
        })
    }
    SortedCollection._indexBy = opts.indexBy

    Object.keys(sortedCollectionFns).forEach(function (k) {
        SortedCollection[k] = sortedCollectionFns[k]
    })

    return SortedCollection
}

var sortedCollectionFns = {
    // data is an array
    get: function (state, data) {
        var self = this
        var newList = _.orderBy(data, state().sortBy, state().order)
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

        var reSort = !!item[state().sortBy]

        var oldItem = state().indexed[item[self._indexBy]]
        var newItem = xtend(oldItem, item)
        var newIndexedState = {}
        newIndexedState[newItem[self._indexBy]] = newItem

        var arr = state().sorted
        var _newList = arr.slice(0,i).concat([newItem])
            .concat(arr.slice(i + 1, arr.length))

        var newList = reSort ?
            _.orderBy(_newList, state().sortBy, state().order) :
            _newList

        state.set({
            order: state().order,
            sortBy: state().sortBy,
            sorted: newList,
            indexed: xtend(state().indexed, newIndexedState)
        })
    },

    add: function (state, item) {
        var i = _.sortedIndexBy(state().sorted, item, state().sortBy)
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
