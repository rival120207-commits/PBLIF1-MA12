const $ = (s, e = document) => e.querySelector(s), load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } }, save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const dt = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10) }, today = dt(0);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nid = a => a.reduce((m, x) => Math.max(m, x.id), 0) + 1, IC = { Hias: '🪴', Bunga: '🌹', Sayur: '🥬', Buah: '🍓' };
const page = document.body.dataset.page;
function toast(t) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 2200) }
// data awal (demo)
if (!load('users')) save('users', [{ nama: 'Admin Demo', email: 'admin@tanaman.com', pass: '12345678' }]);
if (!load('plants')) {
    save('plants', [{ id: 1, nama: 'Monstera', jenis: 'Hias', lokasi: 'Teras', tanggal: '2026-08-12', air: 'Sedang', catatan: '' }, { id: 2, nama: 'Mawar', jenis: 'Bunga', lokasi: 'Kebun', tanggal: '2026-09-01', air: 'Tinggi', catatan: '' }, { id: 3, nama: 'Cabai', jenis: 'Sayur', lokasi: 'Pot', tanggal: '2026-09-20', air: 'Sedang', catatan: '' }]);
    save('jadwal', [{ id: 1, plantId: 1, aktivitas: 'Penyiraman', tanggal: today, ulang: 'Harian', selesai: false }, { id: 2, plantId: 2, aktivitas: 'Pemupukan', tanggal: today, ulang: 'Mingguan', selesai: true }, { id: 3, plantId: 3, aktivitas: 'Penyiraman', tanggal: dt(-2), ulang: 'Tidak', selesai: false }, { id: 4, plantId: 1, aktivitas: 'Pemupukan', tanggal: dt(3), ulang: 'Mingguan', selesai: false }])
}
const user = load('session', null), auth = ['login', 'register'].includes(page);
if (!auth && !user) location.href = 'login.html';
if (auth && user) location.href = 'dashboard.html';
const P = () => load('plants', []), J = () => load('jadwal', []), pn = id => (P().find(p => p.id == id) || {}).nama || '(dihapus)';

// sidebar + logout
if ($('#side')) {
    const nav = document.body.dataset.nav || page;
    $('#side').innerHTML = '<div class="brand">🌱 TanamanKu</div>' + [['dashboard', '🏠', 'Dashboard'], ['tanaman', '🌿', 'Kelola Tanaman'], ['jadwal', '📅', 'Jadwal'], ['rekap', '📊', 'Rekap / Laporan']].map(m => `<a href="${m[0]}.html" class="${nav == m[0] ? 'on' : ''}">${m[1]} ${m[2]}</a>`).join('') + '<button class="out" id="lo">⎋ Logout</button>';
    $('#who').textContent = '👤 ' + user.nama;
    document.body.insertAdjacentHTML('beforeend', '<div class="modal" id="mo"><div class="acard"><div class="logo">👋</div><h2>Keluar dari akun?</h2><p class="muted">Anda harus login lagi untuk mengakses data.</p><button class="btn" id="yes">Ya, Logout</button><button class="btn o" id="no" style="margin-top:8px">Batal</button></div></div>');
    $('#lo').onclick = () => $('#mo').classList.add('on'); $('#no').onclick = () => $('#mo').classList.remove('on');
    $('#yes').onclick = () => { localStorage.removeItem('session'); location.href = 'login.html' }
}

// ---------- LOGIN ----------
if (page === 'login') $('#fl').onsubmit = e => {
    e.preventDefault(); const u = load('users', []).find(u => u.email === $('#email').value.trim().toLowerCase() && u.pass === $('#pass').value);
    if (!u) return $('#err').textContent = 'Email atau password salah.'; save('session', { nama: u.nama, email: u.email }); location.href = 'dashboard.html'
};

