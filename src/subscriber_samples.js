import test from 'ava'
import { createInbox } from 'nats'
const NATS = require('nats')

test('subscribe_async', (t) => {
  return new Promise((resolve) => {
    // [begin subscribe_async]
    const nc = NATS.connect({
      url: 'nats://demo.nats.io:4222'
    })
    nc.subscribe('updates', (msg) => {
      t.log(msg)
    })
    // [end subscribe_async]
    nc.publish('updates', 'All is Well!', () => {
      nc.close()
      t.pass()
      resolve()
    })
  })
})

test('subscribe_w_reply', async (t) => {
  return new Promise((resolve) => {
    // [begin subscribe_w_reply]
    const nc = NATS.connect({
      url: 'nats://demo.nats.io:4222'
    })

    // set up a subscription to process a request
    nc.subscribe('time', (msg, reply) => {
      if (reply) {
        nc.publish(reply, new Date().toLocaleTimeString())
      }
    })
    // [end subscribe_w_reply]
    nc.requestOne('time', (msg) => {
      t.log('the time is', msg)
    })

    nc.flush(() => {
      nc.close()
      t.pass()
      resolve()
    })
  })
})

test('unsubscribe', (t) => {
  return new Promise((resolve) => {
    // [begin unsubscribe]
    const nc = NATS.connect({
      url: 'nats://demo.nats.io:4222'
    })
    // set up a subscription to process a request
    const sub = nc.subscribe(NATS.createInbox(), (msg, reply) => {
      if (reply) {
        nc.publish(reply, new Date().toLocaleTimeString())
      }
    })

    // without arguments the subscription will cancel when the server receives it
    // you can also specify how many messages are expected by the subscription
    nc.unsubscribe(sub)
    // [end unsubscribe]
    nc.flush(() => {
      nc.close()
      t.pass()
      resolve()
    })
  })
})

test('subscribe_json', (t) => {
  return new Promise((resolve) => {
    // [begin subscribe_json]
    const nc = NATS.connect({
      url: 'nats://demo.nats.io:4222',
      json: true
    })

    nc.subscribe('updates', (msg) => {
      if (msg && msg.ticker === 'TSLA') {
        t.log('got message:', msg)
      }
    })

    // [end subscribe_json]
    nc.publish('updates', { ticker: 'TSLA', price: 355.49 })
    nc.flush(() => {
      nc.close()
      t.pass()
      resolve()
    })
  })
})

test('unsubscribe_auto', (t) => {
  return new Promise((resolve) => {
    // [begin unsubscribe_auto]
    const nc = NATS.connect({
      url: 'nats://demo.nats.io:4222'
    })
    // `max` specifies the number of messages that the server will forward.
    // The server will auto-cancel.
    const subj = NATS.createInbox()
    const opts = { max: 10 }
    nc.subscribe(subj, opts, (msg) => {
      t.log('sub1', msg)
    })

    // another way after 10 messages
    const sub = nc.subscribe(subj, (msg) => {
      t.log('sub2', msg)
    })
    // if the subscription already received 10 messages, the handler
    // won't get any more messages
    nc.unsubscribe(sub, 10)
    // [end unsubscribe_auto]

    for (let i = 0; i < 10; i++) {
      nc.publish(subj, String(i))
    }

    nc.flush(() => {
      nc.close()
      t.pass()
      resolve()
    })
  })
})

test('subscribe_star', (t) => {
  return new Promise((resolve, reject) => {
    // [begin subscribe_star]
    const nc = NATS.connect({ url: 'nats://demo.nats.io:4222' })

    nc.subscribe('time.us.*', (msg, reply, subject) => {
      // converting timezones correctly in node requires a library
      // this doesn't take into account *many* things.
      let time = ''
      switch (subject) {
        case 'time.us.east':
          time = new Date().toLocaleTimeString('en-us', { timeZone: 'America/New_York' })
          break
        case 'time.us.central':
          time = new Date().toLocaleTimeString('en-us', { timeZone: 'America/Chicago' })
          break
        case 'time.us.mountain':
          time = new Date().toLocaleTimeString('en-us', { timeZone: 'America/Denver' })
          break
        case 'time.us.west':
          time = new Date().toLocaleTimeString('en-us', { timeZone: 'America/Los_Angeles' })
          break
        default:
          time = "I don't know what you are talking about Willis"
      }
      t.log(subject, time)
    })
    // [end subscribe_star]
    nc.publish('time.us.east')
    nc.publish('time.us.central')
    nc.publish('time.us.mountain')
    nc.publish('time.us.west')
    nc.flush(() => {
      nc.close()
      t.pass()
      resolve()
    })
  })
})

test('subscribe_arrow', async (t) => {
  return new Promise((resolve, reject) => {
    // [begin subscribe_arrow]
    const nc = NATS.connect({ url: 'nats://demo.nats.io:4222' })

    nc.subscribe('time.>', (msg, reply, subject) => {
      // converting timezones correctly in node requires a library
      // this doesn't take into account *many* things.
      let time = ''
      switch (subject) {
        case 'time.us.east':
          time = new Date().toLocaleTimeString('en-us', { timeZone: 'America/New_York' })
          break
        case 'time.us.central':
          time = new Date().toLocaleTimeString('en-us', { timeZone: 'America/Chicago' })
          break
        case 'time.us.mountain':
          time = new Date().toLocaleTimeString('en-us', { timeZone: 'America/Denver' })
          break
        case 'time.us.west':
          time = new Date().toLocaleTimeString('en-us', { timeZone: 'America/Los_Angeles' })
          break
        default:
          time = "I don't know what you are talking about Willis"
      }
      t.log(subject, time)
    })
    // [end subscribe_arrow]
    nc.publish('time.us.east')
    nc.publish('time.us.central')
    nc.publish('time.us.mountain')
    nc.publish('time.us.west')
    nc.flush(() => {
      nc.close()
      t.pass()
      resolve()
    })
  })
})

test('subscribe_queue', (t) => {
  return new Promise((resolve, reject) => {
    // [begin subscribe_queue]
    const nc = NATS.connect({ url: 'nats://demo.nats.io:4222' })

    nc.subscribe('updates', { queue: 'workers' }, (msg) => {
      t.log('worker got message', msg)
    })
    // [end subscribe_queue]
    nc.publish('updates')
    nc.flush(() => {
      nc.close()
      t.pass()
      resolve()
    })
  })
})

test('drain_sub', (t) => {
  return new Promise((resolve, reject) => {
    // [begin drain_sub]
    const nc = NATS.connect({ url: 'nats://demo.nats.io:4222' })
    const inbox = createInbox()
    let counter = 0
    const sid = nc.subscribe(inbox, () => {
      counter++
    })

    nc.publish(inbox)
    nc.drainSubscription(sid, (err) => {
      if (err) {
        t.log(err)
      }
      t.log('processed', counter, 'messages')
    })
    nc.flush(() => {
      nc.close()
      t.pass()
      resolve()
    })
    // [end drain_sub]
  })
})

test('no_echo', (t) => {
  return new Promise((resolve, reject) => {
    // [begin no_echo]
    const nc = NATS.connect({
      url: 'nats://demo.nats.io:4222',
      noEcho: true
    })
    // [end no_echo]
    nc.flush(() => {
      nc.close()
      t.pass()
      resolve()
    })
  })
})

test('subscribe_sync', (t) => {
  // [begin subscribe_sync]
  // node-nats subscriptions are always async.
  // [end subscribe_sync]
  t.pass()
})
