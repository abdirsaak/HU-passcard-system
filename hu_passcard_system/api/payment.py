



# # Copyright (c) 2026, abdirsak and contributors
# # hu_passcard_system/api/payment.py

# import frappe
# import requests
# import uuid
# from datetime import datetime, date, timedelta

# WAAFI_API_URL  = "https://api.waafipay.net/asm"
# WAAFI_API_KEY  = "API-1221796037AHX"
# WAAFI_USER_ID  = "1007359"
# WAAFI_MERCHANT = "M0913615"

# # ─────────────────────────────────────────────────────────────────────────────
# # HELPER: Get Academic Term linked to this student
# # ─────────────────────────────────────────────────────────────────────────────
# def get_active_term(student_id: str):
#     student = frappe.db.get_value("Student", student_id, ["academic_term", "academic_year"], as_dict=True)
#     if not student: return None

#     if student.academic_term:
#         term = frappe.db.get_value("Academic Term", student.academic_term, ["name", "term_name", "start_date", "send_date", "academic_year"], as_dict=True)
#         if term and term.start_date and term.send_date: return term

#     today = date.today()
#     terms = frappe.db.get_all("Academic Term", fields=["name", "term_name", "start_date", "send_date", "academic_year"])
#     for t in terms:
#         if t.start_date and t.send_date and (t.start_date <= today <= t.send_date):
#             return t
#     return None

# # ─────────────────────────────────────────────────────────────────────────────
# # HELPER: Calculate exam phases
# # ─────────────────────────────────────────────────────────────────────────────
# def get_term_phases(term):
#     start, end = term.start_date, term.send_date
#     today = date.today()

#     mid_exam_start = start + timedelta(days=75)
#     mid_exam_end   = start + timedelta(days=88)
#     final_start    = mid_exam_end + timedelta(days=15)
#     final_end      = end

#     if today < start: phase = "before_term"
#     elif today <= mid_exam_end: phase = "mid_term"
#     elif today < final_start: phase = "between"
#     elif today <= final_end: phase = "final"
#     else: phase = "ended"

#     return {
#         "start": start, "end": end,
#         "mid_term_exam_start": mid_exam_start, "mid_term_exam_end": mid_exam_end,
#         "final_start": final_start, "final_end": final_end,
#         "current_phase": phase,
#     }

# # ─────────────────────────────────────────────────────────────────────────────
# # HELPER: Generate Months Sequence
# # ─────────────────────────────────────────────────────────────────────────────
# def get_months_list(start, end):
#     months = []
#     if not start or not end: return months
#     curr = start.replace(day=1)
#     while curr <= end:
#         months.append({
#             "label": curr.strftime("%B %Y"),
#             "value": curr.strftime("%Y-%m")
#         })
#         if curr.month == 12:
#             curr = curr.replace(year=curr.year + 1, month=1)
#         else:
#             curr = curr.replace(month=curr.month + 1)
#     return months

# # ─────────────────────────────────────────────────────────────────────────────
# # HELPER: Waafi EVC Plus payment
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
#                 "amount": str(round(float(amount), 2)), "currency": "USD",
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
# # HELPER: Issue passcard
# # ─────────────────────────────────────────────────────────────────────────────
# def create_passcard(student_id, term, payment_name, payment_type, amount, transaction_id, phases, target_month=None):
#     # Set default expiration dates based on the payment type
#     if payment_type == "Final":
#         valid_until = phases["final_end"]
#     else:
#         # For Mid-term or half-semester, valid until the day before finals start
#         valid_until = phases["final_start"] - timedelta(days=1)
        
#     # SAFETY FIX: If the student pays late and the calculated date is already in the past,
#     # give the passcard a 14-day grace period so it doesn't instantly expire.
#     if valid_until < date.today():
#         valid_until = date.today() + timedelta(days=14)

#     # Invalidate any old active passcards
#     old_passcards = frappe.db.get_all("Student Passcard", filters={"student": student_id, "academic_term": term.name, "is_valid": 1}, fields=["name"])
#     for old in old_passcards:
#         frappe.db.set_value("Student Passcard", old.name, "is_valid", 0)

#     # Safety catch for the "FInal" typo in the DocType options
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
# # API 1 — Get term info
# # ─────────────────────────────────────────────────────────────────────────────
# @frappe.whitelist(allow_guest=True)
# def get_term_info(student_id):
#     term = get_active_term(student_id)
#     if not term: return {"term": None}

