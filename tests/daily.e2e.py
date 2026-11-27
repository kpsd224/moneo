"""Daily-ledger smoke test. Runs standalone HTML inside Chromium without web access."""
from pathlib import Path
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox', '--disable-dev-shm-usage'])
    page = browser.new_page(viewport={'width':390,'height':844}, device_scale_factor=1)
    failures = []
    page.on('pageerror',lambda error: failures.append(str(error)))
    page.goto('about:blank')
    page.set_content((Path(__file__).resolve().parents[1] / 'preview/index.html').read_text(), wait_until='load')
    page.locator('[data-tab="activity"]').click()
    assert page.get_by_text('3 transaksi', exact=True).count() == 1
    page.get_by_role('button', name='Buka kalender transaksi harian').click()
    assert page.get_by_role('button',name='Kamis, 2 Januari 2025, 2 transaksi').count() == 1
    page.get_by_role('button',name='Jumat, 3 Januari 2025, 1 transaksi').count() == 1
    page.get_by_role('button',name='Kamis, 2 Januari 2025, 2 transaksi').click()
    assert page.locator('.day-date').inner_text() == 'Kamis, 2 Januari 2025'
    assert page.get_by_text('2 transaksi', exact=False).count() >= 1
    assert page.locator('#activity-list .tx').count() == 2
    assert page.locator('.day-stats').inner_text().find('Rp 5.300.000') >= 0
    assert page.locator('.day-stats').inner_text().find('Rp 1.600.000') >= 0
    page.get_by_role('button',name='Hari berikutnya').click()
    assert page.locator('.day-date').inner_text() == 'Jumat, 3 Januari 2025'
    assert page.locator('#activity-list .tx').count() == 1
    page.get_by_role('button',name='Hari berikutnya').click()
    assert page.locator('.day-date').inner_text() == 'Sabtu, 4 Januari 2025'
    assert page.locator('#activity-list .tx').count() == 0
    assert 'Tidak ada transaksi pada tanggal ini' in page.locator('#activity-list').inner_text() if 'Tidak ada transaksi pada tanggal ini' in page.locator('#activity-list').inner_text() else 'Tidak ada transaksi yang cocok' in page.locator('#activity-list').inner_text()
    page.locator('.day-actions button', has_text='Semua tanggal').click()
    assert page.locator('#activity-list .tx').count() == 3
    page.get_by_role('button',name='Buka kalender transaksi harian').click()
    page.get_by_role('button',name='Kalender bulan sebelumnya').click()
    assert page.get_by_text('Desember 2024').count() >= 1
    page.get_by_role('button',name='Selasa, 31 Desember 2024, 0 transaksi').click()
    assert page.locator('#period-label').inner_text() == 'Desember 2024'
    page.get_by_role('button',name='Hari berikutnya').click()
    assert page.locator('.day-date').inner_text() == 'Rabu, 1 Januari 2025'
    page.get_by_role('button',name='Hari berikutnya').click()
    assert page.locator('.day-date').inner_text() == 'Kamis, 2 Januari 2025'
    # A newly added transaction on this day should be immediately reflected in its day ledger.
    page.get_by_role('button',name='Tambah transaksi').click()
    assert page.locator('#date').input_value() == '2025-01-02'
    page.locator('#amount').fill('25000')
    page.locator('#note').fill('Tes beli makan')
    page.locator('#cat').select_option('rent')
    page.locator('#acc').select_option('bni')
    page.get_by_role('button',name='Simpan transaksi').click()
    assert page.locator('#activity-list .tx').count() == 3
    assert page.locator('.day-date').inner_text() == 'Kamis, 2 Januari 2025'
    assert 'Rp 1.625.000' in page.locator('.day-stats').inner_text() # exact, not rounded
    assert 'Tes beli makan' in page.locator('#activity-list').inner_text()
    saved = page.evaluate("data.transactions")
    assert any(t['note']=='Tes beli makan' and t['date']=='2025-01-02' for t in saved)
    assert not failures, failures
    page.screenshot(path=str(Path(__file__).resolve().parents[1]/'tests'/'daily-tested.png'))
    print('PASS: Daily calendar markers, day filter/totals, next day + month boundary, add-on-selected-date, storage')
    browser.close()
