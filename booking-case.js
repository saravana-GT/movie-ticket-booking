// CineWave Pega Case Management Engine, Ticket Issuance & Tracking

// Submit Booking Case (Stage 3 -> Stage 4/5)
async function submitBookingCase() {
  const name = document.getElementById('cust-name').value.trim();
  const email = document.getElementById('cust-email').value.trim();
  const phone = document.getElementById('cust-phone').value.trim();
  const notes = document.getElementById('cust-notes').value.trim();

  // Validations
  if (!name) {
    showToast('Validation Error: Please enter your full name.', 'error');
    return;
  }
  if (!email || !email.includes('@')) {
    showToast('Validation Error: Please provide a valid email address.', 'error');
    return;
  }
  if (!phone) {
    showToast('Validation Error: Please enter a contact phone number.', 'error');
    return;
  }

  const payMethodRadio = document.querySelector('input[name="pay-method"]:checked');
  const payMethod = payMethodRadio ? payMethodRadio.value : 'Credit Card';

  const btn = document.getElementById('btn-submit-booking');
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Authorizing & Creating Case...`;

  const payload = {
    customer: { name, email, phone, notes },
    movie: {
      id: AppState.selectedMovie.id,
      title: AppState.selectedMovie.title,
      poster: AppState.selectedMovie.poster
    },
    theatre: {
      id: AppState.selectedTheatre.id,
      name: AppState.selectedTheatre.name,
      city: AppState.selectedTheatre.city
    },
    showtime: {
      id: AppState.selectedShowtime.id,
      date: AppState.selectedShowtime.date,
      time: AppState.selectedShowtime.time,
      screen: AppState.selectedShowtime.screen,
      experience: AppState.selectedShowtime.experience
    },
    seats: AppState.selectedSeats,
    pricing: AppState.pricing,
    payment: {
      method: payMethod,
      last4: Math.floor(1000 + Math.random() * 9000).toString()
    }
  };

  try {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || 'Failed to create booking case.', 'error');
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-lock"></i> Confirm & Pay`;
      return;
    }

    clearInterval(AppState.holdTimerInterval);
    AppState.currentCase = data.booking;

    // Render Digital Ticket
    renderDigitalTicket(data.booking);

    // Show Stage 4 & 5
    goToStage(4);
    document.getElementById('step-nav-5').classList.add('completed');

    showToast(`Case ${data.booking.caseId} successfully resolved and confirmed!`, 'success');
  } catch (err) {
    console.error('Error creating booking case:', err);
    showToast('Failed to connect to case management server.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-lock"></i> Confirm & Pay`;
  }
}

