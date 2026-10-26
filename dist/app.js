import { importCSV, splitStatements, shuffled, lieReady, truthsFor, demo } from './data.js';

const app = document.querySelector('#app');
const announcement = document.querySelector('#announcement');
const colors = ['#9a6552', '#647c70', '#a58555', '#7d7186', '#586f83', '#a66670'];
const state = { page: 'upload', tab: 'participants', data: null, filename: '', error: '', taste: null, lies: null, participant: null };
const heart = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 20 3.8 12.1C-1.6 6.4 8.2 1.4 12 8c3.8-6.6 13.6-1.6 8.2 4.1Z" fill="currentColor"/></svg>';
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const announce = message => { announcement.textContent = message; };
const errorBox = () => state.error ? `<div class="error" role="alert">${esc(state.error)}</div>` : '';

function frame(content) {
  return `<div class="shell"><header class="topbar"><button class="brand" data-action="brand" aria-label="YVR Heart Signal 홈">${heart} Heart Signal <small>VANCOUVER</small></button><nav class="topnav" aria-label="주 메뉴">${state.data ? '<button class="text-btn" data-action="home">홈 화면</button><button class="text-btn" data-action="setup">진행 준비</button>' : ''}<span class="pill"><span class="dot"></span> ${state.data ? `${state.data.participants.length}명의 시그널` : 'YVR EDITION 01'}</span></nav></header><main id="main">${content}</main></div>`;
}

function uploadPage() {
  return `<section class="hero"><div class="eyebrow">YVR HEART SIGNAL / OUR FIRST CHAPTER</div><h1>우연한 만남,<br>서로를 알아가는 <em>시그널.</em></h1><p>스무 개의 질문과 세 개의 이야기.<br>어떤 답변 뒤에, 어떤 사람이 기다리고 있을까요?</p><svg class="hero-art" viewBox="0 0 220 180" aria-hidden="true"><ellipse class="orbit" cx="110" cy="86" rx="102" ry="49" transform="rotate(-28 110 86)"/><ellipse class="orbit" cx="110" cy="86" rx="70" ry="78" transform="rotate(25 110 86)"/><path class="heart" d="M110 128 72 92c-26-28 21-49 38-19 17-30 64-9 38 19Z"/><circle cx="189" cy="40" r="4" fill="#c3a084"/><text x="66" y="173">YOU + ME + MAYBE</text></svg></section>${errorBox()}<div class="upload-layout"><section class="upload-box" id="drop-zone"><svg class="upload-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true"><rect x="9" y="5" width="29" height="38" rx="4" stroke="currentColor" stroke-width="1.3"/><path d="M24 32V16m-6 6 6-6 6 6M16 37h16" stroke="currentColor" stroke-width="1.3"/></svg><h2>우리의 이야기를 불러오세요</h2><p>Google Forms 응답을 CSV로 내려받아 넣어 주세요.<br>파일을 이곳에 끌어다 놓아도 좋아요.</p><button class="primary" data-action="choose-file">CSV 파일 선택 <span aria-hidden="true">↗</span></button><input id="csv-file" class="sr-only" type="file" accept=".csv,text/csv" aria-label="응답 CSV 파일 선택"></section><aside class="intro-box"><div class="eyebrow">HOW IT WORKS</div><h2>Let the signals begin.</h2><div class="step"><b>01</b><p>응답 파일을 불러오고<span>참가자와 질문을 확인해요.</span></p></div><div class="step"><b>02</b><p>오늘의 이야기를 준비하고<span>세 문장 중 거짓 하나를 지정해요.</span></p></div><div class="step"><b>03</b><p>궁금한 마음으로 시작해요<span>카드를 열고, 서로의 이야기를 나눠요.</span></p></div><button class="demo-btn" data-action="demo">가상 참가자 4명으로 먼저 둘러보기 →</button></aside></div><p class="privacy" style="margin-bottom:28px"><span aria-hidden="true">◇</span> 응답은 이 브라우저 메모리에서만 처리해요. 새로고침하면 응답과 진행 상태가 사라져요.</p>`;
}

