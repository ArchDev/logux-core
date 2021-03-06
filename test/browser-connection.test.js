var BrowserConnection = require('../browser-connection')

function FakeWebSocket () {
  this.sent = []
  var self = this
  setTimeout(function () {
    self.onopen()
  }, 1)
}
FakeWebSocket.prototype = {
  send: function (msg) {
    this.sent.push(msg)
  },
  close: function () { }
}

afterEach(function () {
  delete global.WebSocket
})

it('throws a error on lack of WebSocket support', function () {
  var connection = new BrowserConnection('ws://locahost')
  expect(function () {
    connection.connect()
  }).toThrowError(/WebSocket/)
})

it('emits error on wrong format', function () {
  global.WebSocket = FakeWebSocket
  var connection = new BrowserConnection('ws://locahost')
  var error
  connection.on('error', function (err) {
    error = err
  })

  return connection.connect().then(function () {
    connection.ws.onmessage({ data: '{' })
    expect(error.message).toEqual('Wrong message format')
    expect(error.received).toEqual('{')
  })
})

it('emits error on error', function () {
  global.WebSocket = FakeWebSocket
  var connection = new BrowserConnection('ws://locahost')
  var error
  connection.on('error', function (err) {
    error = err
  })

  return connection.connect().then(function () {
    connection.ws.onerror(new Error('test'))
    expect(error.message).toEqual('test')
  })
})

it('emits connection states', function () {
  global.WebSocket = FakeWebSocket
  var connection = new BrowserConnection('ws://locahost')

  var states = []
  connection.on('connecting', function () {
    states.push('connecting')
  })
  connection.on('connect', function () {
    states.push('connect')
  })
  connection.on('disconnect', function () {
    states.push('disconnect')
  })

  expect(states).toEqual([])
  expect(connection.connected).toBeFalsy()

  var connecting = connection.connect()
  expect(states).toEqual(['connecting'])
  expect(connection.connected).toBeFalsy()

  return connecting.then(function () {
    expect(states).toEqual(['connecting', 'connect'])
    expect(connection.connected).toBeTruthy()

    connection.ws.onclose()
    expect(states).toEqual(['connecting', 'connect', 'disconnect'])
    expect(connection.connected).toBeFalsy()
  })
})

it('closes WebSocket', function () {
  global.WebSocket = FakeWebSocket
  var connection = new BrowserConnection('ws://locahost')

  return connection.connect().then(function () {
    var ws = connection.ws
    ws.close = jest.fn(function () {
      ws.onclose()
    })

    connection.disconnect()
    expect(ws.close).toHaveBeenCalled()
    expect(connection.connected).toBeFalsy()
  })
})

it('receives messages', function () {
  global.WebSocket = FakeWebSocket
  var connection = new BrowserConnection('ws://locahost')

  var received = []
  connection.on('message', function (msg) {
    received.push(msg)
  })

  return connection.connect().then(function () {
    connection.ws.onmessage({ data: '["test"]' })
    expect(received).toEqual([['test']])
  })
})

it('sends messages', function () {
  global.WebSocket = FakeWebSocket
  var connection = new BrowserConnection('ws://locahost')

  return connection.connect().then(function () {
    connection.send(['test'])
    expect(connection.ws.sent).toEqual(['["test"]'])
  })
})