// Render Digital E-Ticket
function renderDigitalTicket(bCase) {
  document.getElementById('ticket-res-case-id').innerText = bCase.caseId;
  document.getElementById('t-case-id').innerText = bCase.caseId;
  document.getElementById('t-movie-title').innerText = bCase.movie.title;
  document.getElementById('t-theatre').innerText = bCase.theatre.name;
  document.getElementById('t-screen').innerText = `${bCase.showtime.screen} (${bCase.showtime.experience})`;
  document.getElementById('t-datetime').innerText = `${bCase.showtime.date} • ${bCase.showtime.time}`;
  document.getElementById('t-seats').innerText = bCase.seats.map(s => `${s.seatId} (${s.tier})`).join(', ');
  document.getElementById('t-customer-name').innerText = bCase.customer.name;
  document.getElementById('t-amount').innerText = `$${bCase.pricing.total.toFixed(2)}`;
  document.getElementById('t-txn-id').innerText = bCase.payment.transactionId;

  // Generate QR Code with Case ID & Verification Token
  const qrData = encodeURIComponent(`CINEWAVE|CASE:${bCase.caseId}|TXN:${bCase.payment.transactionId}|SHOW:${bCase.showtime.id}|SEATS:${bCase.seats.map(s=>s.seatId).join(',')}`);
  document.getElementById('t-qr-image').src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrData}`;
}

// Print / Download Ticket
function printTicket() {
  window.print();
}

// Simulated Email Notification Modal
function showEmailNotificationModal() {
  if (!AppState.currentCase) return;
  const b = AppState.currentCase;
  const modalBody = document.getElementById('email-modal-body');

  modalBody.innerHTML = `
    <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 20px; font-family: sans-serif;">
      <div style="border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 16px;">
        <div style="font-size: 0.85rem; color: var(--text-muted);">From: <strong>notifications@cinewave-entertainment.com</strong></div>
        <div style="font-size: 0.85rem; color: var(--text-muted);">To: <strong>${b.customer.email}</strong></div>
        <div style="font-size: 0.85rem; color: var(--text-muted);">Subject: <strong style="color: var(--accent-primary);">Booking Confirmed: ${b.movie.title} [${b.caseId}]</strong></div>
      </div>
      <div>
        <p style="margin-bottom: 12px;">Dear <strong>${b.customer.name}</strong>,</p>
        <p style="margin-bottom: 14px; color: var(--text-secondary);">Your movie tickets for <strong>${b.movie.title}</strong> have been confirmed by the CineWave Ticketing System!</p>
        
        <div style="background: rgba(255,255,255,0.05); padding: 14px; border-radius: var(--radius-sm); margin-bottom: 16px; font-size: 0.9rem;">
          <div>🏢 <strong>Theatre:</strong> ${b.theatre.name}, ${b.theatre.city}</div>
          <div>🎥 <strong>Screen:</strong> ${b.showtime.screen} (${b.showtime.experience})</div>
          <div>📅 <strong>Date & Time:</strong> ${b.showtime.date} at ${b.showtime.time}</div>
          <div>💺 <strong>Seats:</strong> ${b.seats.map(s=>s.seatId).join(', ')}</div>
          <div>💳 <strong>Total Paid:</strong> $${b.pricing.total.toFixed(2)} (${b.payment.method})</div>
          <div>🔑 <strong>Case ID:</strong> ${b.caseId}</div>
        </div>

        <p style="font-size: 0.8rem; color: var(--text-muted);">Please present your Digital QR Code ticket at the cinema turnstiles. Enjoy your show!</p>
      </div>
    </div>
  `;

  document.getElementById('email-modal').classList.add('active');
}

function closeEmailModal() {
  document.getElementById('email-modal').classList.remove('active');
}

function finishBookingFlow() {
  closeBookingModal();
  switchView('movies');
}

// Track Booking Case by ID (View 2)
async function trackBookingCase(explicitCaseId) {
  const caseIdInput = explicitCaseId || document.getElementById('track-case-input').value.trim();
  if (!caseIdInput) {
    showToast('Please enter a Case ID to search.', 'error');
    return;
  }

  const container = document.getElementById('track-result-container');
  container.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Locating case in Pega repository...</div>`;

  try {
    const res = await fetch(`${API_BASE}/bookings/${caseIdInput.toUpperCase()}`);
    if (!res.ok) {
      container.innerHTML = `
        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid var(--danger); border-radius: var(--radius-md); padding: 30px; text-align: center; color: #fca5a5;">
          <i class="fa-solid fa-circle-exclamation" style="font-size: 2.5rem; margin-bottom: 12px;"></i>
          <h3>Case Reference '${caseIdInput}' Not Found</h3>
          <p style="font-size: 0.85rem; margin-top: 6px;">Please check the ID and try again (e.g., TICK-1001).</p>
        </div>
      `;
      return;
    }

    const b = await res.json();
    const isCancelled = b.status === 'Resolved-Cancelled';

    container.innerHTML = `
      <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 28px; box-shadow: var(--shadow-lg);">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 16px; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
          <div>
            <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Pega Case Instance</div>
            <h3 style="font-size: 1.5rem; font-weight: 800; color: var(--accent-primary);">${b.caseId}</h3>
          </div>
          <div>
            <span class="badge-status ${isCancelled ? 'badge-cancelled' : 'badge-completed'}" style="font-size: 0.9rem; padding: 6px 14px;">
              ${b.status}
            </span>
          </div>
        </div>

        <!-- Case Lifecycle Stepper -->
        <div style="margin-bottom: 28px;">
          <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 12px; font-weight: 700;">Case Lifecycle Timeline</div>
          <div style="display: flex; justify-content: space-between; position: relative;">
            ${['Selection', 'Seat Reservation', 'Customer Confirmation', 'Fulfillment', isCancelled ? 'Cancellation' : 'Resolution'].map((stg, idx) => `
              <div style="display: flex; flex-direction: column; align-items: center; flex: 1; position: relative; z-index: 2;">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: ${isCancelled && idx === 4 ? 'var(--danger)' : 'var(--success)'}; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; box-shadow: 0 0 10px ${isCancelled && idx === 4 ? 'rgba(239,68,68,0.5)' : 'rgba(16,185,129,0.5)'};">
                  <i class="fa-solid ${isCancelled && idx === 4 ? 'fa-xmark' : 'fa-check'}"></i>
                </div>
                <div style="font-size: 0.75rem; font-weight: 600; color: var(--text-primary); margin-top: 6px; text-align: center;">${stg}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Details Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px; margin-bottom: 24px; font-size: 0.9rem;">
          <div style="background: var(--bg-primary); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <div style="color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">Movie Title</div>
            <strong style="color: #fff; font-size: 1.05rem;">${b.movie.title}</strong>
          </div>
          <div style="background: var(--bg-primary); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <div style="color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">Theatre & Screen</div>
            <strong style="color: #fff;">${b.theatre.name}</strong>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">${b.showtime.screen}</div>
          </div>
          <div style="background: var(--bg-primary); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <div style="color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">Date & Showtime</div>
            <strong style="color: #fff;">${b.showtime.date} • ${b.showtime.time}</strong>
          </div>
          <div style="background: var(--bg-primary); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <div style="color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">Reserved Seats</div>
            <strong style="color: var(--accent-primary);">${b.seats.map(s => s.seatId).join(', ')}</strong>
          </div>
          <div style="background: var(--bg-primary); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <div style="color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">Customer Details</div>
            <strong style="color: #fff;">${b.customer.name}</strong>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">${b.customer.email}</div>
          </div>
          <div style="background: var(--bg-primary); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <div style="color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">Payment Total</div>
            <strong style="color: var(--success); font-size: 1.1rem;">$${b.pricing.total.toFixed(2)}</strong>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${b.payment.method} (${b.payment.transactionId})</div>
          </div>
        </div>

        <!-- Actions -->
        <div style="display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid var(--border-color); padding-top: 18px;">
          ${!isCancelled ? `
            <button class="btn btn-danger" onclick="cancelBookingCase('${b.caseId}')">
              <i class="fa-solid fa-ban"></i> Cancel Booking & Release Seats
            </button>
          ` : `
            <span style="color: var(--danger); font-size: 0.85rem; display: flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-circle-xmark"></i> This booking case has been cancelled and refunded.
            </span>
          `}
        </div>
      </div>
    `;

  } catch (err) {
    console.error('Error tracking case:', err);
    showToast('Failed to retrieve case details.', 'error');
  }
}

// Cancel Booking Case (Alternate Stage)
async function cancelBookingCase(caseId) {
  if (!confirm(`Are you sure you want to cancel booking case ${caseId}? This will release the seats back to available inventory.`)) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/bookings/${caseId}/cancel`, {
      method: 'POST'
    });
    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || 'Failed to cancel case.', 'error');
      return;
    }

    showToast(data.message, 'success');
    trackBookingCase(caseId);
  } catch (err) {
    console.error('Error cancelling case:', err);
    showToast('Failed to execute cancellation action.', 'error');
  }
}
