from ai.diff_analyzer import DiffAnalyzer


def test_real_patch_analysis():
    analyzer = DiffAnalyzer()

    patch = """
-    return STUDENTS[student_id]
+    return STUDENTS.get(student_id)
"""

    failure = """
KeyError: 999
student_service.py:10
student_id=999
"""

    result = analyzer.analyze_diff(
        patch=patch,
        original_failure=failure,
    )

    print("\nAI ANALYSIS:\n")
    print(result)

    assert result