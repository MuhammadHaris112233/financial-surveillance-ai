
from pathlib import Path

import streamlit as st
import pandas as pd
import plotly.express as px

# ---------------------------------------
# FINANCIAL SURVEILLANCE AI - PUBLIC DEMO
# ---------------------------------------

st.set_page_config(
    page_title="Financial Surveillance AI | Demo",
    page_icon="🛡️",
    layout="wide",
)

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "demo_data"

st.title("🛡️ Financial Surveillance AI")

st.caption(
    "AI-Powered Transaction Monitoring | "
    "Rule-Based Validation | "
    "Isolation Forest | "
    "Investigation Analytics"
)

st.info(
    "Portfolio demonstration using synthetic financial transactions. "
    "No real customer or banking data is used."
)

st.subheader("Welcome to Financial Surveillance AI")

st.write(
    "This application demonstrates how financial transactions "
    "can be monitored using data validation, machine learning, "
    "hybrid anomaly detection, and investigation analytics."
)

st.success("Public demo application initialized successfully.")



# ---------------------------------------
# OVERVIEW - INDEPENDENT TEST DATA
# ---------------------------------------

@st.cache_data
def load_demo_trades():
    file_path = DATA_DIR / "hybrid_test_results.csv"
    return pd.read_csv(file_path)


test_trades = load_demo_trades()


# ---------------------------------------
# OVERVIEW - INTERACTIVE FILTERS
# ---------------------------------------


# ---------------------------------------
# APPLICATION NAVIGATION
# ---------------------------------------

st.sidebar.title("🛡️ Financial Surveillance AI")

page = st.sidebar.radio(
    "Navigation",
    options=[
        "Overview",
        "Transaction Explorer",
        "Hybrid Detection",
        "Investigation Centre",
        "AI Investigation Reports",
    ],
    index=0,
)

st.sidebar.divider()

overview_container = st.container()

if page != "Overview":
    st.header(page)

    if page == "Transaction Explorer":
        st.write(
            "Explore synthetic financial transactions "
            "from the independent test dataset."
        )

        st.metric("Total Test Transactions", f"{len(test_trades):,}")

        asset_options = sorted(
            test_trades["asset_class"].dropna().unique().tolist()
        )

        selected_assets = st.multiselect(
            "Filter by Asset Class",
            options=asset_options,
            default=asset_options,
        )

        status_options = sorted(
            test_trades["reporting_status"].dropna().unique().tolist()
        )

        selected_statuses = st.multiselect(
            "Filter by Reporting Status",
            options=status_options,
            default=status_options,
        )

        filtered_trades = test_trades[
            test_trades["asset_class"].isin(selected_assets)
            & test_trades["reporting_status"].isin(selected_statuses)
        ].copy()

        st.caption(
            f"Showing {len(filtered_trades):,} matching transactions"
        )

        st.dataframe(
            filtered_trades[
                [
                    "record_id",
                    "trade_id",
                    "asset_class",
                    "counterparty_id",
                    "trade_side",
                    "notional_amount",
                    "currency",
                    "trade_timestamp",
                    "reporting_status",
                ]
            ],
            use_container_width=True,
            hide_index=True,
        )



    elif page == "Hybrid Detection":
        st.write(
            "Rule-based validation and Isolation Forest "
            "anomaly detection on 2,000 synthetic test records."
        )

        rules = test_trades["rule_flag"].fillna(False).astype(bool)
        ml = test_trades["ml_flag"].fillna(False).astype(bool)
        hybrid = test_trades["hybrid_flag"].fillna(False).astype(bool)

        rule_only = int((rules & ~ml).sum())
        ml_only = int((ml & ~rules).sum())
        both = int((rules & ml).sum())

        col1, col2, col3, col4 = st.columns(4)
        col1.metric("Rule Alerts", f"{int(rules.sum()):,}")
        col2.metric("ML Alerts", f"{int(ml.sum()):,}")
        col3.metric("Hybrid Alerts", f"{int(hybrid.sum()):,}")
        col4.metric("Flagged by Both", f"{both:,}")

        st.caption(
            "Anomaly alerts are statistical or rule-based indicators, "
            "not confirmed fraud or regulatory violations."
        )

        left, right = st.columns(2)

        with left:
            st.subheader("ML Anomalies by Asset Class")

            ml_counts = (
                test_trades.loc[ml]
                .groupby("asset_class")
                .size()
                .reset_index(name="Anomalies")
            )

            fig_ml = px.bar(
                ml_counts,
                x="asset_class",
                y="Anomalies",
                color="asset_class",
                title="ML Anomaly Distribution",
            )

            st.plotly_chart(fig_ml, use_container_width=True)

        with right:
            st.subheader("Rule-Based vs ML Detection")

            comparison = pd.DataFrame({
                "Category": [
                    "Rule-Based Only",
                    "ML Only",
                    "Flagged by Both",
                ],
                "Transactions": [rule_only, ml_only, both],
            })

            fig_comparison = px.bar(
                comparison,
                x="Category",
                y="Transactions",
                color="Category",
                title="Detection Method Comparison",
            )

            st.plotly_chart(fig_comparison, use_container_width=True)

        st.subheader("Hybrid Detection Alerts")

        alert_columns = [
            "record_id",
            "trade_id",
            "asset_class",
            "notional_amount",
            "currency",
            "rule_flag",
            "ml_flag",
            "detection_source",
            "anomaly_score",
        ]

        alerts = test_trades.loc[hybrid, alert_columns].copy()

        st.dataframe(
            alerts,
            use_container_width=True,
            hide_index=True,
        )


    elif page == "Investigation Centre":
        st.write(
            "Explore prioritised investigations generated from "
            "synthetic financial transaction surveillance."
        )

        @st.cache_data
        def load_investigations():
            return pd.read_csv(
                DATA_DIR / "prioritized_investigations.csv"
            )

        investigations = load_investigations()

        st.metric(
            "Total Investigations",
            f"{len(investigations):,}"
        )

        priority_options = ["ALL", "HIGH", "MEDIUM", "LOW"]

        selected_priority = st.selectbox(
            "Filter by Risk Priority",
            options=priority_options,
        )

        if selected_priority == "ALL":
            filtered_investigations = investigations.copy()
        else:
            filtered_investigations = investigations[
                investigations["risk_priority"] == selected_priority
            ].copy()

        st.caption(
            f"Showing {len(filtered_investigations):,} investigations"
        )

        st.subheader("Investigation Queue")

        st.dataframe(
            filtered_investigations[
                [
                    "record_id",
                    "trade_id",
                    "asset_class",
                    "detection_source",
                    "risk_score",
                    "risk_priority",
                    "investigation_summary",
                ]
            ],
            use_container_width=True,
            hide_index=True,
        )

    elif page == "AI Investigation Reports":
        st.write(
            "Review three pre-generated AI investigation reports "
            "based on synthetic financial transactions."
        )

        @st.cache_data
        def load_ai_reports():
            file_path = DATA_DIR / "ai_investigation_reports.csv"
            return pd.read_csv(file_path)

        reports = load_ai_reports()

        st.metric("Total AI Reports", f"{len(reports):,}")

        selected_trade = st.selectbox(
            "Select a trade to review",
            options=reports["trade_id"].tolist(),
        )

        selected_report = reports.loc[
            reports["trade_id"] == selected_trade
        ].iloc[0]

        st.subheader("Investigation Details")

        col1, col2 = st.columns(2)

        col1.metric(
            "Risk Score",
            int(selected_report["risk_score"])
        )

        col2.metric(
            "Risk Priority",
            selected_report["risk_priority"]
        )

        st.write("**Trade ID:**", selected_report["trade_id"])
        st.write("**AI Status:**", selected_report["ai_status"])

        st.subheader("AI Investigation Report")
        st.markdown(str(selected_report["ai_report"]))

        st.caption(
            "These are pre-generated AI-assisted reports for "
            "demonstration purposes. They are not confirmed "
            "fraud findings or regulatory decisions."
        )

    else:
        st.info("This section is under development.")

    st.stop()


