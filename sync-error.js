/**
 * Logux error in logs synchronization.
 *
 * @param {BaseNode} node The node instance.
 * @param {string} type The error code.
 * @param {any} options The error option.
 * @param {boolean} received Was error received from remote node.
 *
 * @example
 * if (error.name === 'SyncError') {
 *   console.log('Server throws: ' + error.description)
 * }
 *
 * @extends Error
 * @class
 */
function SyncError (node, type, options, received) {
  Error.call(this, type)

  /**
   * Always equal to `SyncError`. The best way to check error class.
   * @type {string}
   *
   * @example
   * if (error.name === 'SyncError') { }
   */
  this.name = 'SyncError'

  /**
   * The error code.
   * @type {string}
   *
   * @example
   * if (error.type === 'timeout') {
   *   fixNetwork()
   * }
   */
  this.type = type

  /**
   * Error options depends on error type.
   * @type {any}
   *
   * @example
   * if (error.type === 'timeout') {
   *   console.error('A timeout was reached (' + error.options + ' ms)')
   * }
   */
  this.options = options

  /**
   * Human-readable error description.
   * @type {string}
   *
   * @example
   * console.log('Server throws: ' + error.description)
   */
  this.description = SyncError.describe(type, options)

  /**
   * Current node instance.
   * @type {BaseNode}
   *
   * @example
   * error.node.connection.connected
   */
  this.node = node

  /**
   * Was error received from remote client.
   * @type {boolean}
   */
  this.received = !!received

  this.message = ''
  if (received) {
    if (this.node.remoteNodeId) {
      this.message += this.node.remoteNodeId + ' sent '
    } else {
      this.message += 'Logux received '
    }
    this.message += this.type + ' error'
    if (this.description !== this.type) {
      this.message += ' (' + this.description + ')'
    }
  } else {
    this.message = this.description
  }

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, SyncError)
  }
}

/**
 * Return a error description by it code.
 *
 * @param {string} type The error code.
 * @param {any} options The errors options depends on error code.
 *
 * @return {string} Human-readable error description.
 *
 * @example
 * errorMessage(msg) {
 *   console.log(SyncError.describe(msg[1], msg[2]))
 * }
 */
SyncError.describe = function describe (type, options) {
  if (type === 'timeout') {
    return 'A timeout was reached (' + options + 'ms)'
  } else if (type === 'wrong-format') {
    return 'Wrong message format in ' + options
  } else if (type === 'unknown-message') {
    return 'Unknown message `' + options + '` type'
  } else if (type === 'bruteforce') {
    return 'Too many wrong authentication attempts'
  } else if (type === 'missed-auth') {
    return 'Start authentication before sending message ' + options
  } else if (type === 'wrong-protocol') {
    return 'Logux supports protocols only from version ' + options.supported +
           ', but you use ' + options.used
  } else if (type === 'wrong-subprotocol') {
    return 'Only ' + options.supported + ' application subprotocols are ' +
           'supported, but you use ' + options.used
  } else if (type === 'wrong-credentials') {
    return 'Wrong credentials'
  } else {
    return type
  }
}

SyncError.prototype = Error.prototype

module.exports = SyncError
