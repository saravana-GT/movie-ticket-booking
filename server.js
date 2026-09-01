const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Data file paths
const DATA_DIR = path.join(__dirname, 'data');
const MOVIES_FILE = path.join(DATA_DIR, 'movies.json');
const THEATRES_FILE = path.join(DATA_DIR, 'theatres.json');
const SHOWTIMES_FILE = path.join(DATA_DIR, 'showtimes.json');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');

// Helper functions to read/write JSON data
function readData(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return [];
  }
}

function writeData(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
}

// In-memory temporary seat locks (expires in 10 minutes)
const activeLocks = new Map(); // key: showId_seatId, val: { caseId, expiresAt }

function cleanExpiredLocks() {
  const now = Date.now();
  for (const [key, val] of activeLocks.entries()) {
    if (val.expiresAt < now) {
      activeLocks.delete(key);
    }
  }
}
setInterval(cleanExpiredLocks, 30000);

// --- API ROUTES ---

// Health & System Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    application: 'CineWave Movie Ticket Booking Management',
    platform: 'Pega Infinity Architecture Simulator v8.x/v25.x',
    operator: 'author@uplus',
    timestamp: new Date().toISOString()
  });
});

// Movies
app.get('/api/movies', (req, res) => {
  const movies = readData(MOVIES_FILE);
  const { featured } = req.query;
  if (featured === 'true') {
    return res.json(movies.filter(m => m.featured));
  }
  res.json(movies);
});

app.get('/api/movies/:id', (req, res) => {
  const movies = readData(MOVIES_FILE);
  const movie = movies.find(m => m.id === req.params.id);
  if (!movie) return res.status(404).json({ error: 'Movie not found' });
  res.json(movie);
});

// Theatres
app.get('/api/theatres', (req, res) => {
  const theatres = readData(THEATRES_FILE);
  const { city } = req.query;
  if (city) {
    return res.json(theatres.filter(t => t.city.toLowerCase() === city.toLowerCase()));
  }
  res.json(theatres);
});

// Showtimes
app.get('/api/showtimes', (req, res) => {
  const showtimes = readData(SHOWTIMES_FILE);
  const { movieId, theatreId, date } = req.query;
  let filtered = showtimes;

  if (movieId) filtered = filtered.filter(s => s.movieId === movieId);
  if (theatreId) filtered = filtered.filter(s => s.theatreId === theatreId);
  if (date) filtered = filtered.filter(s => s.date === date);

  res.json(filtered);
});

app.get('/api/showtimes/:id', (req, res) => {
  cleanExpiredLocks();
  const showtimes = readData(SHOWTIMES_FILE);
  const show = showtimes.find(s => s.id === req.params.id);
  if (!show) return res.status(404).json({ error: 'Showtime not found' });

  // Get currently locked seats for this show
  const locked = [];
  for (const [key, val] of activeLocks.entries()) {
    if (key.startsWith(`${show.id}_`)) {
      locked.push(key.replace(`${show.id}_`, ''));
    }
  }

  res.json({
    ...show,
    lockedSeats: locked
  });
});

// Lock seats temporarily (Seat Reservation Stage Step)
app.post('/api/bookings/lock-seats', (req, res) => {
  const { showId, seats } = req.body;
  if (!showId || !Array.isArray(seats) || seats.length === 0) {
    return res.status(400).json({ error: 'showId and seats array are required' });
  }

  const showtimes = readData(SHOWTIMES_FILE);
  const show = showtimes.find(s => s.id === showId);
  if (!show) return res.status(404).json({ error: 'Showtime not found' });

  cleanExpiredLocks();

  // Check if any seat is already occupied or locked
  for (const seatId of seats) {
    if (show.occupiedSeats.includes(seatId)) {
      return res.status(409).json({ error: `Seat ${seatId} is already booked.` });
    }
    const lockKey = `${showId}_${seatId}`;
    if (activeLocks.has(lockKey)) {
      return res.status(409).json({ error: `Seat ${seatId} is currently reserved by another customer.` });
    }
  }

  // Lock for 10 minutes
  const expiresAt = Date.now() + 10 * 60 * 1000;
  for (const seatId of seats) {
    activeLocks.set(`${showId}_${seatId}`, { expiresAt });
  }

  res.json({
    success: true,
    message: 'Seats temporarily locked for 10 minutes',
    expiresAt: new Date(expiresAt).toISOString()
  });
});

