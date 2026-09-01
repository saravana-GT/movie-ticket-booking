// CineWave Box Office Staff Portal, Case Queue & Executive Analytics

let staffBookings = [];

// Load Staff Case Queue
async function loadStaffCases() {
  const tbody = document.getElementById('staff-cases-tbody');
  tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 30px; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Loading case queue...</td></tr>`;

  try {
    const res = await fetch(`${API_BASE}/bookings`);
    staffBookings = await res.json();
    renderStaffTable(staffBookings);
  } catch (err) {
    console.error('Error fetching staff cases:', err);
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--danger); padding: 20px;">Failed to load case queue.</td></tr>`;
  }
}

// Render Staff Cases Table
function renderStaffTable(bookings) {
  const tbody = document.getElementById('staff-cases-tbody');

  if (bookings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 40px; color: var(--text-muted);">No cases found in this queue.</td></tr>`;
    return;
  }

  tbody.innerHTML = bookings.map(b => {
    const isCancelled = b.status === 'Resolved-Cancelled';
    return `
      <tr style="border-bottom: 1px solid var(--border-color); transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
        <td style="padding: 14px 18px; font-weight: 700;">
          <a href="javascript:void(0)" onclick="inspectCase('${b.caseId}')" style="color: var(--accent-primary); text-decoration: none;">${b.caseId}</a>
        </td>
        <td style="padding: 14px 18px;">
          <div style="font-weight: 600;">${b.customer.name}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${b.customer.email}</div>
        </td>
        <td style="padding: 14px 18px;">
          <div style="font-weight: 600;">${b.movie.title}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${b.theatre.name}</div>
        </td>
        <td style="padding: 14px 18px;">
          <div>${b.showtime.date}</div>
          <div style="font-size: 0.75rem; color: var(--accent-primary);">${b.showtime.time}</div>
        </td>
        <td style="padding: 14px 18px;">
          <span style="font-weight: 700; color: #fff;">${b.seats.length}</span>
          <span style="font-size: 0.75rem; color: var(--text-muted);">(${b.seats.map(s=>s.seatId).join(',')})</span>
        </td>
        <td style="padding: 14px 18px; font-weight: 700; color: var(--success);">$${b.pricing.total.toFixed(2)}</td>
        <td style="padding: 14px 18px;">
          <span class="badge-status ${isCancelled ? 'badge-cancelled' : 'badge-completed'}">${b.status}</span>
        </td>
        <td style="padding: 14px 18px; text-align: right;">
          <div style="display: inline-flex; gap: 6px;">
            <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.75rem;" onclick="inspectCase('${b.caseId}')" title="Track Case">
              <i class="fa-solid fa-eye"></i> View
            </button>
            ${!isCancelled ? `
              <button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.75rem;" onclick="cancelBookingCase('${b.caseId}')" title="Cancel Case">
                <i class="fa-solid fa-ban"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Filter Staff Cases
function filterStaffCases() {
  const query = document.getElementById('staff-search-input').value.toLowerCase().trim();
  const status = document.getElementById('staff-status-filter').value;

  let filtered = staffBookings.filter(b => {
    const matchesQuery = b.caseId.toLowerCase().includes(query) ||
                         b.customer.name.toLowerCase().includes(query) ||
                         b.customer.email.toLowerCase().includes(query) ||
                         b.movie.title.toLowerCase().includes(query);

    const matchesStatus = status === 'All' || b.status === status;

    return matchesQuery && matchesStatus;
  });

  renderStaffTable(filtered);
}

function inspectCase(caseId) {
  switchView('track');
  document.getElementById('track-case-input').value = caseId;
  trackBookingCase(caseId);
}

// Schedule New Showtime Modal
function openAddShowModal() {
  const movieSelect = document.getElementById('newshow-movie');
  const theatreSelect = document.getElementById('newshow-theatre');

  movieSelect.innerHTML = AppState.movies.map(m => `<option value="${m.id}">${m.title} (${m.duration})</option>`).join('');
  theatreSelect.innerHTML = AppState.theatres.map(t => `<option value="${t.id}">${t.name} - ${t.city}</option>`).join('');

  // Default date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  document.getElementById('newshow-date').value = tomorrow.toISOString().split('T')[0];

  document.getElementById('add-show-modal').classList.add('active');
}

function closeAddShowModal() {
  document.getElementById('add-show-modal').classList.remove('active');
}

async function submitNewShowtime(event) {
  event.preventDefault();

  const movieId = document.getElementById('newshow-movie').value;
  const theatreId = document.getElementById('newshow-theatre').value;
  const screen = document.getElementById('newshow-screen').value.trim();
  const experience = document.getElementById('newshow-exp').value.trim();
  const date = document.getElementById('newshow-date').value;
  const time = document.getElementById('newshow-time').value.trim();

  try {
    const res = await fetch(`${API_BASE}/showtimes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        movieId,
        theatreId,
        screen,
        experience,
        date,
        time,
        pricing: { standard: 13.00, premium: 17.00, vip: 24.00 }
      })
    });

    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || 'Failed to schedule showtime.', 'error');
      return;
    }

    showToast(`New showtime successfully scheduled for ${date} at ${time}!`, 'success');
    closeAddShowModal();
  } catch (err) {
    console.error('Error creating showtime:', err);
    showToast('Failed to connect to showtime scheduler.', 'error');
  }
}

// Executive Analytics Visualizer
async function loadAnalytics() {
  try {
    const res = await fetch(`${API_BASE}/analytics`);
    const data = await res.json();

    document.getElementById('kpi-revenue').innerText = `$${data.totalRevenue.toFixed(2)}`;
    document.getElementById('kpi-total-cases').innerText = data.totalBookings;
    document.getElementById('kpi-tickets-sold').innerText = data.totalTicketsSold;
    document.getElementById('kpi-avg-value').innerText = `$${data.averageTicketValue.toFixed(2)}`;

    // Render Revenue by Movie Bars
    const movieContainer = document.getElementById('movie-revenue-bars');
    const movieEntries = Object.entries(data.movieRevenue);

    if (movieEntries.length === 0) {
      movieContainer.innerHTML = `<div style="color: var(--text-muted); font-size: 0.85rem;">No revenue recorded yet.</div>`;
    } else {
      const maxRev = Math.max(...movieEntries.map(e => e[1])) || 1;
      movieContainer.innerHTML = movieEntries.map(([title, rev]) => {
        const percent = Math.min(100, Math.round((rev / maxRev) * 100));
        return `
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 4px;">
              <strong style="color: var(--text-primary);">${title}</strong>
              <span style="color: var(--accent-primary); font-weight: 700;">$${rev.toFixed(2)}</span>
            </div>
            <div style="height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden;">
              <div style="width: ${percent}%; height: 100%; background: var(--accent-gradient); border-radius: 4px;"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Render Stage Distribution Bars
    const stageContainer = document.getElementById('stage-distribution-bars');
    const stageEntries = Object.entries(data.stageDistribution);
    const totalCases = data.totalBookings || 1;

    stageContainer.innerHTML = stageEntries.map(([stage, count]) => {
      const percent = Math.min(100, Math.round((count / totalCases) * 100));
      return `
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 4px;">
            <span style="color: var(--text-secondary);">${stage}</span>
            <span style="font-weight: 700; color: #fff;">${count} cases (${percent}%)</span>
          </div>
          <div style="height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden;">
            <div style="width: ${percent}%; height: 100%; background: ${stage.includes('Cancelled') ? 'var(--danger)' : '#a855f7'}; border-radius: 4px;"></div>
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error('Error loading analytics:', err);
    showToast('Failed to load analytics data.', 'error');
  }
}
