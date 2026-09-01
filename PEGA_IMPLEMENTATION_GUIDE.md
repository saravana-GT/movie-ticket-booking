# CineWave Entertainment - Pega App Studio Implementation Guide

This guide provides step-by-step instructions for creating and configuring the **Movie Ticket Booking Management Application** in **Pega Platform™ (Pega Infinity v8.x / v25.x)** using **Pega App Studio** and **Dev Studio**.

---

## 1. Environment & Operator Setup

1. **Access Exercise System**:
   - Open Google Chrome, Firefox, or Microsoft Edge.
   - Navigate to your assigned Pega Academy Exercise System instance URL.
2. **Login Credentials**:
   - **Operator ID**: `author@uplus`
   - **Password**: `pega123!`
3. **Application Creation**:
   - In Pega App Studio, click **New Application**.
   - Select application type: **Theme-Cosmos** (or **Constellation**).
   - Application Name: `CineWave`
   - Organization: `CineWave`
   - Division: `Entertainment`
   - Unit: `Ticketing`
   - Click **Create Application** and then **Go to app**.

---

## 2. Case Type Creation (`Ticket Booking`)

1. Navigate to **Case types** in the left navigation panel.
2. Click **+ Add case type** -> **New**.
3. Name: `Ticket Booking`
4. Set Case ID prefix to: `TICK-` (via Dev Studio -> Case Type Settings -> Details -> Prefix: `TICK-`).
5. Work Class: `CineWave-Work-TicketBooking`.

---

## 3. Case Lifecycle Configuration (Stages & Steps)

Configure the following stages and steps in App Studio:

### Stage 1: Selection (Primary Stage)
- **Step 1.1**: *Select Movie & Theatre*
  - **Type**: Collect information (User Action)
  - **Persona / Routing**: Customer (`CurrentOperator`)
  - **View Fields**:
    - `MovieID` (Picklist / Dropdown sourced from `D_MovieList`)
    - `TheatreID` (Picklist sourced from `D_TheatresByCity`)
- **Step 1.2**: *Select Date & Showtime*
  - **Type**: Collect information
  - **View Fields**:
    - `BookingDate` (Date)
    - `ShowtimeID` (Picklist sourced from `D_Showtimes`)

### Stage 2: Seat Reservation (Primary Stage)
- **Step 2.1**: *Choose Seats*
  - **Type**: Collect information (Custom UI Section)
  - **View**: Embedded seating matrix (`CineWave-Data-Seat` list).
- **Step 2.2**: *Apply Seat Lock SLA*
  - **Type**: Automation / Service Level Agreement
  - **Goal**: 5 minutes | **Deadline**: 10 minutes
  - **Action on Deadline**: Route to Alternate Stage (*Cancellation / Timeout*).
- **Step 2.3**: *Calculate Fares*
  - **Type**: Automation -> Data Transform (`CalculateTicketFare`)
  - **Logic**:
    - `.Subtotal = @Sum(.SelectedSeats.Price)`
    - `.ConvenienceFee = .Subtotal * 0.10`
    - `.Tax = (.Subtotal + .ConvenienceFee) * 0.18`
    - `.TotalAmount = .Subtotal + .ConvenienceFee + .Tax - .Discount`

### Stage 3: Customer Confirmation (Primary Stage)
- **Step 3.1**: *Enter Customer Details*
  - **Type**: Collect information
  - **View Fields**:
    - `.Customer.FullName` (Text - Required)
    - `.Customer.Email` (Email - Required with Validate rule)
    - `.Customer.Phone` (Phone - Required)
    - `.Customer.SpecialRequests` (Text - Optional)
    - `.PromoCode` (Text - Optional)
- **Step 3.2**: *Apply Promo Code Discount*
  - **Type**: Decision / When Rule (`IsPromoValid`)
  - **When**: `.PromoCode == "CINEWAVE20"` -> Set `.Discount = .TotalAmount * 0.20`
- **Step 3.3**: *Process Payment*
  - **Type**: Collect information / Integration Connector
  - **View Fields**:
    - `.Payment.PaymentMethod` (Radio: Credit Card, Apple Pay, UPI)
    - `.Payment.Amount` (Currency - Read Only)

### Stage 4: Fulfillment & Issuance (Primary Stage)
- **Step 4.1**: *Generate E-Ticket & QR Token*
  - **Type**: Automation
  - **Action**: Create unique transaction reference and barcode string.
- **Step 4.2**: *Send Confirmation Notification*
  - **Type**: Send notification (Correspondence)
  - **Channel**: Email
  - **Recipient**: `.Customer.Email`
  - **Correspondence Rule**: `BookingConfirmationEmail`
  - **Subject**: `Booking Confirmed: <.Movie.Title> [<.pyID>]`

### Stage 5: Resolution (Resolution Stage)
- **Step 5.1**: *Close Case*
  - **Type**: Change stage / Set Case Status
  - **Case Status**: `Resolved-Completed`

### Alternate Stage: Cancellation & Refund
- **Stage Type**: Alternate Stage
- **Entry Condition**: Customer initiated cancellation OR Seat lock timeout.
- **Step Alt.1**: *Release Seat Inventory*
  - **Type**: Automation -> Data Page Save
- **Step Alt.2**: *Send Cancellation Notice*
  - **Type**: Send notification (Email)
