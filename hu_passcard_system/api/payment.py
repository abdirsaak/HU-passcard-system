

# # Copyright (c) 2026, abdirsak and contributors
# import frappe
# import requests
# import uuid
# from datetime import datetime, date, timedelta

# WAAFI_API_URL  = "https://api.waafipay.net/asm"
# WAAFI_API_KEY  = "API-1221796037AHX"
# WAAFI_USER_ID  = "1007359"
# WAAFI_MERCHANT = "M0913615"

# # ─────────────────────────────────────────────────────────────────────────────
# # HELPER: Get Active Term from Semester History Table
# # ─────────────────────────────────────────────────────────────────────────────
# def get_active_term(student_id: str):
#     student_doc = frappe.get_doc("Student", student_id)
#     active_term_name = None
    
#     # 1. Loop through the semester_history child table for the "active" row
#     for row in student_doc.semester_history:
#         if row.status == "active":
#             active_term_name = row.academic_term
#             break
            
#     # 2. Fallback to main academic_term if no active history is found
#     if not active_term_name:
#         active_term_name = student_doc.academic_term

#     if active_term_name:
#         return frappe.db.get_value(
#             "Academic Term", 
#             active_term_name, 
#             ["name", "term_name", "start_date", "send_date", "academic_year"], 
#             as_dict=True
#         )
#     return None

# # ─────────────────────────────────────────────────────────────────────────────
# # HELPER: Generate Months List correctly
# # ─────────────────────────────────────────────────────────────────────────────
# def get_months_list(start, end):
#     months = []
#     if not start or not end: return months
    
#     # Ensure start and end are actual date objects, not strings
#     if isinstance(start, str): start = datetime.strptime(start, "%Y-%m-%d").date()
#     if isinstance(end, str): end = datetime.strptime(end, "%Y-%m-%d").date()
    
#     curr = start.replace(day=1)
#     while curr <= end:
#         months.append({
#             "label": curr.strftime("%B %Y"),
#             "value": curr.strftime("%Y-%m")
#         })
#         # Move to next month safely
#         if curr.month == 12:
#             curr = curr.replace(year=curr.year + 1, month=1)
#         else:
#             curr = curr.replace(month=curr.month + 1)
#     return months

# # ─────────────────────────────────────────────────────────────────────────────
# # API 1: Get Term Info (Provides the months list to the frontend)
# # ─────────────────────────────────────────────────────────────────────────────
# @frappe.whitelist(allow_guest=True)
# def get_term_info(student_id):
#     term = get_active_term(student_id)
#     if not term: return {"term": None}

#     # Generate months using the start and end dates from the active term
#     months = get_months_list(term.start_date, term.send_date)

#     return {
#         "term": {
#             "name": term.name, 
#             "term_name": term.term_name,
#             "academic_year": str(term.academic_year) if term.academic_year else "",
#             "start_date": str(term.start_date), 
#             "end_date": str(term.send_date),
#             "months": months  # This list MUST be present for the Installment UI to work
#         }
#     }

# # ─────────────────────────────────────────────────────────────────────────────
# # HELPER: Waafi EVC Plus Payment
# # ─────────────────────────────────────────────────────────────────────────────
# def call_waafi(phone, amount, reference_id, invoice_id, description):
#     cleaned = str(phone).strip()
#     for prefix in ["+252", "252", "0"]:
#         if cleaned.startswith(prefix):
#             cleaned = cleaned[len(prefix):]
#             break

#     if not cleaned.isdigit() or not (7 <= len(cleaned) <= 9):
#         frappe.throw("Invalid EVC Plus phone number.", frappe.ValidationError)

#     payload = {
#         "schemaVersion": "1.0",
#         "requestId":     str(uuid.uuid4()),
#         "timestamp":     datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
#         "channelName":   "WEB",
#         "serviceName":   "API_PURCHASE",
#         "serviceParams": {
#             "merchantUid":   WAAFI_MERCHANT,
#             "apiUserId":     WAAFI_USER_ID,
#             "apiKey":        WAAFI_API_KEY,
#             "paymentMethod": "MWALLET_ACCOUNT",
#             "payerInfo":     {"accountNo": cleaned},
#             "transactionInfo": {
#                 "referenceId": reference_id, "invoiceId": invoice_id,
#                 "amount": str(amount), "currency": "USD",
#                 # "amount": str(round(float(amount), 2)), "currency": "USD",
#                 "description": description,
#             },
#         },
#     }

