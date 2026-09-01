# CineWave Data Model & Data Pages Specification

## 1. Class Structure Hierarchy

```
CineWave-
├── Work-
│   └── TicketBooking (Case Type: TICK-)
└── Data-
    ├── Movie
    ├── Theatre
    ├── Showtime
    ├── Seat
    ├── Customer
    └── Payment
```

---

## 2. Data Classes & Property Definitions

### 1. `CineWave-Data-Movie`
| Property | Type | Description |
|---|---|---|
| `MovieID` | Text (Identifier) | Unique movie identifier (e.g. `MOV-101`) |
| `Title` | Text | Title of the film |
| `Genre` | Text | Film genres (e.g. `Sci-Fi / Adventure`) |
| `Duration` | Text | Duration in minutes (e.g. `166 mins`) |
| `Rating` | Text | Critic / Audience rating (e.g. `8.6/10`) |
| `Certificate` | Text | Age classification (`U`, `UA`, `A`) |
| `Language` | Text | Spoken audio language |
| `Director` | Text | Primary director |
| `Cast` | Text | Starring cast members |
| `Synopsis` | Text | Movie plot summary |
| `PosterURL` | Text / URL | Thumbnail image web link |
| `IsFeatured` | True/False | Catalog highlight flag |

### 2. `CineWave-Data-Theatre`
| Property | Type | Description |
|---|---|---|
| `TheatreID` | Text (Identifier) | Unique theatre ID (e.g. `THTR-01`) |
| `Name` | Text | Cinema venue name |
| `City` | Text | Location city (`Metropolis`, `Gotham`, `Star City`) |
| `Address` | Text | Full physical venue address |
| `ScreenCount` | Integer | Number of auditoriums |
| `FacilitiesList` | Page List | Amenities (`IMAX Laser`, `Dolby Atmos`, `Recliners`) |

### 3. `CineWave-Data-Showtime`
| Property | Type | Description |
|---|---|---|
| `ShowID` | Text (Identifier) | Unique showtime ID (e.g. `SHOW-101`) |
| `MovieID` | Text | Reference to `CineWave-Data-Movie` |
| `TheatreID` | Text | Reference to `CineWave-Data-Theatre` |
| `Screen` | Text | Auditorium name (e.g. `Audi 1 (IMAX)`) |
| `ShowDate` | Date | Date of screening |
| `ShowTime` | TimeOfDay / Text | Scheduled time (e.g. `10:30 AM`) |
| `Experience` | Text | Screen format (`IMAX 3D`, `4DX`, `Laser`) |
| `Pricing.Standard` | Currency | Base price for standard seats |
| `Pricing.Premium` | Currency | Base price for premium club seats |
| `Pricing.VIP` | Currency | Base price for VIP recliners |
| `OccupiedSeats` | Value List | List of already reserved seat IDs |

### 4. `CineWave-Data-Seat`
| Property | Type | Description |
|---|---|---|
| `SeatID` | Text | Alphanumeric seat coordinate (e.g. `E4`) |
| `Row` | Text | Row letter (`A` through `F`) |
| `Col` | Integer | Column number (`1` through `8`) |
| `Tier` | Text | `VIP`, `Premium`, `Standard` |
| `Price` | Currency | Price per ticket in this tier |
| `Status` | Text | `Available`, `Selected`, `Occupied`, `Locked` |

### 5. `CineWave-Data-Customer`
| Property | Type | Description |
|---|---|---|
| `FullName` | Text | Customer complete legal name |
| `Email` | Email | Contact and e-ticket destination email |
| `Phone` | Phone | Mobile contact phone number |
| `SpecialRequests` | Text | Accessibility or dining preferences |

### 6. `CineWave-Data-Payment`
| Property | Type | Description |
|---|---|---|
| `TransactionID` | Text | Unique authorization reference code |
| `Method` | Text | `Credit Card`, `Apple Pay`, `UPI` |
| `Last4` | Text | Masked card reference |
| `Status` | Text | `Paid`, `Pending`, `Refunded` |
| `Timestamp` | DateTime | Transaction authorization timestamp |

---

## 3. Data Pages Architecture

| Data Page | Class | Scope | Mode | Parameters | Data Source |
|---|---|---|---|---|---|
| `D_MovieList` | `CineWave-Data-Movie` | Node | Read-Only | None | Movie Data Table / REST |
| `D_TheatresByCity` | `CineWave-Data-Theatre` | Thread | Read-Only | `City` (Text) | Database Lookup Filter |
| `D_Showtimes` | `CineWave-Data-Showtime` | Thread | Read-Only | `MovieID`, `Date` | Filtered Query |
| `D_SeatAvailability` | `CineWave-Data-Seat` | Requestor | Read-Only | `ShowID` | Real-time Seat State Map |
| `D_BookingDetails` | `CineWave-Work-TicketBooking` | Thread | Savable | `CaseID` | Case Context Persistence |
