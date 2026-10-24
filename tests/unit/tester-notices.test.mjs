import test from 'node:test';
import assert from 'node:assert/strict';
import {resizeDeliveryNotice,publicFixedVersion} from '../../js/tester-detection.js';
test('only the browser ResizeObserver delivery notices are ignored',()=>{
 for(const message of ['ResizeObserver loop limit exceeded','ResizeObserver loop completed with undelivered notifications.'])assert.equal(resizeDeliveryNotice(message),true);
 for(const message of ['ResizeObserver callback threw','TypeError: ResizeObserver loop is undefined','ResizeObserver loop completed with undelivered notifications. More errors','ReferenceError: unknown'])assert.equal(resizeDeliveryNotice(message),false);
});
test('tester lists show public versions, retaining old stored rounds privately',()=>{
 assert.equal(publicFixedVersion('r89'),'');assert.equal(publicFixedVersion('r90'),'v1');
 assert.equal(publicFixedVersion('v1'),'v1');assert.equal(publicFixedVersion('v1.01'),'v1.01');assert.equal(publicFixedVersion('v2.00'),'v2.00');
 assert.equal(publicFixedVersion('r91'),'');assert.equal(publicFixedVersion('bad'),'');
});
