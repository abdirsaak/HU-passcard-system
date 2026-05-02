# Copyright (c) 2026, abdirsak and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils.password import check_password


class Student(Document):
    pass


@frappe.whitelist(allow_guest=True)
def student_login(student_id, password):
    """
    Student Login API
    Endpoint: /api/method/your_app.hu_passcard_system.doctype.student.student.student_login

    Params:
        student_id  — e.g. "HU-00001"
        password    — plain text password entered by student

    Returns:
        success + student info, or error message
    """

    # ── 1. Validate inputs ────────────────────────────────────────────────
    if not student_id or not password:
        frappe.throw("Student ID and Password are required.", frappe.AuthenticationError)

    # ── 2. Check student exists ───────────────────────────────────────────
    if not frappe.db.exists("Student", student_id):
        frappe.throw("Student not found.", frappe.AuthenticationError)

    # ── 3. Fetch student record ───────────────────────────────────────────
    student = frappe.db.get_value(
        "Student",
        student_id,
        [
            "name",
            "full_name",
            "email",
            "phone_number",
            "faculty",
            "department1",
            "current_semester",
            "student_class",
            "academic_year",
            "fee",
            "discount_percentage",
            "photo",
            "is_active",
            "password"
        ],
        as_dict=True
    )

    # ── 4. Check account is active ────────────────────────────────────────
    if not student.is_active:
        frappe.throw("Your account is inactive. Please contact the university.", frappe.AuthenticationError)

    # ── 5. Verify password (stored as plain in Password field) ────────────
    stored_password = frappe.db.get_value("Student", student_id, "password")

    if stored_password != password:
        frappe.throw("Incorrect password.", frappe.AuthenticationError)

    # ── 6. Return student data ────────────────────────────────────────────
    return {
        "success": True,
        "message": "Login successful",
        "student": {
            "student_id":        student.name,
            "full_name":         student.full_name,
            "email":             student.email,
            "phone_number":      student.phone_number,
            "faculty":           student.faculty,
            "department":        student.department1,
            "current_semester":  student.current_semester,
            "batch":             student.student_class,
            "academic_year":     student.academic_year,
            "fee":               student.fee,
            "discount":          student.discount_percentage,
            "photo":             student.photo,
        }
    }