#     phases = get_term_phases(term)
#     months = get_months_list(phases["start"], phases["end"])

#     return {
#         "term": {
#             "name": term.name, "term_name": term.term_name,
#             "academic_year": str(term.academic_year) if term.academic_year else "",
#             "start_date": str(phases["start"]), "end_date": str(phases["end"]),
#             "mid_term_exam_start": str(phases["mid_term_exam_start"]), "mid_term_exam_end": str(phases["mid_term_exam_end"]),
#             "final_start": str(phases["final_start"]), "final_end": str(phases["final_end"]),
#             "current_phase": phases["current_phase"], "months": months
#         }
#     }

# # ─────────────────────────────────────────────────────────────────────────────
# # API 2 — Initiate payment
# # ─────────────────────────────────────────────────────────────────────────────
# @frappe.whitelist(allow_guest=True)
# def initiate_payment(student_id, phone, amount, payment_type, target_month=None):
#     amount = float(amount)

#     if payment_type not in ("Mid term", "Final", "Month"):
#         frappe.throw('Invalid payment type. Must be "Mid term", "Final", or "Month".', frappe.ValidationError)

#     student_data = frappe.db.get_value("Student", student_id, ["fee", "discount_percentage"], as_dict=True)
#     semester_fee = float(student_data.fee or 0)
#     discount     = float(student_data.discount_percentage or 0)

#     final_fee = round(semester_fee * (1 - discount / 100), 2)
#     mid_term_fee  = round(final_fee / 2, 2)

#     term = get_active_term(student_id)
#     if not term: frappe.throw("No active academic term found.", frappe.ValidationError)

#     phases = get_term_phases(term)
#     months = get_months_list(term.start_date, term.send_date)
#     monthly_fee = round(final_fee / len(months), 2) if months else 0

#     expected_amount = mid_term_fee if payment_type == "Mid term" else final_fee if payment_type == "Final" else monthly_fee

#     if abs(amount - expected_amount) > 0.05:
#         frappe.throw(f"Amount mismatch. Expected ${expected_amount}.", frappe.ValidationError)

#     existing = frappe.db.get_all("Student Payment", filters={"student": student_id, "academic_term": term.name, "status": "Paid"}, fields=["payment_type", "notes"])
#     paid_types = [ex.payment_type for ex in existing]

#     if "Final" in paid_types:
#         frappe.throw("You have already paid the final fee.", frappe.ValidationError)
#     if payment_type == "Mid term" and "Mid term" in paid_types:
#         frappe.throw("You have already paid the mid-term fee.", frappe.ValidationError)

#     # Sequence Check for Monthly Payments
#     if payment_type == "Month":
#         if not target_month: frappe.throw("Please select a month to pay.", frappe.ValidationError)
#         paid_months = [ex.notes for ex in existing if ex.payment_type == "Month" and ex.notes]
#         if target_month in paid_months:
#             frappe.throw("You have already paid for this month.", frappe.ValidationError)
        
#         unpaid_months = [m["value"] for m in months if m["value"] not in paid_months]
#         if not unpaid_months:
#             frappe.throw("All months have been paid.", frappe.ValidationError)
#         if target_month != unpaid_months[0]:
#             frappe.throw(f"Sequence Error. Please pay for {unpaid_months[0]} first.", frappe.ValidationError)

#     # RULE 3: Do NOT save to DB until Waafi succeeds. Call Waafi first.
#     ref_id = str(uuid.uuid4())[:16]
#     invoice_id = f"INV-{student_id}-{term.name}-{payment_type[:3].upper()}-{ref_id[:4]}"
    
#     try:
#         waafi = call_waafi(phone=phone, amount=amount, reference_id=ref_id, invoice_id=invoice_id, description=f"HU – {payment_type}")
#     except Exception as e:
#         # If Waafi fails, execution stops here. Nothing is stored in the database.
#         raise frappe.ValidationError(str(e))

#     # If Waafi is successful, NOW we create and store the "Paid" record in the Database
#     payment_doc = frappe.get_doc({
#         "doctype": "Student Payment", 
#         "student": student_id, 
#         "academic_term": term.name,
#         "payment_type": payment_type, 
#         "amount": amount, 
#         "status": "Paid", 
#         "phone_number": phone, 
#         "payment_date": datetime.now(),
#         "notes": target_month if payment_type == "Month" else "",
#         "transaction_id": waafi.get("transaction_id"),
#         "waafi_reference_id": waafi.get("reference_id"), 
#         "issuer_transaction_id": waafi.get("issuer_transaction_id")
#     })
#     payment_doc.insert(ignore_permissions=True)
#     frappe.db.commit()

