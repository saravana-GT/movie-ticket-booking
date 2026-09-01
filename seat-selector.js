// CineWave Interactive Seat Matrix & Price Calculation Engine

async function selectShowtime(showId) {
  try {
    const res = await fetch(`${API_BASE}/showtimes/${showId}`);
    const show = await res.json();
    AppState.selectedShowtime = show;
    AppState.selectedTheatre = AppState.theatres.find(t => t.id === show.theatreId);

    // Update Summary Header on Stage 2
    document.getElementById('stage2-theatre-name').innerText = AppState.selectedTheatre ? AppState.selectedTheatre.name : 'CineWave Complex';
    document.getElementById('stage2-screen-info').innerText = `${show.screen} (${show.experience}) - ${show.time}`;

    document.getElementById('summary-mini-poster').src = AppState.selectedMovie.poster;
    document.getElementById('summary-mini-title').innerText = AppState.selectedMovie.title;
    document.getElementById('summary-mini-show').innerText = `${show.date} • ${show.time}`;

    // Render Seating Layout
    renderSeatGrid(show);

    // Reset selection & recalculate
    AppState.selectedSeats = [];
    updatePricingBreakdown();

    // Start 10-minute Hold Timer
    startHoldTimer();

    // Move to Stage 2 (Seat Reservation)
    goToStage(2);
  } catch (err) {
    console.error('Error loading showtime details:', err);
    showToast('Failed to load seating matrix.', 'error');
  }
}

// Render Tiered Cinema Seat Layout
function renderSeatGrid(show) {
  const container = document.getElementById('seat-matrix-container');
  container.innerHTML = '';

  const tiers = [
    { name: 'VIP Recliners', class: 'vip', price: show.pricing.vip, rows: ['F', 'E'], cols: 8 },
    { name: 'Premium Club', class: 'premium', price: show.pricing.premium, rows: ['D', 'C'], cols: 8 },
    { name: 'Standard Classic', class: 'standard', price: show.pricing.standard, rows: ['B', 'A'], cols: 8 }
  ];

  tiers.forEach(tier => {
    const section = document.createElement('div');
    section.className = 'tier-section';
    section.innerHTML = `
      <div class="tier-header ${tier.class}">
        <span>${tier.name}</span>
        <span>$${tier.price.toFixed(2)} / seat</span>
      </div>
    `;

    tier.rows.forEach(rowLetter => {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'seat-row';

      const labelLeft = document.createElement('span');
      labelLeft.className = 'row-label';
      labelLeft.innerText = rowLetter;
      rowDiv.appendChild(labelLeft);

      for (let col = 1; col <= tier.cols; col++) {
        const seatId = `${rowLetter}${col}`;
        const seatBtn = document.createElement('div');
        seatBtn.className = `seat tier-${tier.class}`;
        seatBtn.innerText = col;
        seatBtn.dataset.seatId = seatId;
        seatBtn.dataset.tier = tier.name;
        seatBtn.dataset.price = tier.price;

        const isOccupied = show.occupiedSeats && show.occupiedSeats.includes(seatId);
        const isLocked = show.lockedSeats && show.lockedSeats.includes(seatId);

        if (isOccupied) {
          seatBtn.classList.add('occupied');
          seatBtn.title = `Seat ${seatId} is booked`;
        } else if (isLocked) {
          seatBtn.classList.add('locked');
          seatBtn.title = `Seat ${seatId} is temporarily on hold`;
        } else {
          seatBtn.addEventListener('click', () => toggleSeatSelection(seatId, rowLetter, col, tier.name, tier.price, seatBtn));
        }

        rowDiv.appendChild(seatBtn);
      }

      const labelRight = document.createElement('span');
      labelRight.className = 'row-label';
      labelRight.innerText = rowLetter;
      rowDiv.appendChild(labelRight);

      section.appendChild(rowDiv);
    });

    container.appendChild(section);
  });
}

// Toggle individual seat selection
function toggleSeatSelection(seatId, row, col, tier, price, element) {
  const index = AppState.selectedSeats.findIndex(s => s.seatId === seatId);

  if (index !== -1) {
    // Deselect
    AppState.selectedSeats.splice(index, 1);
    element.classList.remove('selected');
  } else {
    // Validation Rule: Max 10 seats per booking case
    if (AppState.selectedSeats.length >= 10) {
      showToast('Validation Error: Maximum 10 tickets allowed per booking case.', 'error');
      return;
    }
    // Select
    AppState.selectedSeats.push({ seatId, row, col, tier, price });
    element.classList.add('selected');
  }

  updatePricingBreakdown();
}

