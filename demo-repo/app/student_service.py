from app.errors import StudentNotFoundError

STUDENTS = {
    101: {"name": "Rahul", "attendance": 92},
    102: {"name": "Priya", "attendance": 88},
}


def get_student(student_id):
    return STUDENTS[student_id]


def get_attendance(student_id):
    student = get_student(student_id)
    return student["attendance"]