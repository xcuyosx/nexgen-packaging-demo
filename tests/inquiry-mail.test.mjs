import assert from 'node:assert/strict'
import test from 'node:test'
import { createInquiryMailer } from '../supabase/functions/submit-inquiry/mail.ts'

const mail = { from: 'orders@nexgenpac.com', to: ['visitor@example.test'],
  replyTo: 'orders@nexgenpac.com', subject: 'Test confirmation', text: 'Test message',
  idempotencyKey: '10000000-0000-4000-8000-000000000001:visitor' }

test('Resend sends the approved fields server-side and keeps retry payload and key stable', async () => {
  const requests = []
  const send = createInquiryMailer('local-test-key', async (url, init) => {
    requests.push({ url, init })
    return Response.json({ id: 'provider-message-id' })
  })
  await send(mail); await send(mail)
  assert.equal(requests[0].url, 'https://api.resend.com/emails')
  assert.equal(requests[0].init.method, 'POST')
  assert.equal(requests[0].init.redirect, 'error')
  assert.equal(requests[0].init.headers.Authorization, 'Bearer local-test-key')
  assert.equal(requests[0].init.headers['Idempotency-Key'], mail.idempotencyKey)
  assert.deepEqual(JSON.parse(requests[0].init.body), { from: mail.from, to: mail.to,
    reply_to: mail.replyTo, subject: mail.subject, text: mail.text })
  assert.equal(requests[0].init.body, requests[1].init.body)
  assert.equal(requests[0].init.headers['Idempotency-Key'], requests[1].init.headers['Idempotency-Key'])
  assert.ok(requests[0].init.signal instanceof AbortSignal)
})

test('missing credentials make no provider request', async () => {
  let calls = 0
  const send = createInquiryMailer(' ', async () => { calls++; return Response.json({ id: 'unused' }) })
  await assert.rejects(send(mail), /not been configured/)
  assert.equal(calls, 0)
})

test('provider rejection, malformed success, and network errors cannot count as sent or leak details', async () => {
  const responses = [
    () => Response.json({ message: 'private-provider-details' }, { status: 403 }),
    () => Response.json({ message: 'private-provider-details' }, { status: 429 }),
    () => Response.json({ message: 'private-provider-details' }, { status: 500 }),
    () => Response.json({}), () => Response.json({ id: '' }), () => Response.json(null),
    () => new Response('invalid-json'),
    () => { throw new Error('private-provider-details') },
  ]
  for (const response of responses) {
    const send = createInquiryMailer('local-test-key', async () => response())
    await assert.rejects(send(mail), { message: 'Inquiry email could not be confirmed' })
  }
})

test('outbound timeout is bounded even when the provider never responds', async () => {
  const originalTimeout = AbortSignal.timeout
  AbortSignal.timeout = ms => { assert.equal(ms, 8000); return originalTimeout(10) }
  const keepAlive = setTimeout(() => {}, 1000)
  try {
    const send = createInquiryMailer('local-test-key', async (_url, init) => new Promise((_resolve, reject) => {
      init.signal.addEventListener('abort', () => reject(init.signal.reason), { once: true })
    }))
    await assert.rejects(send(mail), { message: 'Inquiry email could not be confirmed' })
  } finally {
    clearTimeout(keepAlive)
    AbortSignal.timeout = originalTimeout
  }
})