function setupPage() {
  const { participants, questions } = state.data;
  let content = '';
  if (state.tab === 'participants') content = `<div class="participant-fields">${participants.map((p, i) => `<div class="field-card"><label class="field-label" for="nickname-${p.id}">PARTICIPANT ${String(i + 1).padStart(2, '0')}</label><input id="nickname-${p.id}" data-nickname="${p.id}" value="${esc(p.nickname)}" maxlength="60" autocomplete="off"></div>`).join('')}</div><div class="notice">화면에 공개할 닉네임을 확인해 주세요. 취향 카드의 순서는 질문마다 무작위로 섞여요.</div>`;
  if (state.tab === 'questions') content = `<div class="setup-list">${questions.map((q, i) => `<label class="question-edit"><input type="checkbox" data-question="${q.id}" ${q.enabled ? 'checked' : ''}><div><span>${String(i + 1).padStart(2, '0')}</span>${esc(q.title)}</div></label>`).join('')}</div>`;
  if (state.tab === 'lies') content = `<div class="notice">진행자만 보는 정답 설정 화면이에요. 참가자별로 세 문장을 한 줄씩 적고, 거짓인 문장 하나를 선택해 주세요.</div><div class="setup-list">${participants.map(p => `<section class="lie-editor"><h3>${esc(p.nickname)}</h3><label class="field-label" for="statements-${p.id}">두 가지 진실과 하나의 거짓 · 한 줄에 한 문장</label><textarea id="statements-${p.id}" data-statements="${p.id}" rows="4">${esc(p.statements)}</textarea><div id="options-${p.id}">${lieOptions(p)}</div></section>`).join('')}</div>`;
  return `<div class="section-head"><div><div class="eyebrow">BEFORE WE BEGIN</div><h1>오늘의 시그널을 준비해요</h1><p class="desc">함께할 사람들, 궁금한 질문들, 그리고 작은 비밀 하나.</p></div><span class="meta">${esc(state.filename)}</span></div><div class="tabs" role="tablist" aria-label="진행 준비">${[['participants', '참가자'], ['questions', '취향 질문'], ['lies', '진실과 거짓']].map(([id, label]) => `<button id="tab-${id}" class="tab ${state.tab === id ? 'active' : ''}" role="tab" aria-selected="${state.tab === id}" aria-controls="setup-panel" data-tab="${id}">${label}</button>`).join('')}</div>${errorBox()}<div id="setup-panel" role="tabpanel" aria-labelledby="tab-${state.tab}">${content}</div><div class="setup-actions"><button class="text-btn" data-action="replace">다른 CSV 불러오기</button><button class="primary" data-action="ready">준비 완료 · 홈으로 →</button></div>`;
}

function lieOptions(p) {
  const lines = splitStatements(p.statements);
  return `<div class="editor-note ${lieReady(p) ? 'ready' : 'warning'}">${lines.length !== 3 ? `현재 ${lines.length}개 문장 · 정확히 세 줄로 편집해 주세요.` : lieReady(p) ? '✓ 정답 설정 완료' : '거짓인 문장 하나를 선택해 주세요.'}</div>${lines.length === 3 ? `<fieldset style="border:0;padding:0;margin:0"><legend class="sr-only">${esc(p.nickname)}님의 거짓 문장</legend><div class="lie-options">${lines.map((s, i) => `<label class="radio-line"><input type="radio" name="lie-${p.id}" data-lie="${p.id}" value="${i}" ${p.lie === i ? 'checked' : ''}><span>${esc(s)}</span></label>`).join('')}</div></fieldset>` : ''}`;
}

function homePage() {
  const count = state.data.questions.filter(q => q.enabled).length;
  const ready = state.data.participants.filter(lieReady).length;
  return `${errorBox()}<div class="home-cards"><button class="mode-card taste" data-action="start-taste"><span class="mode-num">Signal No. 01</span><span class="mode-illustration" aria-hidden="true">♡</span><h2>취향 시그널</h2><p>답변을 보고, 떠오르는 사람을 말해 보세요.<br>카드를 뒤집으면 답변의 주인이 나타나요.</p><span class="start"><span>${count}개의 질문 · ${state.data.participants.length}명의 취향</span><span>시작하기 ↗</span></span></button><button class="mode-card lies" data-action="start-lies"><span class="mode-num">Signal No. 02</span><span class="mode-illustration" aria-hidden="true">“ ”</span><h2 class="english">Two Truths and a Lie</h2><p>세 가지 이야기, 그중 하나의 작은 거짓말.<br>어떤 이야기가 거짓일지 골라 보세요.</p><span class="start"><span>${ready === state.data.participants.length ? `${ready}명의 이야기 · 준비 완료` : `정답 설정 ${ready} / ${state.data.participants.length}명`}</span><span>시작하기 ↗</span></span></button><button class="mode-card profiles" data-action="participants"><span class="mode-num">Signal No. 03</span><h2>참가자별 Q&amp;A</h2><p>한 사람의 모든 취향 답변과 두 가지 진실을 모아 봐요.</p><span class="start"><span>${state.data.participants.length}명의 질답</span><span>사람 선택하기 ↗</span></span></button></div><div class="home-meta">${state.data.participants.map(p => `<span class="chip">${esc(p.nickname)}</span>`).join('')}</div><p class="privacy" style="margin-bottom:32px">◇ 진행 상태는 홈에 다녀와도 유지돼요. 새로고침하면 파일을 다시 불러와야 해요.</p>`;
}