#     try:
#         resp = requests.post(WAAFI_API_URL, json=payload, headers={"Content-Type": "application/json"}, timeout=30)
#         data = resp.json()
#     except Exception as e:
#         frappe.throw(f"Payment gateway error: {str(e)}", frappe.ValidationError)

#     if data.get("responseCode") != "2001":
#         error_map = {"5001": "Insufficient balance.", "5002": "Account not found.", "5003": "Limit exceeded.", "5004": "Blocked."}
#         frappe.throw(error_map.get(data.get("responseCode", ""), data.get("responseMsg", "Failed.")), frappe.ValidationError)

#     return {
#         "transaction_id": data.get("params", {}).get("transactionId"),
#         "reference_id": data.get("params", {}).get("referenceId"),
#         "issuer_transaction_id": data.get("params", {}).get("issuerTransactionId"),
#         "amount": data.get("params", {}).get("txAmount"),
#     }

# # ─────────────────────────────────────────────────────────────────────────────
# # HELPER: Issue Passcard
# # ─────────────────────────────────────────────────────────────────────────────
# def create_passcard(student_id, term, payment_name, payment_type, amount, transaction_id, target_month=None):
#     valid_until = term.send_date
        
#     old_passcards = frappe.db.get_all("Student Passcard", filters={"student": student_id, "academic_term": term.name, "is_valid": 1}, fields=["name"])
#     for old in old_passcards:
#         frappe.db.set_value("Student Passcard", old.name, "is_valid", 0)

#     db_payment_type = "FInal" if payment_type == "Final" else payment_type

#     passcard = frappe.get_doc({
#         "doctype": "Student Passcard", 
#         "student": student_id, 
#         "academic_term": term.name,
#         "payment": payment_name, 
#         "payment_type": db_payment_type, 
#         "amount_paid": amount,
#         "issue_date": date.today(), 
#         "valid_until": valid_until, 
#         "is_valid": 1, 
#         "transaction_id": transaction_id,
#     })
#     passcard.insert(ignore_permissions=True)
#     frappe.db.commit()
#     return passcard.name

# # ─────────────────────────────────────────────────────────────────────────────
# # API 2: Initiate Payment
# # ─────────────────────────────────────────────────────────────────────────────
# @frappe.whitelist(allow_guest=True)
# def initiate_payment(student_id, phone, amount, payment_type, target_month=None):
#     amount = float(amount)
#     if payment_type not in ("Mid term", "Final", "Month"):
#         frappe.throw('Invalid payment type.')

#     term = get_active_term(student_id)
#     if not term: frappe.throw("No active academic term found.")

#     student_data = frappe.db.get_value("Student", student_id, ["fee", "discount_percentage"], as_dict=True)
#     final_fee = round(float(student_data.fee or 0) * (1 - float(student_data.discount_percentage or 0) / 100), 2)
    
#     months = get_months_list(term.start_date, term.send_date)
#     total_months_in_semester = len(months)
#     half_months = total_months_in_semester / 2.0

#     existing = frappe.db.get_all("Student Payment", filters={"student": student_id, "academic_term": term.name, "status": "Paid"}, fields=["payment_type", "notes"])
#     paid_types = [ex.payment_type for ex in existing]
#     paid_monthly_count = len([ex for ex in existing if ex.payment_type == "Month" and ex.notes])

#     if payment_type == "Final" and ("Final" in paid_types or paid_monthly_count >= total_months_in_semester):
#         frappe.throw("Final fee already paid.")
#     if payment_type == "Mid term" and ("Mid term" in paid_types or "Final" in paid_types or paid_monthly_count >= half_months):
#         frappe.throw("Mid-term already covered.")

#     # Call Waafi First!
#     ref_id = str(uuid.uuid4())[:16]
#     invoice_id = f"INV-{student_id}-{term.name}-{payment_type[:3].upper()}-{ref_id[:4]}"
#     try:
#         waafi = call_waafi(phone=phone, amount=amount, reference_id=ref_id, invoice_id=invoice_id, description=f"HU – {payment_type}")
#     except Exception as e:
#         raise frappe.ValidationError(str(e))

