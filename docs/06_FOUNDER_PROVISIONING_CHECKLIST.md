# **File: `03_FOUNDER_PROVISIONING_CHECKLIST.md`**

## **Founder's Provisioning Checklist & Credential Store**

### **Purpose**

This document outlines every account, platform, credential, and asset that must be created and securely provisioned to the development team lead *before* the Genesis Sprint begins. Its purpose is to eliminate all potential blockers and empower the team to build with maximum velocity and clarity from Day 1.

### **Security Protocol: The Digital Briefcase**

All credentials listed below (API keys, passwords, service account files) must **NEVER** be shared via insecure channels like email, Slack, or Discord DMs.

1.  **Create a Secure Vault:** Use a dedicated password manager (e.g., 1Password, Bitwarden, LastPass).
2.  **Populate the Vault:** Add every credential and key file to this vault.
3.  **Share Securely:** Share access to this specific vault or folder with the development team lead only. They will be responsible for using these credentials to populate the environment variables (`.env` files) for the development, staging, and production environments.

-----

### **Part 1: Core Platform Accounts**

These are the foundational services for the entire Arboracle ecosystem.

  * **[ ] GitHub Organization & Repository**

      * **Action:** Create a new GitHub Organization (e.g., `Arboracle-Ecosystem`).
      * **Action:** Within the organization, create a new, empty **private** repository named `arboracle-platform`.
      * **Action:** Create a `docs` folder within the repository and upload all the `.md` files from this development kit.
      * **Provision:** Grant "Owner" access to the development lead.

  * **[ ] Firebase Project**

      * **Action:** Go to the [Firebase Console](https://www.google.com/search?q=https.console.firebase.google.com) and create a new project (e.g., `arboracle-prod`).
      * **Action:** Under "Build," enable **Authentication**. Activate the "Email/Password" and "Google" sign-in methods.
      * **Action:** Under "Build," enable **Cloud Storage**.
      * **Provision (Add to Vault):**
          * Your Firebase **Project ID**.
          * The **Web API Key** (found in Project Settings \> General).
          * A **Service Account JSON key file** for the backend (found in Project Settings \> Service accounts \> Generate new private key).

  * **[ ] Cloud Provider Account (Google Cloud Platform Recommended)**

      * **Note:** Given the use of goose and potential use of Clay/LGND, Google Cloud Platform (GCP) is the recommended provider for seamless integration.
      * **Action:** Go to the [Google Cloud Console](https://console.cloud.google.com/) and create a new project, linking it to your Firebase project if possible.
      * **Action:** Set up a **Billing Account**.
      * **Action:** Create a dedicated **IAM Service Account** for Arboracle services.
      * **Provision (Add to Vault):**
          * The **IAM Service Account JSON key file**. This key will grant the backend services permissions to access GCP services like Cloud Run, Cloud Storage, and AI Platform.

  * **[ ] Domain Name**

      * **Action:** Purchase the primary domain for the application (e.g., `arborac.le`, `arboracle.ai`).
      * **Provision (Add to Vault):** Login credentials for the domain registrar (e.g., GoDaddy, Namecheap, Google Domains).

### **Part 2: AI & Knowledge Services**

These services will power the "brains" of the platform.

  * **[ ] Google AI Platform (Vertex AI)**

      * **Action:** Within your GCP project, navigate to the **Vertex AI** section.
      * **Action:** **Enable the Vertex AI API**. This is necessary for the backend to programmatically access goose models.
      * **Provision:** The GCP Project ID is the primary identifier needed here. The IAM key from the previous step will grant access.

  * **[ ] Arboracle Knowledge Base**

      * **Action:** Consolidate all your markdown files, research, PDFs, and other text-based knowledge into a single, well-organized folder structure (your "Obsidian Vault").
      * **Action:** Zip this entire folder.
      * **Provision:** Add the `.zip` file to a secure location (e.g., a private Google Drive folder) and share the link with the development lead. This will be the initial corpus for the RAG pipeline.

### **Part 3: Team Collaboration & Workflow**

These tools will ensure the team communicates and works efficiently.

  * **[ ] Team Communication Channel**

      * **Action:** Set up a dedicated **Slack** or **Discord** server.
      * **Action:** Create relevant channels (`#general`, `#backend`, `#frontend`, `#random`, `#build-log`).
      * **Provision:** Provide an invite link to the entire team.

  * **[ ] Project Management Board**

      * **Action:** Set up a project board in **Trello**, **Jira**, or **Notion**.
      * **Action:** Create columns for `Backlog`, `To Do`, `In Progress`, `In Review`, `Done`.
      * **Action:** Pre-populate the `Backlog` with the high-level features outlined in the MLP Roadmap (`00_MASTER_BLUEPRINT.md`).
      * **Provision:** Provide an invite link to the entire team.

### **Part 4: Development Philosophy & Local Environment**

This ensures the team understands your vision for the development process itself.

  * **[ ] Development Environment Mandate**

      * **Action:** No action is needed other than communicating this philosophy.
      * **Communicate:** "For local development, I want to ensure our environment is as close to production as possible while being easy to manage. I've been exploring tools like **Multipass** to create clean, isolated Ubuntu VMs. The goal is a consistent and reproducible development setup for every team member to avoid 'it works on my machine' issues. The `supergoose` framework we've outlined should be the guiding principle for our AI development workflow."

  * **[ ] The Supergoose Framework**

      * **Action:** Create a file named `SUPERGOOSE_FRAMEWORK.md` and include the full specification from our previous discussion (the core prompt, the Python tool implementation example, and the project structure).
      * **Provision:** Add this file to the `docs` folder in the GitHub repository. This is not a credential, but a critical provisioning step for the AI engineering workflow.