function participantPage() {
  const { participants, questions } = state.data;
  const person = participants.find(p => p.id === state.participant) || participants[0];
  const truths = truthsFor(person);
  return `<section class="profile-page"><div class="section-head"><h1>참가자별 Q&amp;A</h1></div><div class="participant-picker" role="group" aria-label="참가자 선택">${participants.map(p => `<button class="person-button ${p.id === person.id ? 'active' : ''}" data-person="${p.id}" aria-pressed="${p.id === person.id}">${esc(p.nickname)}</button>`).join('')}</div><section aria-label="${esc(person.nickname)}님의 질답"><h2 class="profile-name">${esc(person.nickname)}</h2><div class="qa-list">${questions.map((q, i) => `<article class="qa-item"><h3>${i + 1}. ${esc(q.title)}</h3><p>${esc(person.answers[q.id] || '아직 답변이 없어요')}</p></article>`).join('')}</div><section class="profile-truths"><h2>두 가지 진실</h2>${truths.length ? `<div class="truth-list">${truths.map(t => `<p class="truth-item">${esc(t)}</p>`).join('')}</div>` : '<p class="editor-note">진행 준비에서 거짓 문장을 지정하면 두 가지 진실을 볼 수 있어요.</p>'}</section></section><div class="setup-actions"><button class="secondary" data-action="home">← 홈 화면</button></div></section>`;
}

function gameHeader(kind, index, total) {
  return `<div class="game-top"><span>${kind === 'taste' ? '01 / 취향 시그널' : '02 / TWO TRUTHS AND A LIE'}</span><span>${String(index + 1).padStart(2, '0')} <span style="color:#b1a597">/ ${String(total).padStart(2, '0')}</span></span></div><div class="progress" role="progressbar" aria-label="진행률" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${index + 1}"><span style="width:${100 * (index + 1) / total}%"></span></div>`;
}

function gameNav(index, total) {
  return `<div class="nav-row"><button class="secondary" data-action="prev" ${index === 0 ? 'disabled' : ''}>← 이전</button><button class="primary" data-action="next">${index === total - 1 ? '마무리하기' : '다음'} →</button></div>`;
}

function tastePage() {
  const run = state.taste;
  const item = run.items[run.index];
  return `<section class="game">${gameHeader('taste', run.index, run.items.length)}<div class="question-head"><h1>${run.index + 1}. ${esc(item.question.title)}</h1></div><div class="answer-grid">${item.order.map((id, i) => {
    const p = state.data.participants.find(p => p.id === id);
    const open = item.revealed.has(id);
    return `<button class="flip-card ${open ? 'flipped' : ''}" data-flip="${id}" aria-pressed="${open}" aria-label="${open ? `${esc(p.nickname)}. 눌러서 답변 보기` : `답변 ${i + 1}: ${esc(p.answers[item.question.id] || '아직 답변이 없어요')}. 눌러서 닉네임 공개`}" style="--card:${colors[i % colors.length]}"><span class="flip-inner"><span class="face front" aria-hidden="${open}"><span class="card-index">${String(i + 1).padStart(2, '0')}</span><span class="answer">${esc(p.answers[item.question.id] || '아직 답변이 없어요')}</span></span><span class="face back" aria-hidden="${!open}"><span class="card-index">${String(i + 1).padStart(2, '0')}</span><span class="nickname">${esc(p.nickname)}</span></span></span></button>`;
  }).join('')}</div>${gameNav(run.index, run.items.length)}</section>`;
}