// Update Pricing Breakdown (Subtotal, Convenience Fee, Tax, Total)
function updatePricingBreakdown() {
  const count = AppState.selectedSeats.length;
  document.getElementById('summary-seat-count').innerText = count;

  // Render Seat Tags
  const tagsContainer = document.getElementById('summary-seat-tags');
  if (count === 0) {
    tagsContainer.innerHTML = `<span style="color: var(--text-muted); font-size: 0.8rem; font-style: italic;">No seats chosen</span>`;
  } else {
    tagsContainer.innerHTML = AppState.selectedSeats.map(s => `
      <span class="seat-tag">${s.seatId} ($${s.price})</span>
    `).join('');
  }

  // Calculate Subtotal
  const subtotal = AppState.selectedSeats.reduce((sum, s) => sum + s.price, 0);
  const convenienceFee = count > 0 ? subtotal * 0.10 : 0; // 10% convenience fee
  const tax = count > 0 ? (subtotal + convenienceFee) * 0.18 : 0; // 18% GST/Tax

  // Discount
  let discount = 0;
  if (AppState.promoApplied) {
    discount = (subtotal + convenienceFee + tax) * 0.20; // 20% discount
  }

  const grandTotal = Math.max(0, (subtotal + convenienceFee + tax) - discount);

  AppState.pricing = {
    subtotal: parseFloat(subtotal.toFixed(2)),
    convenienceFee: parseFloat(convenienceFee.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    discount: parseFloat(discount.toFixed(2)),
    total: parseFloat(grandTotal.toFixed(2))
  };

  // Update UI Elements on Stage 2
  document.getElementById('summary-base-fare').innerText = `$${AppState.pricing.subtotal.toFixed(2)}`;
  document.getElementById('summary-convenience-fee').innerText = `$${AppState.pricing.convenienceFee.toFixed(2)}`;
  document.getElementById('summary-taxes').innerText = `$${AppState.pricing.tax.toFixed(2)}`;

  const discountRow = document.getElementById('summary-discount-row');
  if (AppState.promoApplied) {
    discountRow.style.display = 'flex';
    document.getElementById('summary-discount-val').innerText = `-$${AppState.pricing.discount.toFixed(2)}`;
  } else {
    discountRow.style.display = 'none';
  }

  document.getElementById('summary-grand-total').innerText = `$${AppState.pricing.total.toFixed(2)}`;

  // Enable / Disable Next Button
  const nextBtn = document.getElementById('btn-proceed-to-customer');
  nextBtn.disabled = count === 0;
}

// 10-Minute Concurrency Hold Timer
function startHoldTimer() {
  clearInterval(AppState.holdTimerInterval);
  AppState.holdTimeRemaining = 600; // 10 minutes

  const timerEl = document.getElementById('hold-countdown');

  AppState.holdTimerInterval = setInterval(() => {
    AppState.holdTimeRemaining--;
    const mins = Math.floor(AppState.holdTimeRemaining / 60);
    const secs = AppState.holdTimeRemaining % 60;
    timerEl.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    if (AppState.holdTimeRemaining <= 0) {
      clearInterval(AppState.holdTimerInterval);
      showToast('Your 10-minute seat lock reservation has expired.', 'error');
      closeBookingModal();
    }
  }, 1000);
}

// Apply Promo Code
function applyPromoCode() {
  const code = document.getElementById('promo-code-input').value.trim().toUpperCase();
  const msgEl = document.getElementById('promo-message');

  if (code === 'CINEWAVE20') {
    AppState.promoApplied = true;
    msgEl.innerHTML = `<span style="color: var(--success);"><i class="fa-solid fa-check"></i> Promo 'CINEWAVE20' applied! 20% discount deducted.</span>`;
    updatePricingBreakdown();
    updateStage3Summary();
  } else {
    AppState.promoApplied = false;
    msgEl.innerHTML = `<span style="color: var(--danger);"><i class="fa-solid fa-triangle-exclamation"></i> Invalid promo code. Try 'CINEWAVE20'</span>`;
    updatePricingBreakdown();
    updateStage3Summary();
  }
}

// Proceed from Stage 2 (Seat Reservation) to Stage 3 (Customer Information)
async function proceedToCustomerInfo() {
  if (AppState.selectedSeats.length === 0) {
    showToast('Please select at least 1 seat to proceed.', 'error');
    return;
  }

  // Lock seats via API
  try {
    const seatIds = AppState.selectedSeats.map(s => s.seatId);
    const res = await fetch(`${API_BASE}/bookings/lock-seats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        showId: AppState.selectedShowtime.id,
        seats: seatIds
      })
    });

    if (!res.ok) {
      const errData = await res.json();
      showToast(errData.error || 'Seat lock failed.', 'error');
      return;
    }

    updateStage3Summary();
    goToStage(3);
  } catch (err) {
    console.error('Error locking seats:', err);
    showToast('Failed to lock seats.', 'error');
  }
}

// Update Stage 3 Confirmation Details
function updateStage3Summary() {
  const seatNames = AppState.selectedSeats.map(s => s.seatId).join(', ');
  document.getElementById('stage3-seats-list').innerText = seatNames || '--';
  document.getElementById('stage3-subtotal').innerText = `$${AppState.pricing.subtotal.toFixed(2)}`;
  document.getElementById('stage3-fee').innerText = `$${AppState.pricing.convenienceFee.toFixed(2)}`;
  document.getElementById('stage3-tax').innerText = `$${AppState.pricing.tax.toFixed(2)}`;

  const discountRow = document.getElementById('stage3-discount-row');
  if (AppState.promoApplied) {
    discountRow.style.display = 'flex';
    document.getElementById('stage3-discount-val').innerText = `-$${AppState.pricing.discount.toFixed(2)}`;
  } else {
    discountRow.style.display = 'none';
  }

  document.getElementById('stage3-grand-total').innerText = `$${AppState.pricing.total.toFixed(2)}`;
}
