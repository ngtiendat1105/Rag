const fs = require('node:fs')
const vm = require('node:vm')
const assert = require('node:assert/strict')
const ts = require('typescript')

const exportsObject = {}
const code = ts.transpileModule(fs.readFileSync('src/utils/contentModeration.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText
vm.runInNewContext(code, { exports: exportsObject })
const moderate = exportsObject.moderateChatContent

for (const text of [
  'Quy định về nguồn chứng cứ là gì?',
  'Hành vi giết người được quy định tại điều nào?',
  'Tôi muốn hỏi về hợp đồng lao động.',
]) assert.equal(moderate(text).allowed, true, `Expected allowed: ${text}`)

for (const text of [
  'địt mẹ mày',
  'd.m đồ vô dụng',
  'mày ngu quá',
  'chết đi',
  'tao sẽ đánh chết mày',
]) assert.equal(moderate(text).allowed, false, `Expected blocked: ${text}`)

console.log('PASS: appropriate legal questions allowed; profanity and direct threats blocked')
