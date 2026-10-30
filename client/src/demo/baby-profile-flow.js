import { demoLocal as localStorage } from './storage';
// Readable extension for the deployed FD04 demo (the repository has no source app).
// Baby information stays in this browser and is never uploaded.
export function createBabyProfileFlow({
  React,
  DeviceFrame,
  navigate,
  language,
  BackIcon,
}) {
  const h = React.createElement;
  const PROFILE_KEY = 'fd04_baby_profile';
  const copy = (lang, zh, en) => (lang === 'zh' ? zh : en);

  function hasBaby() {
    try {
      const profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
      return Boolean(
        profile &&
        typeof profile.name === 'string' &&
        profile.name.trim() &&
        /^\d{4}-\d{2}-\d{2}$/.test(profile.birthday),
      );
    } catch {
      return false;
    }
  }

  function MissingBabyPrompt() {
    const go = navigate();
    const { language: lang } = language();
    const dialog = React.useRef(null);
    const primary = React.useRef(null);
    const titleId = React.useId();
    const descriptionId = React.useId();
    React.useEffect(() => {
      primary.current?.focus({ preventScroll: true });
    }, []);
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        go('/device', { replace: true });
      }
      if (event.key === 'Tab') {
        const buttons = [...dialog.current.querySelectorAll('button')];
        const first = buttons[0],
          last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    return h(
      'div',
      { className: 'baby-missing-overlay' },
      h(
        'section',
        {
          ref: dialog,
          className: 'baby-missing-dialog',
          role: 'dialog',
          'aria-modal': true,
          'aria-labelledby': titleId,
          'aria-describedby': descriptionId,
          onKeyDown,
        },
        h(
          'div',
          { className: 'baby-profile-icon', 'aria-hidden': true },
          h(
            'svg',
            { viewBox: '0 0 48 48', fill: 'none' },
            h('circle', {
              cx: 24,
              cy: 25,
              r: 15,
              stroke: 'currentColor',
              strokeWidth: 2,
            }),
            h('path', {
              d: 'M23 10c6-8 13 1 5 5M18 23v2m12-2v2m-12 6c3 4 9 4 12 0',
              stroke: 'currentColor',
              strokeWidth: 2,
              strokeLinecap: 'round',
            }),
          ),
        ),
        h(
          'h2',
          { id: titleId },
          copy(lang, '还没有添加宝宝', 'Add a Baby to Log Feedings'),
        ),
        h(
          'p',
          { id: descriptionId },
          copy(
            lang,
            '本次调奶暂时无法记入喂养记录。添加宝宝信息后，即可记录宝宝的喂养情况。',
            'This preparation can’t be added to a feeding record yet. Add your baby’s information to start logging feedings.',
          ),
        ),
        h(
          'button',
          {
            ref: primary,
            type: 'button',
            className: 'baby-primary',
            onClick: () => go('/add-baby'),
          },
          copy(lang, '添加宝宝', 'Add Baby'),
        ),
        h(
          'button',
          {
            type: 'button',
            className: 'baby-secondary',
            onClick: () => go('/device', { replace: true }),
          },
          copy(lang, '忽略', 'Ignore'),
        ),
      ),
    );
  }

  function AddBabyPage() {
    const go = navigate();
    const { language: lang } = language();
    const [name, setName] = React.useState('');
    const [birthday, setBirthday] = React.useState('');
    const [gender, setGender] = React.useState('unspecified');
    const [error, setError] = React.useState('');
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const nameId = React.useId(),
      birthdayId = React.useId(),
      genderId = React.useId();
    const errorId = React.useId();
    function save(event) {
      event.preventDefault();
      if (!name.trim()) {
        setError(copy(lang, '请输入宝宝昵称', 'Enter your baby’s name.'));
        return;
      }
      if (!birthday || birthday > today) {
        setError(
          copy(
            lang,
            '请选择有效的出生日期，不能晚于今天',
            'Choose a valid date of birth, not later than today.',
          ),
        );
        return;
      }
      try {
        localStorage.setItem(
          PROFILE_KEY,
          JSON.stringify({ name: name.trim(), birthday, gender }),
        );
        window.dispatchEvent(new Event('fd04BabyProfileChanged'));
        go('/device', { replace: true });
      } catch {
        setError(
          copy(
            lang,
            '保存失败，请检查浏览器存储设置后重试',
            'Could not save. Check browser storage settings and try again.',
          ),
        );
      }
    }
    return h(
      DeviceFrame,
      { background: '#F8F7F5' },
      h(
        'div',
        { className: 'baby-add-page' },
        h(
          'div',
          { className: 'fd06-page-nav' },
          h(
            'button',
            {
              type: 'button',
              className: 'fd06-page-back',
              'aria-label': copy(lang, '返回', 'Back'),
              onClick: () => go('/device', { replace: true }),
            },
            h(BackIcon),
          ),
          h('h1', null, copy(lang, '添加宝宝', 'Add Baby')),
          h('div', { style: { width: 32 } }),
        ),
        h(
          'form',
          {
            className: 'baby-add-form',
            onSubmit: save,
            'aria-describedby': error ? errorId : undefined,
          },
          h(
            'div',
            { className: 'baby-add-intro' },
            h(
              'span',
              { className: 'baby-add-avatar', 'aria-hidden': true },
              '♡',
            ),
            h(
              'h2',
              null,
              copy(lang, '认识一下你的小宝贝', 'Meet Your Little One'),
            ),
            h(
              'p',
              null,
              copy(
                lang,
                '完善宝宝信息，开始记录每一次喂养。',
                'Add a few details to start tracking feedings.',
              ),
            ),
          ),
          h(
            'div',
            { className: 'baby-fields' },
            h(
              'label',
              { htmlFor: nameId },
              copy(lang, '宝宝昵称', 'Baby’s Name'),
              h('span', { 'aria-hidden': true }, ' *'),
            ),
            h('input', {
              id: nameId,
              value: name,
              onChange: (e) => setName(e.target.value),
              required: true,
              maxLength: 30,
              autoComplete: 'off',
              placeholder: copy(
                lang,
                '请输入宝宝昵称',
                'Enter your baby’s name',
              ),
            }),
            h(
              'label',
              { htmlFor: birthdayId },
              copy(lang, '出生日期', 'Date of Birth'),
              h('span', { 'aria-hidden': true }, ' *'),
            ),
            h('input', {
              id: birthdayId,
              type: 'date',
              value: birthday,
              max: today,
              min: '1900-01-01',
              required: true,
              onChange: (e) => setBirthday(e.target.value),
            }),
            h(
              'label',
              { htmlFor: genderId },
              copy(lang, '宝宝性别（选填）', 'Gender (Optional)'),
            ),
            h(
              'select',
              {
                id: genderId,
                value: gender,
                onChange: (e) => setGender(e.target.value),
              },
              h(
                'option',
                { value: 'unspecified' },
                copy(lang, '暂不填写', 'Prefer not to say'),
              ),
              h('option', { value: 'girl' }, copy(lang, '女宝宝', 'Girl')),
              h('option', { value: 'boy' }, copy(lang, '男宝宝', 'Boy')),
            ),
          ),
          error &&
            h(
              'p',
              { id: errorId, role: 'alert', className: 'baby-form-error' },
              error,
            ),
          h(
            'p',
            { className: 'baby-local-note' },
            copy(
              lang,
              '演示信息仅保存在当前浏览器，不会上传。',
              'Demo details stay in this browser and are not uploaded.',
            ),
          ),
          h(
            'button',
            { type: 'submit', className: 'baby-primary baby-save' },
            copy(lang, '保存', 'Save'),
          ),
        ),
      ),
    );
  }
  return { hasBaby, MissingBabyPrompt, AddBabyPage };
}
