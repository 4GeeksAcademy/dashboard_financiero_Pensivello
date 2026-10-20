from datetime import date

from fastapi.testclient import TestClient

from app.main import app
from app.routes import (
    MetricsSummaryItem,
    detect_outcome_alerts,
    filter_movements_by_date,
    generate_mock_movements,
)


client = TestClient(app)


def test_generate_mock_movements_returns_full_year_sorted_data():
    movements = generate_mock_movements(seed=42)

    assert len(movements) == 360
    assert movements == sorted(movements, key=lambda item: item.create_date)


def test_filter_movements_by_date_includes_range_edges():
    movements = generate_mock_movements(seed=42)
    target_date = movements[0].create_date

    filtered = filter_movements_by_date(movements, target_date, target_date)

    assert filtered
    assert all(movement.create_date == target_date for movement in filtered)


def test_health_endpoint_returns_ok():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_metrics_endpoint_respects_date_filters():
    base_response = client.get("/api/metrics")
    assert base_response.status_code == 200
    first_date = base_response.json()[0]["create_date"]

    response = client.get(
        "/api/metrics",
        params={"start_date": first_date, "end_date": first_date},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload
    assert all(item["create_date"] == first_date for item in payload)


def test_b2b_endpoint_only_returns_b2b_records():
    response = client.get("/api/metrics/b2b")

    assert response.status_code == 200
    payload = response.json()
    assert payload
    assert all(item["business_type"] == "B2B" for item in payload)
    assert payload == sorted(payload, key=lambda item: item["create_date"])


def test_b2c_endpoint_only_returns_b2c_records():
    response = client.get("/api/metrics/b2c")

    assert response.status_code == 200
    payload = response.json()
    assert payload
    assert all(item["business_type"] == "B2C" for item in payload)
    assert payload == sorted(payload, key=lambda item: item["create_date"])


def test_metrics_endpoint_filters_by_category():
    response = client.get("/api/metrics", params={"category": "sales"})

    assert response.status_code == 200
    payload = response.json()
    assert payload
    assert all(item["category"] == "sales" for item in payload)


def test_metrics_endpoint_filters_by_operation_type():
    response = client.get("/api/metrics", params={"operation_type": "income"})

    assert response.status_code == 200
    payload = response.json()
    assert payload
    assert all(item["operation_type"] == "income" for item in payload)


def test_b2b_endpoint_combines_new_filters():
    response = client.get(
        "/api/metrics/b2b",
        params={"operation_type": "outcome", "category": "suppliers"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload
    assert all(item["business_type"] == "B2B" for item in payload)
    assert all(item["operation_type"] == "outcome" for item in payload)
    assert all(item["category"] == "suppliers" for item in payload)


def test_metrics_facets_returns_filter_options_and_date_range():
    response = client.get("/api/metrics/facets")

    assert response.status_code == 200
    payload = response.json()
    assert sorted(payload["operation_types"]) == ["income", "outcome"]
    assert payload["business_types"] == ["B2B", "B2C"]
    assert payload["categories"] == [
        "administrative",
        "operational",
        "others",
        "sales",
        "suppliers",
    ]
    assert payload["min_date"] <= payload["max_date"]


def test_metrics_summary_by_month_returns_balances():
    response = client.get("/api/metrics/summary", params={"group_by": "month"})

    assert response.status_code == 200
    payload = response.json()
    assert payload
    first = payload[0]
    assert set(first.keys()) == {"period", "income", "outcome", "net"}
    assert all(item["income"] >= 0 for item in payload)
    assert all(item["outcome"] >= 0 for item in payload)


def test_metrics_summary_by_week_honors_business_type_filter():
    response = client.get(
        "/api/metrics/summary",
        params={"group_by": "week", "business_type": "B2C"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload


def test_top_categories_returns_limited_sorted_categories():
    response = client.get(
        "/api/metrics/categories/top",
        params={"operation_type": "outcome", "limit": 3},
    )

    assert response.status_code == 200
    payload = response.json()
    assert len(payload) == 3
    assert payload[0]["total_amount"] >= payload[1]["total_amount"]
    assert all(item["operation_type"] == "outcome" for item in payload)


def test_metrics_comparison_returns_delta_fields():
    response = client.get(
        "/api/metrics/comparison",
        params={"start_date": "2025-03-01", "end_date": "2025-03-31"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert set(payload.keys()) == {
        "current_period",
        "previous_period",
        "delta_abs",
        "delta_pct",
    }


def test_metrics_alerts_returns_anomaly_candidates():
    response = client.get(
        "/api/metrics/alerts",
        params={"threshold": 0.2, "group_by": "month"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload, list)
    if payload:
        first = payload[0]
        assert set(first.keys()) == {
            "period",
            "outcome_total",
            "baseline_average",
            "increase_ratio",
        }


def test_outcome_alerts_use_only_three_previous_periods():
    summary = [
        MetricsSummaryItem(period=f"2025-{month:02d}", income=0, outcome=value, net=-value)
        for month, value in enumerate([10, 20, 30, 60, 40], start=1)
    ]

    alerts = detect_outcome_alerts(summary, threshold=0.3)

    assert len(alerts) == 1
    assert alerts[0].period == "2025-04"
    assert alerts[0].baseline_average == 20
    assert alerts[0].increase_ratio == 2


def test_metrics_alerts_validate_threshold_range():
    assert client.get("/api/metrics/alerts", params={"threshold": 0.009}).status_code == 422
    assert client.get("/api/metrics/alerts", params={"threshold": 1.01}).status_code == 422


def test_metrics_alerts_respect_selected_date_range():
    movements = generate_mock_movements(seed=42)
    months = sorted({movement.create_date.strftime("%Y-%m") for movement in movements})
    selected_month = months[4]
    selected_movement = next(
        movement
        for movement in movements
        if movement.create_date.strftime("%Y-%m") == selected_month
    )
    selected_date = selected_movement.create_date.isoformat()

    response = client.get(
        "/api/metrics/alerts",
        params={
            "threshold": 0.01,
            "start_date": selected_date,
            "end_date": selected_date,
        },
    )

    assert response.status_code == 200
    assert all(item["period"] == selected_month for item in response.json())


def test_alert_date_range_includes_overlapping_periods():
    full_summary = [
        MetricsSummaryItem(period=f"2025-{month:02d}", income=0, outcome=value, net=-value)
        for month, value in enumerate([10, 20, 30, 60], start=1)
    ]

    # The selected range supplies the month's partial/current total, while the
    # full history keeps the three preceding periods available as the baseline.
    filtered_summary = [
        MetricsSummaryItem(period="2025-04", income=0, outcome=45, net=-45)
    ]
    alerts = detect_outcome_alerts(filtered_summary, 0.3, full_summary)

    assert len(alerts) == 1
    assert alerts[0].period == "2025-04"
    assert alerts[0].outcome_total == 45
    assert alerts[0].baseline_average == 20
    assert alerts[0].increase_ratio == 1.25
