frappe.pages['hu-dashbaord'].on_page_load = function(wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Analytical Dashboard',
        single_column: true
    });

    // 1. Add Academic Year Filter
    let year_field = page.add_field({
        fieldname: 'academic_year',
        label: 'Academic Year',
        fieldtype: 'Link',
        options: 'Academic year',
        change: function() {
            // Clear the term field when the year changes so it doesn't leave an invalid term
            term_field.set_value('');
            load_dashboard_data(page, wrapper);
        }
    });

    // 2. Add Academic Term Filter
    let term_field = page.add_field({
        fieldname: 'academic_term',
        label: 'Academic Term',
        fieldtype: 'Link',
        options: 'Academic Term',
        get_query: function() {
            // Only show terms that belong to the selected year
            let year = year_field.get_value();
            if (year) {
                return { filters: { 'academic_year': year } };
            }
        },
        change: function() {
            load_dashboard_data(page, wrapper);
        }
    });

    // Add a manual refresh button
    page.set_primary_action('Refresh', () => load_dashboard_data(page, wrapper), 'refresh');

    // Add a dedicated container for the dashboard HTML
    $(wrapper).find('.layout-main-section').append('<div id="hu-dashboard-container"></div>');

    // Initial fetch
    load_dashboard_data(page, wrapper);
}

function load_dashboard_data(page, wrapper) {
    let $container = $(wrapper).find('#hu-dashboard-container');
    
    // Show loading state
    $container.html(`<div class="dashboard-content mt-4"><h3>Loading analytics...</h3></div>`);

    // Get filter values from the dropdowns
    let academic_year = page.fields_dict.academic_year.get_value();
    let academic_term = page.fields_dict.academic_term.get_value();

    frappe.call({
        method: "hu_passcard_system.hu_passcard_system.page.hu_dashbaord.hu_dashbaord.get_dashboard_data",
        args: {
            academic_year: academic_year,
            academic_term: academic_term
        },
        callback: function(r) {
            if (r.message) {
                render_dashboard($container, r.message);
                render_charts(r.message);
            }
        }
    });
}

function render_dashboard($container, data) {
    const formatMoney = (amount) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
    };

    let style = `
        <style>
            .dashboard-wrapper { font-family: 'Inter', sans-serif; padding-bottom: 40px; }
            .stat-card {
                background: #ffffff; border-radius: 12px; padding: 24px;
                display: flex; align-items: center; justify-content: space-between;
                box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;
                transition: transform 0.2s ease; min-height: 110px;
            }
            .stat-card:hover { transform: translateY(-5px); box-shadow: 0 10px 15px rgba(0,0,0,0.1); }
            .stat-details { z-index: 1; }
            .stat-label { font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 8px;}
            .stat-value { font-size: 30px; font-weight: 800; color: #0f172a; margin: 0; line-height: 1; }
            .finance-value { font-size: 26px; }
            .text-green { color: #10b981 !important; }
            .text-red { color: #ef4444 !important; }
            .section-container { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; margin-top: 20px; }
            .recent-table th { background: #f8fafc; color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 12px; border-top: none; }
            .recent-table td { vertical-align: middle; font-weight: 500; color: #1e293b; }
            .badge-paid { background: #d1fae5; color: #065f46; padding: 4px 8px; border-radius: 6px; font-size: 12px; }
            .badge-unpaid { background: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 6px; font-size: 12px; }
            .badge-partial { background: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 6px; font-size: 12px; }
        </style>
    `;

    let html = style + `
        <div class="dashboard-wrapper">
            
            <div class="row">
                <div class="col-md-4 col-sm-12 mb-4">
                    <div class="stat-card" style="border-top: 4px solid #3b82f6;">
                        <div class="stat-details">
                            <div class="stat-label">Total Active Students</div>
                            <h3 class="stat-value">${data.total_students || 0}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 col-sm-12 mb-4">
                    <div class="stat-card" style="border-top: 4px solid #10b981;">
                        <div class="stat-details">
                            <div class="stat-label">Total Revenue (Paid)</div>
                            <h3 class="stat-value finance-value text-green">${formatMoney(data.total_revenue)}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 col-sm-12 mb-4">
                    <div class="stat-card" style="border-top: 4px solid #f59e0b;">
                        <div class="stat-details">
                            <div class="stat-label">Active Passcards</div>
                            <h3 class="stat-value">${data.active_passcards || 0}</h3>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mt-2">
                <div class="col-md-6">
                    <div class="section-container">
                        <h4 style="margin-bottom: 20px; color: #171e28; font-weight: 600;">Payment Status Overview</h4>
                        <div id="status-chart"></div> 
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="section-container">
                        <h4 style="margin-bottom: 20px; color: #171e28; font-weight: 600;">Revenue by Payment Type</h4>
                        <div id="type-revenue-chart"></div>
                    </div>
                </div>
            </div>

            <div class="row mt-4">
                <div class="col-md-12">
                    <div class="section-container">
                        <h4 style="margin-bottom: 20px; color: #171e28; font-weight: 600;">Recent Payments</h4>
                        <div class="table-responsive">
                            <table class="table recent-table table-hover">
                                <thead>
                                    <tr>
                                        <th>Student Name</th>
                                        <th>Academic Term</th>
                                        <th>Payment Type</th>
                                        <th>Date</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${data.recent_payments && data.recent_payments.length > 0 ? data.recent_payments.map(t => {
                                        let badgeClass = t.status === 'Paid' ? 'badge-paid' : (t.status === 'Pending' ? 'badge-unpaid' : 'badge-partial');
                                        let dateStr = t.payment_date ? t.payment_date.split(' ')[0] : '-';
                                        return `
                                        <tr>
                                            <td><a href="/app/student-payment/${t.name}"><strong>${t.student_name || 'Unknown'}</strong></a></td>
                                            <td>${t.academic_term || '-'}</td>
                                            <td>${t.payment_type || '-'}</td>
                                            <td>${dateStr}</td>
                                            <td>${formatMoney(t.amount)}</td>
                                            <td><span class="${badgeClass}">${t.status}</span></td>
                                        </tr>
                                        `
                                    }).join('') : '<tr><td colspan="6" class="text-center text-muted">No records found for this filter.</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    $container.html(html);
}

// Function to draw Frappe Charts
function render_charts(data) {
    if (data.status_counts && data.status_counts.length > 0) {
        let labels = data.status_counts.map(d => d.status);
        let values = data.status_counts.map(d => d.count);
        
        new frappe.Chart("#status-chart", {
            data: { labels: labels, datasets: [{ name: "Status", values: values }] },
            type: 'donut',
            height: 250,
            colors: ['#10b981', '#f59e0b', '#ef4444'] 
        });
    } else {
        $("#status-chart").html('<p class="text-muted text-center py-5">No Data Available</p>');
    }

    if (data.revenue_by_type && data.revenue_by_type.length > 0) {
        let typeLabels = data.revenue_by_type.map(d => d.payment_type || 'Unknown');
        let typeValues = data.revenue_by_type.map(d => d.total);

        new frappe.Chart("#type-revenue-chart", {
            data: { labels: typeLabels, datasets: [{ name: "Revenue ($)", values: typeValues }] },
            type: 'bar',
            height: 250,
            colors: ['#3b82f6'] 
        });
    } else {
        $("#type-revenue-chart").html('<p class="text-muted text-center py-5">No Data Available</p>');
    }
}