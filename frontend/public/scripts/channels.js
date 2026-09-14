(() => {
  const yt = document.getElementById('yt-latest');
  const tw = document.getElementById('tw-status');
  const wantYt = yt && !yt.hidden;
  const wantTw = tw && !tw.hidden;
  if (!wantYt && !wantTw) return;

  const DEV_MODE = false;
  const API_BASE = DEV_MODE ? 'http://127.0.0.1:8000' : '';

  const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const formatDate = (iso) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return `${String(d.getUTCDate()).padStart(2, '0')} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  };

  const setBody = (root, nodes) => {
    const body = root.querySelector('.channel-live-body');
    body.classList.remove('muted');
    body.innerHTML = '';
    body.append(...nodes);
  };

  const renderYt = (video) => {
    if (!video) {
      setBody(yt, [Object.assign(document.createElement('span'), { className: 'muted', textContent: 'no videos yet' })]);
      return;
    }
    const wrap = document.createElement('span');
    wrap.className = 'channel-video';

    const img = document.createElement('img');
    img.className = 'channel-thumb';
    img.src = video.thumbnail;
    img.alt = '';
    img.loading = 'lazy';

    const link = document.createElement('a');
    link.className = 'link-accent';
    link.href = video.url;
    link.textContent = video.title;

    wrap.append(img, link);
    setBody(yt, [wrap, Object.assign(document.createElement('span'), {
      className: 'muted',
      textContent: video.published ? ` / ${formatDate(video.published)}` : '',
    })]);
  };

  const renderTw = (twitch) => {
    if (!twitch || !twitch.live) {
      setBody(tw, [Object.assign(document.createElement('span'), { className: 'tag', textContent: 'OFFLINE' })]);
      return;
    }
    const state = document.createElement('span');
    state.className = 'tag';
    state.style.fontWeight = '800';
    state.textContent = 'LIVE';

    const link = document.createElement('a');
    link.className = 'link-accent';
    link.href = twitch.url;
    link.textContent = twitch.title || 'watch stream';

    setBody(tw, [state, document.createTextNode(' '), link]);
  };

  fetch(`${API_BASE}/api/socials`)
    .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
    .then(({ youtube, twitch }) => {
      if (wantYt) renderYt(youtube);
      if (wantTw) renderTw(twitch);
    })
    .catch((error) => {
      console.error(error);
      // fail quiet: hide the dynamic rows, the static link tiles stay
      if (yt) yt.hidden = true;
      if (tw) tw.hidden = true;
    });
})();