function liesPage() {
  const run = state.lies, round = run.rounds[run.index];
  const p = state.data.participants[run.index];
  return `<section class="game">${gameHeader('lies', run.index, run.rounds.length)}<div class="question-head"><h1>${esc(p.nickname)}님의 이야기</h1><p>세 가지 이야기 중, 거짓이라고 생각하는 문장을 골라 주세요.</p></div><div class="statements">${splitStatements(p.statements).map((s, i) => `<button class="statement-card ${round.revealed ? i === p.lie ? 'lie' : 'truth' : round.selected === i ? 'selected' : ''}" data-select="${i}" aria-pressed="${round.selected === i}" ${round.revealed ? 'aria-disabled="true"' : ''}><span class="statement-number">${String(i + 1).padStart(2, '0')}</span><span class="statement-text">${esc(s)}</span>${round.revealed ? `<span class="result-label">${i === p.lie ? '거짓' : '진실'}${round.selected === i ? ' · 내 선택' : ''}</span>` : ''}</button>`).join('')}</div><div class="reveal-box">${round.revealed ? `<p class="result-message">${round.selected === p.lie ? '작은 거짓말을 찾아냈어요!' : '예상 밖의 이야기였네요!'}</p><p class="result-sub">붉은 카드는 거짓, 초록 카드는 진실이에요. 이제 그 이야기를 들려주세요.</p>` : `<button class="primary" data-action="reveal" ${round.selected === null ? 'disabled' : ''}>정답 확인 <span aria-hidden="true">↗</span></button>`}</div>${gameNav(run.index, run.rounds.length)}</section>`;
}

function finishPage() {
  const taste = state.page === 'finish-taste';
  return `<section class="finish"><div class="finish-symbol" aria-hidden="true">♡</div><div class="eyebrow">A LITTLE CLOSER, TOGETHER</div><h1>우리, 조금 더 가까워졌나요?</h1><p>${taste ? '모든 취향 시그널을 만나봤어요.' : '모든 사람의 세 가지 이야기를 만나봤어요.'}<br>가장 의외였던 답변으로, 다음 대화를 시작해 보세요.</p><div class="finish-actions"><button class="secondary" data-action="restart" data-kind="${taste ? 'taste' : 'lies'}">↶ 처음으로</button><button class="primary" data-action="home">홈 화면 →</button></div></section>`;
}

function render(focus = false) {
  const pages = { upload: uploadPage, setup: setupPage, home: homePage, participants: participantPage, taste: tastePage, lies: liesPage, 'finish-taste': finishPage, 'finish-lies': finishPage };
  app.innerHTML = frame(pages[state.page]());
  if (focus) {
    window.scrollTo(0, 0);
    const heading = app.querySelector('h1, h2');
    if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
  }
  wireDropzone();
}

function go(page) { state.page = page; state.error = ''; render(true); }
function invalidateRuns() { state.taste = null; state.lies = null; }
function startTaste(reset = false) {
  const questions = state.data.questions.filter(q => q.enabled);
  if (!questions.length) { state.error = '진행 준비에서 취향 질문을 하나 이상 선택해 주세요.'; render(); return; }
  if (!state.taste || reset) state.taste = { index: 0, items: questions.map(question => ({ question, order: shuffled(state.data.participants.map(p => p.id)), revealed: new Set() })) };
  go('taste');
}
function startLies(reset = false) {
  if (!state.data.participants.every(lieReady)) {
    state.tab = 'lies'; state.page = 'setup'; state.error = '모든 참가자의 문장 세 개와 거짓 문장 하나를 설정하면 시작할 수 있어요.'; render(true); return;
  }
  if (!state.lies || reset) state.lies = { index: 0, rounds: state.data.participants.map(() => ({ selected: null, revealed: false })) };
  go('lies');
}

async function loadFile(file) {
  if (!file) return;
  try {
    if (!file.name.toLowerCase().endsWith('.csv')) throw new Error('확장자가 .csv인 파일을 선택해 주세요.');
    if (file.size > 10 * 1024 * 1024) throw new Error('10MB 이하의 CSV를 선택해 주세요.');
    const data = importCSV(await file.text());
    state.data = data; state.filename = file.name; state.tab = 'participants'; invalidateRuns(); go('setup');
    announce(`${data.participants.length}명과 질문 ${data.questions.length}개를 불러왔어요.`);
  } catch (error) { state.error = error.message; render(); }
}