#     # Save to DB on Success
#     payment_doc = frappe.get_doc({
#         "doctype": "Student Payment", 
#         "student": student_id, "academic_term": term.name,
#         "payment_type": payment_type, "amount": amount, "status": "Paid", 
#         "phone_number": phone, "payment_date": datetime.now(),
#         "notes": target_month if payment_type == "Month" else "",
#         "transaction_id": waafi.get("transaction_id"),
#         "waafi_reference_id": waafi.get("reference_id"), 
#         "issuer_transaction_id": waafi.get("issuer_transaction_id")
#     })
#     payment_doc.insert(ignore_permissions=True)
#     frappe.db.commit()

#     # Passcard Logic
#     passcard_name = None
#     if payment_type == "Month" and (paid_monthly_count + 1) >= half_months:
#         passcard_name = create_passcard(student_id, term, payment_doc.name, payment_type, amount, waafi.get("transaction_id"), target_month)
#     elif payment_type in ("Mid term", "Final"):
#         passcard_name = create_passcard(student_id, term, payment_doc.name, payment_type, amount, waafi.get("transaction_id"), target_month)

#     return {"status": "success", "transaction_id": waafi.get("transaction_id"), "amount": waafi.get("amount", amount), "passcard": passcard_name}

# # ─────────────────────────────────────────────────────────────────────────────
# # Get Histories
# # ─────────────────────────────────────────────────────────────────────────────
# @frappe.whitelist(allow_guest=True)
# def get_student_payments(student_id):
#     return {"payments": frappe.db.get_all("Student Payment", filters={"student": student_id, "status": "Paid"}, fields=["*"], order_by="payment_date desc")}

# @frappe.whitelist(allow_guest=True)
# def get_student_passcard(student_id):
#     term = get_active_term(student_id)
#     if not term: return {"passcard": None}
#     passcards = frappe.db.get_all("Student Passcard", filters={"student": student_id, "academic_term": term.name}, fields=["*"], order_by="issue_date desc", limit=1)
#     return {"passcard": passcards[0] if passcards else None}

# @frappe.whitelist(allow_guest=True)
# def get_all_student_passcards(student_id):
#     return {"passcards": frappe.db.get_all("Student Passcard", filters={"student": student_id}, fields=["*"], order_by="issue_date desc")}



# Copyright (c) 2026, abdirsak and contributors
# hu_passcard_system/api/payment.py

import frappe
import requests
import uuid
from datetime import datetime, date, timedelta

WAAFI_API_URL  = "https://api.waafipay.net/asm"
WAAFI_API_KEY  = "API-1221796037AHX"
WAAFI_USER_ID  = "1007359"
WAAFI_MERCHANT = "M0913615"

# ─────────────────────────────────────────────────────────────────────────────
# HELPER: Get Active Term from Semester History Table
# ─────────────────────────────────────────────────────────────────────────────
def get_active_term(student_id: str):
    student_doc = frappe.get_doc("Student", student_id)
    active_term_name = None

    for row in student_doc.semester_history:
        if row.status == "active":
            active_term_name = row.academic_term
            break

    if not active_term_name:
        active_term_name = student_doc.academic_term

    if active_term_name:
        return frappe.db.get_value(
            "Academic Term",
            active_term_name,
            ["name", "term_name", "start_date", "send_date", "academic_year"],
            as_dict=True
        )
    return None

# ─────────────────────────────────────────────────────────────────────────────
# HELPER: Generate Months List
# ─────────────────────────────────────────────────────────────────────────────
def get_months_list(start, end):
    months = []
    if not start or not end:
        return months
    if isinstance(start, str):
        start = datetime.strptime(start, "%Y-%m-%d").date()
    if isinstance(end, str):
        end = datetime.strptime(end, "%Y-%m-%d").date()

    curr = start.replace(day=1)
    while curr <= end:
        months.append({
            "label": curr.strftime("%B %Y"),
            "value": curr.strftime("%Y-%m")
        })
        if curr.month == 12:
            curr = curr.replace(year=curr.year + 1, month=1)
        else:
            curr = curr.replace(month=curr.month + 1)
    return months

