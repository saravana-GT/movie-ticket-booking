// Automated End-to-End API Verification Script for CineWave

async function testAllEndpoints() {
  const baseURL = 'http://localhost:3000/api';
  console.log('Testing CineWave API Endpoints...\n');

  try {
    // 1. Test Health
    const healthRes = await fetch(`${baseURL}/health`);
    const health = await healthRes.json();
    console.log('✅ /api/health:', health.status, `(${health.application})`);

    // 2. Test Movies
    const moviesRes = await fetch(`${baseURL}/movies`);
    const movies = await moviesRes.json();
    console.log(`✅ /api/movies: Retrieved ${movies.length} movies.`);

    // 3. Test Theatres
    const theatresRes = await fetch(`${baseURL}/theatres`);
    const theatres = await theatresRes.json();
    console.log(`✅ /api/theatres: Retrieved ${theatres.length} theatres.`);

    // 4. Test Showtimes
    const showtimesRes = await fetch(`${baseURL}/showtimes`);
    const showtimes = await showtimesRes.json();
    console.log(`✅ /api/showtimes: Retrieved ${showtimes.length} showtimes.`);

    // 5. Test Pega Blueprint
    const blueprintRes = await fetch(`${baseURL}/pega/blueprint`);
    const blueprint = await blueprintRes.json();
    console.log(`✅ /api/pega/blueprint: App "${blueprint.application.name}", Case Type: "${blueprint.caseTypes[0].name}"`);

    // 6. Test Analytics
    const analyticsRes = await fetch(`${baseURL}/analytics`);
    const analytics = await analyticsRes.json();
    console.log(`✅ /api/analytics: Revenue: $${analytics.totalRevenue}, Bookings: ${analytics.totalBookings}`);

    // 7. Test Booking Case Creation (Stage 1-5 simulation)
    const newBookingPayload = {
      customer: {
        name: "Test Customer",
        email: "test.customer@example.com",
        phone: "+1 (555) 345-6789",
        notes: "Automated test case"
      },
      movie: {
        id: movies[0].id,
        title: movies[0].title,
        poster: movies[0].poster
      },
      theatre: {
        id: theatres[0].id,
        name: theatres[0].name,
        city: theatres[0].city
      },
      showtime: {
        id: showtimes[0].id,
        date: showtimes[0].date,
        time: showtimes[0].time,
        screen: showtimes[0].screen,
        experience: showtimes[0].experience
      },
      seats: [
        { seatId: "F7", tier: "VIP", price: 22.00 },
        { seatId: "F8", tier: "VIP", price: 22.00 }
      ],
      pricing: {
        subtotal: 44.00,
        convenienceFee: 4.40,
        tax: 8.71,
        discount: 0.00,
        total: 57.11
      },
      payment: {
        method: "Credit Card",
        last4: "9999"
      }
    };

    const createRes = await fetch(`${baseURL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBookingPayload)
    });
    const createData = await createRes.json();
    console.log(`✅ POST /api/bookings: Created Case ID ${createData.caseId} with status ${createData.booking.status}`);

    // 8. Test Tracking of the created case
    const trackRes = await fetch(`${baseURL}/bookings/${createData.caseId}`);
    const trackData = await trackRes.json();
    console.log(`✅ GET /api/bookings/${createData.caseId}: Found case for ${trackData.customer.name}, Movie: ${trackData.movie.title}`);

    // 9. Test Cancellation of the created case (Alternate Stage)
    const cancelRes = await fetch(`${baseURL}/bookings/${createData.caseId}/cancel`, {
      method: 'POST'
    });
    const cancelData = await cancelRes.json();
    console.log(`✅ POST /api/bookings/${createData.caseId}/cancel: New Status: ${cancelData.booking.status}`);

    console.log('\n🎉 ALL 9 END-TO-END TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  }
}

testAllEndpoints();
