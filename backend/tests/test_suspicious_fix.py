from engine.suspicious_fix import analyze_patch


def test_clean_patch():
    patch = """
+def get_student(student_id):
+    return STUDENTS.get(student_id)
"""

    checks = analyze_patch(patch)

    assert not any(check.detected for check in checks)


def test_detects_exception_swallowing():
    patch = """
+try:
+    value = get_student(student_id)
+except:
+    pass
"""

    checks = analyze_patch(patch)

    assert any(
        check.name == "Exception swallowing"
        and check.detected
        for check in checks
    )


def test_detects_hardcoded_input():
    patch = """
+if student_id == 999:
+    return None
"""

    checks = analyze_patch(patch)

    assert any(
        check.name == "Hardcoded failing input"
        and check.detected
        for check in checks
    )


def test_detects_test_modification():
    patch = """
-tests/test_student.py
-    assert get_attendance(999) is None
+tests/test_student.py
+    assert True
"""

    checks = analyze_patch(patch)

    assert any(
        check.name == "Test modification"
        and check.detected
        for check in checks
    )