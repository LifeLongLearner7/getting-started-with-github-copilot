import pytest
from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_activities():
    # Work on a shallow copy to avoid cross-test pollution
    original = {
        k: {**v, "participants": list(v.get("participants", []))}
        for k, v in activities.items()
    }
    yield
    # restore
    activities.clear()
    activities.update(original)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "Tennis Club" in data


def test_signup_and_unregister():
    activity = "Tennis Club"
    email = "testuser@example.com"

    # Ensure not already in participants
    resp = client.get("/activities")
    assert resp.status_code == 200
    assert email not in resp.json()[activity]["participants"]

    # Sign up
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    assert resp.json()["message"] == f"Signed up {email} for {activity}"

    # Now participant should be present
    resp = client.get("/activities")
    assert email in resp.json()[activity]["participants"]

    # Unregister
    resp = client.delete(f"/activities/{activity}/participants?email={email}")
    assert resp.status_code == 200
    assert resp.json()["message"] == f"Unregistered {email} from {activity}"

    # Ensure removed
    resp = client.get("/activities")
    assert email not in resp.json()[activity]["participants"]


def test_unregister_missing_participant():
    activity = "Tennis Club"
    email = "nonexistent@example.com"

    resp = client.delete(f"/activities/{activity}/participants?email={email}")
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Participant not found in this activity"


def test_signup_existing():
    activity = "Basketball Team"
    # pick an existing participant from initial data
    existing = activities[activity]["participants"][0]

    resp = client.post(f"/activities/{activity}/signup?email={existing}")
    assert resp.status_code == 400
    assert resp.json()["detail"] == "Student already signed up for this activity"
