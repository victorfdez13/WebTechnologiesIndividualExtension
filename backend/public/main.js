// main.js
document.addEventListener('DOMContentLoaded', () => {

  const API_BASE = 'http://127.0.0.1:8000/api';

  const homeTab = document.getElementById('homeTab');
  const favoritesTab = document.getElementById('favoritesTab');
  const playlistsTab = document.getElementById('playlistsTab');
  const settingsTab = document.getElementById('settingsTab');

  const cardsSection = document.querySelector('.cards-section');
  const mainSongsPanel = document.querySelector('.content-columns');
  const openCreatePlaylistBtn = document.getElementById('openCreatePlaylistBtn');


  const favoritesView = document.getElementById('favoritesView');
  const playlistsView = document.getElementById('playlistsView');
  const settingsView = document.getElementById('settingsView');

  const songListContainer = document.getElementById('songsListContainer');
  const favoritesSongsList = document.getElementById('favoritesSongsList');
  const playlistsList = document.getElementById('playlistsList');
  const playlistSongsList = document.getElementById('playlistSongsList');

  const songForm = document.getElementById('songForm');
  const createPlaylistForm = document.getElementById('createPlaylistForm');

  const audioElem = document.getElementById('audioPlayer');
  const playBtn = document.querySelector('.play-btn');
  const playIcon = playBtn ? playBtn.querySelector('.material-symbols-outlined') : null;
  const progressFill = document.querySelector('.progress-fill');
  const timeCurrent = document.querySelector('.time-current');
  const timeTotal = document.querySelector('.time-total');
  const playerSongTitle = document.getElementById('playerSongTitle');
  const playerSongArtist = document.getElementById('playerSongArtist');

  const statsTab = document.getElementById("statsTab");
  const statsView = document.getElementById("statsView");

  const goToLibraryBtn = document.getElementById('goToLibraryBtn');
  const themeChips = document.querySelectorAll('.theme-chip');
  const logoutButton = document.getElementById('logoutButton');

  let songs = [];
  let currentSongIndex = -1;
  let isPlaying = false;
  let playlists = [];
  let userRole = 'user';

  let selectedPlaylistId = null;
  document.getElementById("addSongToPlaylistBtn").addEventListener("click", () => {
  if (!selectedPlaylistId) {
    alert("Select a playlist first.");
    return;
  }
  location.hash = "addToPlaylistModal";
  loadSongPickerModal();
});
function loadSongPickerModal() {
  const box = document.getElementById("playlistSelectList");
  box.innerHTML = "";

  songs.forEach(song => {
    const div = document.createElement("div");
    div.className = "playlist-card";
    div.innerHTML = `
      <div class="playlist-card-main">
        <p class="playlist-card-title">${escapeHtml(song.title)}</p>
        <p class="playlist-card-desc">${escapeHtml(song.artist)}</p>
      </div>
      <button class="primary-btn secondary" data-id="${song.id}">Add</button>
    `;

    div.querySelector("button").onclick = () => addSongToCurrentPlaylist(song.id);
    box.appendChild(div);
  });
}


// When clicking a playlist in sidebar:
async function openPlaylist(id) {
  selectedPlaylistId = id;
  const playlist = await apiGetPlaylist(id);
  renderPlaylistDetail(playlist);
}

// Hook sidebar playlist buttons to use openPlaylist():
// (Modify your existing renderPlaylistsSidebar button handler)


  function formatDuration(sec) {
    const m = Math.floor(sec / 60);
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function parseDurationToSeconds(str) {
    if (!str) return 0;
    if (typeof str === 'number') return str;
    const p = String(str).split(':');
    if (p.length === 1) return parseInt(p[0], 10) || 0;
    return (parseInt(p[0], 10) || 0) * 60 + (parseInt(p[1], 10) || 0);
  }

  function applyTheme(theme) {
    const body = document.body;
    if (!body) return;
    const normalized = theme === 'light' ? 'light' : 'dark';
    if (normalized === 'light') {
      body.classList.add('theme-light');
      body.classList.remove('theme-dark');
    } else {
      body.classList.add('theme-dark');
      body.classList.remove('theme-light');
    }
    themeChips.forEach((chip) => {
      const label = chip.textContent.trim().toLowerCase();
      const isLightChip = label === 'light';
      chip.classList.toggle('active',
        (normalized === 'light' && isLightChip) ||
        (normalized === 'dark' && !isLightChip)
      );
    });
    localStorage.setItem('musix-theme', normalized);
  }

  function clearActiveTabs() {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  }

  function hideAllViews() {
    cardsSection?.classList.add('hidden');
    mainSongsPanel?.classList.add('hidden');
    favoritesView?.classList.add('hidden');
    playlistsView?.classList.add('hidden');
    settingsView?.classList.add('hidden');
  }

  function showHomeView() {
    hideAllViews();
    cardsSection.classList.remove('hidden');
    mainSongsPanel.classList.remove('hidden');
    clearActiveTabs();
    homeTab.classList.add('active');
    renderSongs(songs);
  }
async function addSongToCurrentPlaylist(songId) {
  if (!selectedPlaylistId) return;

  await fetch(`${API_BASE}/playlists/${selectedPlaylistId}/add-song`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ song_id: songId })
  });

  location.hash = ""; // close modal

  await renderPlaylistsSidebar();
  await openPlaylist(selectedPlaylistId);
}

