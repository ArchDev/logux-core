/**
 * Sortable unique event ID.
 * Array of comparable native types (like number or string).
 *
 * @typedef {array} Time
 *
 * @example
 * [1, 'host']
 */

/**
 * Log’s event.
 *
 * @typedef {object} Event
 * @property {string} type Event type name.
 * @property {Time} [time] Event occured time. {@link Log#add} will fill it,
 *                         if field will be empty.
 */

/**
 * Every log store should provide two methods: add and get.
 *
 * @typedef {object} Store
 * @property {function} add Add new event to store. Event always will
 *                          have type and time properties.
 * @property {function} get Return a Promise with events “page”.
 *                          Page is a object with events in `data` property
 *                          and function `next` to return Promise with
 *                          next page. Last page should not have `next`.
 */

/**
 * Returns current time. Time should be unique for every call.
 *
 * @typedef {function} Timer
 * @return {Time}
 */

/**
 * @callback listener
 * @param {Event} event new event
 */

/**
 * @callback iterator
 * @param {Event} event next event
 * @return {boolean} returning false will stop iteration
 */

/**
 * Log is main idea in Logux to store timed events inside.
 *
 * @param {object} opts options
 * @param {Store} opts.store Store for events
 * @param {Timer} opts.timer Timer to mark events
 *
 * @example
 * import Log from 'logux-core'
 * const log = new Log({
 *   store: new MemoryStore(),
 *   timer: createTestTimer()
 * })
 *
 * log.subscribe(beeper)
 * log.add({ type: 'beep' })
 *
 * @class
 */
function Log (opts) {
  if (!opts) opts = { }

  if (typeof opts.timer !== 'function') {
    throw new Error('Expected log timer to be a function')
  }
  this.timer = opts.timer

  if (typeof opts.store === 'undefined') {
    throw new Error('Expected log store to be a object')
  }
  this.store = opts.store

  this.listeners = []
}

Log.prototype = {

  /**
   * Listen for log changes
   *
   * @param {listener} listener will be executed on every added event
   * @return {function} remove listener from log
   *
   * @example
   * const unsubscribe = log.subscribe(newEvent => {
   *   if (newEvent.type === 'beep') beep()
   * })
   * function disableBeeps () {
   *   unsubscribe()
   * }
   */
  subscribe: function subscribe (listener) {
    if (typeof listener !== 'function') {
      throw new Error('Expected log listener to be a function')
    }

    var listeners = this.listeners
    var isSubscribed = true
    listeners.push(listener)

    return function unsubscribe () {
      if (!isSubscribed) return
      isSubscribed = false
      listeners.splice(listeners.indexOf(listener), 1)
    }
  },

  /**
   * Add event to log. It will set time for event (if it missed)
   * and call all listeners.
   *
   * @param {Event} event new event
   * @return {undefined}
   *
   * @example
   * removeButton.addEventListener('click', () => {
   *   log.add({ type: 'users:remove', user: id })
   * })
   */
  add: function add (event) {
    if (typeof event.type === 'undefined') {
      throw new Error('Expected "type" property in event')
    }
    if (typeof event.time === 'undefined') {
      event.time = this.timer()
    }

    this.store.add(event)

    for (var i = 0; i < this.listeners.length; i++) {
      this.listeners[i](event)
    }
  },

  /**
   * Iteraters through all event, from last event to first.
   *
   * Return false from callback if you want to stop iteration.
   *
   * @param {iterator} callback function will be executed on every event
   * @return {undefined}
   *
   * @example
   * log.each(event => {
   *   if ( less(event.time, lastBeep) ) {
   *     return false;
   *   } else if ( event.type === 'beep' &&  ) {
   *     beep()
   *     lastBeep = event.time
   *     return false;
   *   }
   * })
   */
  each: function each (callback) {
    function nextPage (get) {
      get().then(function (page) {
        for (var i = 0; i < page.data.length; i++) {
          var result = callback(page.data[i])
          if (result === false) break
        }
        if (result !== false && page.next) {
          nextPage(page.next)
        }
      })
    }

    nextPage(this.store.get.bind(this.store))
  }
}

module.exports = Log