st.sidebar.header("Transaction Filters")

asset_options = sorted(
    test_trades["asset_class"].dropna().unique().tolist()
)

selected_assets = st.sidebar.multiselect(
    "Asset Class",
    options=asset_options,
    default=asset_options,
)

status_options = sorted(
    test_trades["reporting_status"].dropna().unique().tolist()
)

selected_statuses = st.sidebar.multiselect(
    "Reporting Status",
    options=status_options,
    default=status_options,
)

test_trades = test_trades[
    test_trades["asset_class"].isin(selected_assets)
    & test_trades["reporting_status"].isin(selected_statuses)
].copy()

st.sidebar.caption(
    f"Showing {len(test_trades):,} matching test records."
)


st.divider()
st.subheader("Transaction Monitoring Overview")

total_trades = len(test_trades)
flagged_trades = int(test_trades["rule_flag"].fillna(False).sum())
valid_trades = total_trades - flagged_trades

exception_rate = (
    flagged_trades / total_trades * 100
    if total_trades else 0
)

col1, col2, col3, col4 = st.columns(4)

col1.metric("Test Transactions", f"{total_trades:,}")
col2.metric("Rule-Flagged Records", f"{flagged_trades:,}")
col3.metric("Not Rule-Flagged", f"{valid_trades:,}")
col4.metric("Rule Exception Rate", f"{exception_rate:.2f}%")


# ---------------------------------------
# OVERVIEW - TRANSACTION VISUALIZATIONS
# ---------------------------------------

st.divider()

left, right = st.columns(2)

with left:
    st.subheader("Transactions by Asset Class")

    asset_counts = (
        test_trades["asset_class"]
        .value_counts()
        .rename_axis("Asset Class")
        .reset_index(name="Transactions")
    )

    fig_assets = px.bar(
        asset_counts,
        x="Asset Class",
        y="Transactions",
        color="Asset Class",
        title="Transaction Distribution by Asset Class",
    )

    fig_assets.update_layout(showlegend=False)

    st.plotly_chart(fig_assets, use_container_width=True)

with right:
    st.subheader("Validation Failures")

    validation_rules = {
        "duplicate_trade_id": "Duplicate Trade ID",
        "missing_counterparty": "Missing Counterparty",
        "invalid_notional": "Invalid Notional",
        "invalid_currency": "Invalid Currency",
        "invalid_trade_date": "Invalid Trade Date",
    }

    failure_counts = pd.DataFrame({
        "Validation Rule": list(validation_rules.values()),
        "Flagged Records": [
            int(test_trades[column].fillna(False).sum())
            for column in validation_rules
        ],
    })

    fig_failures = px.bar(
        failure_counts,
        x="Flagged Records",
        y="Validation Rule",
        orientation="h",
        title="Detected Data Quality Issues",
    )

    st.plotly_chart(fig_failures, use_container_width=True)
