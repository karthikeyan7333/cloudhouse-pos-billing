import bcrypt from 'bcryptjs';
import { dataService } from '../services/dataService.js';
import { dbStore } from '../storage/store.js';

export async function seedDatabase(force = false) {
  try {
    console.log('Verifying demo catalog & accounts for CloudHouse POS...');

    // 1. Seed Users (Admin & Staff) idempotently
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@cloudhousepos.com').toLowerCase();
    const staffEmail = (process.env.STAFF_EMAIL || 'staff@cloudhousepos.com').toLowerCase();

    let adminUser = await dataService.findUserByEmail(adminEmail);
    if (!adminUser || force) {
      const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
      const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
      adminUser = await dataService.createUser({
        name: process.env.ADMIN_NAME || 'CloudHouse Store Manager',
        email: adminEmail,
        password: hashedAdminPassword,
        role: 'admin',
        phone: '+91 98401 23456',
        isActive: true,
      });
      console.log(`Admin account initialized: ${adminEmail}`);
    }

    let staffUser = await dataService.findUserByEmail(staffEmail);
    if (!staffUser || force) {
      const staffPassword = process.env.STAFF_PASSWORD || 'Staff@123';
      const hashedStaffPassword = await bcrypt.hash(staffPassword, 10);
      staffUser = await dataService.createUser({
        name: process.env.STAFF_NAME || 'Raghav Sharma (Cashier)',
        email: staffEmail,
        password: hashedStaffPassword,
        role: 'staff',
        phone: '+91 98401 98765',
        isActive: true,
      });
      console.log(`Staff account initialized: ${staffEmail}`);
    }

    // 2. Seed Categories Idempotently
    const categorySeeds = [
      {
        name: 'Pure Silk & Handlooms',
        code: 'SILK',
        description: 'Authentic Kanchipuram, Banarasi and Mysore Silk Sarees & Dhotis',
      },
      {
        name: 'Men Premium Shirts',
        code: 'MSHIRT',
        description: 'Linen, pure Egyptian cotton, formal and casual button-down shirts',
      },
      {
        name: 'Women Ethnic Wear & Kurtis',
        code: 'WETHNIC',
        description: 'Anarkalis, designer Kurtas, palazzo sets and dupattas',
      },
      {
        name: 'Suiting & Shirting Fabrics',
        code: 'FABRICS',
        description: 'Unstitched premium Raymond, Arvind and Italian wool blends',
      },
      {
        name: 'Shawls & Stoles',
        code: 'ACC',
        description: 'Pashmina shawls, silk scarves and embroidered stoles',
      },
    ];

    const categoryMap: Record<string, any> = {};
    for (const catSeed of categorySeeds) {
      let existingCat = await dataService.findCategoryByCode(catSeed.code);
      if (!existingCat) {
        existingCat = await dataService.createCategory({ ...catSeed, isActive: true });
      }
      categoryMap[catSeed.code] = existingCat;
    }

    // 3. Seed Suppliers Idempotently
    const supplierSeeds = [
      {
        name: 'Kanchipuram Heritage Weavers Co-op',
        code: 'SUP-KANCHI',
        contactPerson: 'S. Ramanathan',
        email: 'ramanathan@kanchiweavers.org',
        phone: '+91 94440 11223',
        address: '24 Gandhi Road, Kanchipuram, Tamil Nadu 631501',
        gstin: '33AABCK1122P1Z5',
        notes: 'Direct handloom source for Pure Zari Kanchipuram Sarees',
      },
      {
        name: 'Arvind Lifestyle Fabrics Ltd',
        code: 'SUP-ARVIND',
        contactPerson: 'Deepak Mehta',
        email: 'sales@arvindtextiles.in',
        phone: '+91 79 6600 0000',
        address: 'Naroda Road, Ahmedabad, Gujarat 380025',
        gstin: '24AAACA0000A1Z9',
        notes: 'Supplier for premium linen and luxury shirting fabric',
      },
      {
        name: 'Raymond Mills Wholesale Depot',
        code: 'SUP-RAYMOND',
        contactPerson: 'Vijay Singhania',
        email: 'vijay@raymonddistributors.com',
        phone: '+91 22 2580 8888',
        address: 'Pokhran Road No. 1, Jekegram, Thane, Maharashtra 400606',
        gstin: '27AAACR1234F1Z1',
        notes: 'Wool blend suitings and festive readymades',
      },
    ];

    const supplierMap: Record<string, any> = {};
    for (const supSeed of supplierSeeds) {
      let existingSup = await dataService.findSupplierByCode(supSeed.code);
      if (!existingSup) {
        existingSup = await dataService.createSupplier({ ...supSeed, isActive: true });
      }
      supplierMap[supSeed.code] = existingSup;
    }

    // 4. Seed Products Idempotently
    const adminAuthInfo = { id: adminUser._id.toString(), name: adminUser.name };

    const productSeeds = [
      {
        name: 'Kanchipuram Bridal Silk Saree (Gold Zari Temple Border)',
        sku: 'SILK-KNC-001',
        barcode: '890123400001',
        catCode: 'SILK',
        supCode: 'SUP-KANCHI',
        description: 'Authentic 6-yard pure mulberry silk saree woven with real gold electroplated zari.',
        material: '100% Pure Mulberry Silk',
        variants: [
          { size: 'Free Size', color: 'Royal Crimson Red', sku: 'SILK-KNC-001-RED', stock: 8, barcode: '890123400101' },
          { size: 'Free Size', color: 'Peacock Green', sku: 'SILK-KNC-001-GRN', stock: 6, barcode: '890123400102' },
          { size: 'Free Size', color: 'Temple Yellow', sku: 'SILK-KNC-001-YLW', stock: 4, barcode: '890123400103' },
        ],
        costPrice: 9500,
        sellingPrice: 15999,
        stockQuantity: 18,
        reorderThreshold: 5,
        taxRate: 5,
      },
      {
        name: 'Classic Linen Slim-Fit Casual Shirt',
        sku: 'SHRT-LIN-002',
        barcode: '890123400002',
        catCode: 'MSHIRT',
        supCode: 'SUP-ARVIND',
        description: 'Breathable 100% European flax linen shirt featuring pearl buttons and a spread collar.',
        material: '100% Pure Linen',
        variants: [
          { size: '38 (M)', color: 'Powder Blue', sku: 'SHRT-LIN-002-BLU-M', stock: 12, barcode: '890123400201' },
          { size: '40 (L)', color: 'Powder Blue', sku: 'SHRT-LIN-002-BLU-L', stock: 15, barcode: '890123400202' },
          { size: '42 (XL)', color: 'Powder Blue', sku: 'SHRT-LIN-002-BLU-XL', stock: 8, barcode: '890123400203' },
          { size: '40 (L)', color: 'Crisp White', sku: 'SHRT-LIN-002-WHT-L', stock: 14, barcode: '890123400204' },
          { size: '42 (XL)', color: 'Crisp White', sku: 'SHRT-LIN-002-WHT-XL', stock: 2, barcode: '890123400205' },
        ],
        costPrice: 950,
        sellingPrice: 1899,
        stockQuantity: 51,
        reorderThreshold: 10,
        taxRate: 5,
      },
      {
        name: 'Chanderi Embroidered Festive Anarkali Set',
        sku: 'KURT-CHN-003',
        barcode: '890123400003',
        catCode: 'WETHNIC',
        supCode: 'SUP-RAYMOND',
        description: 'Handcrafted floral zari embroidery with matching santoon pants and organza dupatta.',
        material: 'Chanderi Silk Cotton',
        variants: [
          { size: 'S', color: 'Dusty Peach', sku: 'KURT-CHN-003-PCH-S', stock: 5, barcode: '890123400301' },
          { size: 'M', color: 'Dusty Peach', sku: 'KURT-CHN-003-PCH-M', stock: 7, barcode: '890123400302' },
          { size: 'L', color: 'Dusty Peach', sku: 'KURT-CHN-003-PCH-L', stock: 3, barcode: '890123400303' },
          { size: 'M', color: 'Emerald Green', sku: 'KURT-CHN-003-GRN-M', stock: 4, barcode: '890123400304' },
        ],
        costPrice: 2200,
        sellingPrice: 4499,
        stockQuantity: 19,
        reorderThreshold: 6,
        taxRate: 12,
      },
      {
        name: 'Raymond Fine Merino Wool Blend Suiting Fabric (3.0m)',
        sku: 'FAB-RAY-004',
        barcode: '890123400004',
        catCode: 'FABRICS',
        supCode: 'SUP-RAYMOND',
        description: 'Super 120s luxury wool-rich unstitched fabric length for blazers and formal two-piece suits.',
        material: 'Super 120s Merino Wool Blend',
        variants: [
          { size: '3.0 Meters', color: 'Charcoal Grey', sku: 'FAB-RAY-004-CHR', stock: 8, barcode: '890123400401' },
          { size: '3.0 Meters', color: 'Midnight Navy', sku: 'FAB-RAY-004-NVY', stock: 10, barcode: '890123400402' },
        ],
        costPrice: 3200,
        sellingPrice: 5999,
        stockQuantity: 18,
        reorderThreshold: 4,
        taxRate: 5,
      },
      {
        name: 'Kashmiri Hand-Embroidered Jamawar Pashmina Shawl',
        sku: 'ACC-PSH-005',
        barcode: '890123400005',
        catCode: 'ACC',
        supCode: 'SUP-KANCHI',
        description: 'Intricate needlepoint paisley motif embroidery on soft, warm cashmere wool weave.',
        material: '100% Cashmere Pashmina',
        variants: [
          { size: '2.5m x 1.0m', color: 'Burgundy Wine', sku: 'ACC-PSH-005-WNE', stock: 2, barcode: '890123400501' },
          { size: '2.5m x 1.0m', color: 'Antique Cream', sku: 'ACC-PSH-005-CRM', stock: 2, barcode: '890123400502' },
        ],
        costPrice: 4200,
        sellingPrice: 7999,
        stockQuantity: 4,
        reorderThreshold: 5,
        taxRate: 12,
      },
    ];

    for (const pSeed of productSeeds) {
      const existingProd = await dataService.findProductBySkuOrBarcode(pSeed.sku);
      if (!existingProd) {
        const cat = categoryMap[pSeed.catCode];
        const sup = supplierMap[pSeed.supCode];
        await dataService.createProduct(
          {
            name: pSeed.name,
            sku: pSeed.sku,
            barcode: pSeed.barcode,
            category: cat?._id.toString(),
            categoryName: cat?.name,
            description: pSeed.description,
            material: pSeed.material,
            variants: pSeed.variants,
            costPrice: pSeed.costPrice,
            sellingPrice: pSeed.sellingPrice,
            stockQuantity: pSeed.stockQuantity,
            reorderThreshold: pSeed.reorderThreshold,
            supplier: sup?._id.toString(),
            supplierName: sup?.name,
            taxRate: pSeed.taxRate,
            isActive: true,
          },
          adminAuthInfo
        );
      }
    }

    // 5. Seed Initial Business Settings (only if not set)
    const existingSettings = await dataService.getSettings();
    if (!existingSettings || !existingSettings.businessName) {
      await dataService.updateSettings(
        {
          businessName: 'CloudHouse Silks & Retail Apparels',
          tagline: 'Authentic Handlooms, Sarees, Ready-to-Wear & Designer Fabrics',
          address: 'No. 45/2, Panagal Park Commercial Complex, Usman Road, T. Nagar',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600017',
          phone: '+91 98401 23456',
          email: 'billing@cloudhousepos.com',
          gstin: '33AABCC1234F1Z8',
          currencyCode: 'INR',
          currencySymbol: '₹',
          defaultTaxRate: 5,
          maxDiscountPercent: 30,
          timezone: 'Asia/Kolkata',
          receiptHeader: 'TAX INVOICE / CASH MEMO - CLOUDHOUSE TEXTILES',
          receiptFooter: 'Thank you for shopping at CloudHouse! Goods once sold can be exchanged within 7 days with original tag and bill. No cash refunds.',
        },
        adminAuthInfo
      );
    }

    // 6. Seed Initial Opening Balance in Ledger if empty
    const ledgerCheck = await dataService.getLedgerEntries({ limit: 1 });
    if (ledgerCheck.entries.length === 0) {
      await dataService.recordLedgerEntry({
        type: 'OPENING_BALANCE',
        category: 'Initial Store Capital',
        description: 'Opening register cash balance for store operations',
        debit: 0,
        credit: 50000,
        referenceType: 'MANUAL',
        performedByUserId: adminUser._id.toString(),
        performedByUserName: adminUser.name,
      });
    }

    console.log('Catalog and demo accounts verified without duplicates.');
  } catch (err) {
    console.error('Error during database seed verification:', err);
  }
}
