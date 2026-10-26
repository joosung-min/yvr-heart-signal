// A strict CSV reader: quoted commas, escaped quotes, CRLF and multiline cells.
export function parseCSV(source) {
  const text = source.replace(/^\uFEFF/, '');
  const rows = [];
  let row = [], field = '', quoted = false, closed = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { quoted = false; closed = true; }
      else { field += c; }
    } else if (c === '"') {
      if (field || closed) throw new Error('CSV의 따옴표 형식이 올바르지 않아요. Google Sheets에서 CSV로 다시 내려받아 주세요.');
      quoted = true;
    } else if (c === ',' || c === '\n' || c === '\r') {
      row.push(field); field = ''; closed = false;
      if (c !== ',') {
        if (row.some(v => v.trim())) rows.push(row);
        row = [];
        if (c === '\r' && text[i + 1] === '\n') i++;
      }
    } else {
      if (closed) {
        if (c === ' ' || c === '\t') continue;
        throw new Error('닫힌 따옴표 뒤에 예상하지 못한 문자가 있어요. CSV 형식을 확인해 주세요.');
      }
      field += c;
    }
  }
  if (quoted) throw new Error('닫히지 않은 따옴표가 있어요. CSV 파일이 온전히 내려받아졌는지 확인해 주세요.');
  row.push(field);
  if (row.some(v => v.trim())) rows.push(row);
  return rows;
}

export function splitStatements(value) {
  return value.split(/\r\n|\n|\r/).map(s => s.trim()).filter(Boolean);
}

export function importCSV(text) {
  if (text.includes('\uFFFD')) throw new Error('한글 인코딩을 읽을 수 없어요. UTF-8 CSV로 저장해 주세요.');
  const rows = parseCSV(text);
  if (rows.length < 2) throw new Error('질문 제목과 참가자 응답이 있는 CSV를 넣어 주세요.');
  const headers = rows[0].map(h => h.trim());
  if (headers.length < 4) throw new Error('타임스탬프, 닉네임, 취향 질문, 진실·거짓 열이 필요해요.');
  const participants = rows.slice(1).map((row, i) => {
    if (row.length !== headers.length) throw new Error(`${i + 2}번째 행의 열 개수가 제목 행과 달라요.`);
    if (!row[1].trim()) throw new Error(`${i + 2}번째 행의 닉네임을 입력해 주세요.`);
    return { id: `p${i}`, nickname: row[1].trim(), answers: row.slice(2, -1).map(s => s.trim()), statements: row.at(-1).trim(), lie: null };
  });
  const questions = headers.slice(2, -1).map((title, i) => ({ id: i, title: title || `질문 ${i + 1}`, enabled: true }));
  return { participants, questions };
}

export function shuffled(values, random = Math.random) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function lieReady(p) {
  return splitStatements(p.statements).length === 3 && Number.isInteger(p.lie) && p.lie >= 0 && p.lie < 3;
}

export const demo = {
  questions: ['요즘 가장 자주 듣는 노래는?', '나에게 완벽한 주말이란?', '평생 한 가지 음식만 먹어야 한다면?', '내가 가장 좋아하는 계절과 그 이유는?'].map((title, id) => ({ id, title, enabled: true })),
  participants: [
    { nickname: '메이플', answers: ['산책하며 듣는 재즈 플레이리스트', '늦잠, 커피 한 잔, 그리고 바닷가 산책', '뜨끈한 쌀국수', '가을. 걸을 때마다 풍경이 바뀌어서.'], statements: '혼자 유럽 여행을 해봤다.\n커피를 하루에 세 잔 마신다.\n서핑을 배운 적이 있다.', lie: 1 },
    { nickname: '바다', answers: ['백예린의 Square', '아무 계획 없이 떠나는 짧은 여행', '엄마가 해준 김치찌개', '여름. 해가 늦게 져서 하루가 길다.'], statements: '강아지와 함께 살고 있다.\n마라톤을 완주했다.\n민트초코를 좋아한다.', lie: 1 },
    { nickname: '구름', answers: ['출근길의 신나는 밴드 음악', '좋아하는 영화와 배달 음식', '매일 먹어도 좋은 초밥', '겨울. 눈 오는 날의 조용함이 좋아서.'], statements: '기타를 칠 수 있다.\n롤러코스터를 무서워한다.\n다섯 개 언어를 한다.', lie: 2 },
    { nickname: '노을', answers: ['wave to earth의 seasons', '친구들과 브런치, 저녁엔 새로운 레시피', '모양을 바꿔가며 먹는 파스타', '봄. 무언가 시작할 수 있을 것 같아서.'], statements: '빵을 직접 구워 먹는다.\n번지점프를 해봤다.\n식물을 열 개 넘게 키운다.', lie: 1 }
  ].map((p, i) => ({ ...p, id: `p${i}` }))
};

// Unconfigured or malformed statements must never be presented as truths.
export function truthsFor(participant) {
  if (!lieReady(participant)) return [];
  return splitStatements(participant.statements).filter((_, i) => i !== participant.lie);
}

// Choose one starting face per question; navigation reuses the resulting sets.
export function createTasteRun(questions, participants, randomStarts = true, random = Math.random) {
  const ids = participants.map(p => p.id);
  return {
    index: 0,
    items: questions.map(question => {
      const showNames = randomStarts && random() < 0.5;
      return { question, order: shuffled(ids, random), revealed: new Set(showNames ? ids : []) };
    })
  };
}

// Split before filtering, so excluding a question never changes part membership.
export function tastePartQuestions(questions, part) {
  return questions.slice(part * 10, part * 10 + 10).filter(q => q.enabled);
}