# ─────────────────────────────────────────────────────────────────────────────
# HELPER: Calculate the fee breakdown and payment status
#
# Rules:
#   semester_fee = student.fee after discount
#   mid_term_fee = semester_fee / 2          (covers first half of months)
#   final_fee    = semester_fee              (covers entire semester)
#   monthly_fee  = semester_fee / total_months
#
# Cross-update logic:
#   - Paying Mid term  → covers months 1..half_months; final_remaining -= mid_term_fee
#   - Paying Final     → covers everything; remaining = 0
#   - Paying N months  → mid_term_remaining -= N*monthly_fee (floor to 0)
#                        final_remaining    -= N*monthly_fee (floor to 0)
# ─────────────────────────────────────────────────────────────────────────────
def get_fee_status(student_id, term):
    """
    Returns a dict with:
      - semester_fee, mid_term_fee, final_fee, monthly_fee
      - total_months, half_months
      - paid_months_list      : list of month values already paid (via Month type)
      - mid_covered_by_months : True if paid months >= half_months
      - mid_explicit_paid     : True if a "Mid term" payment exists
      - final_explicit_paid   : True if a "Final" payment exists
      - mid_term_paid_amount  : total paid toward mid-term
      - final_paid_amount     : total paid toward final
      - mid_term_remaining    : how much is still owed for mid-term
      - final_remaining       : how much is still owed for final (after mid credit)
      - months                : list of {label, value} for the semester
      - months_covered_by_mid : list of month values covered by a Mid term payment
    """
    student_data = frappe.db.get_value(
        "Student", student_id,
        ["fee", "discount_percentage"],
        as_dict=True
    )
    semester_fee = float(student_data.fee or 0)
    discount = float(student_data.discount_percentage or 0)
    final_fee = round(semester_fee * (1 - discount / 100), 4)
    mid_term_fee = round(final_fee / 2, 4)

    months = get_months_list(term.start_date, term.send_date)
    total_months = len(months) or 1
    # half_months: how many months the mid-term payment covers (ceiling so it always
    # reaches or slightly exceeds the mid-term fee rather than leaving a gap)
    half_months = -(-total_months // 2)   # ceiling division without math.ceil

    # Monthly fee = semester fee / total months, rounded to 4 decimal places.
    # Every month pays the same amount — no special "last month remainder" logic,
    # which was the source of the $0.02 bug.  The tiny rounding difference (a few
    # cents at most) is absorbed by final_remaining using real DB totals.
    monthly_fee = round(final_fee / total_months, 4)

    existing = frappe.db.get_all(
        "Student Payment",
        filters={"student": student_id, "academic_term": term.name, "status": "Paid"},
        fields=["payment_type", "amount", "notes"]
    )

    mid_explicit_paid = any(e.payment_type == "Mid term" for e in existing)
    final_explicit_paid = any(e.payment_type == "Final" for e in existing)

    paid_months_list = [e.notes for e in existing if e.payment_type == "Month" and e.notes]
    paid_month_count = len(paid_months_list)

    # Months covered if a "Mid term" payment was made = first half_months months
    months_covered_by_mid = [m["value"] for m in months[:half_months]] if mid_explicit_paid else []

    # All covered months (union of explicit mid coverage + individually paid months)
    all_covered_months = list(set(months_covered_by_mid + paid_months_list))

    mid_covered_by_months = paid_month_count >= half_months

    # ── Total money actually paid (from real DB amounts, avoids float drift) ─
    total_actually_paid = round(sum(float(e.amount or 0) for e in existing), 4)

    # ── Amount paid toward mid-term ──────────────────────────────────────────
    if mid_explicit_paid or final_explicit_paid:
        mid_term_paid_amount = mid_term_fee
    else:
        # Monthly payments credit toward mid-term until it is covered
        mid_term_paid_amount = min(round(paid_month_count * monthly_fee, 4), mid_term_fee)

    mid_term_remaining = max(round(mid_term_fee - mid_term_paid_amount, 4), 0)

    # ── Amount remaining for final ───────────────────────────────────────────
    # Use actual paid amounts from DB so floating-point drift never leaves a
    # phantom balance (e.g. $0.002 when the student has really paid in full).
    if final_explicit_paid:
        final_remaining = 0.0
    else:
        raw_remaining = round(final_fee - total_actually_paid, 4)
        # If the student has paid >= final_fee (e.g. due to rounding on last
        # month), treat as fully paid rather than showing a negative balance.
        final_remaining = max(raw_remaining, 0.0)

    return {
        "semester_fee": semester_fee,
        "mid_term_fee": mid_term_fee,
        "final_fee": final_fee,
        "monthly_fee": monthly_fee,
        "total_months": total_months,
        "half_months": half_months,
        "months": months,
        "paid_months_list": paid_months_list,
        "all_covered_months": all_covered_months,
        "months_covered_by_mid": months_covered_by_mid,
        "mid_covered_by_months": mid_covered_by_months,
        "mid_explicit_paid": mid_explicit_paid,
        "final_explicit_paid": final_explicit_paid,
        "mid_term_paid_amount": mid_term_paid_amount,
        "mid_term_remaining": mid_term_remaining,
        "total_actually_paid": total_actually_paid,
        "final_remaining": final_remaining,
    }

# ─────────────────────────────────────────────────────────────────────────────
# HELPER: Waafi EVC Plus Payment
# ─────────────────────────────────────────────────────────────────────────────
def call_waafi(phone, amount, reference_id, invoice_id, description):
    cleaned = str(phone).strip()
    for prefix in ["+252", "252", "0"]:
        if cleaned.startswith(prefix):
            cleaned = cleaned[len(prefix):]
            break

    if not cleaned.isdigit() or not (7 <= len(cleaned) <= 9):
        frappe.throw("Invalid EVC Plus phone number.", frappe.ValidationError)

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
                "amount":      str(amount),
                "currency":    "USD",
                "description": description,
            },
        },
    }

    try:
        resp = requests.post(
            WAAFI_API_URL, json=payload,
            headers={"Content-Type": "application/json"}, timeout=30
        )
        data = resp.json()
    except Exception as e:
        frappe.throw(f"Payment gateway error: {str(e)}", frappe.ValidationError)

    if data.get("responseCode") != "2001":
        error_map = {
            "5001": "Insufficient balance.",
            "5002": "Account not found.",
            "5003": "Limit exceeded.",
            "5004": "Account blocked."
        }
        frappe.throw(
            error_map.get(data.get("responseCode", ""), data.get("responseMsg", "Payment failed.")),
            frappe.ValidationError
        )

    return {
        "transaction_id":        data.get("params", {}).get("transactionId"),
        "reference_id":          data.get("params", {}).get("referenceId"),
        "issuer_transaction_id": data.get("params", {}).get("issuerTransactionId"),
        "amount":                data.get("params", {}).get("txAmount"),
    }