// ---------- REGISTRASI ----------
if (page === 'register') $('#fr').onsubmit = e => {
    e.preventDefault(); const n = $('#nama').value.trim(), em = $('#email').value.trim().toLowerCase(), p = $('#pass').value, E = $('#err');
    if (!n || !/^\S+@\S+\.\S+$/.test(em)) return E.textContent = 'Nama dan format email harus benar.';
    if (p.length < 8) return E.textContent = 'Password minimal 8 karakter.';
    if (p !== $('#pass2').value) return E.textContent = 'Konfirmasi password tidak sama.';
    const us = load('users', []); if (us.some(u => u.email === em)) return E.textContent = 'Email sudah terdaftar.';
    us.push({ nama: n, email: em, pass: p }); save('users', us); alert('Registrasi berhasil! Silakan login.'); location.href = 'login.html'
};

// ---------- jadwal item (dipakai dashboard & jadwal) ----------
function jItem(j) { const late = j.tanggal < today && !j.selesai; return `<div class="item ${j.selesai ? 'done' : ''}"><input type="checkbox" ${j.selesai ? 'checked' : ''} onchange="tog(${j.id})"><div class="grow"><b>${j.aktivitas}</b> – ${esc(pn(j.plantId))}<br><span class="muted">${j.tanggal} · ${j.ulang}</span></div>${late ? '<span class="tag r">Terlambat</span>' : j.selesai ? '<span class="tag">Selesai</span>' : '<span class="tag w">Menunggu</span>'}${page === 'jadwal' ? `<button class="btn sm d" onclick="delJ(${j.id})">✕</button>` : ''}</div>` }
function tog(id) { const a = J(); const j = a.find(x => x.id == id); j.selesai = !j.selesai; save('jadwal', a); toast(j.selesai ? 'Jadwal ditandai selesai' : 'Status dikembalikan'); draw() }
function delJ(id) { if (confirm('Hapus jadwal ini?')) { save('jadwal', J().filter(j => j.id != id)); draw() } }

// ---------- DASHBOARD ----------
function drawDash() {
    const a = J(), h = a.filter(j => j.tanggal === today);
    $('#stats').innerHTML = [['🌿', 'Total Tanaman', P().length], ['📅', 'Jadwal Hari Ini', h.length], ['✅', 'Selesai Hari Ini', h.filter(j => j.selesai).length], ['⏰', 'Terlambat', a.filter(j => j.tanggal < today && !j.selesai).length]].map(s => `<div class="stat"><span>${s[0]} ${s[1]}</span><b>${s[2]}</b></div>`).join('');
    $('#hari').innerHTML = h.map(jItem).join('') || '<p class="empty">Tidak ada jadwal hari ini 🎉</p>';
    $('#baru').innerHTML = P().slice(-4).reverse().map(p => `<div class="item"><span class="ava">${IC[p.jenis] || '🌱'}</span><div class="grow"><b>${esc(p.nama)}</b><br><span class="muted">${p.jenis} · ${esc(p.lokasi)}</span></div></div>`).join('')
}

// ---------- KELOLA TANAMAN ----------
function drawTan() {
    const q = $('#q').value.toLowerCase(), j = $('#fj').value;
    const r = P().filter(p => p.nama.toLowerCase().includes(q) && (!j || p.jenis === j));
    $('#tb').innerHTML = r.map((p, i) => `<tr><td>${i + 1}</td><td><span class="ava">${IC[p.jenis] || '🌱'}</span></td><td><b>${esc(p.nama)}</b></td><td><span class="tag">${p.jenis}</span></td><td>${esc(p.lokasi)}</td><td>${p.tanggal}</td><td><a class="btn sm o" href="form-tanaman.html?id=${p.id}">Edit</a> <button class="btn sm d" onclick="delP(${p.id})">Hapus</button></td></tr>`).join('') || '<tr><td colspan="7" class="empty">Data tidak ditemukan</td></tr>'
}
function delP(id) { if (confirm('Hapus tanaman beserta jadwalnya?')) { save('plants', P().filter(p => p.id != id)); save('jadwal', J().filter(j => j.plantId != id)); toast('Tanaman dihapus'); drawTan() } }

