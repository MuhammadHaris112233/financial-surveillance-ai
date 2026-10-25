# 🛡️ Financial Surveillance AI

**Financial Transaction Monitoring | Rule-Based Validation | Machine Learning Anomaly Detection | Investigation Analytics**

An end-to-end financial surveillance portfolio project demonstrating how Python, SQL, machine learning and interactive dashboards can support transaction monitoring, data-quality checks, anomaly detection and investigation prioritisation.

### 🌐 Live Dashboard

### 🚀 Financial Surveillance AI V2 — React + FastAPI

**[Launch the V2 Interactive Dashboard](https://financial-surveillance-ai.vercel.app/)**

A modern financial surveillance dashboard built with React, Vite, and FastAPI, deployed on Vercel.

Features include:
- Financial surveillance overview and interactive charts
- Transaction monitoring and filtering
- Rule-based and machine learning anomaly detection
- Risk-prioritised investigation queues
- AI-assisted investigation reports

The dashboard uses 2,000 synthetic transactions and provides a read-only demonstration without requiring login.

### Original Streamlit Dashboard

**[Launch Financial Surveillance AI](https://financial-surveillance-ai-demo.streamlit.app/)**

Explore the public demonstration directly in your browser. No installation or login is required.

## Project Overview

Financial institutions process large volumes of transactions and need reliable ways to identify incomplete records, unusual transaction patterns and potential reporting exceptions.

Financial Surveillance AI demonstrates a monitoring workflow that combines:

- Rule-based transaction validation
- Isolation Forest machine learning anomaly detection
- Hybrid alert classification
- Risk-based investigation prioritisation
- AI-assisted investigation reporting
- Interactive analytics using Streamlit and Plotly

The public demonstration uses **synthetic financial transaction data only**. It does not contain real customer or banking information.

## Dashboard Features

### 1. Transaction Monitoring Overview

Provides an overview of the synthetic transaction dataset, including transaction counts, rule-based exceptions, reporting statuses and asset-class distributions.

### 2. Transaction Explorer

Enables users to explore and filter transaction records, examine validation results and understand the characteristics of the test dataset.

### 3. Hybrid Detection

Combines rule-based validation with machine learning anomaly detection to identify transactions flagged by either method or both methods.

**Demonstration results:**

| Metric | Result |
|---|---:|
| Synthetic test transactions | 2,000 |
| Rule-based alerts | 120 |
| Machine learning alerts | 81 |
| Flagged by both methods | 49 |
| Total unique hybrid alerts | 152 |

These alerts indicate data-quality exceptions or statistical anomalies. They are not confirmed cases of fraud or regulatory misconduct.

### 4. Investigation Centre

Presents a prioritised investigation queue with risk scores, risk categories, detection sources and investigation summaries.

Analysts can filter investigations by risk priority and review transactions requiring further examination.

### 5. AI Investigation Reports

Displays three pre-generated AI-assisted investigation reports.

Each report includes:

- Investigation summary
- Observed issues
- Recommended analyst checks
- Missing evidence
- Investigation conclusion

The public dashboard displays saved reports and does not require a live AI API connection.

## Technology Stack

| Technology | Purpose |
|---|---|
| Python | Data processing and analytical workflows |
| Pandas and NumPy | Data preparation and analysis |
| Scikit-learn | Isolation Forest anomaly detection |
| SQL / MySQL | Database functionality in the local development project |
| Streamlit | Interactive dashboard development |
| Plotly | Data visualisation |
| AI-assisted reporting | Investigation narrative generation in the development workflow |
| Git and GitHub | Version control and project publishing |
| Streamlit Community Cloud | Public dashboard hosting |

## Project Methodology

**Synthetic Transaction Data → Rule-Based Validation → Machine Learning Detection → Hybrid Alerts → Risk Prioritisation → Investigation Reports → Dashboard**

The development workflow includes transaction validation, anomaly modelling, investigation analysis and testing.

The publicly hosted version is a standalone, read-only demonstration built from prepared synthetic outputs. It does not connect to the local MySQL database or generate live AI reports.

## Running the Public Demo Locally

Clone the repository:

```bash
git clone -b public-demo https://github.com/MuhammadHaris112233/financial-surveillance-ai.git
cd financial-surveillance-ai
```

Install the required packages:

```bash
pip install -r requirements.txt
```

Start the dashboard:

```bash
streamlit run demo_app.py
```

## Testing and Development

The broader local development project includes automated testing of transaction validation, anomaly detection, case management and related analytical components.

The public demonstration is intentionally separated from database credentials, private configuration and other local development dependencies.

## Limitations and Responsible Use

- All transaction records are synthetic.
- The public dashboard uses prepared analytical results.
- AI investigation reports are pre-generated examples.
- Statistical anomalies do not establish fraud.
- Risk scores and investigation priorities are illustrative, not validated regulatory decisions.
- Human investigation and additional evidence would be required before making operational or compliance decisions.

## Project Purpose

This project was developed to demonstrate practical skills relevant to:

**Data Analytics | Financial Services | Regulatory Reporting | Business Intelligence | Risk Analytics | Python Development**

It brings together analytical programming, machine learning, business-rule validation and dashboard design in a financial-services use case.

---

**Live application:** https://financial-surveillance-ai-demo.streamlit.app/

**GitHub repository:** https://github.com/MuhammadHaris112233/financial-surveillance-ai