// Create New Booking Case (Pega Ticket Booking Case Lifecycle execution)
app.post('/api/bookings', (req, res) => {
  const { customer, movie, theatre, showtime, seats, pricing, payment } = req.body;

  if (!customer || !movie || !theatre || !showtime || !seats || !seats.length) {
    return res.status(400).json({ error: 'Incomplete booking data provided.' });
  }

  // Validation rules
  if (seats.length > 10) {
    return res.status(400).json({ error: 'Business Rule Violation: Maximum 10 tickets allowed per booking case.' });
  }
  if (!customer.email || !customer.email.includes('@')) {
    return res.status(400).json({ error: 'Validation Error: Valid customer email is required.' });
  }

  const bookings = readData(BOOKINGS_FILE);
  const showtimes = readData(SHOWTIMES_FILE);

  // Generate new Pega Case ID: TICK-XXXX
  const nextNum = 1000 + bookings.length + 1;
  const caseId = `TICK-${nextNum}`;

  const now = new Date().toISOString();

  // Create Case Record with Lifecycle tracking
  const newBookingCase = {
    caseId,
    customer: {
      name: customer.name || 'Anonymous Customer',
      email: customer.email,
      phone: customer.phone || 'N/A',
      notes: customer.notes || ''
    },
    movie: {
      id: movie.id,
      title: movie.title,
      poster: movie.poster
    },
    theatre: {
      id: theatre.id,
      name: theatre.name,
      city: theatre.city
    },
    showtime: {
      id: showtime.id,
      date: showtime.date,
      time: showtime.time,
      screen: showtime.screen,
      experience: showtime.experience
    },
    seats: seats.map(s => ({
      seatId: s.seatId,
      tier: s.tier,
      price: s.price
    })),
    pricing: {
      subtotal: pricing.subtotal || 0,
      convenienceFee: pricing.convenienceFee || 0,
      tax: pricing.tax || 0,
      discount: pricing.discount || 0,
      total: pricing.total || 0
    },
    payment: {
      method: payment?.method || 'Credit Card',
      last4: payment?.last4 || '1234',
      transactionId: `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`,
      status: 'Paid'
    },
    currentStage: 'Resolution',
    status: 'Resolved-Completed',
    createdAt: now,
    resolvedAt: now,
    stageHistory: [
      { stage: 'Selection', status: 'Completed', timestamp: now },
      { stage: 'Seat Reservation', status: 'Completed', timestamp: now },
      { stage: 'Customer Confirmation', status: 'Completed', timestamp: now },
      { stage: 'Fulfillment & Issuance', status: 'Completed', timestamp: now },
      { stage: 'Resolution', status: 'Resolved-Completed', timestamp: now }
    ],
    notificationsSent: [
      {
        channel: 'Email',
        recipient: customer.email,
        subject: `Booking Confirmed: ${movie.title} [${caseId}]`,
        timestamp: now
      }
    ]
  };

  // Permanently commit occupied seats in showtimes.json
  const showIndex = showtimes.findIndex(s => s.id === showtime.id);
  if (showIndex !== -1) {
    const seatIds = seats.map(s => s.seatId);
    showtimes[showIndex].occupiedSeats = Array.from(new Set([...showtimes[showIndex].occupiedSeats, ...seatIds]));
    writeData(SHOWTIMES_FILE, showtimes);

    // Release temporary memory locks for these seats
    for (const seatId of seatIds) {
      activeLocks.delete(`${showtime.id}_${seatId}`);
    }
  }

  // Save Booking Case
  bookings.unshift(newBookingCase);
  writeData(BOOKINGS_FILE, bookings);

  res.status(201).json({
    success: true,
    caseId: newBookingCase.caseId,
    booking: newBookingCase
  });
});

// Bookings List (Staff Portal / Admin)
app.get('/api/bookings', (req, res) => {
  const bookings = readData(BOOKINGS_FILE);
  const { status, search } = req.query;
  let filtered = bookings;

  if (status && status !== 'All') {
    filtered = filtered.filter(b => b.status === status);
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(b => 
      b.caseId.toLowerCase().includes(q) ||
      b.customer.name.toLowerCase().includes(q) ||
      b.customer.email.toLowerCase().includes(q) ||
      b.movie.title.toLowerCase().includes(q)
    );
  }

  res.json(filtered);
});