- **Step Alt.3**: *Resolve Cancelled*
  - **Case Status**: `Resolved-Cancelled`

---

## 4. Data Types Setup (`Data Objects`)

In App Studio, navigate to **Data** -> **Data objects and integrations** -> **+ Add data object**:

1. **Movie (`CineWave-Data-Movie`)**:
   - `MovieID` (Text) - Primary Key
   - `Title` (Text)
   - `Genre` (Text)
   - `Duration` (Text)
   - `Rating` (Text)
   - `PosterURL` (URL)
   - `Synopsis` (Text)
2. **Theatre (`CineWave-Data-Theatre`)**:
   - `TheatreID` (Text) - Primary Key
   - `Name` (Text)
   - `City` (Text)
   - `ScreensCount` (Integer)
   - `Facilities` (Text)
3. **Showtime (`CineWave-Data-Showtime`)**:
   - `ShowID` (Text) - Primary Key
   - `MovieID` (Text)
   - `TheatreID` (Text)
   - `ScreenName` (Text)
   - `ShowTime` (Text)
   - `ShowDate` (Date)
   - `StandardPrice` (Currency)
   - `PremiumPrice` (Currency)
   - `VIPPrice` (Currency)
4. **Seat (`CineWave-Data-Seat`)**:
   - `SeatID` (Text) - e.g. `E4`
   - `Row` (Text)
   - `Col` (Integer)
   - `Tier` (Picklist: Standard, Premium, VIP)
   - `Price` (Currency)
   - `Status` (Picklist: Available, Occupied, Locked)
5. **Customer (`CineWave-Data-Customer`)**:
   - `FullName` (Text)
   - `Email` (Email)
   - `Phone` (Phone)
   - `SpecialRequests` (Text)
6. **Payment (`CineWave-Data-Payment`)**:
   - `TransactionID` (Text)
   - `PaymentMethod` (Text)
   - `Amount` (Currency)
   - `PaymentStatus` (Text)

---

## 5. Data Pages (`D_*`)

1. `D_MovieList`: Sourced from Movie data table, Read-only, Node scope.
2. `D_TheatresByCity`: Sourced with parameter `City`, Thread scope.
3. `D_Showtimes`: Sourced with parameters `MovieID` and `ShowDate`, Thread scope.
4. `D_SeatAvailability`: Sourced with parameter `ShowID`, Requestor scope.
5. `D_BookingDetails`: Savable Data Page for case persistence.

---

## 6. Business Logic, Calculations & Validations

1. **Validation Rule (`ValidateTicketCount`)**:
   - Property: `.SelectedSeats`
   - Condition: `@Count(.SelectedSeats) <= 10`
   - Message: *"You cannot select more than 10 seats per booking case."*
2. **Validation Rule (`ValidateCustomerEmail`)**:
   - Property: `.Customer.Email`
   - Condition: Standard valid email pattern check.
3. **Calculation Data Transform (`CalculateTicketFare`)**:
   - Set `.Subtotal` = sum of seat prices
   - Set `.ConvenienceFee` = `.Subtotal * 0.10`
   - Set `.Tax` = `(.Subtotal + .ConvenienceFee) * 0.18`
   - Set `.TotalAmount` = `.Subtotal + .ConvenienceFee + .Tax - .Discount`

---

## 7. Correspondence Template (`BookingConfirmationEmail`)

In Dev Studio -> **Records** -> **Process** -> **Correspondence**:
- Name: `BookingConfirmationEmail`
- Applies to: `CineWave-Work-TicketBooking`
- Content Body:
```html
<p>Dear <pega:reference name=".Customer.FullName" />,</p>
<p>Your movie ticket booking has been confirmed successfully!</p>
<table border="1" cellpadding="6">
  <tr><td><strong>Case Reference ID:</strong></td><td><pega:reference name=".pyID" /></td></tr>
  <tr><td><strong>Movie:</strong></td><td><pega:reference name=".Movie.Title" /></td></tr>
  <tr><td><strong>Theatre:</strong></td><td><pega:reference name=".Theatre.Name" /> (<pega:reference name=".Theatre.City" />)</td></tr>
  <tr><td><strong>Date & Time:</strong></td><td><pega:reference name=".Showtime.ShowDate" /> at <pega:reference name=".Showtime.ShowTime" /></td></tr>
  <tr><td><strong>Seats:</strong></td><td><pega:reference name=".SelectedSeatsList" /></td></tr>
  <tr><td><strong>Total Amount Paid:</strong></td><td>$<pega:reference name=".TotalAmount" format="Currency" /></td></tr>
</table>
<p>Please present this digital confirmation or QR Code at the cinema entrance.</p>
```

---

## 8. Verification & Case Run

1. In App Studio, click **+ Create** -> **Ticket Booking**.
2. Advance through the stages:
   - Select **Dune: Part Two** at **CineWave IMAX Grand**.
   - Pick 2 VIP seats.
   - Enter Customer details (`Sarah Connor`, `sarah.connor@example.com`).
   - Enter Promo Code `CINEWAVE20` and click Apply.
   - Choose Payment Method and Submit.
3. Confirm that case resolves with status **Resolved-Completed** and generates `TICK-XXXX`.
4. Capture screenshots of each screen to embed in your `FirstName_LastName.docx` report.
