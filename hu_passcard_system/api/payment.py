# Copyright (c) 2026, abdirsak and contributors
# hu_passcard_system/api/payment.py

import frappe
import requests
import uuid
from datetime import datetime, date


# ── Waafi / EVC Plus credentials ─────────────────────────────────────────────
WAAFI_API_URL   = "https://api.waafipay.net/asm"
WAAFI_API_KEY   = "API-1221796037AHX"
WAAFI_USER_ID   = "1007359"
WAAFI_MERCHANT  = "M0913615"


# ─────────────────────────────────────────────────────────────────────────────
# HELPER: Get the current active Academic Term for a student
# ─────────────────────────────────────────────────────────────────────────────
def get_active_term(student_id: str):
    """
    Returns the Academic Term doc that is currently active (today is between
    start_date and send_date). Prefers the term linked to the student.
    """
    student = frappe.db.get_value(
        "Student", student_id,
        ["academic_term", "academic_year"],
        as_dict=True
    )

    # Try the term explicitly linked to the student first
    if student.academic_term:
        term = frappe.db.get_value(
            "Academic Term",
            student.academic_term,
            ["name", "term_name", "start_date", "send_date", "academic_year"],
            as_dict=True
        )
        if term:
            return term

    # Fallback: find any active term for the student's academic year
    today = date.today()
    terms = frappe.db.get_all(
        "Academic Term",
        filters={"academic_year": student.academic_year},
        fields=["name", "term_name", "start_date", "send_date", "academic_year"],
    )
    for t in terms:
        if t.start_date and t.send_date:
            if t.start_date <= today <= t.send_date:
                return t

    return None


# ─────────────────────────────────────────────────────────────────────────────
# HELPER: Calculate term phases from Academic Term dates
# ─────────────────────────────────────────────────────────────────────────────
def get_term_phases(term):
    """
    Given an Academic Term with start_date and send_date (6 months):
      - Mid-term period  : day 1  → day 75  (~2.5 months)
      - Mid-term exams   : day 76 → day 89  (2 weeks)
      - Between          : day 90 → day 105
      - Final exams      : day 106 → end
    Returns a dict of phase dates and the current phase name.
    """
    from datetime import timedelta

    start = term.start_date
    end   = term.send_date
    today = date.today()

    mid_term_exam_start = start + timedelta(days=75)
    mid_term_exam_end   = start + timedelta(days=89)
    final_start         = start + timedelta(days=106)
    final_end           = end

    if today < start:
        phase = "before_term"
    elif today <= mid_term_exam_end:
        phase = "mid_term"
    elif today < final_start:
        phase = "between"
    elif today <= final_end:
        phase = "final"
    else:
        phase = "ended"

    return {
        "start":              start,
        "end":                end,
        "mid_term_exam_start": mid_term_exam_start,
        "mid_term_exam_end":   mid_term_exam_end,
        "final_start":         final_start,
        "final_end":           final_end,
        "current_phase":       phase,
    }


# ─────────────────────────────────────────────────────────────────────────────
# HELPER: Waafi EVC Plus payment
# ─────────────────────────────────────────────────────────────────────────────
def call_waafi(phone: str, amount: float, reference_id: str, invoice_id: str, description: str):
    """
    Calls Waafi API_PURCHASE and returns the response dict.
    Raises frappe.ValidationError on failure.
    """
    # Clean phone number
    cleaned = str(phone).strip()
    for prefix in ["+252", "252", "0"]:
        if cleaned.startswith(prefix):
            cleaned = cleaned[len(prefix):]
            break

    if not cleaned.isdigit() or not (7 <= len(cleaned) <= 9):
        frappe.throw("Invalid EVC Plus phone number format.", frappe.ValidationError)

    payload = {
        "schemaVersion": "1.0",
        "requestId":     str(uuid.uuid4()),
        "timestamp":     datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
        "channelName":   "WEB",
        "serviceName":   "API_PURCHASE",
        "serviceParams": {
            "merchantUid":   WAAFI_MERCHANT,
            "apiUserId":     WAAFI_USER_ID,
            "apiKey":        WAAFI_API_KEY,
            "paymentMethod": "MWALLET_ACCOUNT",
            "payerInfo":     {"accountNo": cleaned},
            "transactionInfo": {
                "referenceId": reference_id,
                "invoiceId":   invoice_id,
                "amount":      str(int(amount)),
                "currency":    "USD",
                "description": description,
            },
        },
    }

    try:
        resp = requests.post(WAAFI_API_URL, json=payload,
                             headers={"Content-Type": "application/json"}, timeout=30)
        data = resp.json()
    except Exception as e:
        frappe.throw(f"Payment gateway error: {str(e)}", frappe.ValidationError)

    if data.get("responseCode") != "2001":
        code = data.get("responseCode", "")
        msg  = data.get("responseMsg", "Payment failed.")
        if code == "5001": msg = "Insufficient balance in your EVC Plus account."
        elif code == "5002": msg = "EVC Plus account not found."
        elif code == "5003": msg = "Transaction limit exceeded."
        elif code == "5004": msg = "Account temporarily blocked."
        frappe.throw(msg, frappe.ValidationError)

    params = data.get("params", {})
    return {
        "transaction_id":       params.get("transactionId"),
        "reference_id":         params.get("referenceId"),
        "issuer_transaction_id": params.get("issuerTransactionId"),
        "amount":               params.get("txAmount"),
    }


