import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCSV, importCSV, splitStatements, shuffled, lieReady, truthsFor, createTasteRun } from '../dist/data.js';

test('Google Forms CSV: BOM, quoted commas, escaped quotes, multiline and CRLF', () => {
  const csv = '\uFEFFTimestamp,닉네임,질문,진실과거짓\r\n2026-10-26,메이플,"노래, 그리고 ""산책""","첫째\r\n둘째\r\n셋째"\r\n';
  const data = importCSV(csv);
  assert.equal(data.participants[0].answers[0], '노래, 그리고 "산책"');
  assert.deepEqual(splitStatements(data.participants[0].statements), ['첫째', '둘째', '셋째']);
  assert.equal(data.participants[0].lie, null);
  assert.equal(data.questions.length, 1);
});
test('blank rows are ignored; blank responses and trailing cells are retained', () => {
  const data = importCSV('time,nick,q,lies\n\nnow,A,,\n,,,\n');
  assert.equal(data.participants.length, 1);
  assert.equal(data.participants[0].answers[0], '');
  assert.deepEqual(parseCSV('a,b,\n'), [['a', 'b', '']]);
});
test('rejects truncated CSV, missing columns, bad quotes and missing nicknames', () => {
  for (const csv of ['time,nick,q,lies\nnow,A,x', 'time,nick,q,lies\nnow,,x,y', 'time,nick,q,lies\nnow,A,"x,y', 'time,nick,q,lies\nnow,A,"x"oops,y', 'a,b,c\nx,y,z', 'time,nick,q,lies']) assert.throws(() => importCSV(csv));
});
test('truth game requires exactly three nonempty statements and an explicit lie index', () => {
  assert.equal(lieReady({ statements: 'a\nb\nc', lie: null }), false);
  assert.equal(lieReady({ statements: 'a\nb\nc', lie: 0 }), true);
  assert.equal(lieReady({ statements: 'a\nb\nc', lie: 3 }), false);
  assert.equal(lieReady({ statements: 'a\nb', lie: 1 }), false);
  assert.deepEqual(splitStatements(' a \r\n\n b\rc '), ['a', 'b', 'c']);
});
test('shuffle does not change the original participant list or lose participants', () => {
  const source = ['p0', 'p1', 'p2', 'p3'];
  const result = shuffled(source, () => 0);
  assert.deepEqual(source, ['p0', 'p1', 'p2', 'p3']);
  assert.deepEqual([...result].sort(), source);
  assert.notDeepEqual(result, source);
});

test('participant profile shows only verified truths, regardless of the lie position', () => {
  for (const lie of [0, 1, 2]) {
    assert.deepEqual(truthsFor({ statements: 'first\nsecond\nthird', lie }), ['first', 'second', 'third'].filter((_, i) => i !== lie));
  }
  assert.deepEqual(truthsFor({ statements: 'first\nsecond\nthird', lie: null }), []);
  assert.deepEqual(truthsFor({ statements: 'first\nsecond', lie: 0 }), []);
});

test('random start chooses the same face for every card in a question', () => {
  const people = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
  const questions = [{ id: 0 }, { id: 1 }];
  const samples = [0.1, 0.2, 0.3, 0.4, 0.9, 0.2, 0.3, 0.4];
  const run = createTasteRun(questions, people, true, () => samples.shift());
  assert.deepEqual([...run.items[0].revealed], ['a', 'b', 'c', 'd']);
  assert.equal(run.items[1].revealed.size, 0);
  run.items[0].revealed.delete('a');
  assert.equal(run.items[0].revealed.size, 3);
  assert.equal(run.items[1].revealed.size, 0);
});

test('disabling random start always shows answers and preserves participant data', () => {
  const people = [{ id: 'a' }, { id: 'b' }];
  const questions = [{ id: 0 }, { id: 1 }];
  const run = createTasteRun(questions, people, false, () => 0);
  assert.ok(run.items.every(item => item.revealed.size === 0));
  assert.ok(run.items.every(item => [...item.order].sort().join(',') === 'a,b'));
  assert.deepEqual(people, [{ id: 'a' }, { id: 'b' }]);
  assert.equal(createTasteRun(questions, people, undefined, () => 0).items[0].revealed.size, 2);
});
