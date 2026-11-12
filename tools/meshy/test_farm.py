"""Offline farm approval, cap and lost-response checks. No network."""
import tempfile, unittest
from pathlib import Path
from datetime import datetime, timezone
from unittest.mock import patch
import run_batch as b

class FarmTests(unittest.TestCase):
    def test_guards(self):
        account=dict(verifiedAt=datetime.now(timezone.utc).isoformat(),apiCreditBalanceConfirmed=True,batchStartingAPIBalance=1614,creditCap=120,approvedTierOverrides=['cow','sheep','chicken'])
        for asset in account['approvedTierOverrides']:
            spec=b.spec_for(asset); b.check_account(account,spec)
            self.assertEqual(len(b.payload_for(spec)['image_urls']),3)
        with tempfile.TemporaryDirectory() as t:
            db=b.journal(Path(t)/'j.sqlite3'); calls=[]
            def lost(*args): calls.append(1); raise TimeoutError()
            with patch.object(b,'payload_for',return_value={}):
                with self.assertRaises(TimeoutError): b.submit(db,b.spec_for('cow'),account,lost)
                with self.assertRaises(ValueError): b.submit(db,b.spec_for('cow'),account,lost)
            self.assertEqual(len(calls),1)
            db.execute('DELETE FROM jobs'); db.commit()
            db.execute('CREATE TABLE remesh (cost INTEGER, state TEXT)')
            db.execute("INSERT INTO remesh VALUES (95,'SUCCEEDED')"); db.commit()
            with self.assertRaises(ValueError): b.reserve(db,'cow',30,'x',1614,120)
            db.close()
        account['approvedTierOverrides']=[]
        with self.assertRaises(ValueError): b.check_account(account,b.spec_for('cow'))

if __name__=='__main__': unittest.main()
