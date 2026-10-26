# YVR Heart Signal

[Open the app](https://joosung-min.github.io/yvr-heart-signal/)

A browser-only meeting game powered by Google Forms responses.

## Use

1. Download your Google Sheets responses as **UTF-8 CSV** and upload the file.
2. Review nicknames and questions. In **진실과 거짓**, put one statement on each of three lines and select the lie for each participant.
3. Choose a section:
   - **취향 시그널:** tap cards to switch between answers and nicknames. Each question randomly starts with all answers or all nicknames; disable **시작 면 랜덤** under **진행 준비 → 취향 질문** to always start with answers. Four-person grids use taller cards; six-person grids stay compact.
   - **Two Truths and a Lie:** pick a statement, then reveal the truth.
   - **참가자별 Q&A:** view all of one person's answers and their two truths. Truths stay hidden until the lie is configured.

CSV columns: **Timestamp → Nickname → Taste questions… → Two Truths and a Lie**. Each participant occupies one row. Quoted multiline cells are supported; maximum file size is 10 MB.

**Responses stay in browser memory.** Refreshing, closing the tab, or pressing **Heart Signal** clears responses, settings, and progress. Navigation within the app preserves progress; editing settings resets the relevant game. Actual participant CSVs are excluded from Git.

## Develop

Requires Python 3. No package installation needed.

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Open <http://127.0.0.1:4173>. Run tests with Node.js 20+:

```sh
npm test
```

Pushes to `main` run checks and deploy `dist/` to GitHub Pages. When changing CSS or JavaScript, update the corresponding asset version in `dist/index.html` so browsers load the new files.
