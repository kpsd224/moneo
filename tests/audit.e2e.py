"""Regression suite for transaction corrections, offline JSON backup/restore and CSV."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json, tempfile, threading, http.server, socketserver

SITE=Path(__file__).resolve().parents[2]/'site'
class Silent(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args): pass

def run():
    with tempfile.TemporaryDirectory() as tmp:
        with socketserver.TCPServer(('127.0.0.1',0), lambda *args,**kwargs: Silent(*args, directory=str(SITE), **kwargs)) as server:
            threading.Thread(target=server.serve_forever,daemon=True).start()
            url=f'http://127.0.0.1:{server.server_address[1]}/'
            with sync_playwright() as p:
                browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
                page=browser.new_page(viewport={'width':390,'height':844},accept_downloads=True)
                errors=[]
                page.on('pageerror',lambda e: errors.append(str(e)))
                page.goto('about:blank')
                page.set_content((SITE/'index.html').read_text(),wait_until='load')
                # Edit originally 1.6m rent, moving from BNI to cash, and another month.
                page.locator('[data-tab="activity"]').click()
                assert page.locator('.tx-actions button[aria-label="Edit transaksi"]').count()==3
                page.locator('.tx',has_text='Sewa rumah').get_by_role('button',name='Edit transaksi').click()
                assert 'Edit transaksi' in page.locator('.modal-head h2').inner_text()
                assert page.locator('#amount').input_value()=='1600000'
                page.locator('#amount').fill('900000')
                page.locator('#acc').select_option('cash')
                page.locator('#date').fill('2025-02-03')
                page.locator('#note').fill('Sewa dibetulkan')
                page.get_by_role('button',name='Simpan perubahan').click()
                assert page.locator('#period-label').inner_text()=='Februari 2025'
                assert page.evaluate("data.transactions.length")==3
                assert page.evaluate("data.transactions.find(t=>t.id==='demo-1').amount")==900000
                assert page.evaluate("balance('bni')")==5300000
                assert page.evaluate("balance('cash')")==-600000
                assert page.locator('.tx',has_text='Sewa dibetulkan').count()==1
                # Invalid calendar date must not change data (input type date browser rejects it).
                page.locator('.tx',has_text='Sewa dibetulkan').get_by_role('button',name='Edit transaksi').click()
                page.locator('#amount').fill('0')
                page.get_by_role('button',name='Simpan perubahan').click()
                assert 'Periksa nominal' in page.locator('#formError').inner_text()
                page.locator('.close').click()
                assert page.evaluate("balance('cash')")==-600000
                # Export JSON and CSV should work from static pages, no backend.
                page.locator('.square-btn').click()
                with page.expect_download() as info:
                    page.get_by_role('button',name='Unduh backup JSON').click()
                download=info.value
                content=Path(tmp,'backup.json')
                download.save_as(content)
                backup=json.loads(content.read_text())
                assert backup['app']=='ana-budget' and backup['backupVersion']==1
                assert len(backup['book']['entries'])==3
                with page.expect_download() as info:
                    page.get_by_role('button',name='Ekspor transaksi CSV').click()
                csv=Path(tmp,'report.csv')
                info.value.save_as(csv)
                assert 'Sewa dibetulkan' in csv.read_text(encoding='utf-8-sig')
                # Backup file can restore data after deletion and keeps year/period.
                page.locator('.close').click()
                page.locator('.tx',has_text='Sewa dibetulkan').get_by_role('button',name='Hapus transaksi').click()
                page.get_by_role('button',name='Hapus transaksi').last.click()
                assert page.evaluate('data.transactions.length')==2
                page.locator('.square-btn').click()
                page.locator('#restore-file').set_input_files(str(content))
                page.wait_for_timeout(250)
                assert '3 transaksi' in page.locator('#sheet').inner_text(), page.locator('#sheet').inner_text()[:900]
                page.get_by_role('button',name='Ya, pulihkan data').click()
                assert page.evaluate('data.transactions.length')==3
                assert page.evaluate("balance('cash')")==-600000
                # Browser context blocks localStorage in this sandbox; persistence is covered by the Node VM state test.
                # Invalid backup must fail without altering any ledger rows.
                page.locator('.square-btn').click()
                bad=backup.copy()
                bad['book']=json.loads(json.dumps(bad['book']))
                bad['book']['entries'][0]['accountId']='deleted-account'
                page.locator('#restore-file').set_input_files({'name':'bad.json','mimeType':'application/json','buffer':json.dumps(bad).encode()})
                page.wait_for_function("document.querySelector('#formError')?.textContent.includes('Backup ditolak')")
                assert page.evaluate('data.transactions.length')==3
                page.locator('.close').click()
                page.locator('[data-tab="activity"]').click()
                page.screenshot(path=str(SITE.parent/'audit-mobile.png'),full_page=False)
                assert not errors,errors
                browser.close()
            server.shutdown()
run()
print('PASS: Browser transaction edit, totals, invalid input, backup JSON, CSV, restore, corrupt backup rejection')
