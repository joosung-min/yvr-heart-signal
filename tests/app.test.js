import test from 'node:test';
import assert from 'node:assert/strict';

test('validation, reset, and separate taste-part progress survive navigation', async () => {
  const handlers = {};
  const app = {
    innerHTML: '',
    addEventListener(type, listener) { handlers[type] = listener; },
    querySelector(selector) { return selector.startsWith('[data-select=') ? { focus() {} } : null; }
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

    const csv = ['time,nick,' + Array.from({ length: 20 }, (_, i) => `Question ${i + 1}`).join(',') + ',lies',
      'now,A,' + Array.from({ length: 20 }, (_, i) => `Answer ${i + 1}`).join(',') + ',"one\ntwo\nthree"'].join('\n');
    handlers.change({ target: { id: 'csv-file', dataset: {}, files: [{ name: 'parts.csv', size: csv.length, text: async () => csv }] } });
    await new Promise(resolve => setImmediate(resolve));
    handlers.change({ target: { dataset: { randomStarts: '' }, checked: false } });
    click('ready');
    click('start-taste');
    assert.match(app.innerHTML, /data-part="0"/);
    assert.match(app.innerHTML, /data-part="1"/);
    const part = index => handlers.click({ target: { closest: () => ({ dataset: { part: String(index) } }) } });
    part(0);
    assert.match(app.innerHTML, /<h1>1\. Question 1<\/h1>/);
    click('next');
    click('taste-parts');
    part(1);
    assert.match(app.innerHTML, /<h1>11\. Question 11<\/h1>/);
    click('next');
    click('taste-parts');
    part(0);
    assert.match(app.innerHTML, /<h1>2\. Question 2<\/h1>/);
    handlers.change({ target: { dataset: { question: '0' }, checked: false } });
    click('taste-parts');
    part(0);
    assert.match(app.innerHTML, /<h1>2\. Question 2<\/h1>/);
    for (let i = 0; i < 9; i++) click('next');
    assert.match(app.innerHTML, /Part 1의 취향 시그널/);
    assert.match(app.innerHTML, /data-action="taste-parts"/);
    handlers.click({ target: { closest: () => ({ dataset: { action: 'restart', kind: 'taste' } }) } });
    assert.match(app.innerHTML, /<h1>2\. Question 2<\/h1>/);
    click('taste-parts');
    part(1);
    assert.match(app.innerHTML, /<h1>12\. Question 12<\/h1>/);

    const move = (kind, id, key) => {
      const list = { dataset: { sortKind: kind } };
      const row = { dataset: { sortItem: String(id) }, closest: () => list };
      const handle = { closest: () => row };
      handlers.keydown({ target: { closest: () => handle }, key, preventDefault() {} });
    };
    click('setup');
    move('questions', '10', 'ArrowLeft');
    move('questions', '10', 'ArrowUp');
    part(0);
    for (let i = 0; i < 8; i++) click('next');
    assert.match(app.innerHTML, /Question 11<\/h1>/);
    assert.match(app.innerHTML, /Answer 11/);

    click('demo');
    click('setup');
    move('people', 'p1', 'ArrowUp');
    click('start-lies');
    assert.match(app.innerHTML, /바다님의 이야기/);
    handlers.click({ target: { closest: () => ({ dataset: { select: '1' } }) } });
    click('reveal');
    assert.match(announcement.textContent, /2번 문장이 거짓/);
    click('next');
    assert.match(app.innerHTML, /메이플님의 이야기/);
  } finally {
    delete globalThis.document;
    delete globalThis.window;
  }
});
