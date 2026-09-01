# Project Submission Report: Movie Ticket Booking Management Application

**Student Name**: [Your First Name] [Your Last Name]  
**Application Name**: CineWave Entertainment  
**Platform**: Pega Platform™ (Pega Infinity v8.x / v25.x) & CineWave Web Architecture  
**Role / Operator**: `author@uplus`  
**Submission Date**: August 2026  

---

## 1. Executive Summary & Problem Statement

### Background
CineWave Entertainment manages movie ticket bookings across multiple cinema multiplexes and cities. Prior to this project, ticket booking and tracking processes were handled manually through offline paper records and ad-hoc email communications. This resulted in:
- High booking delays and lack of real-time seat inventory visibility.
- Concurrency conflicts (double-booking risk).
- Absence of customer self-service case tracking.
- Fragmented reporting for box-office executives.

### Solution Overview
Using the Pega Platform™ Case Management and Data Modeling paradigms, CineWave modernised its operations with the **Ticket Booking Case Type** (`TICK-`). The system provides:
1. Multi-tier visual seat selection (VIP, Premium, Standard).
2. Concurrency hold locks (10-minute SLA).
3. Automated fare calculation, tax computation, and promo validations.
4. Instant E-Ticket generation with encrypted QR verification tokens.
5. Real-time customer case tracking and staff operator queue management.

---

## 2. Project Objectives & Deliverables Matrix

| Objective | Implementation Details | Status |
|---|---|---|
| **Case Lifecycle Design** | 5 Primary Stages + 1 Alternate Cancellation Stage configured with clear routing and status transitions. | ✅ Completed |
| **User Interaction & Views** | Modern customer self-service wizard, interactive seat map, and staff operator queue. | ✅ Completed |
| **Data Modeling** | 6 Data Classes (`Movie`, `Theatre`, `Showtime`, `Seat`, `Customer`, `Payment`) and 5 Data Pages (`D_*`). | ✅ Completed |
| **Business Logic & Automation** | 10% Convenience fee, 18% GST calculation, `CINEWAVE20` discount rule, 10-ticket limit validation. | ✅ Completed |
| **Customer Notifications** | Pega Correspondence email dispatch simulation and digital QR E-Ticket issuance. | ✅ Completed |

---

## 3. Case Lifecycle Architecture (Stages & Steps)

### Stages Breakdown
1. **Selection**: Customer picks movie, city, theatre, and showtime.
2. **Seat Reservation**: Interactive visual seating layout with tier pricing and 10-minute hold SLA.
3. **Customer Confirmation**: Collects customer contact info, validates inputs, applies promo codes, and processes payment.
4. **Fulfillment & Issuance**: Generates booking ID, QR code token, and dispatches automated confirmation email.
5. **Resolution**: Case resolved with status `Resolved-Completed`.
6. **Alternate: Cancellation**: Returns reserved seats to public inventory, processes refund, and sets status to `Resolved-Cancelled`.

---

## 4. Key Screenshots & Evidence Checklist

*(Insert your captured screenshots in these sections for the Word/PDF document)*

### Screenshot 1: Pega Case Lifecycle & Stage Configuration
*Insert screenshot from App Studio showing the 5 Primary Stages and 1 Alternate Stage of the Ticket Booking case type.*

### Screenshot 2: Data Model & Data Objects View
*Insert screenshot showing `CineWave-Data-Movie`, `CineWave-Data-Showtime`, and `CineWave-Data-Seat` data structures.*

### Screenshot 3: Customer Movie Catalog & Filter UI
*Insert screenshot of the CineWave customer portal showing movie cards, ratings, and city/genre filters.*

### Screenshot 4: Interactive Cinema Seating Grid & Hold Timer
*Insert screenshot showing the curved cinema screen, VIP/Premium/Standard seat rows, and 10:00 hold countdown.*

### Screenshot 5: Customer Details & Fare Calculation Summary
*Insert screenshot showing the price breakdown (Base Fare + 10% Convenience Fee + 18% GST - Discount).*

### Screenshot 6: Confirmed Digital E-Ticket with QR Code
*Insert screenshot of the issued E-Ticket with Case ID `TICK-XXXX` and QR verification code.*

### Screenshot 7: Real-Time Case Tracking & Lifecycle Stepper
*Insert screenshot showing the search result for `TICK-XXXX` with stage timeline and cancellation trigger.*

### Screenshot 8: Box Office Staff Operator Queue
*Insert screenshot showing the filterable table of active and resolved booking cases.*

### Screenshot 9: Executive Analytics Dashboard
*Insert screenshot showing revenue KPI cards, movie gross receipts, and stage distribution charts.*

---

## 5. Conclusion & Business Impact

The CineWave Movie Ticket Booking Management Application demonstrates how low-code Case Management, automated business rules, and robust data modeling eliminate manual booking bottlenecks, improve customer satisfaction, and ensure zero seat concurrency conflicts across multi-location cinema complexes.