#     # RULES 1 & 4: Passcard Issuance Logic
#     passcard_name = None
#     total_months_in_semester = len(months)
    
#     if payment_type == "Month":
#         # Check if the student has hit the 50% threshold of paid months
#         paid_monthly_count = len([ex for ex in existing if ex.payment_type == "Month"]) + 1
#         if paid_monthly_count >= (total_months_in_semester / 2.0):
#             passcard_name = create_passcard(student_id, term, payment_doc.name, payment_type, amount, waafi.get("transaction_id"), phases, target_month)
            
#     elif payment_type in ("Mid term", "Final"):
#         # Always issue passcard immediately for Mid Term and Final
#         passcard_name = create_passcard(student_id, term, payment_doc.name, payment_type, amount, waafi.get("transaction_id"), phases, target_month)

#     return {"status": "success", "transaction_id": waafi.get("transaction_id"), "amount": waafi.get("amount", amount), "passcard": passcard_name}


# # ─────────────────────────────────────────────────────────────────────────────
# # API 3 — Get payment history
# # ─────────────────────────────────────────────────────────────────────────────
# @frappe.whitelist(allow_guest=True)
# def get_student_payments(student_id):
#     # RULE 2: Pull only the "Paid" payments from the Database to display in the frontend history
#     payments = frappe.db.get_all(
#         "Student Payment", 
#         filters={"student": student_id, "status": "Paid"}, 
#         fields=["name", "payment_type", "amount", "status", "payment_date", "transaction_id", "academic_term", "notes"], 
#         order_by="payment_date desc"
#     )
#     return {"payments": payments}


# # ─────────────────────────────────────────────────────────────────────────────
# # API 4 — Get latest valid passcard
# # ─────────────────────────────────────────────────────────────────────────────
# @frappe.whitelist(allow_guest=True)
# def get_student_passcard(student_id):
#     # FIX: Removed the {"is_valid": 1} filter so the UI can retrieve and display 
#     # expired passcards instead of showing "No Passcard Available".
#     passcards = frappe.db.get_all(
#         "Student Passcard", 
#         filters={"student": student_id}, 
#         fields=["name", "payment_type", "amount_paid", "issue_date", "valid_until", "is_valid", "transaction_id", "academic_term"], 
#         order_by="issue_date desc", 
#         limit=1
#     )
    
#     if not passcards: return {"passcard": None}
    
#     p = passcards[0]
    
#     # Auto-expire logic: if the date has passed, mark it invalid in the DB and the response
#     if p.is_valid and p.valid_until and date.today() > p.valid_until:
#         frappe.db.set_value("Student Passcard", p.name, "is_valid", 0)
#         frappe.db.commit()
#         p.is_valid = 0 
        
#     return {"passcard": p}








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
# EXAM TIMELINE LOGIC
# ─────────────────────────────────────────────────────────────────────────────
EXAM_TIMELINE = {
    'first_semester': {
        'mid_term': {'start_month': 9, 'end_month': 11, 'end_day': 29},
        'final':    {'start_month': 12, 'end_month': 2, 'end_day': 28}
    },
    'second_semester': {
        'mid_term': {'start_month': 3, 'end_month': 5},
        'final':    {'start_month': 6, 'end_month': 8}
    }
}

def get_academic_phase(target_date=None):
    if target_date is None:
        target_date = date.today()
        
    month = target_date.month
    day = target_date.day

    # First Semester
    if month in [9, 10, 11]:
        if month == 11 and day > EXAM_TIMELINE['first_semester']['mid_term']['end_day']:
            return "between"
        return "mid_term"
    elif month in [12, 1, 2]:
        if month == 2 and day > EXAM_TIMELINE['first_semester']['final']['end_day']:
            return "ended"
        return "final"
    # Second Semester
    elif month in [3, 4, 5]:
        return "mid_term"
    elif month in [6, 7, 8]:
        return "final"

    return "before_term"

