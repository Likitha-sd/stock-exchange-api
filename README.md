# StockFlow — Stock Exchange & Order Matching Engine

StockFlow is a full-stack stock exchange simulation built to demonstrate how an order book and matching engine process buy and sell orders. It combines a Java Spring Boot backend, PostgreSQL persistence, and a React dashboard.

The project focuses on order matching, partial order execution, trade recording, and visualizing executed trades through a web interface.

> **Note:** StockFlow is an educational exchange simulation. It does not connect to a real stock exchange or provide live market prices.

## Features

* **Order Matching Engine:** Processes compatible buy and sell orders.
* **Partial Order Execution:** Supports orders that can be filled across multiple matches.
* **Order Book:** Exposes order information through REST APIs.
* **Trade History:** Records and retrieves executed trades.
* **Database Persistence:** Stores orders and trades in PostgreSQL.
* **Recovery:** Includes backend logic for rebuilding the order book from persisted data.
* **Interactive Dashboard:** React interface for submitting orders and viewing order book and trade information.
* **Trade Visualization:** Displays charts based on recorded trade executions.
* **REST API:** Provides endpoints for health checks, orders, and trades.

## Technology Stack

### Backend

* Java 21
* Spring Boot
* Spring Data JPA
* PostgreSQL
* Maven
* REST APIs

### Frontend

* React
* JavaScript
* Vite
* HTML and CSS

### Development Tools

* Git and GitHub
* Visual Studio Code

## Architecture

```text
React Dashboard
      |
      | HTTP / REST
      v
Spring Boot Backend
      |
      v
Order Matching Engine
      |
      +---- Order Management
      |
      +---- Trade Execution
      |
      v
PostgreSQL Database
```

## Project Structure

```text
stock-exchange-api/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── src/
│   ├── main/
│   │   ├── java/stock_exchange_api/
│   │   │   ├── engine/
│   │   │   ├── entity/
│   │   │   ├── repository/
│   │   │   ├── service/
│   │   │   └── *Controller.java
│   │   └── resources/
│   │       └── application.properties
│   └── test/
├── pom.xml
├── mvnw
├── mvnw.cmd
└── README.md
```

## Prerequisites

Install the following before running the project:

* Java 21
* PostgreSQL
* Node.js and npm
* Git

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Likitha-sd/stock-exchange-api.git
cd stock-exchange-api
```

### 2. Configure PostgreSQL

Create a PostgreSQL database named:

```sql
CREATE DATABASE stock_exchange_db;
```

The backend reads its database configuration from environment variables. The default connection URL and username are configured in `application.properties`.

For a local PowerShell session, configure the connection as follows:

```powershell
$env:DB_URL = "jdbc:postgresql://localhost:5432/stock_exchange_db"
$env:DB_USERNAME = "postgres"
$env:DB_PASSWORD = Read-Host "Enter your PostgreSQL password"
```

Enter your local database password when prompted. Never commit your actual database password to GitHub.

### 3. Start the backend

From the project root, run:

```powershell
.\mvnw.cmd spring-boot:run
```

The backend should start at:

```text
http://localhost:8080
```

### 4. Start the frontend

Open a second terminal and navigate to the frontend directory:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, typically:

```text
http://localhost:5173
```

## API Endpoints

| Method | Endpoint      | Purpose                  |
| ------ | ------------- | ------------------------ |
| GET    | `/api/health` | Check backend health     |
| GET    | `/api/orders` | Retrieve orders          |
| POST   | `/api/orders` | Submit an order          |
| GET    | `/api/trades` | Retrieve executed trades |

The backend must be running and connected to PostgreSQL for database-dependent endpoints to work.

## Price Representation

StockFlow represents prices using integer price ticks. For example:

* `10000` ticks represents ₹100.00.
* `12550` ticks represents ₹125.50.

This representation avoids relying on floating-point values for price calculations.

## Current Scope

StockFlow demonstrates the fundamentals of an exchange-style order-processing system, including order matching, partial fills, trade persistence, and a web-based dashboard.

The dashboard's charts are based on trades recorded by the application. They do not represent historical or live market data from an external exchange.

## Future Improvements

Potential extensions include:

* Order cancellation and modification
* Improved order-book visualization
* Automated matching-engine tests
* Performance benchmarking under concurrent order submissions
* Docker-based development and deployment
* Cloud deployment with managed PostgreSQL
* Monitoring and application metrics

## Author

**Likitha Sri Maddipatla**

GitHub: [Likitha-sd](https://github.com/Likitha-sd)

## Disclaimer

StockFlow is a software engineering and educational project. It is not a brokerage platform, does not execute real financial transactions, and should not be used for live trading.
