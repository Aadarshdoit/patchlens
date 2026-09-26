from engine.signature import parse_traceback


def test_parse_traceback():
    traceback = """Traceback (most recent call last):
  File "C:\\project\\reproduce.py", line 6, in <module>
    print(get_attendance(student_id))
  File "C:\\project\\app\\student_service.py", line 10, in get_student
    return STUDENTS[student_id]
KeyError: 999
"""

    result = parse_traceback(traceback)

    assert result.exception_type == "KeyError"
    assert result.message == "999"
    assert result.location == "student_service.py:10"