# ─────────────────────────────────────────────────────────────────────────────
# HELPER: Get Academic Term
# ─────────────────────────────────────────────────────────────────────────────
def get_active_term(student_id: str):
    student = frappe.db.get_value("Student", student_id, ["academic_term", "academic_year"], as_dict=True)
    if not student: return None

    if student.academic_term:
        term = frappe.db.get_value("Academic Term", student.academic_term, ["name", "term_name", "start_date", "send_date", "academic_year"], as_dict=True)
        if term and term.start_date and term.send_date: return term

    today = date.today()
    terms = frappe.db.get_all("Academic Term", fields=["name", "term_name", "start_date", "send_date", "academic_year"])
    for t in terms:
        if t.start_date and t.send_date and (t.start_date <= today <= t.send_date):
            return t
#     return None
# def get_active_term(student_id: str):
#     # Load the full Student document to access child tables
#     student_doc = frappe.get_doc("Student", student_id)[cite: 18, 19]
    
#     active_term_name = None
    
#     # Loop through the semester_history child table
#     for row in student_doc.semester_history:[cite: 19]
#         # Check if the status in this row is "active"
#         if row.status == "active":
#             active_term_name = row.academic_term
#             break
            
#     # If we found an active term in the history table, get its details
#     if active_term_name:
#         term = frappe.db.get_value(
#             "Academic Term", 
#             active_term_name, 
#             ["name", "term_name", "start_date", "send_date", "academic_year"], 
#             as_dict=True
#         )[cite: 17]
#         if term and term.start_date and term.send_date:
#             return term

#     # Fallback: if no active row found in table, use the main field on student record
#     if student_doc.academic_term:[cite: 19]
#         term = frappe.db.get_value(
#             "Academic Term", 
#             student_doc.academic_term, 
#             ["name", "term_name", "start_date", "send_date", "academic_year"], 
#             as_dict=True
#         )[cite: 17]
#         return term

#     return None
# ─────────────────────────────────────────────────────────────────────────────
# HELPER: Calculate exam phases
# ─────────────────────────────────────────────────────────────────────────────
def get_term_phases(term):
    start, end = term.start_date, term.send_date
    
    # Keeping these to prevent frontend UI breaks, but using timeline for current phase
    mid_exam_start = start + timedelta(days=75)
    mid_exam_end   = start + timedelta(days=88)
    final_start    = mid_exam_end + timedelta(days=15)
    final_end      = end

    return {
        "start": start, "end": end,
        "mid_term_exam_start": mid_exam_start, "mid_term_exam_end": mid_exam_end,
        "final_start": final_start, "final_end": final_end,
        "current_phase": get_academic_phase(), # Uses your EXAM_TIMELINE logic
    }

# ─────────────────────────────────────────────────────────────────────────────
# HELPER: Generate Months Sequence
# ─────────────────────────────────────────────────────────────────────────────
def get_months_list(start, end):
    months = []
    if not start or not end: return months
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
# HELPER: Waafi EVC Plus payment
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
                "referenceId": reference_id, "invoiceId": invoice_id,
                "amount": str(round(float(amount), 2)), "currency": "USD",
                "description": description,
            },
        },
    }

    try:
        resp = requests.post(WAAFI_API_URL, json=payload, headers={"Content-Type": "application/json"}, timeout=30)
        data = resp.json()
    except Exception as e:
        frappe.throw(f"Payment gateway error: {str(e)}", frappe.ValidationError)

    if data.get("responseCode") != "2001":
        error_map = {"5001": "Insufficient balance.", "5002": "Account not found.", "5003": "Limit exceeded.", "5004": "Blocked."}
        frappe.throw(error_map.get(data.get("responseCode", ""), data.get("responseMsg", "Failed.")), frappe.ValidationError)

    return {
        "transaction_id": data.get("params", {}).get("transactionId"),
        "reference_id": data.get("params", {}).get("referenceId"),
        "issuer_transaction_id": data.get("params", {}).get("issuerTransactionId"),
        "amount": data.get("params", {}).get("txAmount"),
    }

# ─────────────────────────────────────────────────────────────────────────────
# HELPER: Issue passcard
# ─────────────────────────────────────────────────────────────────────────────
def create_passcard(student_id, term, payment_name, payment_type, amount, transaction_id, phases, target_month=None):
    if payment_type == "Final":
        valid_until = phases["final_end"]
    else:
        valid_until = phases["final_start"] - timedelta(days=1)
        
    # GRACE PERIOD: Prevent immediate expiration on late payments
    if valid_until < date.today():
        valid_until = date.today() + timedelta(days=14)

    old_passcards = frappe.db.get_all("Student Passcard", filters={"student": student_id, "academic_term": term.name, "is_valid": 1}, fields=["name"])
    for old in old_passcards:
        frappe.db.set_value("Student Passcard", old.name, "is_valid", 0)

    db_payment_type = "FInal" if payment_type == "Final" else payment_type

    passcard = frappe.get_doc({
        "doctype": "Student Passcard", 
        "student": student_id, 
        "academic_term": term.name,
        "payment": payment_name, 
        "payment_type": db_payment_type, 
        "amount_paid": amount,
        "issue_date": date.today(), 
        "valid_until": valid_until, 
        "is_valid": 1, 
        "transaction_id": transaction_id,
    })
    passcard.insert(ignore_permissions=True)
    frappe.db.commit()
    return passcard.name