# ─────────────────────────────────────────────────────────────────────────────
# HELPER: Create Student Passcard after successful payment
# ─────────────────────────────────────────────────────────────────────────────
def create_passcard(student_id, term, payment_name, payment_type, amount, transaction_id, phases):
    from datetime import timedelta

    # Passcard is valid until end of relevant exam period
    if payment_type == "Mid Term":
        valid_until = phases["mid_term_exam_end"]
    else:
        valid_until = phases["final_end"]

    # Invalidate any previous passcards for this student + term
    old_passcards = frappe.db.get_all(
        "Student Passcard",
        filters={"student": student_id, "academic_term": term.name},
        fields=["name"]
    )
    for old in old_passcards:
        frappe.db.set_value("Student Passcard", old.name, "is_valid", 0)

    passcard = frappe.get_doc({
        "doctype":       "Student Passcard",
        "student":       student_id,
        "academic_term": term.name,
        "payment":       payment_name,
        "payment_type":  payment_type,
        "amount_paid":   amount,
        "issue_date":    date.today(),
        "valid_until":   valid_until,
        "is_valid":      1,
        "transaction_id": transaction_id,
    })
    passcard.insert(ignore_permissions=True)
    frappe.db.commit()
    return passcard.name


# ─────────────────────────────────────────────────────────────────────────────
# API 1: Initiate Payment
# ─────────────────────────────────────────────────────────────────────────────
@frappe.whitelist(allow_guest=False)
def initiate_payment(student_id, phone, amount, payment_type):
    """
    POST /api/method/hu_passcard_system.api.payment.initiate_payment
    payment_type: "Mid Term" | "Full Term"
    """
    amount = float(amount)

    # ── Validate student ──────────────────────────────────────────────────
    if not frappe.db.exists("Student", student_id):
        frappe.throw("Student not found.", frappe.ValidationError)

    # ── Get active term ───────────────────────────────────────────────────
    term = get_active_term(student_id)
    if not term:
        frappe.throw("No active academic term found for your account.", frappe.ValidationError)

    phases = get_term_phases(term)

    # ── Payment rules ─────────────────────────────────────────────────────
    phase = phases["current_phase"]

    if payment_type == "Mid Term":
        if phase not in ("mid_term",):
            frappe.throw(
                f"Mid-term payment is only allowed during the mid-term exam period "
                f"({phases['mid_term_exam_start']} – {phases['mid_term_exam_end']}).",
                frappe.ValidationError
            )

    elif payment_type == "Full Term":
        if phase in ("before_term", "ended"):
            frappe.throw("Full term payment is not available at this time.", frappe.ValidationError)
    else:
        frappe.throw("Invalid payment type.", frappe.ValidationError)

    # ── Check duplicate payment ───────────────────────────────────────────
    existing = frappe.db.get_all(
        "Student Payment",
        filters={
            "student":       student_id,
            "academic_term": term.name,
            "status":        "Paid",
        },
        fields=["payment_type", "name"]
    )
    for ex in existing:
        if ex.payment_type == "Full Term":
            frappe.throw("You have already paid the full term fee.", frappe.ValidationError)
        if ex.payment_type == "Mid Term" and payment_type == "Mid Term":
            frappe.throw("You have already paid the mid-term fee.", frappe.ValidationError)

    # ── Create pending payment record ─────────────────────────────────────
    invoice_id   = f"INV-{student_id}-{term.name}-{payment_type[:3].upper()}"
    reference_id = str(uuid.uuid4())[:16]

    payment_doc = frappe.get_doc({
        "doctype":        "Student Payment",
        "student":        student_id,
        "academic_term":  term.name,
        "payment_type":   payment_type,
        "amount":         amount,
        "status":         "Pending",
        "phone_number":   phone,
        "payment_date":   datetime.now(),
    })
    payment_doc.insert(ignore_permissions=True)
    frappe.db.commit()

    # ── Call Waafi ────────────────────────────────────────────────────────
    try:
        waafi = call_waafi(
            phone=phone,
            amount=amount,
            reference_id=reference_id,
            invoice_id=invoice_id,
            description=f"HU Fee – {student_id} – {payment_type} – {term.name}",
        )
    except frappe.ValidationError as e:
        # Mark payment as failed
        frappe.db.set_value("Student Payment", payment_doc.name, "status", "Failed")
        frappe.db.set_value("Student Payment", payment_doc.name, "notes", str(e))
        frappe.db.commit()
        raise

    # ── Mark payment as Paid ──────────────────────────────────────────────
    frappe.db.set_value("Student Payment", payment_doc.name, {
        "status":               "Paid",
        "transaction_id":       waafi["transaction_id"],
        "waafi_reference_id":   waafi["reference_id"],
        "issuer_transaction_id": waafi["issuer_transaction_id"],
    })
    frappe.db.commit()

    # ── Generate Passcard ─────────────────────────────────────────────────
    passcard_name = create_passcard(
        student_id=student_id,
        term=term,
        payment_name=payment_doc.name,
        payment_type=payment_type,
        amount=amount,
        transaction_id=waafi["transaction_id"],
        phases=phases,
    )

    return {
        "status":         "success",
        "message":        f"Payment successful. Passcard {passcard_name} issued.",
        "transaction_id": waafi["transaction_id"],
        "amount":         waafi["amount"],
        "passcard":       passcard_name,
    }


