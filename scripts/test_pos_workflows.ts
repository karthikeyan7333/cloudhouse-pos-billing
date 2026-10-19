import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

async function runTests() {
  console.log('=== STARTING CLOUDHOUSE POS AUTOMATED VERIFICATION SUITE ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await axios.get(`${BASE_URL}/health`);
    assert(health.status === 200 && health.data.status === 'healthy', '1. Server Health Check endpoint');

    // 2. Admin Login
    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@cloudhousepos.com',
      password: 'Admin@123',
    });
    const adminToken = adminLogin.data.token;
    assert(adminLogin.data.success && !!adminToken, '2. Admin Login with valid credentials');

    // 3. Staff Login
    const staffLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'staff@cloudhousepos.com',
      password: 'Staff@123',
    });
    const staffToken = staffLogin.data.token;
    assert(staffLogin.data.success && staffLogin.data.user.role === 'staff', '3. Staff Login with valid credentials');

    // 4. Invalid Credentials Login
    let invalidCaught = false;
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: 'staff@cloudhousepos.com',
        password: 'WrongPassword999!',
      });
    } catch (err: any) {
      invalidCaught = err.response?.status === 401;
    }
    assert(invalidCaught, '4. Invalid password rejected with HTTP 401');

    // 5. Role-based Authorization: Staff attempting admin-only product creation
    let forbiddenCaught = false;
    try {
      await axios.post(
        `${BASE_URL}/products`,
        { name: 'Unauthorized Garment', sku: 'UNAUTH-01', category: 'dummy', sellingPrice: 999 },
        { headers: { Authorization: `Bearer ${staffToken}` } }
      );
    } catch (err: any) {
      forbiddenCaught = err.response?.status === 403;
    }
    assert(forbiddenCaught, '5. Staff blocked from admin-only Product Creation with HTTP 403');

    // 6. Admin Product CRUD
    const newSku = `TEST-KURT-${Date.now().toString().slice(-4)}`;
    const catRes = await axios.get(`${BASE_URL}/categories`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const testCatId = catRes.data.categories[0]._id;

    const prodCreate = await axios.post(
      `${BASE_URL}/products`,
      {
        name: 'Automated Test Silk Kurti',
        sku: newSku,
        category: testCatId,
        costPrice: 800,
        sellingPrice: 1600,
        stockQuantity: 10,
        taxRate: 5,
        variants: [
          { size: 'M', color: 'Navy', sku: `${newSku}-M`, stock: 10 },
        ],
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const createdProductId = prodCreate.data.product._id;
    assert(prodCreate.data.success && prodCreate.data.product.sku === newSku, '6a. Product created successfully by Admin');

    // Fetch product
    const prodGet = await axios.get(`${BASE_URL}/products/${createdProductId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(prodGet.data.product.name === 'Automated Test Silk Kurti', '6b. Product retrieved with accurate attributes');

    // 7. POS Checkout: Staff bills 2 units
    const checkoutRes = await axios.post(
      `${BASE_URL}/billing/checkout`,
      {
        items: [
          {
            productId: createdProductId,
            variantSku: `${newSku}-M`,
            quantity: 2,
            discountPercentage: 10,
          },
        ],
        customerName: 'Test Buyer',
        customerPhone: '+91 99999 88888',
        paymentMethod: 'CASH',
        amountPaid: 5000,
      },
      { headers: { Authorization: `Bearer ${staffToken}` } }
    );
    const bill = checkoutRes.data.bill;
    assert(checkoutRes.data.success && bill.billNumber.startsWith('CH-'), '7a. Staff Checkout successful with unique bill number');

    // Verify Stock Reduction
    const prodAfterSale = await axios.get(`${BASE_URL}/products/${createdProductId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(prodAfterSale.data.product.stockQuantity === 8, '7b. Inventory decremented accurately from 10 to 8 units');

    // 8. Prevent Negative Stock / Over-selling
    let outOfStockCaught = false;
    try {
      await axios.post(
        `${BASE_URL}/billing/checkout`,
        {
          items: [
            {
              productId: createdProductId,
              variantSku: `${newSku}-M`,
              quantity: 20, // Only 8 left!
            },
          ],
          paymentMethod: 'CASH',
          amountPaid: 50000,
        },
        { headers: { Authorization: `Bearer ${staffToken}` } }
      );
    } catch (err: any) {
      outOfStockCaught = err.response?.status === 400 && err.response?.data?.message?.includes('Insufficient stock');
    }
    assert(outOfStockCaught, '8. Over-selling / negative stock prevented with error message');

    // 9. Process Partial Return & Validate Remaining Quantity
    const billItemId = bill.items[0]._id || bill.items[0].productId;
    const returnRes = await axios.post(
      `${BASE_URL}/returns`,
      {
        billId: bill._id,
        itemsToReturn: [
          {
            billItemId,
            returnedQuantity: 1,
            disposition: 'RESTOCK',
            reason: 'Customer requested size exchange',
          },
        ],
        refundPaymentMethod: 'CASH',
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(returnRes.data.success && returnRes.data.returnRecord.returnNumber.startsWith('RET-'), '9a. Partial Return processed with return number');

    // Verify Restocked Inventory
    const prodAfterReturn = await axios.get(`${BASE_URL}/products/${createdProductId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(prodAfterReturn.data.product.stockQuantity === 9, '9b. Restock disposition added 1 unit back to stock (8 -> 9)');

    // 10. Prevent Returning More than Billed (Return quantity validation)
    let excessReturnCaught = false;
    try {
      await axios.post(
        `${BASE_URL}/returns`,
        {
          billId: bill._id,
          itemsToReturn: [
            {
              billItemId,
              returnedQuantity: 2, // Only 1 remaining returnable!
              disposition: 'RESTOCK',
              reason: 'Excessive return test',
            },
          ],
          refundPaymentMethod: 'CASH',
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
    } catch (err: any) {
      excessReturnCaught = err.response?.status === 400 && err.response?.data?.message?.includes('remaining returnable');
    }
    assert(excessReturnCaught, '10. Excessive returns exceeding billed quantity blocked');

    // 11. Financial Ledger Synchronization
    const ledgerRes = await axios.get(`${BASE_URL}/ledger`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const latestEntries = ledgerRes.data.entries;
    const hasSaleEntry = latestEntries.some((e: any) => e.referenceNumber === bill.billNumber && e.credit > 0);
    const hasReturnEntry = latestEntries.some((e: any) => e.referenceNumber === returnRes.data.returnRecord.returnNumber && e.debit > 0);
    assert(hasSaleEntry && hasReturnEntry, '11. Double-entry ledger verified: Credit for Sale & Debit for Return');

    // 12. Reports Analytics
    const reportsRes = await axios.get(`${BASE_URL}/reports/analytics?period=monthly`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      reportsRes.data.success &&
      reportsRes.data.reports.summary.grossSales > 0 &&
      reportsRes.data.reports.summary.refundsTotal > 0,
      '12. Multi-period reports computed from actual stored records'
    );

    console.log(`\n=== SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED ===\n`);
    if (failed > 0) process.exit(1);
  } catch (error: any) {
    console.error('Fatal error in test runner:', error.message);
    process.exit(1);
  }
}

runTests();
