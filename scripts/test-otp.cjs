const fs = require('node:fs')
const vm = require('node:vm')
const assert = require('node:assert/strict')
const ts = require('typescript')

const exportsObject = {}
let now = Date.now()
let deliveredCode
let failSend = false
class Clock extends Date { static now() { return now } }
const code = ts.transpileModule(fs.readFileSync('src/lib/otp.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText
vm.runInNewContext(code, {
  exports: exportsObject, require, Buffer, Date: Clock, AbortSignal,
  process: { env: { RESEND_API_KEY: 'test-key', RESEND_FROM_EMAIL: 'test@example.com' } },
  fetch: async (url, options) => {
    assert.equal(url, 'https://api.resend.com/emails')
    deliveredCode = JSON.parse(options.body).text.match(/\d{6}/)[0]
    return { ok: !failSend, json: async () => ({ id: 'test-email' }) }
  },
})

async function test() {
  const { sendOtp, verifyOtp } = exportsObject
  const email = 'user@example.com'
  let id = await sendOtp(email)
  const firstCode = deliveredCode
  await assert.rejects(sendOtp(email), /60/)
  assert.throws(() => verifyOtp(id, 'other@example.com', firstCode))
  assert.throws(() => verifyOtp(id, email, '000000'), /không chính xác/)
  verifyOtp(id, email, firstCode)
  assert.throws(() => verifyOtp(id, email, firstCode), /không còn hợp lệ/)
  now += 60001
  id = await sendOtp(email)
  const oldId = id
  now += 60001
  id = await sendOtp(email)
  assert.throws(() => verifyOtp(oldId, email, deliveredCode))
  for (let i = 0; i < 5; i++) assert.throws(() => verifyOtp(id, email, '000000'))
  assert.throws(() => verifyOtp(id, email, deliveredCode), /không còn hợp lệ/)
  now += 60001
  id = await sendOtp(email)
  now += 300001
  assert.throws(() => verifyOtp(id, email, deliveredCode), /hết hạn/)
  failSend = true
  await assert.rejects(sendOtp(email), /Không thể gửi/)
  failSend = false
  await sendOtp(email)
  console.log('PASS: delivery, cooldown, email binding, wrong code, one-time use, resend, attempt limit, expiry, delivery failure/retry')
}
test().catch(error => { console.error(error); process.exitCode = 1 })