# ─────────────────────────────────────────────────────────────────────────────
# API 2: Get student payments history
# ─────────────────────────────────────────────────────────────────────────────
@frappe.whitelist(allow_guest=False)
def get_student_payments(student_id):
    payments = frappe.db.get_all(
        "Student Payment",
        filters={"student": student_id},
        fields=[
            "name", "payment_type", "amount", "status",
            "payment_date", "transaction_id", "academic_term"
        ],
        order_by="payment_date desc",
    )
    return {"payments": payments}


# ─────────────────────────────────────────────────────────────────────────────
# API 3: Get student passcard
# ─────────────────────────────────────────────────────────────────────────────
@frappe.whitelist(allow_guest=False)
def get_student_passcard(student_id):
    # Get the latest valid passcard
    passcards = frappe.db.get_all(
        "Student Passcard",
        filters={"student": student_id, "is_valid": 1},
        fields=[
            "name", "payment_type", "amount_paid", "issue_date",
            "valid_until", "is_valid", "transaction_id", "academic_term"
        ],
        order_by="issue_date desc",
        limit=1,
    )

    if not passcards:
        return {"passcard": None}

    passcard = passcards[0]

    # Check if passcard is still valid by date
    today = date.today()
    if passcard.valid_until and today > passcard.valid_until:
        frappe.db.set_value("Student Passcard", passcard.name, "is_valid", 0)
        frappe.db.commit()
        return {"passcard": None}

    return {"passcard": passcard}


# ─────────────────────────────────────────────────────────────────────────────
# API 4: Get term info (for frontend display)
# ─────────────────────────────────────────────────────────────────────────────
@frappe.whitelist(allow_guest=False)
def get_term_info(student_id):
    term = get_active_term(student_id)
    if not term:
        return {"term": None}

    phases = get_term_phases(term)

    # Convert dates to strings for JSON
    return {
        "term": {
            "name":               term.name,
            "term_name":          term.term_name,
            "start_date":         str(term.start_date),
            "end_date":           str(term.send_date),
            "mid_term_exam_start": str(phases["mid_term_exam_start"]),
            "mid_term_exam_end":   str(phases["mid_term_exam_end"]),
            "final_start":         str(phases["final_start"]),
            "final_end":           str(phases["final_end"]),
            "current_phase":       phases["current_phase"],
        }
    }