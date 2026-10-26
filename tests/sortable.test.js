import test from 'node:test';
import assert from 'node:assert/strict';
import { attachSortable } from '../dist/sortable.js';

test('touch drag moves between lists, cancellation restores order, and keyboard moves are delegated', () => {
  const handlers = {};
  const classes = () => ({ add() {}, remove() {} });
  function list() {
    return {
      dataset: { sortKind: 'questions' }, children: [],
      insertBefore(row, before) {
        if (row.parentNode) row.parentNode.children.splice(row.parentNode.children.indexOf(row), 1);
        const index = before ? this.children.indexOf(before) : this.children.length;
        this.children.splice(index, 0, row); row.parentNode = this;
      }
    };
  }
  function row(id) {
    return {
      dataset: { sortItem: id }, classList: classes(),
      get nextElementSibling() { return this.parentNode.children[this.parentNode.children.indexOf(this) + 1]; },
      closest() { return this.parentNode; },
      getBoundingClientRect() { return { left: 0, top: 100, height: 50, width: 200 }; },
      cloneNode() { return { classList: classes(), style: {}, setAttribute() {}, remove() {} }; }
    };
  }
  const lists = [list(), list()];
  const a = row('0'), b = row('1'), c = row('2');
  lists[0].insertBefore(a, null); lists[0].insertBefore(b, null); lists[1].insertBefore(c, null);
  const root = {
    addEventListener(type, handler) { handlers[type] = handler; },
    contains: target => lists.includes(target),
    querySelectorAll: () => lists,
    setPointerCapture() {}, hasPointerCapture: () => true, releasePointerCapture() {}
  };
  let targetList = lists[1];
  globalThis.document = { body: { append() {}, classList: classes() }, elementFromPoint: () => ({ closest: () => targetList }) };
  globalThis.window = { innerHeight: 800, requestAnimationFrame: () => 1, cancelAnimationFrame() {}, scrollBy() {} };
  try {
    const changes = [], keys = [];
    const cancel = attachSortable(root, (...args) => changes.push(args), (...args) => keys.push(args));
    const target = { closest: () => ({ closest: () => a }) };
    const down = () => handlers.pointerdown({ target, pointerId: 7, pointerType: 'touch', clientX: 30, clientY: 150, preventDefault() {} });
    const move = () => handlers.pointermove({ pointerId: 7, clientX: 300, clientY: 350, preventDefault() {} });
    down(); move(); handlers.pointerup({ pointerId: 7 });
    assert.deepEqual(changes, [['questions', [['1'], ['2', '0']], '0']]);

    targetList = lists[0];
    down(); move(); handlers.pointercancel({ pointerId: 7 });
    assert.deepEqual(lists.map(l => l.children.map(r => r.dataset.sortItem)), [['1'], ['2', '0']]);
    assert.equal(changes.length, 1);
    handlers.keydown({ target, key: 'ArrowUp', preventDefault() {} });
    assert.deepEqual(keys, [['questions', '0', 'ArrowUp']]);
    cancel();
  } finally {
    delete globalThis.document;
    delete globalThis.window;
  }
});
