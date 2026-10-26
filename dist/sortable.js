// Pointer Events support both touch (including iPad Safari) and mouse handles.
export function attachSortable(root, onChange, onKeyboardMove) {
  let drag = null;

  function place(x, y) {
    const list = document.elementFromPoint(x, y)?.closest('[data-sort-list]');
    if (!list || !root.contains(list) || list.dataset.sortKind !== drag.kind) return;
    const before = [...list.children].find(row => row !== drag.row && y < row.getBoundingClientRect().top + row.getBoundingClientRect().height / 2);
    list.insertBefore(drag.row, before || null);
  }

  function scroll() {
    if (!drag) return;
    const edge = 65;
    const speed = drag.y < edge ? -14 : drag.y > window.innerHeight - edge ? 14 : 0;
    if (speed) {
      window.scrollBy(0, speed);
      place(drag.x, drag.y);
    }
    drag.frame = window.requestAnimationFrame(scroll);
  }

  function finish(cancelled) {
    if (!drag) return;
    const current = drag;
    drag = null;
    window.cancelAnimationFrame(current.frame);
    current.ghost.remove();
    current.row.classList.remove('sort-placeholder');
    document.body.classList.remove('is-sorting');
    if (root.hasPointerCapture(current.pointerId)) root.releasePointerCapture(current.pointerId);
    if (cancelled) {
      current.original.insertBefore(current.row, current.next?.parentNode === current.original ? current.next : null);
      return;
    }
    const lists = [...root.querySelectorAll(`[data-sort-kind="${current.kind}"]`)];
    const groups = lists.map(list => [...list.children].map(row => row.dataset.sortItem));
    onChange(current.kind, groups, current.id);
  }

  root.addEventListener('pointerdown', e => {
    const handle = e.target.closest('[data-sort-handle]');
    if (!handle || drag || (e.pointerType === 'mouse' && e.button !== 0)) return;
    handle.focus?.({ preventScroll: true });
    const row = handle.closest('[data-sort-item]');
    const list = row.closest('[data-sort-list]');
    const rect = row.getBoundingClientRect();
    const ghost = row.cloneNode(true);
    ghost.classList.add('sort-ghost');
    ghost.setAttribute('aria-hidden', 'true');
    Object.assign(ghost.style, { width: `${rect.width}px`, left: `${rect.left}px`, top: `${rect.top}px` });
    document.body.append(ghost);
    drag = { row, ghost, kind: list.dataset.sortKind, id: row.dataset.sortItem, original: list, next: row.nextElementSibling, pointerId: e.pointerId, x: e.clientX, y: e.clientY, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top };
    row.classList.add('sort-placeholder');
    document.body.classList.add('is-sorting');
    root.setPointerCapture(e.pointerId);
    e.preventDefault();
    scroll();
  });

  root.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    drag.x = e.clientX; drag.y = e.clientY;
    drag.ghost.style.left = `${e.clientX - drag.offsetX}px`;
    drag.ghost.style.top = `${e.clientY - drag.offsetY}px`;
    place(e.clientX, e.clientY);
    e.preventDefault();
  });
  root.addEventListener('pointerup', e => { if (drag?.pointerId === e.pointerId) finish(false); });
  root.addEventListener('pointercancel', e => { if (drag?.pointerId === e.pointerId) finish(true); });
  root.addEventListener('lostpointercapture', () => finish(true));
  root.addEventListener('keydown', e => {
    if (e.key === 'Escape' && drag) { e.preventDefault(); finish(true); return; }
    const handle = e.target.closest('[data-sort-handle]');
    if (!handle || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    const row = handle.closest('[data-sort-item]');
    onKeyboardMove(row.closest('[data-sort-list]').dataset.sortKind, row.dataset.sortItem, e.key);
  });
  return () => finish(true);
}
