const API = '/api/admin';
let token = localStorage.getItem('admin_token');

function getHeaders() {
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
    };
}

if (token) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    loadData();
}

async function adminLogin() {
    const password = document.getElementById('admin-password').value;
    const errEl = document.getElementById('login-error');
    errEl.style.display = 'none';

    try {
        const res = await fetch(API + '/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        if (!res.ok) { errEl.style.display = 'block'; return; }
        const data = await res.json();
        token = data.token;
        localStorage.setItem('admin_token', token);
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        loadData();
    } catch (e) {
        errEl.textContent = 'Connection error';
        errEl.style.display = 'block';
    }
}

function adminLogout() {
    token = null;
    localStorage.removeItem('admin_token');
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('admin-password').value = '';
}

async function loadData() {
    loadContacts();
    loadUsers();
    loadOrders();
}

async function loadContacts() {
    const tbody = document.getElementById('contacts-body');
    try {
        const res = await fetch(API + '/contacts', { headers: getHeaders() });
        if (res.status === 401) { adminLogout(); return; }
        const contacts = await res.json();
        document.getElementById('contacts-count').textContent = contacts.length;

        if (!contacts.length) {
            tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><p>No contact submissions yet</p></div></td></tr>';
            return;
        }

        tbody.innerHTML = contacts.map(c => {
            const date = new Date(c.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
            return `<tr>
                <td class="timestamp">${date}</td>
                <td><strong>${esc(c.name)}</strong></td>
                <td>${esc(c.phone)}</td>
                <td><span class="badge badge-${esc(c.service)}">${esc(c.service)}</span></td>
                <td class="msg-cell" title="${esc(c.address || '')}">${esc(c.address || '—')}</td>
                <td class="msg-cell" title="${esc(c.message)}">${esc(c.message)}</td>
            </tr>`;
        }).join('');
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><p>Failed to load contacts</p></div></td></tr>';
    }
}

async function loadUsers() {
    const tbody = document.getElementById('users-body');
    try {
        const res = await fetch(API + '/users', { headers: getHeaders() });
        if (res.status === 401) { adminLogout(); return; }
        const users = await res.json();
        document.getElementById('users-count').textContent = users.length;

        if (!users.length) {
            tbody.innerHTML = '<tr><td colspan="4"><div class="empty-state"><p>No registered users yet</p></div></td></tr>';
            return;
        }

        tbody.innerHTML = users.map(u => {
            const date = new Date(u.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
            return `<tr>
                <td class="timestamp">${date}</td>
                <td><strong>${esc(u.name)}</strong></td>
                <td>${esc(u.email)}</td>
                <td>${u.phone ? esc(u.phone) : '<span style="color:#555">—</span>'}</td>
            </tr>`;
        }).join('');
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="4"><div class="empty-state"><p>Failed to load users</p></div></td></tr>';
    }
}

async function loadOrders() {
    const tbody = document.getElementById('orders-body');
    try {
        const res = await fetch(API + '/orders', { headers: getHeaders() });
        if (res.status === 401) { adminLogout(); return; }
        const orders = await res.json();
        document.getElementById('orders-count').textContent = orders.length;

        if (!orders.length) {
            tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state"><p>No orders yet</p></div></td></tr>';
            return;
        }

        const payLabels = { cod: 'Cash on Delivery', upi: 'UPI', netbanking: 'Net Banking' };
        tbody.innerHTML = orders.map(o => {
            const date = new Date(o.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
            const items = (o.items || []).map(i =>
                `${esc(i.name)} ×${i.qty}${i.unit ? ' ' + esc(i.unit) : ''}`
            ).join(', ');
            const pay = payLabels[o.paymentMethod] || o.paymentMethod;
            return `<tr>
                <td class="timestamp">${date}</td>
                <td><strong>${esc(o.customerName)}</strong></td>
                <td>${esc(o.phone)}<br><span style="color:#555;font-size:12px">${esc(o.email || '—')}</span></td>
                <td class="msg-cell" title="${esc(o.address || '')}">${esc(o.address || '—')}</td>
                <td class="items-cell" title="${items}">${items || '—'}</td>
                <td><strong>₹${Number(o.totalAmount).toLocaleString('en-IN')}</strong></td>
                <td><span class="badge badge-${esc(o.paymentMethod)}">${esc(pay)}</span></td>
                <td><span class="badge badge-${esc(o.orderStatus || 'placed')}">${esc(o.orderStatus || 'placed')}</span>
                    <br><span class="badge badge-${esc(o.paymentStatus || 'pending')}" style="margin-top:4px">${esc(o.paymentStatus || 'pending')}</span></td>
            </tr>`;
        }).join('');
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state"><p>Failed to load orders</p></div></td></tr>';
    }
}

function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelector(`.tab[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`panel-${tab}`).classList.add('active');
}

function esc(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

document.getElementById('admin-password').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') adminLogin();
});
