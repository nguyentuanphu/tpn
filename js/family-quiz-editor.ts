import {T} from './i18n.js';
import {modal} from './popups.js';
import {dom, control} from './games/arcade-board.js';
import {familyQuizQuestions, saveFamilyQuiz} from './family-quiz-store.js';
import {cleanFamilyQuiz, type FamilyQuestion, type FamilyWords} from './content/family-quiz.js';

/** A private draft: only a successful explicit Save replaces this device's questions. */
export function openFamilyQuestions(after?: () => void) {
  const existing = document.querySelector<HTMLElement>('.family-questions:not(.out)');
  if (existing) {
    existing.querySelector<HTMLElement>('h2')?.focus({preventScroll: true});
    return;
  }
  const parentBody = document.querySelector<HTMLElement>('.grownups .grownups-body');
  const parentScroll = parentBody?.scrollTop;
  const m = modal('family-questions', '');
  const card = m.querySelector('.card') as HTMLDivElement;
  const draft: FamilyQuestion[] = JSON.parse(JSON.stringify(familyQuizQuestions()));
  let closing = false;
  const close = () => {
    if (closing) return;
    closing = true;
    m.close();
    after?.();
    // The parent redraw replaces its scroll body; retain the entry position too.
    if (parentScroll !== undefined) {
      const body = document.querySelector<HTMLElement>('.grownups .grownups-body');
      if (body) body.scrollTop = parentScroll;
    }
  };
  const style = dom('style');
  style.textContent = `.family-questions .card{width:min(760px,96vw);max-width:760px;height:min(900px,calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 28px));max-height:calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 28px);display:flex;flex-direction:column;gap:12px;overflow:hidden;padding:16px}.family-questions h2{margin:0}.family-questions .fq-edit-body{flex:1 1 auto;overflow:auto;min-height:0;display:grid;align-content:start;gap:14px;padding:4px}.family-questions .fq-edit-question{background:#fff5df;border:2px solid #d7bdeb;border-radius:18px;padding:12px;display:grid;gap:10px}.family-questions .fq-edit-languages{display:grid;grid-template-columns:1fr 1fr;gap:10px}.family-questions label{display:grid;gap:5px;font-weight:700}.family-questions input,.family-questions textarea,.family-questions select{min-height:64px;min-width:0;width:100%;font:inherit;border:2px solid #ccb7e5;border-radius:12px;padding:8px}.family-questions textarea{resize:vertical}.family-questions button{min-height:64px;min-width:64px;white-space:normal}.family-questions .fq-edit-footer,.family-questions .fq-edit-row{display:flex;gap:10px;flex-wrap:wrap}.family-questions .fq-edit-footer{flex:none}.family-questions .fq-edit-footer button{flex:1}.family-questions .fq-edit-answer{display:grid;gap:8px}.family-questions .fq-edit-status{min-height:1.5em;color:#873d32}@media(max-width:520px){.family-questions .fq-edit-languages{grid-template-columns:1fr}}`;
  const title = dom('h2', '', T('Family questions', 'Câu hỏi gia đình'));
  title.id = 'family-questions-title';
  title.tabIndex = -1;
  card.setAttribute('aria-labelledby', title.id);
  const info = dom('p', 'note', T(
    'Your questions stay on this device and in your save copy. Inviting friends sends this round only to accepted players, encrypted.',
    'Câu hỏi nằm trên máy này và trong bản sao lưu của bạn. Khi mời bạn bè, câu hỏi của ván chỉ gửi có mã hóa tới những bạn đã nhận lời.'
  ));
  const body = dom('div', 'fq-edit-body');
  body.dataset.capturePrivate = 'true';
  const message = dom('p', 'fq-edit-status');
  const footer = dom('div', 'fq-edit-footer');
  message.setAttribute('role', 'status');
  const unsaved = () => { message.textContent = T('Not saved yet.', 'Chưa lưu.'); };
  const cancel = control(T('Cancel', 'Hủy'), close);
  cancel.dataset.familyQuizCancel = 'true';
  const save = control(T('Save and close', 'Lưu và đóng'), async () => {
    if (closing) return;
    const clean = cleanFamilyQuiz(draft);
    if (!clean) {
      message.textContent = T(
        'Give each question and at least two answers some text, and choose the correct answer. English or Vietnamese can be left blank when the other is filled.',
        'Điền câu hỏi và ít nhất hai đáp án, rồi chọn đáp án đúng. Có thể để trống một ngôn ngữ nếu đã điền ngôn ngữ kia.'
      );
      return;
    }
    if (!saveFamilyQuiz(clean)) {
      message.textContent = T('Could not save. Check this device’s free storage and try again.', 'Chưa lưu được. Kiểm tra dung lượng trống của máy rồi thử lại.');
      return;
    }
    // Empty overrides hide the local entry; accepted guests register their round separately.
    (await import('./games/familyquiz.js')).syncFamilyQuizRegistration();
    close();
  });
  save.dataset.familyQuizSave = 'true';
  footer.append(cancel, save);
  card.append(style, title, info, body, message, footer);

  m.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    const controls = [...card.querySelectorAll<HTMLElement>('button:not(:disabled),textarea:not(:disabled),select:not(:disabled)')]
      .filter(e => !e.hidden && e.getClientRects().length > 0);
    const first = controls[0], last = controls[controls.length - 1];
    const active = document.activeElement;
    const outside = !card.contains(active) || active === title;
    if (event.shiftKey && (active === first || outside)) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && (active === last || outside)) {
      event.preventDefault();
      first?.focus();
    }
  });

  const editWords = (pair: FamilyWords, what: string, limit: number) => {
    const wrap = dom('div', 'fq-edit-languages');
    for (const [lang, label] of [[0, 'English'], [1, 'Tiếng Việt']] as const) {
      const group = dom('label', '', what + ' · ' + label);
      const input = dom('textarea');
      input.rows = 2;
      input.maxLength = limit;
      input.value = pair[lang];
      input.dataset.quizLanguage = String(lang);
      input.oninput = () => { pair[lang] = input.value; unsaved(); };
      group.append(input);
      wrap.append(group);
    }
    return wrap;
  };
  const draw = (focus?: string) => {
    body.replaceChildren();
    if (!draft.length) body.append(dom('p', '', T('Add a question about your family, a story or something your child enjoys.', 'Thêm câu hỏi về gia đình, một câu chuyện hoặc điều con yêu thích.')));
    draft.forEach((q, index) => {
      const block = dom('section', 'fq-edit-question');
      block.dataset.question = String(index);
      const row = dom('div', 'fq-edit-row');
      const heading = dom('h3', '', T(`Question ${index + 1}`, `Câu ${index + 1}`));
      const remove = control(T('Remove question', 'Bỏ câu hỏi'), () => {
        draft.splice(index, 1);
        draw(`[data-question="${Math.min(index, draft.length - 1)}"] textarea`);
        unsaved();
      });
      remove.dataset.quizRemoveQuestion = String(index);
      row.append(heading, remove);
      block.append(row, editWords(q.q, T('Question', 'Câu hỏi'), 300));
      q.answers.forEach((answer, i) => {
        const entry = dom('div', 'fq-edit-answer');
        entry.dataset.answer = String(i);
        entry.append(editWords(answer, T(`Answer ${i + 1}`, `Đáp án ${i + 1}`), 120));
        if (q.answers.length > 2) {
          const removeAnswer = control(T('Remove answer', 'Bỏ đáp án'), () => {
            q.answers.splice(i, 1);
            if (q.right === i) q.right = 0;
            else if (q.right > i) q.right--;
            draw(`[data-question="${index}"] [data-answer="${Math.min(i, q.answers.length - 1)}"] textarea`);
            unsaved();
          });
          removeAnswer.dataset.quizRemoveAnswer = String(i);
          entry.append(removeAnswer);
        }
        block.append(entry);
      });
      const correct = dom('label', '', T('Correct answer', 'Đáp án đúng'));
      const select = dom('select');
      select.dataset.quizCorrect = 'true';
      q.answers.forEach((_, i) => {
        const option = dom('option', '', String(i + 1));
        option.value = String(i);
        select.append(option);
      });
      select.value = String(q.right);
      select.onchange = () => { q.right = Number(select.value); unsaved(); };
      correct.append(select);
      block.append(correct);
      if (q.answers.length < 6) {
        const addAnswer = control(T('Add an answer', 'Thêm đáp án'), () => {
          q.answers.push(['', '']);
          draw(`[data-question="${index}"] [data-answer="${q.answers.length - 1}"] textarea`);
          unsaved();
        });
        addAnswer.dataset.quizAddAnswer = String(index);
        block.append(addAnswer);
      }
      body.append(block);
    });
    if (draft.length < 6) {
      const add = control(T('Add a question', 'Thêm câu hỏi'), () => {
        draft.push({q: ['', ''], pic: '❓', answers: [['', ''], ['', '']], right: 0});
        draw(`[data-question="${draft.length - 1}"] textarea`);
        unsaved();
      });
      add.dataset.familyQuizAdd = 'true';
      body.append(add);
    }
    if (focus) (body.querySelector<HTMLElement>(focus) || body.querySelector<HTMLElement>('[data-family-quiz-add]'))?.focus();
  };
  draw();
  requestAnimationFrame(() => {
    if (!closing && !card.contains(document.activeElement)) title.focus({preventScroll: true});
  });
}
