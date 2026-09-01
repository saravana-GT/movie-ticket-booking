# CineWave Entertainment - 12 Epics & User Stories Specification

This document details the **12 Epics and User Stories / Tasks** required for the CineWave Movie Ticket Booking Management Application on the Pega Platform™ (Pega Infinity v8.x / v25.x).

---

## Epic 1: Application Setup & Persona Architecture
- **Epic ID**: `EPIC-01`
- **Summary**: Establish the core Pega application container, enterprise class structure, and define user personas and access roles.
- **User Story 1.1**:
  - *As an* Application Author (`author@uplus`),
  - *I want to* generate the `CineWave` application built on `Theme-Cosmos` / `Constellation` with the organization layer `CineWave-Entertainment-Ticketing`,
  - *So that* we establish an enterprise-grade foundation for case management.
  - **Acceptance Criteria**:
    - Application created with name `CineWave`.
    - Class structure `CineWave-Work-TicketBooking` created.
    - Standard operator `author@uplus` configured with Author access group.

---

## Epic 2: Case Lifecycle Design & State Transitions
- **Epic ID**: `EPIC-02`
- **Summary**: Design the primary case lifecycle stages, steps, and alternate flows for movie ticket reservations.
- **User Story 2.1**:
  - *As a* Systems Architect,
  - *I want to* configure the `Ticket Booking` case type (`TICK-`) with 5 primary stages (*Selection*, *Seat Reservation*, *Customer Confirmation*, *Fulfillment & Issuance*, *Resolution*) and 1 alternate stage (*Cancellation & Refund*),
  - *So that* customer bookings follow a predictable, auditable state machine.
  - **Acceptance Criteria**:
    - Case ID prefix configured as `TICK-`.
    - Stage transitions mapped with appropriate case statuses (`New`, `Pending-SeatSelection`, `Pending-Payment`, `Resolved-Completed`, `Resolved-Cancelled`).

---

## Epic 3: Data Modeling & Entity Relationships
- **Epic ID**: `EPIC-03`
- **Summary**: Model the core data classes, properties, and entity relationships required for the cinema domain.
- **User Story 3.1**:
  - *As a* Data Architect,
  - *I want to* create data objects for `Movie`, `Theatre`, `Showtime`, `Seat`, `Customer`, and `Payment`,
  - *So that* the application has a structured, reusable data model.
  - **Acceptance Criteria**:
    - `CineWave-Data-Movie` (MovieID, Title, Genre, Duration, Rating, Language, Cast).
    - `CineWave-Data-Theatre` (TheatreID, Name, City, Screens, Facilities).
    - `CineWave-Data-Showtime` (ShowID, MovieID, TheatreID, Screen, Time, Date, Pricing).
    - `CineWave-Data-Seat` (SeatID, Row, Col, Tier, Price, Status).
    - `CineWave-Data-Customer` (Name, Email, Phone, SpecialRequests).
    - `CineWave-Data-Payment` (TransactionID, Method, Amount, Status).

---

## Epic 4: Data Pages & Dynamic Sourcing
- **Epic ID**: `EPIC-04`
- **Summary**: Configure Pega Data Pages (`D_*`) to fetch and cache movies, showtimes, and theatre inventories efficiently.
- **User Story 4.1**:
  - *As a* Lead System Architect,
  - *I want to* define Data Pages `D_MovieList`, `D_TheatresByCity`, `D_Showtimes`, and `D_SeatAvailability`,
  - *So that* the UI views load catalog data dynamically with parameterized queries and appropriate scopes (Node/Thread).
  - **Acceptance Criteria**:
    - `D_MovieList` (Read-only, Node scope).
    - `D_TheatresByCity` (Read-only, Thread scope, parameterized by `City`).
    - `D_Showtimes` (Read-only, parameterized by `MovieID` and `Date`).
    - `D_BookingDetails` (Savable Data Page).

---

## Epic 5: Customer Portal & Movie Selection UI
- **Epic ID**: `EPIC-05`
- **Summary**: Build responsive user interface views for browsing movies, filtering by city/genre, and picking showtimes.
- **User Story 5.1**:
  - *As a* Moviegoer,
  - *I want to* browse currently playing movies with posters, ratings, genres, and synopsis,
  - *So that* I can easily choose what movie to watch and select a theatre and showtime.
  - **Acceptance Criteria**:
    - Dynamic card layout with image thumbnails and metadata badges.
    - Search input filtering across title, director, and cast.
    - City and Genre dropdown selectors.

---

