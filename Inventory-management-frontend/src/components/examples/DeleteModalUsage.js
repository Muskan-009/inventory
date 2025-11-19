import React from 'react';
import { useDeleteModal } from '../../context/DeleteModalContext';

// Example component showing how to use the global delete modal
const DeleteModalUsage = () => {
  const { showDeleteModal } = useDeleteModal();

  // Example 1: Simple delete confirmation
  const handleDeleteUser = (userName) => {
    showDeleteModal({
      title: 'Are you sure?',
      message: `Confirm to delete user: ${userName}!`,
      itemName: userName,
      onConfirm: () => {
        // Your delete logic here
        console.log(`Deleting user: ${userName}`);
        // Example: deleteUser(userName);
      },
      onCancel: () => {
        console.log('Delete cancelled');
      }
    });
  };

  // Example 2: Custom warning with different colors
  const handleWarningAction = () => {
    showDeleteModal({
      title: 'Warning!',
      message: 'This action will affect multiple records. Are you sure you want to continue?',
      confirmText: 'CONTINUE',
      cancelText: 'CANCEL',
      type: 'warning',
      onConfirm: () => {
        console.log('Warning action confirmed');
      }
    });
  };

  // Example 3: Info type modal
  const handleInfoAction = () => {
    showDeleteModal({
      title: 'Confirm Action',
      message: 'Do you want to proceed with this operation?',
      confirmText: 'PROCEED',
      cancelText: 'ABORT',
      type: 'info',
      onConfirm: () => {
        console.log('Info action confirmed');
      }
    });
  };

  // Example 4: Delete product with custom message
  const handleDeleteProduct = (productName, productId) => {
    showDeleteModal({
      title: 'Delete Product',
      message: `Are you sure you want to delete "${productName}"? This will also remove all associated inventory records.`,
      itemName: productName,
      confirmText: 'DELETE',
      cancelText: 'KEEP',
      onConfirm: () => {
        // Delete product logic
        console.log(`Deleting product: ${productName} (ID: ${productId})`);
        // Example: deleteProduct(productId);
      }
    });
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Delete Modal Usage Examples</h2>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Basic Delete Confirmation:</h3>
        <button
          onClick={() => handleDeleteUser('John Doe')}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Delete User (John Doe)
        </button>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Warning Type:</h3>
        <button
          onClick={handleWarningAction}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
        >
          Show Warning Modal
        </button>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Info Type:</h3>
        <button
          onClick={handleInfoAction}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Show Info Modal
        </button>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Delete Product:</h3>
        <button
          onClick={() => handleDeleteProduct('Greenply MR Plywood', 123)}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Delete Product
        </button>
      </div>
    </div>
  );
};

export default DeleteModalUsage;

/*
USAGE INSTRUCTIONS:

1. Import the hook in any component:
   import { useDeleteModal } from '../context/DeleteModalContext';

2. Use the hook:
   const { showDeleteModal } = useDeleteModal();

3. Call showDeleteModal with options:
   showDeleteModal({
     title: 'Are you sure?',           // Modal title
     message: 'Custom message',        // Custom message (optional)
     itemName: 'Item Name',           // Item name for auto-generated message
     confirmText: 'YES',              // Confirm button text (default: 'YES')
     cancelText: 'NO',                // Cancel button text (default: 'NO')
     type: 'delete',                  // 'delete', 'warning', 'info'
     onConfirm: () => {               // Function to call on confirm
       // Your delete logic here
     },
     onCancel: () => {                // Function to call on cancel (optional)
       // Your cancel logic here
     }
   });

FEATURES:
- ✅ Global state management
- ✅ Multiple modal types (delete, warning, info)
- ✅ Custom colors for each type
- ✅ Custom button text
- ✅ Keyboard support (ESC to cancel)
- ✅ Click outside to cancel
- ✅ Custom confirm/cancel callbacks
- ✅ Responsive design
- ✅ Matches your design from image

MODAL TYPES:
- 'delete': Red theme (default)
- 'warning': Orange theme
- 'info': Blue theme

EXAMPLES FOR DIFFERENT PAGES:
- Vendors: showDeleteModal({ itemName: vendor.name, onConfirm: () => deleteVendor(vendor.id) })
- Customers: showDeleteModal({ itemName: customer.name, onConfirm: () => deleteCustomer(customer.id) })
- Products: showDeleteModal({ itemName: product.name, onConfirm: () => deleteProduct(product.id) })
- Sales: showDeleteModal({ itemName: `Sale #${sale.id}`, onConfirm: () => deleteSale(sale.id) })
*/
