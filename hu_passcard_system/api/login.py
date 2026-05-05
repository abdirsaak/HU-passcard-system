# Copyright (c) 2026, abdirsak and contributors
# For license information, please see license.txt

import frappe
from frappe.utils.password import get_decrypted_password


@frappe.whitelist(allow_guest=True)
def student_login(student_id, password):

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
            "whatsapp_number",
            "faculty",
            "department1",
            "student_batch",
            "academic_year",
            "academic_term",
            "fee",
            "discount_percentage",
            "photo",
            "is_active",
            "date_of_birth",
        ],
        as_dict=True,
    )

    # ── 4. Check account is active ────────────────────────────────────────
    if not student.is_active:
        frappe.throw(
            "Your account is inactive. Please contact the university.",
            frappe.AuthenticationError,
        )

    # ── 5. Verify password ────────────────────────────────────────────────
    # For custom doctypes, Frappe encrypts Password fields.
    # get_decrypted_password() retrieves the actual plain text value.
    try:
        stored_password = get_decrypted_password(
            doctype="Student",
            name=student_id,
            fieldname="password",
            raise_exception=False,
        )
    except Exception:
        frappe.throw("Could not verify password. Contact admin.", frappe.AuthenticationError)

    if not stored_password or stored_password.strip() != password.strip():
        frappe.throw("Incorrect password.", frappe.AuthenticationError)

    # ── 6. Return student data ────────────────────────────────────────────
    return {
        "student": {
            "student_id":      student.name,
            "full_name":       student.full_name,
            "email":           student.email,
            "phone_number":    student.phone_number,
            "whatsapp_number": student.whatsapp_number,
            "faculty":         student.faculty,
            "department":      student.department1,
            "batch":           student.student_batch,
            "academic_year":   student.academic_year,
            "academic_term":   student.academic_term,
            "fee":             student.fee,
            "discount":        student.discount_percentage,
            "photo":           student.photo,
            "date_of_birth":   str(student.date_of_birth) if student.date_of_birth else None,
        }
    }