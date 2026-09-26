from app.student_service import get_attendance


def test_existing_student():
    assert get_attendance(101) == 92