app.addEventListener('click', e => {
  const target = e.target.closest('button');
  if (!target || target.disabled) return;
  const action = target.dataset.action;
  if (target.dataset.tab) { state.tab = target.dataset.tab; state.error = ''; render(); app.querySelector(`#tab-${state.tab}`).focus(); return; }
  if (target.dataset.person) {
    state.participant = target.dataset.person; render();
    app.querySelector(`[data-person="${state.participant}"]`).focus(); return;
  }
  if (target.dataset.flip) {
    const item = state.taste.items[state.taste.index];
    const id = target.dataset.flip;
    const open = !item.revealed.has(id);
    if (open) item.revealed.add(id); else item.revealed.delete(id);
    target.classList.toggle('flipped', open); target.setAttribute('aria-pressed', String(open));
    const p = state.data.participants.find(p => p.id === id);
    target.setAttribute('aria-label', open ? `${p.nickname}. 눌러서 답변 보기` : `답변: ${p.answers[item.question.id] || '아직 답변이 없어요'}. 눌러서 닉네임 공개`);
    target.querySelector('.front').setAttribute('aria-hidden', String(open)); target.querySelector('.back').setAttribute('aria-hidden', String(!open));
    announce(open ? `${p.nickname}` : '답변으로 돌아왔어요.'); return;
  }
  if (target.dataset.select !== undefined) {
    const round = state.lies.rounds[state.lies.index];
    if (round.revealed) return;
    round.selected = Number(target.dataset.select); render();
    app.querySelector(`[data-select="${round.selected}"]`).focus(); return;
  }
  switch (action) {
    case 'brand':
      state.data = null;
      state.filename = '';
      state.tab = 'participants';
      state.participant = null;
      invalidateRuns();
      go('upload');
      announce('초기화했어요. CSV 파일을 다시 불러와 주세요.');
      break;
    case 'home': go('home'); break;
    case 'setup': go('setup'); break;
    case 'choose-file': app.querySelector('#csv-file').click(); break;
    case 'demo': state.data = structuredClone(demo); state.filename = '가상 참가자 미리보기'; invalidateRuns(); go('home'); break;
    case 'replace': go('upload'); break;
    case 'ready': {
      if (state.data.participants.some(p => !p.nickname.trim())) { state.error = '모든 참가자의 닉네임을 입력해 주세요.'; state.tab = 'participants'; render(); break; }
      go('home'); break;
    }
    case 'participants': go('participants'); break;
    case 'start-taste': startTaste(); break;
    case 'start-lies': startLies(); break;
    case 'prev': case 'next': {
      const run = state[state.page], count = state.page === 'taste' ? run.items.length : run.rounds.length;
      if (action === 'next' && run.index === count - 1) { go(`finish-${state.page}`); break; }
      run.index = Math.max(0, Math.min(count - 1, run.index + (action === 'next' ? 1 : -1))); render(true); break;
    }
    case 'reveal': {
      const round = state.lies.rounds[state.lies.index];
      if (round.selected === null) break;
      round.revealed = true; render(); announce(`${state.data.participants[state.lies.index].lie + 1}번 문장이 거짓이에요.`); break;
    }
    case 'restart': target.dataset.kind === 'taste' ? startTaste(true) : startLies(true); break;
  }
});

app.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.nickname) {
    state.data.participants.find(p => p.id === el.dataset.nickname).nickname = el.value;
    invalidateRuns();
  }
  if (el.dataset.statements) {
    const p = state.data.participants.find(p => p.id === el.dataset.statements);
    p.statements = el.value; p.lie = null; state.lies = null;
    app.querySelector(`#options-${p.id}`).innerHTML = lieOptions(p);
  }
});
app.addEventListener('change', e => {
  const el = e.target;
  if (el.id === 'csv-file') loadFile(el.files[0]);
  if (el.dataset.question !== undefined) {
    state.data.questions.find(q => q.id === Number(el.dataset.question)).enabled = el.checked; state.taste = null;
  }
  if (el.dataset.lie) {
    const p = state.data.participants.find(p => p.id === el.dataset.lie); p.lie = Number(el.value); state.lies = null;
    const note = app.querySelector(`#options-${p.id} .editor-note`); note.className = 'editor-note ready'; note.textContent = '✓ 정답 설정 완료';
  }
});

function wireDropzone() {
  const zone = app.querySelector('#drop-zone');
  if (!zone) return;
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag'));
  zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('drag'); loadFile(e.dataTransfer.files[0]); });
}

document.addEventListener('keydown', e => {
  if (!['taste', 'lies'].includes(state.page) || e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.target.matches('input, textarea, select')) return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    e.preventDefault(); app.querySelector(`[data-action="${e.key === 'ArrowRight' ? 'next' : 'prev'}"]`)?.click();
  }
});
render();
