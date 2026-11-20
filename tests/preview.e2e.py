from playwright.sync_api import sync_playwright
from pathlib import Path
url='' # No network needed: inject the standalone HTML into about:blank
with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  page=browser.new_page(viewport={'width':430,'height':860},device_scale_factor=1)
  errors=[]
  page.on('pageerror',lambda e: errors.append(str(e)))
  page.goto('about:blank')
  page.set_content((Path(__file__).resolve().parents[1]/'preview'/'index.html').read_text(), wait_until='load')
  page.wait_for_timeout(200)
  assert page.locator('#period-label').inner_text()=='Januari 2025',page.locator('#period-label').inner_text()
  page.locator('#period-label').click()
  assert page.locator('.year-bar b').inner_text()=='2025'
  page.locator('.month-grid button').filter(has_text='Feb').first.click()
  assert page.locator('#period-label').inner_text()=='Februari 2025'
  page.locator('[data-tab="budget"]').click()
  page.locator('.segmented button',has_text='Pengeluaran').click()
  page.locator('.section-title button',has_text='+ Tambah').click()
  page.locator('#catname').fill('Parkir')
  page.locator('#newbudget').fill('350000')
  page.locator('.save-btn',has_text='Tambah kategori').click()
  assert page.locator('.bud-row',has_text='Parkir').count()==1
  page.locator('.bud-row',has_text='Parkir').click()
  page.locator('#catname').fill('Parkir & tol')
  page.locator('#newbudget').fill('450000')
  page.locator('.save-btn',has_text='Simpan perubahan').click()
  assert page.locator('.bud-row',has_text='Parkir & tol').count()==1
  page.locator('.bud-row',has_text='Parkir & tol').click()
  page.locator('.danger-btn',has_text='Hapus kategori').click()
  page.locator('.danger-btn',has_text='Hapus kategori').click()
  assert page.locator('.bud-row',has_text='Parkir & tol').count()==0
  for typ,label in [('Pemasukan','Proyek'),('Tabungan','Liburan')]:
    page.locator('.segmented button',has_text=typ).click()
    page.locator('.section-title button',has_text='+ Tambah').click()
    page.locator('#catname').fill(label)
    page.locator('#newbudget').fill('270000')
    page.locator('.save-btn',has_text='Tambah kategori').click()
    assert page.locator('.bud-row',has_text=label).count()==1
  page.locator('[data-tab="home"]').click()
  page.locator('.hero-action').click()
  assert page.locator('#sheet').get_by_text('Lainnya').count()>=1
  assert page.locator('#sheet').get_by_text('PayLater').count()==0
  page.locator('.manage-add',has_text='Tambah dompet').click()
  page.locator('#acctname').fill('Bank Mandiri')
  page.locator('#opening').fill('800000')
  page.locator('.save-btn',has_text='Simpan dompet').click()
  assert page.locator('.account-click',has_text='Bank Mandiri').count()==1
  page.locator('.account-click',has_text='Bank Mandiri').click()
  page.locator('#acctname').fill('Mandiri Utama')
  page.locator('.save-btn',has_text='Simpan dompet').click()
  assert page.locator('.account-click',has_text='Mandiri Utama').count()==1
  page.locator('.account-click',has_text='Mandiri Utama').click()
  page.locator('.danger-btn',has_text='Hapus dompet').click()
  page.locator('.danger-btn',has_text='Hapus dompet').click()
  assert page.locator('.account-click',has_text='Mandiri Utama').count()==0
  page.locator('.close').click()
  # Verify category changes persist in the active book and guarded deletion works
  page.locator('[data-tab="budget"]').click()
  page.locator('.segmented button',has_text='Tabungan').click()
  assert page.locator('.bud-row',has_text='Liburan').count()==1
  page.locator('[data-tab="home"]').click()
  page.locator('.hero-action').click()
  page.locator('.account-click',has_text='BNI').click()
  assert page.locator('.danger-btn',has_text='Hapus dompet').count()==1
  page.locator('.danger-btn',has_text='Hapus dompet').click()
  assert 'masih memiliki transaksi' in page.locator('#formError').inner_text()
  page.screenshot(path=str(Path(__file__).resolve().parents[1]/'tests'/'preview-tested.png'))
  assert not errors,errors
  print('PASS: Browser mobile calendar, category CRUD expense/income/saving, wallet CRUD, migration label and transaction-safe delete')
  browser.close()