document.getElementById("deletePlaylistBtn").addEventListener("click", async () => {
  if (!selectedPlaylistId) return;

  await fetch(`${API_BASE}/playlists/${selectedPlaylistId}`, {
    method: "DELETE",
    credentials: "include"
  });

  selectedPlaylistId = null;

  // Reset right panel
  document.querySelector(".playlist-detail-title").textContent = "Select a playlist";
  document.querySelector(".playlist-detail-text").textContent =
    "Choose one of your playlists on the left to see its songs here.";
  playlistSongsList.innerHTML = "";

  await renderPlaylistsSidebar();
});

  async function apiGetSongs() {
    const res = await fetch(`${API_BASE}/songs`, { credentials: 'include' });
    return res.json();
  }

  async function apiCreateSong(data) {
    const res = await fetch(`${API_BASE}/songs`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return { ok: res.ok, status: res.status, data: json };
  }

  async function apiDeleteSong(id) {
    await fetch(`${API_BASE}/songs/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
  }

  async function apiToggleFavorite(id) {
    const res = await fetch(`${API_BASE}/songs/${id}/favorite`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    return res.json();
  }

  async function apiGetFavorites() {
    const res = await fetch(`${API_BASE}/songs/favorites`, { credentials: 'include' });
    if (res.ok) return res.json();
    return songs.filter(s => s.favorite);
  }

  async function apiGetPlaylists() {
    const res = await fetch(`${API_BASE}/playlists`, { credentials: 'include' });
    return res.json();
  }

  async function apiGetPlaylist(id) {
    const res = await fetch(`${API_BASE}/playlists/${id}`, { credentials: 'include' });
    return res.json();
  }

  async function apiCreatePlaylist(data) {
    const res = await fetch(`${API_BASE}/playlists`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  }

    async function loadSongs() {
      songs = await apiGetSongs();
      if (songs.length > 0 && currentSongIndex < 0) selectSong(0, false);
      updateStatsFromSongs();

      if (userRole) {
          renderSongs(songs);
      }
  }

  async function loadPlaylists() {
    playlists = await apiGetPlaylists();
  }

  async function showFavoritesView() {
    hideAllViews();
    favoritesView.classList.remove('hidden');
    clearActiveTabs();
    favoritesTab.classList.add('active');
    await loadSongs();
    const favs = songs.filter(s => s.favorite);
    renderFavorites(favs);
  }
  function renderSongs(list = []) {
    songListContainer.innerHTML = '';
    if (!list.length) {
      songListContainer.innerHTML = '<p class="muted">No songs in your library.</p>';
      return;
    }

    list.forEach((s) => {
      const durationSeconds = parseDurationToSeconds(s.duration);
      const row = document.createElement('div');
      row.className = 'song';

      const idx = songs.findIndex(x => x.id === s.id);
      if (idx === currentSongIndex) row.classList.add('active');
      if (s.favorite) row.classList.add('favorite');

          const editButtonHtml = userRole === 'admin' 
      ? `<button class="edit material-symbols-outlined" data-id="${s.id}" aria-label="Edit">edit</button>` 
      : '';

      console.log('Rendering song, userRole:', userRole, 'showing edit button:', userRole === 'admin');

    row.innerHTML = `
      <span class="song-title">${escapeHtml(s.title)}</span>
      <span class="song-artist">${escapeHtml(s.artist)}</span>
      <span class="song-year">${s.year ?? ''}</span>
      <span class="song-genre">${s.genre ?? ''}</span>
      <span class="song-duration">${formatDuration(durationSeconds)}</span>
      <button class="fav material-symbols-outlined" data-id="${s.id}" aria-label="Toggle favorite">${s.favorite ? 'favorite' : 'favorite_border'}</button>
      ${editButtonHtml}
      <button class="remove material-symbols-outlined" data-id="${s.id}" aria-label="Remove">close</button>
    `;

      row.addEventListener('click', (e) => {
        if (e.target.closest('.remove') || e.target.closest('.fav')) return;
        const songIdx = songs.findIndex(x => x.id === s.id);
        if (songIdx >= 0) selectSong(songIdx, true);
      });

      row.querySelector('.remove').addEventListener('click', async (e) => {
        e.stopPropagation();
        await apiDeleteSong(e.currentTarget.dataset.id);
        await loadSongs();
      });

      row.querySelector('.fav').addEventListener('click', async (e) => {
        e.stopPropagation();
        await apiToggleFavorite(e.currentTarget.dataset.id);
        await loadSongs();
        if (favoritesTab.classList.contains('active')) {
          const favs = songs.filter(x => x.favorite);
          renderFavorites(favs);
        }
      });

      if (userRole === 'admin') {
        const editBtn = row.querySelector('.edit');
        if (editBtn) {
          editBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = e.currentTarget.dataset.id;
            alert(`Edit song ${id} - This will open an edit form!`);
          });
        }
      }

      songListContainer.appendChild(row);
    });
  }

  if (openCreatePlaylistBtn) {
    openCreatePlaylistBtn.addEventListener('click', () => {
      location.hash = 'createPlaylistModal';
    });
  }

  function renderFavorites(list = []) {
    favoritesSongsList.innerHTML = '';

    const emptyState = document.getElementById('favoritesEmptyState');
    if (!list.length) {
      emptyState.style.display = 'block';
      return;
    }
    emptyState.style.display = 'none';

    list.forEach(s => {
      const div = document.createElement('div');
      div.className = 'favorite-row';
      div.innerHTML = `
        <div class="fav-left">
          <strong>${escapeHtml(s.title)}</strong> — <span>${escapeHtml(s.artist)}</span>
        </div>
        <div class="fav-right">
          <span>${formatDuration(parseDurationToSeconds(s.duration))}</span>
          <button class="fav-remove material-symbols-outlined" data-id="${s.id}" aria-label="Remove from favorites">close</button>
        </div>
      `;

      div.querySelector('.fav-remove').addEventListener('click', async (e) => {
        e.stopPropagation();
        await apiToggleFavorite(e.currentTarget.dataset.id);
        await loadSongs();
        const favs = songs.filter(x => x.favorite);
        renderFavorites(favs);
      });

      favoritesSongsList.appendChild(div);
    });
  }

  function selectSong(index, autoPlay = true) {
    if (index < 0 || index >= songs.length) return;
    currentSongIndex = index;
    const s = songs[index];

    document.querySelectorAll('.song').forEach(el => el.classList.remove('active'));
    const activeRow = Array.from(document.querySelectorAll('.song'))
      .find(row => row.querySelector('.remove')?.dataset.id == s.id);
    activeRow?.classList.add('active');

    audioElem.src = s.url || '';
    playerSongTitle.textContent = s.title || 'No song selected';
    playerSongArtist.textContent = s.artist || '—';
    timeCurrent.textContent = '0:00';
    timeTotal.textContent = formatDuration(parseDurationToSeconds(s.duration || 0));
    progressFill.style.width = '0%';

    if (autoPlay) {
      audioElem.play().catch(() => { });
      playBtn.textContent = 'pause';
      isPlaying = true;
    }
  }

  function togglePlay() {
    if (!audioElem) return;

    if (audioElem.paused) {
      audioElem.play();
      if (playIcon) playIcon.textContent = 'pause';
      isPlaying = true;
    } else {
      audioElem.pause();
      if (playIcon) playIcon.textContent = 'play_arrow';
      isPlaying = false;
    }
  }

  function nextSong() {
    if (!songs.length) return;
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    selectSong(currentSongIndex, true);
  }

  function prevSong() {
    if (!songs.length) return;
    currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    selectSong(currentSongIndex, true);
  }

  audioElem.addEventListener('timeupdate', () => {
    const total = audioElem.duration;
    const current = audioElem.currentTime;
    if (!isNaN(total)) {
      progressFill.style.width = `${(current / total) * 100}%`;
      timeCurrent.textContent = formatDuration(Math.floor(current));
      timeTotal.textContent = formatDuration(Math.floor(total));
    }
  });

  audioElem.addEventListener('ended', () => {
    nextSong();
  });

  playBtn?.addEventListener('click', togglePlay);

  document.querySelectorAll('.control-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const label = e.currentTarget.getAttribute('aria-label') || '';
      if (label.toLowerCase().includes('previous')) prevSong();
      if (label.toLowerCase().includes('next')) nextSong();
    });
  });

  function updateStatsFromSongs() {
    const totalSongs = songs.length;
    const favs = songs.filter(s => s.favorite).length;
    const totalSeconds = songs.reduce((sum, s) => sum + parseDurationToSeconds(s.duration || 0), 0);
    const minutes = Math.floor(totalSeconds / 60);

    document.getElementById('totalSongsCount').textContent = totalSongs;
    document.getElementById('totalDuration').textContent = minutes + ' min';
    document.getElementById('favoriteSongsCount').textContent = favs;

    document.getElementById('statsTotalSongs').textContent = totalSongs;
    document.getElementById('statsFavoriteSongs').textContent = favs;
    document.getElementById('statsTotalDuration').textContent = minutes + ' min';
  }

  async function renderPlaylistsSidebar() {
    playlistsList.innerHTML = '';
    await loadPlaylists();

    if (!playlists.length) {
      playlistsList.innerHTML = '<p class="empty-playlists-message">You haven’t created any playlists yet.</p>';
      return;
    }

    playlists.forEach((p) => {
      const div = document.createElement('div');
      div.className = 'playlist-item';
      div.innerHTML = `<button class="playlist-select" data-id="${p.id}">${escapeHtml(p.name)}</button>`;
      playlistsList.appendChild(div);
    });

    playlistsList.querySelectorAll('.playlist-select').forEach(btn => {
     btn.addEventListener('click', async (e) => {
  const id = e.currentTarget.dataset.id;
  await openPlaylist(id);
});

    });
  }

  async function renderPlaylistDetail(playlist) {
    playlistSongsList.innerHTML = '';
    document.querySelector('.playlist-detail-title').textContent = playlist.name;

    if (!playlist.songs || playlist.songs.length === 0) {
      playlistSongsList.innerHTML = '<p class="muted">This playlist is empty.</p>';
      return;
    }

    playlist.songs.forEach(s => {
  const div = document.createElement('div');
  div.className = 'playlist-song-row';
  div.innerHTML = `
    <strong>${escapeHtml(s.title)}</strong>
    — ${escapeHtml(s.artist)}
    <span class="song-duration">${formatDuration(parseDurationToSeconds(s.duration))}</span>
  `;
  playlistSongsList.appendChild(div);
});

  }
  if (createPlaylistForm) {
    createPlaylistForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = new FormData(createPlaylistForm);
      const name = f.get('name')?.trim();
      const desc = f.get('description')?.trim();

      if (!name) {
        alert('Playlist name required');
        return;
      }

      await apiCreatePlaylist({ name, description: desc || '' });
      await renderPlaylistsSidebar();
      createPlaylistForm.reset();
      location.hash = '';
    });
  }

  if (songForm) {
    const songInputs = {
      title: document.getElementById('titleInput'),
      artist: document.getElementById('artistInput'),
      genre: document.getElementById('genreInput'),
      year: document.getElementById('yearInput'),
      duration: document.getElementById('durationInput'),
      url: document.getElementById('urlInput'),
    };
    const songFeedback = {
      title: document.getElementById('titleFeedback'),
      artist: document.getElementById('artistFeedback'),
      genre: document.getElementById('genreFeedback'),
      year: document.getElementById('yearFeedback'),
      duration: document.getElementById('durationFeedback'),
      url: document.getElementById('urlFeedback'),
    };
    const maxTextLength = 255;

    const isValidUrl = (value) => {
      try {
        const parsed = new URL(value);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch (err) {
        return false;
      }
    };

    const getFieldMessage = (key, rawValue) => {
      let message = '';

      if (key === 'title') {
        if (!rawValue) message = 'Please enter the song title.';
        else if (rawValue.length > maxTextLength) message = 'Title must be 255 characters or less.';
      }

      if (key === 'artist') {
        if (!rawValue) message = 'Please enter the artist name.';
        else if (rawValue.length > maxTextLength) message = 'Artist must be 255 characters or less.';
      }

      if (key === 'genre') {
        if (!rawValue) {
          message = 'Please enter the genre.';
        } else if (rawValue.length > maxTextLength) {
          message = 'Genre must be 255 characters or less.';
        }
      }

      if (key === 'year') {
        if (!rawValue) {
          message = 'Please enter the release year.';
        } else if (!/^\d{4}$/.test(rawValue)) {
          message = 'Year must be 4 digits.';
        } else {
          const yearValue = Number(rawValue);
          if (yearValue < 1900) {
            message = 'Year must be 1900 or later.';
          } else if (yearValue > 2100) {
            message = 'Year must be between 1900 and 2100.';
          }
        }
      }

      if (key === 'duration') {
        if (!rawValue) {
          message = 'Please enter the duration in seconds.';
        } else {
          const durationValue = Number(rawValue);
          if (!Number.isFinite(durationValue) || !Number.isInteger(durationValue) || durationValue < 1) {
            message = 'Duration must be a whole number of seconds.';
          }
        }
      }

      if (key === 'url') {
        if (!rawValue) {
          message = 'Please add an MP3 link.';
        } else if (rawValue.length > maxTextLength) {
          message = 'URL must be 255 characters or less.';
        } else if (!/\.mp3(\?.*)?$/i.test(rawValue)) {
          message = 'URL must end with .mp3.';
        } else if (!isValidUrl(rawValue)) {
          message = 'Please enter a valid URL.';
        }
      }

      return message;
    };

    const setFeedback = (key, message) => {
      const input = songInputs[key];
      const feedback = songFeedback[key];
      if (!input || !feedback) return;

      const hasError = Boolean(message);
      feedback.textContent = hasError ? message : '';
      feedback.classList.toggle('is-visible', hasError);
      input.classList.toggle('is-invalid', hasError);
      input.setAttribute('aria-invalid', hasError ? 'true' : 'false');
    };

    const clearFeedback = () => {
      Object.keys(songInputs).forEach((key) => {
        setFeedback(key, '');
      });
    };

    const validateField = (key, show = true) => {
      const input = songInputs[key];
      if (!input) return true;

      const rawValue = input.value.trim();
      const message = getFieldMessage(key, rawValue);
      if (show) setFeedback(key, message);
      return message;
    };

    const showFirstInvalid = () => {
      clearFeedback();
      for (const key of Object.keys(songInputs)) {
        const message = validateField(key, false);
        if (message) {
          setFeedback(key, message);
          songInputs[key]?.focus();
          return false;
        }
      }
      return true;
    };

    songForm.addEventListener('reset', () => {
      clearFeedback();
    });

    clearFeedback();
    songForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!showFirstInvalid()) return;
      const f = new FormData(songForm);

      const duration = Number(f.get('duration'));
      const data = {
        title: (f.get('title') || '').trim(),
        artist: (f.get('artist') || '').trim(),
        genre: (f.get('genre') || '').trim() || null,
        year: f.get('year') ? Number(f.get('year')) : null,
        duration: duration,
        url: (f.get('url') || '').trim(),
      };

      try {
        const res = await apiCreateSong(data);
        if (!res.ok) {
          if (res.data && res.data.errors) {
            const errors = Object.entries(res.data.errors)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
              .join('\n');
            alert('Validation Error:\n' + errors);
          } else if (res.data && res.data.message) {
            alert('Error: ' + res.data.message);
          } else {
            alert('Error: Could not add song (Status ' + res.status + ')');
          }
          return;
        }
        if (res.data && res.data.id) {
          songForm.reset();
          location.hash = '';
          await loadSongs();
        } else {
          alert('Could not add song. Please check your data.');
        }
      } catch (err) {
        alert('Error adding song: ' + err.message);
        console.error(err);
      }
    });
  }

  if (statsTab) statsTab.addEventListener("click", (e) => {
    e.preventDefault();
    showStatsView();
  });

  if (settingsTab) settingsTab.addEventListener("click", (e) => {
    e.preventDefault();
    showSettingsView();
  });

  if (goToLibraryBtn) {
    goToLibraryBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showHomeView();
      renderSongs(songs);
    });
  }

  if (themeChips && themeChips.length) {
    let storedTheme = localStorage.getItem('musix-theme') || 'dark';
    applyTheme(storedTheme);

    themeChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const label = chip.textContent.trim().toLowerCase();
        applyTheme(label === 'light' ? 'light' : 'dark');
      });
    });
  } else {
    applyTheme('dark');
  }

  if (logoutButton) {
    logoutButton.addEventListener('click', async (e) => {
      e.preventDefault();
      console.log('Logout button clicked');
      try {
        const res = await fetch('/logout', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
        console.log('Logout response:', res.status, res.ok);
        if (res.ok || res.status === 302 || res.status === 200) {
          console.log('Logout successful, redirecting to /login');
          window.location.href = '/login';
        } else {
          console.warn('Unexpected logout response:', res.status);
          window.location.href = '/login';
        }
      } catch (err) {
        console.error('Logout error:', err);
        window.location.href = '/login';
      }
    });
  } else {
    console.warn('logoutButton not found');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

    async function loadUserRole() {
    try {
      const res = await fetch(`${API_BASE}/user/role`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        userRole = data.role || 'user';
        console.log('User role loaded:', userRole); 
        console.log('Is admin?', userRole === 'admin');  
      }
    } catch (e) {
      console.error('Could not load user role', e);
    }
  }

  function showSettingsView() {
    hideAllViews();
    settingsView.classList.remove('hidden');
    clearActiveTabs();
    settingsTab.classList.add('active');
  }

  function showStatsView() {
    hideAllViews();
    statsView.classList.remove("hidden");
    clearActiveTabs();
    statsTab.classList.add("active");
  }

  if (homeTab) homeTab.addEventListener('click', (e) => {
    e.preventDefault();
    showHomeView();
  });
  if (favoritesTab) favoritesTab.addEventListener('click', (e) => {
    e.preventDefault();
    showFavoritesView();
  });
  if (playlistsTab) playlistsTab.addEventListener('click', (e) => {
    e.preventDefault();
    showPlaylistsView();
  });
  if (settingsTab) settingsTab.addEventListener('click', (e) => {
    e.preventDefault();
    showSettingsView();
  });

  function showPlaylistsView() {
    hideAllViews();
    playlistsView.classList.remove('hidden');
    clearActiveTabs();
    playlistsTab.classList.add('active');
    renderPlaylistsSidebar();
  }

  (async function init() {
    await loadUserRole();
    await loadSongs();
    await renderPlaylistsSidebar();
    showHomeView();
  })();

});
