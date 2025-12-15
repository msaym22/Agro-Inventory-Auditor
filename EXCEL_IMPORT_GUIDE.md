# Excel Import Guide for Almadina-Agro

## ✅ **Your Excel Format is Fully Supported!**

The software can automatically extract data from your Excel sheet with the following column mappings:

### **Column Mapping**
| Your Excel Column | Software Field | Description |
|------------------|----------------|-------------|
| `EnglishName` | Product Name | Main product identifier |
| `Supplier` | Supplier | Vendor/supplier name |
| `inventory` | Stock | Current stock quantity |
| `location` | Storage Location | Warehouse/location |
| `selling price` | Selling Price | Product selling price |

### **How to Import**

1. **Go to Products Page** in the software
2. **Click "Import Products"** button
3. **Select your Excel file** (.xlsx or .xls)
4. **Click Upload** - the software will automatically:
   - Map your columns to the correct fields
   - Create new products or update existing ones
   - Show you a summary of results

### **Supported Column Variations**

The software is smart and can recognize these column name variations:

#### **Product Name**
- `EnglishName`, `englishname`, `english_name`, `englishName`
- `name`, `Name`, `product`, `Product`

#### **Supplier**
- `Supplier`, `supplier`, `vendor`, `Vendor`
- `supplier_name`, `supplierName`

#### **Stock/Inventory**
- `inventory`, `Inventory`, `stock`, `Stock`
- `quantity`, `Quantity`

#### **Location**
- `location`, `Location`, `storageLocation`
- `SKU`, `sku`, `warehouse`, `Warehouse`

#### **Price Fields**
- `selling price`, `sellingPrice`, `selling_price`
- `price`, `Price`
- `purchasePrice`, `purchase_price`, `cost`, `Cost`

### **Import Results**

After import, you'll see:
- ✅ **Created**: Number of new products added
- ✅ **Updated**: Number of existing products updated
- ⚠️ **Skipped**: Rows that couldn't be processed
- ❌ **Errors**: Any issues encountered (with row numbers)

### **Example Import Process**

1. **Your Excel** (Q15.xlsx):
   ```
   EnglishName    | Supplier        | inventory | location | selling price
   Muhammad Amin  | Muhammad Hussain| 1         | 192/EB   | 1693
   Ikram          | Ata Muhammad    | 2         | 192/EB   | 5826
   ```

2. **Software automatically creates**:
   - Product: "Muhammad Amin"
   - Supplier: "Muhammad Hussain"
   - Stock: 1
   - Location: "192/EB"
   - Selling Price: 1693

### **Tips for Best Results**

1. **Keep your Excel format** - it's already perfect!
2. **Ensure first row has headers** (like "EnglishName", "Supplier", etc.)
3. **Remove empty rows** before importing
4. **Check for duplicate names** - software will update existing products
5. **Verify numeric values** are properly formatted

### **Troubleshooting**

If import fails:
1. Check the console logs for detailed error messages
2. Ensure Excel file is not corrupted
3. Verify column names match the supported variations
4. Check that numeric fields contain valid numbers

The software will show you exactly which rows had issues and why!
