// CineWave Application Core Router & State Management

const API_BASE = '/api';

// Global Application State
const AppState = {
  movies: [],
  theatres: [],
  showtimes: [],
  activeView: 'movies',
  selectedMovie: null,
  selectedTheatre: null,
  selectedShowtime: null,
  selectedDate: null,
  selectedSeats: [], // array of { seatId, row, col, tier, price }
  pricing: {
    subtotal: 0,
    convenienceFee: 0,
    tax: 0,
    discount: 0,
    total: 0
  },
  promoApplied: false,
  promoDiscount: 0,
  currentCase: null,
  holdTimerInterval: null,
  holdTimeRemaining: 600 // 10 minutes in seconds
};

// Initialize Application on Page Load
document.addEventListener('DOMContentLoaded', async () => {
  await loadInitialData();
  renderMovies(AppState.movies);
  setupDateSelector();
});

// Load Initial Data from REST API
async function loadInitialData() {
  try {
    const [moviesRes, theatresRes] = await Promise.all([
      fetch(`${API_BASE}/movies`),
      fetch(`${API_BASE}/theatres`)
    ]);

    AppState.movies = await moviesRes.json();
    AppState.theatres = await theatresRes.json();

    document.getElementById('stat-active-movies').innerText = AppState.movies.length;
    document.getElementById('stat-theatres').innerText = AppState.theatres.length;
  } catch (err) {
    console.error('Error fetching initial data:', err);
    showToast('Failed to connect to backend server.', 'error');
  }
}

// Switch Main Navigation View
function switchView(viewName) {
  const views = ['movies', 'track', 'staff', 'pega', 'analytics'];
  
  views.forEach(v => {
    const sec = document.getElementById(`view-${v}`);
    const btn = document.getElementById(`nav-${v}`);
    if (sec) sec.style.display = v === viewName ? 'block' : 'none';
    if (btn) {
      if (v === viewName) btn.classList.add('active');
      else btn.classList.remove('active');
    }
  });

  AppState.activeView = viewName;
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Trigger view-specific data loading
  if (viewName === 'staff') {
    loadStaffCases();
  } else if (viewName === 'pega') {
    renderPegaStages();
  } else if (viewName === 'analytics') {
    loadAnalytics();
  }
}