// ---------- FORM TAMBAH / EDIT ----------
function initForm() {
    const id = new URLSearchParams(location.search).get('id'), a = P(), p = a.find(x => x.id == id);
    if (p) { $('#judul').textContent = 'Edit Tanaman';['nama', 'jenis', 'lokasi', 'tanggal', 'air', 'catatan'].forEach(k => $('#' + k).value = p[k]) } else $('#tanggal').value = today;
    $('#f').onsubmit = e => {
        e.preventDefault(); const d = {};['nama', 'jenis', 'lokasi', 'tanggal', 'air', 'catatan'].forEach(k => d[k] = $('#' + k).value.trim());
        if (!d.nama || !d.jenis) return $('#err').textContent = 'Nama dan jenis wajib diisi.';
        if (p) Object.assign(p, d); else a.push({ id: nid(a), ...d }); save('plants', a); location.href = 'tanaman.html'
    }
}

// ---------- JADWAL ----------
function drawJad() {
    const s = $('#fs').value, t = $('#fa').value;
    $('#pl').innerHTML = P().map(p => `<option value="${p.id}">${esc(p.nama)}</option>`).join('');
    const r = J().filter(j => (!t || j.aktivitas === t) && (!s || (s === 'selesai') === j.selesai)).sort((a, b) => a.tanggal.localeCompare(b.tanggal));
    $('#lj').innerHTML = r.map(jItem).join('') || '<p class="empty">Belum ada jadwal</p>'
}
function initJad() {
    $('#tgl').value = today; $('#fjd').onsubmit = e => {
        e.preventDefault(); const a = J();
        if (!$('#pl').value) return toast('Tambahkan tanaman terlebih dahulu');
        a.push({ id: nid(a), plantId: +$('#pl').value, aktivitas: $('#akt').value, tanggal: $('#tgl').value, ulang: $('#ulang').value, selesai: false }); save('jadwal', a); toast('Jadwal tersimpan'); drawJad()
    }
}

// ---------- REKAP ----------
function drawRek() {
    const d1 = $('#d1').value, d2 = $('#d2').value, t = $('#fa').value;
    const r = J().filter(j => (!d1 || j.tanggal >= d1) && (!d2 || j.tanggal <= d2) && (!t || j.aktivitas === t)), ok = r.filter(j => j.selesai).length, late = r.filter(j => j.tanggal < today && !j.selesai).length;
    $('#sum').innerHTML = [['Total Jadwal', r.length], ['Selesai', ok + (r.length ? ` (${Math.round(ok / r.length * 100)}%)` : '')], ['Terlewat', late]].map(s => `<div class="stat"><span>${s[0]}</span><b>${s[1]}</b></div>`).join('');
    $('#chart').innerHTML = ['Penyiraman', 'Pemupukan'].map(k => { const x = r.filter(j => j.aktivitas === k), y = x.filter(j => j.selesai).length; return `<b>${k}</b> <span class="muted">${y}/${x.length} selesai</span><div class="pb"><i style="width:${x.length ? y / x.length * 100 : 0}%"></i></div>` }).join('');
    $('#tr').innerHTML = r.sort((a, b) => b.tanggal.localeCompare(a.tanggal)).map(j => `<tr><td>${j.tanggal}</td><td>${esc(pn(j.plantId))}</td><td>${j.aktivitas}</td><td><span class="tag ${j.selesai ? '' : j.tanggal < today ? 'r' : 'w'}">${j.selesai ? 'Selesai' : j.tanggal < today ? 'Terlewat' : 'Menunggu'}</span></td></tr>`).join('') || '<tr><td colspan="4" class="empty">Data kosong</td></tr>'
}

// ---------- jalankan sesuai halaman ----------
const draw = { dashboard: drawDash, tanaman: drawTan, jadwal: drawJad, rekap: drawRek }[page] || (() => { });
if (page === 'form') initForm(); if (page === 'jadwal') initJad();
document.querySelectorAll('#q,#fj,#fs,#fa,#d1,#d2').forEach(e => e.addEventListener('input', draw));
draw();
