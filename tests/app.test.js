import test from 'node:test';
import assert from 'node:assert/strict';

test('navigation validates names and reset cancels in-flight CSV reads', async () => {
  const handlers = {};
  const app = {
    innerHTML: '',
    addEventListener(type, listener) { handlers[type] = listener; },
    querySelector() { return null; }
  };
  const announcement = { textContent: '' };
  globalThis.document = {
    querySelector: selector => selector === '#app' ? app : announcement,
    addEventListener() {}
  };
  globalThis.window = { scrollTo() {} };
  try {
    await import('../dist/app.js');
    const click = action => handlers.click({ target: { closest: () => ({ dataset: { action } }) } });
    click('demo');
    handlers.input({ target: { dataset: { nickname: 'p0' }, value: '   ' } });
    click('home');
    assert.match(app.innerHTML, /모든 참가자의 닉네임을 입력해 주세요/);
    assert.match(app.innerHTML, /id="nickname-p0"/);

    let finishRead;
    handlers.change({ target: { id: 'csv-file', dataset: {}, files: [{
      name: 'responses.csv', size: 100,
      text: () => new Promise(resolve => { finishRead = resolve; })
    }] } });
    click('brand');
    finishRead('time,nick,q,lies\nnow,A,answer,"one\ntwo\nthree"');
    await new Promise(resolve => setImmediate(resolve));
    assert.match(app.innerHTML, /id="csv-file"/);
    assert.doesNotMatch(app.innerHTML, /id="nickname-p0"/);
    assert.doesNotMatch(app.innerHTML, /responses\.csv/);
    assert.match(announcement.textContent, /초기화/);
  } finally {
    delete globalThis.document;
    delete globalThis.window;
  }
});