# ─────────────────────────────────────────────────────────────────────────────
# API 1 — Get term info
# ─────────────────────────────────────────────────────────────────────────────
@frappe.whitelist(allow_guest=True)
def get_term_info(student_id):
    term = get_active_term(student_id)
    if not term: return {"term": None}

    phases = get_term_phases(term)
    months = get_months_list(phases["start"], phases["end"])

    return {
        "term": {
            "name": term.name, "term_name": term.term_name,
            "academic_year": str(term.academic_year) if term.academic_year else "",
            "start_date": str(phases["start"]), "end_date": str(phases["end"]),
            "mid_term_exam_start": str(phases["mid_term_exam_start"]), "mid_term_exam_end": str(phases["mid_term_exam_end"]),
            "final_start": str(phases["final_start"]), "final_end": str(phases["final_end"]),
            "current_phase": phases["current_phase"], "months": months
        }
    }

# ─────────────────────────────────────────────────────────────────────────────
# API 2 — Initiate payment
# ─────────────────────────────────────────────────────────────────────────────
@frappe.whitelist(allow_guest=True)
def initiate_payment(student_id, phone, amount, payment_type, target_month=None):
    amount = float(amount)

    if payment_type not in ("Mid term", "Final", "Month"):
        frappe.throw('Invalid payment type. Must be "Mid term", "Final", or "Month".', frappe.ValidationError)

    student_data = frappe.db.get_value("Student", student_id, ["fee", "discount_percentage"], as_dict=True)
    semester_fee = float(student_data.fee or 0)
    discount     = float(student_data.discount_percentage or 0)

    final_fee = round(semester_fee * (1 - discount / 100), 2)
    mid_term_fee  = round(final_fee / 2, 2)

    term = get_active_term(student_id)
    if not term: frappe.throw("No active academic term found.", frappe.ValidationError)

    phases = get_term_phases(term)
    months = get_months_list(term.start_date, term.send_date)
    monthly_fee = round(final_fee / len(months), 2) if months else 0

    expected_amount = mid_term_fee if payment_type == "Mid term" else final_fee if payment_type == "Final" else monthly_fee

    if abs(amount - expected_amount) > 0.05:
        frappe.throw(f"Amount mismatch. Expected ${expected_amount}.", frappe.ValidationError)

    # SECURE VALIDATION RULES
    existing = frappe.db.get_all("Student Payment", filters={"student": student_id, "academic_term": term.name, "status": "Paid"}, fields=["payment_type", "notes"])
    paid_types = [ex.payment_type for ex in existing]
    
    paid_monthly_count = len([ex for ex in existing if ex.payment_type == "Month" and ex.notes])
    total_months_in_semester = len(months)
    half_months = total_months_in_semester / 2.0

    if payment_type == "Final":
        if "Final" in paid_types or paid_monthly_count >= total_months_in_semester:
            frappe.throw("You have already paid the final fee in full.", frappe.ValidationError)
            
    if payment_type == "Mid term":
        if "Mid term" in paid_types or "Final" in paid_types or paid_monthly_count >= half_months:
            frappe.throw("You have already paid enough monthly installments to cover the mid-term.", frappe.ValidationError)

    if payment_type == "Month":
        if "Final" in paid_types:
            frappe.throw("You have already paid the full term.", frappe.ValidationError)
        if not target_month: frappe.throw("Please select a month to pay.", frappe.ValidationError)
        
        paid_months_list = [ex.notes for ex in existing if ex.payment_type == "Month" and ex.notes]
        if target_month in paid_months_list:
            frappe.throw("You have already paid for this month.", frappe.ValidationError)
        
        unpaid_months = [m["value"] for m in months if m["value"] not in paid_months_list]
        if not unpaid_months:
            frappe.throw("All months have been paid.", frappe.ValidationError)
        if target_month != unpaid_months[0]:
            frappe.throw(f"Sequence Error. Please pay for {unpaid_months[0]} first.", frappe.ValidationError)

    # CALL WAAFI FIRST - Do not save until successful
    ref_id = str(uuid.uuid4())[:16]
    invoice_id = f"INV-{student_id}-{term.name}-{payment_type[:3].upper()}-{ref_id[:4]}"
    
    try:
        waafi = call_waafi(phone=phone, amount=amount, reference_id=ref_id, invoice_id=invoice_id, description=f"HU – {payment_type}")
    except Exception as e:
        raise frappe.ValidationError(str(e))

    # SAVE TO DATABASE (Only if Waafi is successful)
    payment_doc = frappe.get_doc({
        "doctype": "Student Payment", 
        "student": student_id, 
        "academic_term": term.name,
        "payment_type": payment_type, 
        "amount": amount, 
        "status": "Paid", 
        "phone_number": phone, 
        "payment_date": datetime.now(),
        "notes": target_month if payment_type == "Month" else "",
        "transaction_id": waafi.get("transaction_id"),
        "waafi_reference_id": waafi.get("reference_id"), 
        "issuer_transaction_id": waafi.get("issuer_transaction_id")
    })
    payment_doc.insert(ignore_permissions=True)
    frappe.db.commit()

    # PASSCARD ISSUANCE RULE
    passcard_name = None
    if payment_type == "Month":
        new_paid_monthly_count = paid_monthly_count + 1
        if new_paid_monthly_count >= half_months:
            passcard_name = create_passcard(student_id, term, payment_doc.name, payment_type, amount, waafi.get("transaction_id"), phases, target_month)
    elif payment_type in ("Mid term", "Final"):
        passcard_name = create_passcard(student_id, term, payment_doc.name, payment_type, amount, waafi.get("transaction_id"), phases, target_month)

    return {"status": "success", "transaction_id": waafi.get("transaction_id"), "amount": waafi.get("amount", amount), "passcard": passcard_name}