# ─────────────────────────────────────────────────────────────────────────────
# HELPER: Issue Passcard
# ─────────────────────────────────────────────────────────────────────────────
def create_passcard(student_id, term, payment_name, payment_type, amount, transaction_id, target_month=None):
    valid_until = term.send_date

    old_passcards = frappe.db.get_all(
        "Student Passcard",
        filters={"student": student_id, "academic_term": term.name, "is_valid": 1},
        fields=["name"]
    )
    for old in old_passcards:
        frappe.db.set_value("Student Passcard", old.name, "is_valid", 0)

    db_payment_type = "FInal" if payment_type == "Final" else payment_type

    passcard = frappe.get_doc({
        "doctype":        "Student Passcard",
        "student":        student_id,
        "academic_term":  term.name,
        "payment":        payment_name,
        "payment_type":   db_payment_type,
        "amount_paid":    amount,
        "issue_date":     date.today(),
        "valid_until":    valid_until,
        "is_valid":       1,
        "transaction_id": transaction_id,
    })
    passcard.insert(ignore_permissions=True)
    frappe.db.commit()
    return passcard.name

# ─────────────────────────────────────────────────────────────────────────────
# API 1: Get Term Info (also returns fee breakdown & payment status)
# ─────────────────────────────────────────────────────────────────────────────
@frappe.whitelist(allow_guest=True)
def get_term_info(student_id):
    term = get_active_term(student_id)
    if not term:
        return {"term": None}

    fee_status = get_fee_status(student_id, term)

    return {
        "term": {
            "name":         term.name,
            "term_name":    term.term_name,
            "academic_year": str(term.academic_year) if term.academic_year else "",
            "start_date":   str(term.start_date),
            "end_date":     str(term.send_date),
            "months":       fee_status["months"],
        },
        # Fee breakdown for the frontend to use directly
        "fee_status": {
            "semester_fee":       fee_status["semester_fee"],
            "mid_term_fee":       fee_status["mid_term_fee"],
            "final_fee":          fee_status["final_fee"],
            "monthly_fee":        fee_status["monthly_fee"],
            "total_months":       fee_status["total_months"],
            "half_months":        fee_status["half_months"],
            # Remaining amounts (dynamically reduced by cross-payments)
            "mid_term_remaining": fee_status["mid_term_remaining"],
            "final_remaining":    fee_status["final_remaining"],
            # Payment status flags
            "mid_term_paid":      fee_status["mid_explicit_paid"] or fee_status["mid_covered_by_months"],
            "final_paid":         fee_status["final_explicit_paid"] or fee_status["final_remaining"] == 0,
            "mid_explicit_paid":  fee_status["mid_explicit_paid"],
            "final_explicit_paid": fee_status["final_explicit_paid"],
            # Month coverage
            "paid_months_list":        fee_status["paid_months_list"],
            "all_covered_months":      fee_status["all_covered_months"],
            "months_covered_by_mid":   fee_status["months_covered_by_mid"],
        }
    }

