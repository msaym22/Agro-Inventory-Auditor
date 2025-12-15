# 📦 Agro-Inventory-Auditor

![Stack](https://img.shields.io/badge/Stack-MERN-blue.svg) ![Feature](https://img.shields.io/badge/Data-Excel_Migration-green.svg) ![Status](https://img.shields.io/badge/Status-Production_Ready-brightgreen.svg)

## 🎯 Business Overview
A full-stack **Supply Chain Asset Management Platform** designed to digitize offline ledgers and streamline inventory verification.
Unlike standard inventory apps, this system features a **Bulk Migration Engine** that allows businesses to onboard thousands of SKUs instantly from legacy Excel files.

## 🚀 Key Engineering Features

### 1. 📊 Legacy Data Migration (Excel Ingestion)
* **Problem:** Most supply chains still rely on offline Excel spreadsheets, making data siloed and hard to track.
* **Solution:** Engineered a stream-based parsing pipeline that accepts raw `.xlsx` or `.csv` files.
* **Impact:** Validates schema, sanitizes inputs, and commits thousands of records to the cloud database in a single batch operation, reducing onboarding time by 90%.

### 2. 🛡️ Real-Time Asset Verification
* **Live Tracking:** Dashboard updates instantly via REST API polling as assets move through the supply chain.
* **Audit Trails:** Maintains digital logs of all manual adjustments and bulk imports for financial accountability.

### 3. ⚡ High-Performance Search
* **Indexing:** Implemented MongoDB indexing strategies to allow sub-second retrieval of specific SKUs even within large datasets.

## 🛠️ Technical Architecture

| Component | Tech Stack | Responsibility |
| :--- | :--- | :--- |
| **Frontend** | React.js / CSS3 | Responsive dashboard for data visualization and file upload interface. |
| **Backend** | Node.js / Express | REST API handling business logic and file parsing streams. |
| **Database** | MongoDB | NoSQL document storage for flexible asset attributes. |
| **ETL Tool** | `xlsx` / Multer | Middleware for parsing and buffer management during file uploads. |

## 📸 Usage Workflow
1.  **Upload:** Admin uploads a standard Inventory Sheet (`.xlsx`).
2.  **Parse:** Server validates data types (Integers vs Strings) and checks for duplicates.
3.  **Commit:** Clean data is bulk-inserted into the `Inventory` collection.
4.  **Visualize:** Dashboard immediately reflects new stock levels.
