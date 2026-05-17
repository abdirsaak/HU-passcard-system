import frappe

@frappe.whitelist()
def get_dashboard_data(academic_year=None, academic_term=None):
    # Base standard filters
    student_filters = {'is_active': 1}
    passcard_filters = {'is_valid': 1}
    payment_filters = {'status': 'Paid'}
    recent_payment_filters = {}

    # SQL parameters for the charts
    sql_conditions = ""
    sql_values = {}

    # Apply Filters Dynamically
    if academic_term:
        student_filters['academic_term'] = academic_term
        passcard_filters['academic_term'] = academic_term
        payment_filters['academic_term'] = academic_term
        recent_payment_filters['academic_term'] = academic_term
        
        sql_conditions = "WHERE academic_term = %(term)s"
        sql_values['term'] = academic_term

    elif academic_year:
        student_filters['academic_year'] = academic_year
        
        # Fetch terms that belong to the selected academic year
        terms = frappe.get_all('Academic Term', filters={'academic_year': academic_year}, pluck='name')
        
        if terms:
            passcard_filters['academic_term'] = ['in', terms]
            payment_filters['academic_term'] = ['in', terms]
            recent_payment_filters['academic_term'] = ['in', terms]
            
            sql_conditions = "WHERE academic_term IN %(terms)s"
            sql_values['terms'] = tuple(terms)
        else:
            # If a year is selected but has no terms, return 0 results
            passcard_filters['academic_term'] = 'No-Term-Found'
            payment_filters['academic_term'] = 'No-Term-Found'
            recent_payment_filters['academic_term'] = 'No-Term-Found'
            sql_conditions = "WHERE 1=0"

    # KPI 1: Total Active Students
    total_students = frappe.db.count('Student', student_filters)
    
    # KPI 2: Total Valid Passcards
    active_passcards = frappe.db.count('Student Passcard', passcard_filters)
    
    # KPI 3: Total Revenue (Paid Student Payments)
    revenue_data = frappe.db.get_all('Student Payment', filters=payment_filters, fields=['sum(amount) as total'])
    total_revenue = revenue_data[0].total if revenue_data and revenue_data[0].total else 0
    
    # KPI 4: Recent Payments (Last 5)
    recent_payments = frappe.db.get_all('Student Payment',
        filters=recent_payment_filters,
        fields=['name', 'student_name', 'academic_term','payment_type', 'amount', 'status', 'payment_date'],
        order_by='creation desc',
        limit=5
    )

    # --- ANALYTICAL CHART DATA ---
    
    # Chart A: Payment Status Breakdown
    status_query = f"""
        SELECT status, COUNT(name) as count
        FROM `tabStudent Payment`
        {sql_conditions}
        GROUP BY status
    """
    status_counts = frappe.db.sql(status_query, sql_values, as_dict=True)
    
    # Chart B: Revenue by Payment Type
    paid_condition = "status = 'Paid'"
    if sql_conditions:
        chart_b_conditions = f"{sql_conditions} AND {paid_condition}"
    else:
        chart_b_conditions = f"WHERE {paid_condition}"

    type_query = f"""
        SELECT payment_type, SUM(amount) as total
        FROM `tabStudent Payment`
        {chart_b_conditions}
        GROUP BY payment_type
    """
    revenue_by_type = frappe.db.sql(type_query, sql_values, as_dict=True)

    return {
        "total_students": total_students,
        "active_passcards": active_passcards,
        "total_revenue": total_revenue,
        "recent_payments": recent_payments,
        "status_counts": status_counts,
        "revenue_by_type": revenue_by_type
    }