# Workflow Manager 🚀

A sleek, modern, and highly responsive Kanban-style task management application. Built to demonstrate advanced full-stack capabilities, robust infrastructure security, and seamless user experience through isolated temporary user sandbox environments.

## ✨ Features

* **Architectural Insights Accordion:** An interactive component built into the header to explain the platform's engineering. It gives developers an immediate, deep-dive breakdown of the security sandbox and framework version disclosures.
* **Temporary 24-Hour Sessions:** To keep the environment clean and production-ready, a background routine runs automatically every 24 hours, safely wiping temporary sessions and their respective tasks using an `ON DELETE CASCADE` database constraint.
* **Secure Session Lifecycle:** Token verification completely bypasses `localStorage` to eliminate XSS (Cross-Site Scripting) injection vectors. User authentication and state persistence rely on signed JWT payloads delivered via server-side `HttpOnly` cookies.
* **Modern State Management:** Fully implemented using Angular's latest `Signals` for reactive, glitch-free state updates, preventing unnecessary component re-renders.
* **Interactive Kanban Board:** Effortlessly move tasks between columns using an Angular CDK Drag & Drop interface with optimistic UI updates for instant feedback.
* **Containerized Infrastructure:** Frontend and backend components are fully containerized using optimized Docker multi-stage builds to ensure consistent environment replication.
* **Responsive Layout:** A mobile-first approach using CSS Grid and Flexbox, ensuring the board looks great and scales correctly on any screen size.

## 🛠️ Tech Stack

### Frontend

* **Framework:** Angular 17+ (Standalone Components)
* **Reactivity:** Angular Signals
* **UI/UX:** Angular Material & Angular CDK (Drag and Drop)
* **Styling:** SCSS (with a custom dark theme)

### Backend

* **Environment:** Node.js
* **Framework:** Express.js
* **Authentication:** Cookie-Parser, JWT, Bcrypt
* **Database:** PostgreSQL (with raw connection pooling)

### Infrastructure

* **Containerization:** Docker (Multi-stage builds)

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Make sure you have the following installed:

1. [Node.js](https://nodejs.org) (v18 or higher recommended)
2. [Angular CLI](https://angular.io) (`npm install -g @angular/cli`)

### Installation & Setup

1. **Clone the repository:**

    ```bash
    git clone https://github.com
    cd workflow-manager
    ```

2. **Start the Backend API:**

    ```bash
    cd server
    npm install
    npm start
    ```

The API should now be running on <http://localhost:3000>

3. **Start the FrontEnd Application:**

    ```bash
    cd client
    npm install
    npm start
    ```

4. **View the App:**

Open your browser and navigate to <http://localhost:4200/>

## ☁️ Deployment & Infrastructure Vision

This application is architected with cloud-native principles in mind. The separation of concerns between the Angular frontend and Node.js backend makes it ideal for distributed orchestrations.

**Planned Architecture:**

* Orchestration: Deploying the containerized stack using Amazon Elastic Container Service (AWS ECS) or a Rancher-managed cluster.

* CI/CD: Implementing AWS CodePipeline to automate testing and deployment upon merging to the main branch.

* Infrastructure as Code (IaC): Managing the routing (Elastic Load Balancing) and resource provisioning via AWS CloudFormation.

## 📝 License

This project is licensed under the MIT License - see the LICENSE.md file for details.