# ─────────────────────────────────────────────────────────────────────────────
# API 2: Initiate Payment
#
# Cross-update rules enforced here:
#   - "Mid term"  → amount must equal mid_term_remaining (or mid_term_fee if first time)
#   - "Final"     → amount must equal final_remaining
#   - "Month"     → amount = monthly_fee (last month gets remainder)
#                   month must be next in sequence (not already covered by mid or paid)
# ─────────────────────────────────────────────────────────────────────────────
@frappe.whitelist(allow_guest=True)
def initiate_payment(student_id, phone, amount, payment_type, target_month=None):
    amount = float(amount)

    if payment_type not in ("Mid term", "Final", "Month"):
        frappe.throw('Invalid payment type.', frappe.ValidationError)

    term = get_active_term(student_id)
    if not term:
        frappe.throw("No active academic term found.", frappe.ValidationError)

    fs = get_fee_status(student_id, term)

    # ── Guard: already fully paid ────────────────────────────────────────────
    # Catches: explicit Final payment, OR months/mid combo that totals >= final_fee
    if fs["final_explicit_paid"] or fs["final_remaining"] == 0:
        frappe.throw("You have already paid the full semester fee.", frappe.ValidationError)

    # ── Payment-type-specific validation ────────────────────────────────────
    if payment_type == "Mid term":
        if fs["mid_explicit_paid"]:
            frappe.throw("Mid-term fee is already paid.", frappe.ValidationError)
        if fs["mid_covered_by_months"]:
            frappe.throw(
                "Your monthly installments already cover the mid-term. "
                "You can proceed to pay the remaining Final balance.",
                frappe.ValidationError
            )
        expected = fs["mid_term_remaining"]
        if abs(amount - expected) > 0.05:
            frappe.throw(f"Amount mismatch. Expected ${expected} for Mid term.", frappe.ValidationError)

    elif payment_type == "Final":
        expected = fs["final_remaining"]
        if expected <= 0:
            frappe.throw("Final fee is already fully paid.", frappe.ValidationError)
        if abs(amount - expected) > 0.05:
            frappe.throw(f"Amount mismatch. Expected ${expected} for Final.", frappe.ValidationError)

    elif payment_type == "Month":
        if not target_month:
            frappe.throw("Please select a month to pay.", frappe.ValidationError)

        # A month is payable only if it is not already covered (by mid term or prior month payment)
        if target_month in fs["all_covered_months"]:
            frappe.throw("This month is already covered.", frappe.ValidationError)

        # Enforce sequential payment among uncovered months
        uncovered = [m["value"] for m in fs["months"] if m["value"] not in fs["all_covered_months"]]
        if not uncovered:
            frappe.throw("All months are already covered.", frappe.ValidationError)
        if target_month != uncovered[0]:
            frappe.throw(
                f"Sequence error. Please pay for {uncovered[0]} first.",
                frappe.ValidationError
            )

        # Every month pays the same monthly_fee.
        # final_remaining (computed from real DB totals) handles any tiny rounding gap.
        expected = fs["monthly_fee"]

        if abs(amount - expected) > 0.05:
            frappe.throw(f"Amount mismatch. Expected ${expected} for this month.", frappe.ValidationError)

    # ── Call Waafi ───────────────────────────────────────────────────────────
    ref_id     = str(uuid.uuid4())[:16]
    invoice_id = f"INV-{student_id}-{term.name}-{payment_type[:3].upper()}-{ref_id[:4]}"

    try:
        waafi = call_waafi(
            phone=phone, amount=amount,
            reference_id=ref_id, invoice_id=invoice_id,
            description=f"HU – {payment_type}"
        )
    except Exception as e:
        raise frappe.ValidationError(str(e))

    # ── Save payment record ──────────────────────────────────────────────────
    payment_doc = frappe.get_doc({
        "doctype":               "Student Payment",
        "student":               student_id,
        "academic_term":         term.name,
        "payment_type":          payment_type,
        "amount":                amount,
        "status":                "Paid",
        "phone_number":          phone,
        "payment_date":          datetime.now(),
        "notes":                 target_month if payment_type == "Month" else "",
        "transaction_id":        waafi.get("transaction_id"),
        "waafi_reference_id":    waafi.get("reference_id"),
        "issuer_transaction_id": waafi.get("issuer_transaction_id"),
    })
    payment_doc.insert(ignore_permissions=True)
    frappe.db.commit()

    # ── Re-evaluate fee status after saving ──────────────────────────────────
    fs_after = get_fee_status(student_id, term)

    # ── Passcard issuance rule ───────────────────────────────────────────────
    # Issue passcard if:
    #   - Mid term paid  → covers first half (mid-term exam access)
    #   - Final paid     → covers full semester
    #   - Monthly: enough paid to cover first half
    passcard_name = None

    if payment_type == "Mid term":
        passcard_name = create_passcard(
            student_id, term, payment_doc.name,
            payment_type, amount, waafi.get("transaction_id")
        )
    elif payment_type == "Final":
        passcard_name = create_passcard(
            student_id, term, payment_doc.name,
            payment_type, amount, waafi.get("transaction_id")
        )
    elif payment_type == "Month":
        # Issue/upgrade passcard once monthly payments cover the first half,
        # or when they have now covered the entire semester fee.
        if fs_after["mid_covered_by_months"] or fs_after["final_remaining"] == 0:
            passcard_name = create_passcard(
                student_id, term, payment_doc.name,
                "Final" if fs_after["final_remaining"] == 0 else payment_type,
                amount, waafi.get("transaction_id"), target_month
            )

    return {
        "status":         "success",
        "transaction_id": waafi.get("transaction_id"),
        "amount":         waafi.get("amount", amount),
        "passcard":       passcard_name,
        # Return updated fee status so frontend can re-render immediately
        "fee_status": {
            "mid_term_remaining": fs_after["mid_term_remaining"],
            "final_remaining":    fs_after["final_remaining"],
            "mid_term_paid":      fs_after["mid_explicit_paid"] or fs_after["mid_covered_by_months"],
            "final_paid":         fs_after["final_explicit_paid"] or fs_after["final_remaining"] == 0,
            "paid_months_list":   fs_after["paid_months_list"],
            "all_covered_months": fs_after["all_covered_months"],
        }
    }

