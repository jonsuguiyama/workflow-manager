# Workflow Manager 🚀

A sleek, modern, and highly responsive Kanban-style task management application. Built to demonstrate full-stack capabilities, modern state management, and seamless user experience through drag-and-drop interfaces.

## ✨ Features

* **Interactive Kanban Board:** Effortlessly move tasks between "To Do" and "Done" using a smooth Drag & Drop interface.
* **Modern State Management:** Fully implemented using Angular's latest `Signals` for reactive, glitch-free state updates.
* **Complete CRUD Operations:** Create, Read, Update, and Delete tasks in real-time.
* **Task Prioritization:** Visual indicators for task priority (Low, Medium, High).
* **Responsive Design:** A mobile-first approach using CSS Grid and Flexbox, ensuring the board looks great on any screen size.
* **Toast Notifications:** Non-intrusive UI feedback for user actions and error handling.

## 🛠️ Tech Stack

### Frontend

* **Framework:** Angular 17+ (Standalone Components)
* **Reactivity:** Angular Signals
* **UI/UX:** Angular Material & Angular CDK (Drag and Drop)
* **Styling:** SCSS (with a custom dark theme)

### Backend

* **Environment:** Node.js
* **Framework:** Express.js
* **API:** RESTful Architecture
* **Integration:** CORS-enabled, structured payload handling for reordering and status updates.

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Make sure you have the following installed:

1. [Node.js](https://nodejs.org/) (v18 or higher recommended)
2. [Angular CLI](https://angular.io/cli) (`npm install -g @angular/cli`)

### Installation & Setup

1. **Clone the repository:**

    ```bash
    git clone [https://github.com/jonsuguiyama/workflow-manager.git](https://github.com/jonsuguiyama/workflow-manager.git)
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
    ng serve
    ```

4. **View the App:**

Open your browser and navigate to <http://localhost:4200/>

## ☁️ Deployment & Infrastructure Vision

This application is architected with cloud-native principles in mind. The separation of concerns between the Angular frontend and Node.js backend makes it ideal for containerized deployments.

**Planned Architecture:**

* Containerization: Writing Dockerfiles for both the frontend client and the Node.js API.

* Orchestration: Deploying containers using Amazon Elastic Container Service (AWS ECS) or a Rancher-managed cluster.

* CI/CD: Implementing AWS CodePipeline to automate testing and deployment upon merging to the main branch.

* Infrastructure as Code (IaC): Managing the routing (Elastic Load Balancing) and resource provisioning via AWS CloudFormation.

## 📝 License

This project is licensed under the MIT License - see the LICENSE.md file for details.