// Single Booking Case Tracking
app.get('/api/bookings/:caseId', (req, res) => {
  const bookings = readData(BOOKINGS_FILE);
  const booking = bookings.find(b => b.caseId.toUpperCase() === req.params.caseId.toUpperCase());
  if (!booking) {
    return res.status(404).json({ error: `Booking Case ${req.params.caseId} not found.` });
  }
  res.json(booking);
});

// Cancel Booking Case (Alternate Stage flow)
app.post('/api/bookings/:caseId/cancel', (req, res) => {
  const bookings = readData(BOOKINGS_FILE);
  const index = bookings.findIndex(b => b.caseId.toUpperCase() === req.params.caseId.toUpperCase());
  if (index === -1) {
    return res.status(404).json({ error: 'Case not found' });
  }

  const booking = bookings[index];
  if (booking.status === 'Resolved-Cancelled') {
    return res.status(400).json({ error: 'Case is already cancelled.' });
  }

  const now = new Date().toISOString();
  booking.status = 'Resolved-Cancelled';
  booking.currentStage = 'Cancellation';
  booking.resolvedAt = now;
  booking.stageHistory.push({
    stage: 'Cancellation & Refund',
    status: 'Resolved-Cancelled',
    timestamp: now
  });
  booking.notificationsSent.push({
    channel: 'Email',
    recipient: booking.customer.email,
    subject: `Booking Cancellation Notice [${booking.caseId}]`,
    timestamp: now
  });

  // Release occupied seats
  const showtimes = readData(SHOWTIMES_FILE);
  const showIndex = showtimes.findIndex(s => s.id === booking.showtime.id);
  if (showIndex !== -1) {
    const releasedSeatIds = booking.seats.map(s => s.seatId);
    showtimes[showIndex].occupiedSeats = showtimes[showIndex].occupiedSeats.filter(
      seat => !releasedSeatIds.includes(seat)
    );
    writeData(SHOWTIMES_FILE, showtimes);
  }

  writeData(BOOKINGS_FILE, bookings);

  res.json({
    success: true,
    message: `Case ${booking.caseId} cancelled successfully. Seats have been returned to inventory.`,
    booking
  });
});

// Staff: Add new showtime
app.post('/api/showtimes', (req, res) => {
  const { movieId, theatreId, screen, time, date, experience, pricing } = req.body;
  if (!movieId || !theatreId || !screen || !time || !date) {
    return res.status(400).json({ error: 'All showtime fields are required.' });
  }

  const showtimes = readData(SHOWTIMES_FILE);
  const newShow = {
    id: `SHOW-${100 + showtimes.length + 1}`,
    movieId,
    theatreId,
    screen,
    time,
    date,
    experience: experience || 'Standard 2D',
    pricing: pricing || { standard: 12.00, premium: 16.00, vip: 22.00 },
    occupiedSeats: []
  };

  showtimes.push(newShow);
  writeData(SHOWTIMES_FILE, showtimes);

  res.status(201).json({ success: true, show: newShow });
});

// Analytics Dashboard metrics
app.get('/api/analytics', (req, res) => {
  const bookings = readData(BOOKINGS_FILE);
  const movies = readData(MOVIES_FILE);
  const showtimes = readData(SHOWTIMES_FILE);

  const totalBookings = bookings.length;
  const activeConfirmed = bookings.filter(b => b.status === 'Resolved-Completed');
  const cancelledBookings = bookings.filter(b => b.status === 'Resolved-Cancelled');

  const totalRevenue = activeConfirmed.reduce((sum, b) => sum + (b.pricing?.total || 0), 0);
  const totalTickets = activeConfirmed.reduce((sum, b) => sum + (b.seats?.length || 0), 0);

  // Revenue by Movie
  const movieRevenue = {};
  activeConfirmed.forEach(b => {
    const title = b.movie?.title || 'Unknown';
    movieRevenue[title] = (movieRevenue[title] || 0) + (b.pricing?.total || 0);
  });

  // Stage distribution
  const stageCounts = {
    'Selection': 0,
    'Seat Reservation': 0,
    'Customer Confirmation': 0,
    'Fulfillment': 0,
    'Resolved-Completed': activeConfirmed.length,
    'Resolved-Cancelled': cancelledBookings.length
  };

  res.json({
    totalBookings,
    confirmedBookings: activeConfirmed.length,
    cancelledBookings: cancelledBookings.length,
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    totalTicketsSold: totalTickets,
    averageTicketValue: totalTickets > 0 ? parseFloat((totalRevenue / totalTickets).toFixed(2)) : 0,
    movieRevenue,
    stageDistribution: stageCounts
  });
});