# ─────────────────────────────────────────────────────────────────────────────
# API 3 — Get payment history
# ─────────────────────────────────────────────────────────────────────────────
@frappe.whitelist(allow_guest=True)
def get_student_payments(student_id):
    payments = frappe.db.get_all(
        "Student Payment", 
        filters={"student": student_id, "status": "Paid"}, # ONLY shows paid history
        fields=["name", "payment_type", "amount", "status", "payment_date", "transaction_id", "academic_term", "notes"], 
        order_by="payment_date desc"
    )
    return {"payments": payments}

# ─────────────────────────────────────────────────────────────────────────────
# API 4 — Get latest valid passcard
# ─────────────────────────────────────────────────────────────────────────────
@frappe.whitelist(allow_guest=True)
def get_student_passcard(student_id):
    passcards = frappe.db.get_all(
        "Student Passcard", 
        filters={"student": student_id},
        fields=["name", "payment_type", "amount_paid", "issue_date", "valid_until", "is_valid", "transaction_id", "academic_term"], 
        order_by="issue_date desc", 
        limit=1
    )
    if not passcards: return {"passcard": None}
    
    p = passcards[0]
    if p.is_valid and p.valid_until and date.today() > p.valid_until:
        frappe.db.set_value("Student Passcard", p.name, "is_valid", 0)
        frappe.db.commit()
        p.is_valid = 0 
        
    return {"passcard": p}

# ─────────────────────────────────────────────────────────────────────────────
# API 5 — Get ALL student passcards (History)
# ─────────────────────────────────────────────────────────────────────────────
@frappe.whitelist(allow_guest=True)
def get_all_student_passcards(student_id):
    # Fetch all passcards for this student, ordered newest to oldest
    passcards = frappe.db.get_all(
        "Student Passcard", 
        filters={"student": student_id},
        fields=[
            "name", "payment_type", "amount_paid", "issue_date", 
            "valid_until", "is_valid", "transaction_id", "academic_term"
        ], 
        order_by="issue_date desc"
    )
    
    # Optional: We can do a quick check to auto-expire old ones here too, 
    # just in case they slipped through the cracks.
    today = date.today()
    for p in passcards:
        if p.is_valid and p.valid_until and today > p.valid_until:
            frappe.db.set_value("Student Passcard", p.name, "is_valid", 0)
            frappe.db.commit()
            p.is_valid = 0 
            
    return {"passcards": passcards}