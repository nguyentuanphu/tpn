"""Offline cost/idempotency tests. Fake transports only; no Meshy requests."""
from datetime import datetime,timezone
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import run_batch as batch

class BatchTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.db = batch.journal(self.root/'jobs.sqlite3')
        self.account = dict(verifiedAt=datetime.now(timezone.utc).isoformat(),
            sameAccountAsKey=True,privateAssetsConfirmed=True,apiCreditBalanceConfirmed=True,
            pricingConfirmed=True,batchStartingAPIBalance=1000,claraPilotAccepted=True)
        self.spec = dict(assetId='clara',plannedCredits=30,parameters={},inputImages=[])
    def tearDown(self):
        self.db.close()
        self.temp.cleanup()
    def test_duplicate_does_not_call_transport_twice(self):
        calls=[]
        def send(*args):calls.append(args);return {'result':'task-123'}
        with patch.object(batch,'payload_for',return_value={'views':'fixture'}):
            batch.submit(self.db,self.spec,self.account,send)
            with self.assertRaises(ValueError):batch.submit(self.db,self.spec,self.account,send)
        self.assertEqual(len(calls),1)
    def test_lost_response_survives_restart_and_blocks_batch(self):
        def lost(*args):raise TimeoutError('response lost')
        with patch.object(batch,'payload_for',return_value={}):
            with self.assertRaises(TimeoutError):batch.submit(self.db,self.spec,self.account,lost)
        self.db.close();self.db=batch.journal(self.root/'jobs.sqlite3')
        self.assertEqual(self.db.execute('SELECT state,cost FROM jobs').fetchone(),('ambiguous',30))
        with self.assertRaises(ValueError):batch.reserve(self.db,'finn',30,'hash',1000)
    def test_990_cap_keeps_ten_credit_reserve(self):
        for n in range(33):
            batch.reserve(self.db,str(n),30,'hash',1000)
            self.db.execute("UPDATE jobs SET state='SUCCEEDED' WHERE asset=?",(str(n),));self.db.commit()
        with self.assertRaises(ValueError):batch.reserve(self.db,'overflow',15,'hash',1000)
        self.assertEqual(self.db.execute('SELECT SUM(cost) FROM jobs').fetchone()[0],990)
    def test_actual_balance_also_limits_reservations(self):
        with self.assertRaises(ValueError):batch.reserve(self.db,'clara',30,'hash',39)
        self.assertEqual(self.db.execute('SELECT COUNT(*) FROM jobs').fetchone()[0],0)
    def test_unverified_account_makes_no_reservation(self):
        self.account['privateAssetsConfirmed']=False
        with self.assertRaises(ValueError):batch.submit(self.db,self.spec,self.account,lambda *a:self.fail('network'))
        self.assertEqual(self.db.execute('SELECT COUNT(*) FROM jobs').fetchone()[0],0)
    def test_changed_input_is_rejected(self):
        path=self.root/'front.png';path.write_bytes(b'original')
        spec={'parameters':{},'inputImages':[{'localPath':'front.png','sha256':hashlib.sha256(b'original').hexdigest()}]}
        path.write_bytes(b'changed')
        with patch.object(batch,'OUT',self.root),self.assertRaisesRegex(ValueError,'changed'):
            batch.payload_for(spec)
    def test_bad_response_is_ambiguous(self):
        with patch.object(batch,'payload_for',return_value={}),self.assertRaises(ValueError):
            batch.submit(self.db,self.spec,self.account,lambda *a:{'unexpected':'shape'})
        self.assertEqual(self.db.execute('SELECT state FROM jobs').fetchone()[0],'ambiguous')
    def test_clara_pilot_gate(self):
        self.account['claraPilotAccepted']=False;self.spec['assetId']='finn'
        with self.assertRaisesRegex(ValueError,'Clara pilot'):batch.check_account(self.account,self.spec)
    def test_no_credentials_in_live_journal_under_repo(self):
        with self.assertRaises(ValueError):batch.journal(batch.ROOT/'bad.sqlite3')
    def test_raw_download_cannot_replace_game_models(self):
        with self.assertRaises(ValueError):batch.download(self.db,'clara',batch.ROOT/'models')

if __name__=='__main__':unittest.main()