## Epic 6: Interactive Seating Matrix & Tiered Layout
- **Epic ID**: `EPIC-06`
- **Summary**: Provide an interactive visual seating layout with tier distinction (VIP, Premium, Standard).
- **User Story 6.1**:
  - *As a* Customer,
  - *I want to* see a visual representation of the cinema hall with a curved screen indicator and colored seat rows,
  - *So that* I can click to select my preferred seats.
  - **Acceptance Criteria**:
    - Visual differentiation between VIP Recliners ($22+), Premium ($16+), and Standard ($12+).
    - Distinct states: Available, Selected, Occupied, and Locked.
    - Validation rule preventing booking more than 10 seats per case.

---

## Epic 7: Business Logic, Pricing & Fare Calculations
- **Epic ID**: `EPIC-07`
- **Summary**: Implement automated calculation rules for subtotal, convenience fees, GST/taxes, and promotional discounts.
- **User Story 7.1**:
  - *As a* Financial Controller,
  - *I want to* automatically compute booking fares using Decision Tables and Data Transforms,
  - *So that* customer invoices are accurate and transparent.
  - **Acceptance Criteria**:
    - $\text{Subtotal} = \sum(\text{Seat Tier Base Prices})$
    - $\text{Convenience Fee} = \text{Subtotal} \times 10\%$
    - $\text{Tax (GST)} = (\text{Subtotal} + \text{ConvenienceFee}) \times 18\%$
    - Promo discount deduction (e.g. `CINEWAVE20` applying 20% discount).

---

## Epic 8: Concurrency & Temporary Seat Locking SLA
- **Epic ID**: `EPIC-08`
- **Summary**: Enforce a 10-minute temporary seat hold lock to prevent double bookings during checkout.
- **User Story 8.1**:
  - *As a* System Administrator,
  - *I want to* apply a Service Level Agreement (SLA) with a 10-minute deadline on the *Seat Reservation* stage,
  - *So that* abandoned checkout sessions release reserved seats back to the public pool.
  - **Acceptance Criteria**:
    - Live countdown timer displayed in checkout view.
    - Automatic expiry and lock release when the deadline is breached.

---

## Epic 9: Box Office Staff Portal & Case Queue
- **Epic ID**: `EPIC-09`
- **Summary**: Provide cinema staff with a centralized case management queue for tracking bookings and managing show inventory.
- **User Story 9.1**:
  - *As a* Box Office Staff Operator,
  - *I want to* view all customer booking cases in a filterable table, search by Case ID, and schedule new showtimes,
  - *So that* cinema operations run smoothly with full visibility.
  - **Acceptance Criteria**:
    - Operator queue displaying Case ID, Customer, Movie, Screen, Amount, and Status.
    - Showtime scheduler modal allowing staff to add new dates/screens.

---

## Epic 10: Automated Customer Notifications & Correspondence
- **Epic ID**: `EPIC-10`
- **Summary**: Automatically dispatch email notifications and digital tickets upon successful case resolution.
- **User Story 10.1**:
  - *As a* Customer,
  - *I want to* receive an immediate email confirmation containing my Case ID, show details, and digital ticket,
  - *So that* I have official proof of booking.
  - **Acceptance Criteria**:
    - Pega Correspondence rule `BookingConfirmationEmail` triggered at the *Fulfillment & Issuance* stage.
    - Digital QR code ticket generation containing encrypted booking verification payload.

---

## Epic 11: Case Tracking & Self-Service Cancellation
- **Epic ID**: `EPIC-11`
- **Summary**: Enable customers to look up case progress in real-time and cancel eligible tickets.
- **User Story 11.1**:
  - *As a* Customer,
  - *I want to* enter my `TICK-XXXX` reference to check status or cancel my reservation,
  - *So that* I can manage my booking self-service.
  - **Acceptance Criteria**:
    - Visual Stage Lifecycle Stepper displaying all completed steps with timestamps.
    - Cancellation action triggering the *Cancellation & Refund* alternate stage and restoring seat inventory.

---

## Epic 12: Analytics, Reporting & System Health
- **Epic ID**: `EPIC-12`
- **Summary**: Provide executive dashboards displaying revenue metrics, tickets sold, and case lifecycle distribution.
- **User Story 12.1**:
  - *As an* Executive Manager,
  - *I want to* view real-time charts of total revenue, tickets sold, and case completion rates,
  - *So that* I can monitor business performance and cinema capacity.
  - **Acceptance Criteria**:
    - Real-time KPIs for Total Revenue, Cases Processed, Tickets Sold, and Average Case Value.
    - Dynamic revenue by movie title bar chart.
    - Stage lifecycle distribution breakdown.