// Render Movie Grid
function renderMovies(movies) {
  const container = document.getElementById('movies-container');
  if (!container) return;

  if (movies.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px; color: var(--text-muted);">
        <i class="fa-solid fa-film" style="font-size: 3rem; margin-bottom: 12px; opacity: 0.3;"></i>
        <h3>No movies found matching your filter criteria.</h3>
      </div>
    `;
    return;
  }

  container.innerHTML = movies.map(movie => `
    <div class="movie-card">
      <div class="movie-poster-wrapper">
        <img class="movie-poster" src="${movie.poster}" alt="${movie.title}" loading="lazy">
        <div class="movie-badge-cert">${movie.certificate}</div>
        <div class="movie-rating"><i class="fa-solid fa-star"></i> ${movie.rating}</div>
      </div>
      <div class="movie-info">
        <div class="movie-genre">${movie.genre}</div>
        <h3 class="movie-title">${movie.title}</h3>
        <div class="movie-meta">
          <span><i class="fa-regular fa-clock"></i> ${movie.duration}</span>
          <span><i class="fa-solid fa-language"></i> ${movie.language}</span>
        </div>
        <p class="movie-synopsis">${movie.synopsis}</p>
        <button class="book-btn" onclick="openBookingModal('${movie.id}')">
          <i class="fa-solid fa-ticket"></i> Book Tickets
        </button>
      </div>
    </div>
  `).join('');
}

// Filter Movies (Search, City, Genre)
function filterMovies() {
  const searchQuery = document.getElementById('movie-search').value.toLowerCase().trim();
  const cityFilter = document.getElementById('city-filter').value;
  const genreFilter = document.getElementById('genre-filter').value;

  let filtered = AppState.movies.filter(movie => {
    const matchesSearch = movie.title.toLowerCase().includes(searchQuery) ||
                          movie.genre.toLowerCase().includes(searchQuery) ||
                          movie.director.toLowerCase().includes(searchQuery) ||
                          movie.cast.toLowerCase().includes(searchQuery);

    const matchesGenre = genreFilter === 'All' || movie.genre.toLowerCase().includes(genreFilter.toLowerCase());

    return matchesSearch && matchesGenre;
  });

  renderMovies(filtered);
}

// Date Selector in Booking Modal
function setupDateSelector() {
  const container = document.getElementById('date-selector-container');
  if (!container) return;

  const dates = [];
  const today = new Date();

  for (let i = 0; i < 4; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
    const monthDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    dates.push({ iso, dayName, monthDate, isSelected: i === 0 });
  }

  AppState.selectedDate = dates[0].iso;

  container.innerHTML = dates.map(d => `
    <button type="button" class="btn ${d.isSelected ? 'btn-primary' : 'btn-secondary'}" 
            style="flex: 1; flex-direction: column; padding: 8px;" 
            onclick="selectBookingDate('${d.iso}', this)">
      <span style="font-size: 0.75rem; text-transform: uppercase;">${d.dayName}</span>
      <strong style="font-size: 0.95rem;">${d.monthDate}</strong>
    </button>
  `).join('');
}

function selectBookingDate(dateIso, btnElement) {
  AppState.selectedDate = dateIso;
  const parent = document.getElementById('date-selector-container');
  parent.querySelectorAll('button').forEach(b => {
    b.className = 'btn btn-secondary';
    b.style.flex = '1';
    b.style.flexDirection = 'column';
    b.style.padding = '8px';
  });
  btnElement.className = 'btn btn-primary';
  btnElement.style.flex = '1';
  btnElement.style.flexDirection = 'column';
  btnElement.style.padding = '8px';

  if (AppState.selectedMovie) {
    loadShowtimesForMovie(AppState.selectedMovie.id, AppState.selectedDate);
  }
}

// Open Booking Modal for a selected Movie
async function openBookingModal(movieId) {
  const movie = AppState.movies.find(m => m.id === movieId);
  if (!movie) return;

  AppState.selectedMovie = movie;
  AppState.selectedSeats = [];
  AppState.promoApplied = false;
  AppState.promoDiscount = 0;

  // Reset form fields
  document.getElementById('wizard-movie-poster').src = movie.poster;
  document.getElementById('wizard-movie-title').innerText = movie.title;
  document.getElementById('wizard-movie-meta').innerText = `${movie.genre} • ${movie.duration} • Rating: ${movie.rating}`;
  document.getElementById('wizard-movie-synopsis').innerText = movie.synopsis;

  goToStage(1);
  await loadShowtimesForMovie(movieId, AppState.selectedDate);

  document.getElementById('booking-modal').classList.add('active');
}

function closeBookingModal() {
  document.getElementById('booking-modal').classList.remove('active');
  clearInterval(AppState.holdTimerInterval);
}

// Load Showtimes for selected Movie and Date
async function loadShowtimesForMovie(movieId, date) {
  const container = document.getElementById('theatre-showtimes-list');
  container.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Loading showtimes...</div>`;

  try {
    const res = await fetch(`${API_BASE}/showtimes?movieId=${movieId}&date=${date}`);
    const shows = await res.json();
    AppState.showtimes = shows;

    if (shows.length === 0) {
      container.innerHTML = `
        <div style="background: rgba(255,255,255,0.03); border: 1px dashed var(--border-color); padding: 20px; border-radius: var(--radius-md); text-align: center; color: var(--text-muted);">
          No shows currently scheduled for this date. Please pick another date or movie.
        </div>
      `;
      return;
    }

    // Group shows by theatre
    const grouped = {};
    shows.forEach(show => {
      if (!grouped[show.theatreId]) grouped[show.theatreId] = [];
      grouped[show.theatreId].push(show);
    });

    container.innerHTML = Object.keys(grouped).map(theatreId => {
      const theatre = AppState.theatres.find(t => t.id === theatreId) || { name: 'CineWave Complex', city: 'Metropolis', facilities: [] };
      const theatreShows = grouped[theatreId];

      return `
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
            <div>
              <strong style="font-size: 1rem; color: #fff;">${theatre.name}</strong>
              <div style="font-size: 0.75rem; color: var(--text-muted);"><i class="fa-solid fa-location-dot"></i> ${theatre.city} • ${theatre.facilities.join(' | ')}</div>
            </div>
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 10px;">
            ${theatreShows.map(show => `
              <button type="button" class="btn btn-secondary" style="font-size: 0.85rem; padding: 8px 14px; text-align: center; border-radius: var(--radius-md);" onclick="selectShowtime('${show.id}')">
                <span style="font-weight: 700; color: var(--accent-primary); display: block;">${show.time}</span>
                <span style="font-size: 0.7rem; color: var(--text-muted);">${show.experience}</span>
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error('Error fetching showtimes:', err);
    container.innerHTML = `<div style="color: var(--danger); text-align: center;">Failed to load showtimes.</div>`;
  }
}

// Stage Navigation Wizard Logic
function goToStage(stageNumber) {
  // Hide all stages
  for (let i = 1; i <= 5; i++) {
    const el = document.getElementById(`wizard-stage-${i}`);
    if (el) el.style.display = 'none';
  }

  // Show target stage
  const currentStageEl = document.getElementById(`wizard-stage-${stageNumber}`);
  if (currentStageEl) currentStageEl.style.display = 'block';

  // Update stepper dots
  for (let i = 1; i <= 5; i++) {
    const stepNav = document.getElementById(`step-nav-${i}`);
    if (stepNav) {
      stepNav.classList.remove('active', 'completed');
      if (i === stageNumber) stepNav.classList.add('active');
      else if (i < stageNumber) stepNav.classList.add('completed');
    }
  }
}

// Toast Alert System
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'fa-circle-info';
  if (type === 'success') icon = 'fa-circle-check';
  if (type === 'error') icon = 'fa-circle-exclamation';

  toast.innerHTML = `
    <i class="fa-solid ${icon}" style="font-size: 1.1rem;"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
