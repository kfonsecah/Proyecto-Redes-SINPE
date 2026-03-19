# NovaBank — Interbank Transfer Simulation System

NovaBank is a full-stack digital banking simulation built to model real-world Costa Rican interbank infrastructure. It implements the SINPE Móvil protocol, wire transfers, and a pull-funds mechanism across a physically configured network of Cisco routers and switches — all running in a shared local area network designed to replicate how Costa Rican commercial banks communicate with each other and with the BCCR (Central Bank).

---

## Network infrastructure

The system does not run over localhost. Each bank in the simulation is a dedicated **Cisco 2900 series router**, physically cabled and configured via PuTTY over a serial console connection. The routers are interconnected through **Cisco Catalyst 2960 PoE-8 switches**, which handle VLAN trunking and layer-3 switching between segments.

Each router represents one institution — NovaBank, Banco Nacional, BCR, Promerica, and so on. A laptop or server connected to each router's local segment runs that bank's Node.js API, reachable only through the router's assigned IP and subnet. Static routes were manually configured on every device so that traffic between any two banks travels through the correct physical path rather than a simulated or virtual overlay.

```
  [Laptop: NovaBank API]          [Laptop: Banco Nacional API]
        │                                    │
  Cisco 2900                           Cisco 2900
  Bank 152                             Bank 241
  192.168.1.10                         192.168.4.10
        │                                    │
        └──────── Catalyst 2960 ────────────┘
                   (VLAN trunk / L3 switch)
                         │
                   Cisco 2900
                   Bank 876 (Promerica)
                   192.168.3.10
```

All devices were configured from scratch using PuTTY: interface IP assignments, VLAN definitions, trunk ports, access ports, and static routing tables. SSL certificates were self-signed per bank to enable HTTPS across the network, with `rejectUnauthorized: false` set in development to allow the certificates to be accepted by other banks' servers.

---

## How it works

NovaBank runs as a Node.js/Express REST API with a React frontend. Each bank exposes the same set of endpoints so that transfers, SINPE Móvil messages, and pull-funds requests can be sent and received between institutions using a shared protocol.

Every outgoing transfer is signed with an HMAC-MD5 generated from the sender's account number (or phone number for SINPE), the transaction timestamp, the transaction UUID, and the amount. The receiving bank verifies this signature before processing the transaction. If the HMAC does not match, the transfer is rejected with a NACK.

```
Sender initiates transfer
        ↓
HMAC generated → payload signed
        ↓
POST /api/transactions (receiving bank)
        ↓
HMAC verified → transfer processed
        ↓
ACK returned → funds debited from sender
```

Funds are only debited after an ACK is received. If the external bank returns a NACK or the connection fails, the sender's balance is never touched.

---

## Transfer types

**Wire transfers** — account-to-account transfers between any two banks. The sender selects a source account, enters the destination IBAN, and the system detects the target bank from the IBAN's bank code (positions 5–7). If the destination is within NovaBank (`152`), it routes internally. Otherwise it sends the signed payload to the external bank's API via HTTPS.

**SINPE Móvil** — phone-number-based transfers. The sender must have linked one of their accounts to a phone number, which is registered in the BCCR SINPE subscription table. The receiver's phone is looked up in that same table. If the receiver is at a different bank, the transfer is routed externally using the SINPE Móvil protocol.

**Pull Funds** — a user can pull money from an account they hold at another bank into their NovaBank account. They provide the external IBAN and their national ID (`cédula`). The external bank verifies ownership and debits the amount; NovaBank credits it after receiving an ACK.

---

## BCCR integration

The BCCR (Costa Rican Central Bank) hosts a shared SINPE subscription registry. When a user links their account to a phone number, the system registers that link in both NovaBank's local database and the BCCR's `SINPE_SUBSCRIPTIONS` table. When validating a SINPE Móvil transfer, the system queries the BCCR to find which bank code owns the destination phone number, then routes the transfer accordingly.

---

## Architecture

The project is split into three parts:

**Client** (`client/`) — React 19 with TypeScript, Vite, Tailwind CSS, Framer Motion, and Lucide icons. The interface has a persistent sidebar, animated page transitions, and a multi-step transfer flow (form → summary → processing screen). Authentication stores the session in `localStorage`.

**Server** (`server/`) — Node.js with Express 5, TypeScript, and two Prisma clients: one for the bank's own PostgreSQL database (`sinpeClient`) and one for the BCCR's shared database (`bccrClient`). The server runs on both HTTP (port `3001`) and HTTPS (port `3443`) simultaneously, using self-signed SSL certificates.

**Database** (`db/`) — two PostgreSQL schemas. `Sinpe_Script.sql` defines the bank's internal tables: users, accounts, user-account links, phone links, transfers, and logs. `BCCR_Script.sql` defines the shared SINPE subscription registry maintained by the central bank.

```
novabank/
├── client/                  # React frontend (Vite + TypeScript + Tailwind)
│   └── src/
│       ├── components/      # Layout, Sidebar, Transfer forms, Modals
│       ├── pages/           # Login, Home, ViewAccounts
│       └── utils/           # Currency formatting
├── server/                  # Express API (TypeScript + Prisma)
│   └── src/
│       ├── controller/      # Route handlers
│       ├── service/         # Business logic
│       ├── routes/          # Express routers
│       ├── utils/           # HMAC generation, IBAN generation, Prisma clients
│       ├── config/
│       │   └── bank.json    # Bank code → URL mapping
│       └── prisma/          # Prisma client instances (sinpe + bccr)
└── db/
    ├── Sinpe_Script.sql     # Bank internal schema
    └── BCCR_Script.sql      # BCCR shared SINPE registry
```

---

## Bank routing table

Each bank's base URL is stored in `server/src/config/bank.json`, keyed by the 3-digit bank code embedded in every Costa Rican IBAN:

```json
{
  "152": "http://192.168.1.10:3001",
  "241": "https://192.168.4.10:5050",
  "876": "https://192.168.3.10:5000",
  "223": "https://192.168.5.10:3001"
}
```

When a transfer targets an account at bank `241`, the server looks up that URL and POSTs the signed payload to `https://192.168.4.10:5050/api/sinpe-transfer`. The response is either `ACK` or `NACK`.

---

## Installation

```bash
# Clone the repository
git clone <repository-url>

# Install frontend dependencies
cd client
npm install

# Install backend dependencies
cd ../server
npm install
```

Environment variables required in `server/.env`:

```
DATABASE_URL_SINPE=postgresql://user:password@host:5432/sinpe_db
DATABASE_URL_BCCR=postgresql://user:password@host:5432/bccr_db
```

Run the development servers:

```bash
# Frontend (port 5173)
cd client && npm run dev

# Backend (ports 3001 HTTP and 3443 HTTPS)
cd server && npm run dev
```

The SSL certificate and private key must be placed in `server/ssl/` as `certificate.pem` and `private-key.pem` before the HTTPS server will start.

---

## Known limitations

- The HMAC secret (`supersecreta123`) is hardcoded and shared across all participating banks — in a real deployment this would be replaced by asymmetric signing
- Currency conversion is approximated on the frontend; the backend does not perform actual exchange rate lookups
- Session management relies on `localStorage` with no token expiry
- The pull-funds flow does not validate that the external account's currency matches the local account's currency before initiating the request

---

*This is an academic project developed to apply concepts from an Operating Systems and Computer Networks course, simulating real Costa Rican interbank infrastructure using physical Cisco hardware.*