# ─────────────────────────────────────────────────────────────────────────────
# API 3: Get Payment History
# ─────────────────────────────────────────────────────────────────────────────
@frappe.whitelist(allow_guest=True)
def get_student_payments(student_id):
    return {
        "payments": frappe.db.get_all(
            "Student Payment",
            filters={"student": student_id, "status": "Paid"},
            fields=["*"],
            order_by="payment_date desc"
        )
    }

# ─────────────────────────────────────────────────────────────────────────────
# API 4: Get Latest Valid Passcard
# ─────────────────────────────────────────────────────────────────────────────
@frappe.whitelist(allow_guest=True)
def get_student_passcard(student_id):
    term = get_active_term(student_id)
    if not term:
        return {"passcard": None}
    passcards = frappe.db.get_all(
        "Student Passcard",
        filters={"student": student_id, "academic_term": term.name},
        fields=["*"],
        order_by="issue_date desc",
        limit=1
    )
    return {"passcard": passcards[0] if passcards else None}

# ─────────────────────────────────────────────────────────────────────────────
# API 5: Get All Student Passcards (History)
# ─────────────────────────────────────────────────────────────────────────────
@frappe.whitelist(allow_guest=True)
def get_all_student_passcards(student_id):
    return {
        "passcards": frappe.db.get_all(
            "Student Passcard",
            filters={"student": student_id},
            fields=["*"],
            order_by="issue_date desc"
        )
    }