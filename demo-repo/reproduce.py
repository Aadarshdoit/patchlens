from app.student_service import get_attendance

student_id = 999

print(f"Checking attendance for student {student_id}")
print(get_attendance(student_id))