// Pega Platform Blueprint Spec for interactive visualizer
app.get('/api/pega/blueprint', (req, res) => {
  res.json({
    application: {
      name: 'CineWave Ticketing Application',
      version: '01.01.01',
      builtOn: 'Theme-Cosmos / Constellation (Pega Infinity v8.x/v25.x)',
      classStructure: {
        organization: 'CineWave',
        division: 'Entertainment',
        unit: 'Ticketing',
        workClass: 'CineWave-Work-TicketBooking',
        dataClass: 'CineWave-Data-*'
      }
    },
    caseTypes: [
      {
        name: 'Ticket Booking',
        id: 'TICK',
        description: 'End-to-end customer reservation and confirmation case',
        stages: [
          {
            name: '1. Selection',
            type: 'Primary',
            steps: [
              { name: 'Select Movie & Theatre', type: 'Collect Information (User Action)', persona: 'Customer' },
              { name: 'Select Date & Showtime', type: 'Collect Information (User Action)', persona: 'Customer' }
            ]
          },
          {
            name: '2. Seat Reservation',
            type: 'Primary',
            steps: [
              { name: 'Render Seat Layout', type: 'UI Section', persona: 'Customer' },
              { name: 'Select & Hold Seats', type: 'Automated Lock (10m SLA)', persona: 'System' },
              { name: 'Calculate Fare & Taxes', type: 'Decision Table / Data Transform', persona: 'System' }
            ]
          },
          {
            name: '3. Customer Confirmation',
            type: 'Primary',
            steps: [
              { name: 'Collect Customer Details', type: 'Collect Information', persona: 'Customer' },
              { name: 'Apply Discounts / Promos', type: 'When Rule & Calculation', persona: 'System' },
              { name: 'Payment Processing', type: 'Integration Service', persona: 'Customer' }
            ]
          },
          {
            name: '4. Fulfillment & Issuance',
            type: 'Primary',
            steps: [
              { name: 'Generate Booking ID & QR', type: 'Automation', persona: 'System' },
              { name: 'Send Confirmation Email', type: 'Send Notification (Correspondence)', persona: 'System' }
            ]
          },
          {
            name: '5. Resolution',
            type: 'Resolution',
            status: 'Resolved-Completed',
            steps: [
              { name: 'Close Case', type: 'Update Case Status', persona: 'System' }
            ]
          },
          {
            name: 'Alternate: Cancellation',
            type: 'Alternate',
            status: 'Resolved-Cancelled',
            steps: [
              { name: 'Validate Cancellation Window', type: 'Decision Rule', persona: 'System' },
              { name: 'Release Seat Inventory', type: 'Data Update', persona: 'System' },
              { name: 'Process Refund & Notify', type: 'Notification', persona: 'System' }
            ]
          }
        ]
      }
    ],
    dataModel: [
      { name: 'CineWave-Data-Movie', description: 'Movie catalog entity (Title, Genre, Duration, Rating, Cast)' },
      { name: 'CineWave-Data-Theatre', description: 'Cinema venue entity (Name, City, Screens, Amenities)' },
      { name: 'CineWave-Data-Showtime', description: 'Scheduled screen timings and tier pricing' },
      { name: 'CineWave-Data-Seat', description: 'Individual seat unit with row, column, tier and availability state' },
      { name: 'CineWave-Data-Customer', description: 'Customer profile (Name, Email, Phone, Special requests)' },
      { name: 'CineWave-Data-Payment', description: 'Transaction details (Method, Transaction ID, Status, Amount)' }
    ],
    dataPages: [
      { name: 'D_MovieList', scope: 'Node', mode: 'Read-Only', source: 'Database / REST Connector' },
      { name: 'D_TheatresByCity', scope: 'Thread', mode: 'Read-Only', source: 'Parameterized Query' },
      { name: 'D_Showtimes', scope: 'Thread', mode: 'Read-Only', source: 'Lookup by Movie & Date' },
      { name: 'D_SeatAvailability', scope: 'Requestor', mode: 'Read-Only', source: 'Real-time Matrix' },
      { name: 'D_BookingDetails', scope: 'Thread', mode: 'Savable', source: 'Case Context' }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🎬 CineWave Movie Ticket Booking Management App`);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🏢 Architecture: Pega Platform Infinity v8.x / v25.x`);
  console.log(`👤 Operator: author@uplus (Password: pega123!)`);
  console.log(`====================================================`);
});
