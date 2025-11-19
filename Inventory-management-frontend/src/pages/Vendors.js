import React, { useState, useEffect } from 'react';
import { vendorService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useDeleteModal } from '../context/DeleteModalContext';
import { Plus, Edit, Trash2, Search, Phone, Mail, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Vendors = () => {
  const [vendors, setVendors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    email: '',
    gst_no: '',
    address: '',
  });
  const { hasPermission } = useAuth();
  const { showDeleteModal } = useDeleteModal();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setIsLoading(true);
      const response = await vendorService.getAll();
      console.log('Vendors response:', response);
      console.log('Vendors data:', response.data);
      
      // Handle different response structures
      let vendorsData = [];
      if (response.data && Array.isArray(response.data)) {
        vendorsData = response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        vendorsData = response.data.data;
      } else if (response.data && response.data.vendors && Array.isArray(response.data.vendors)) {
        vendorsData = response.data.vendors;
      }
      
      console.log('Vendors data to set:', vendorsData);
      setVendors(vendorsData);
    } catch (error) {
      console.error('Fetch vendors error:', error);
      toast.error('Failed to load vendors');
      setVendors([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingVendor) {
        await vendorService.update(editingVendor.id, formData);
        toast.success('Vendor updated successfully');
      } else {
        await vendorService.create(formData);
        toast.success('Vendor created successfully');
      }
      
      fetchVendors();
      handleCloseModal();
    } catch (error) {
      console.error('Submit error:', error);
      const message = error.response?.data?.message || 'Operation failed';
      toast.error(message);
    }
  };

  const handleEdit = (vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      contact: vendor.contact,
      email: vendor.email || '',
      gst_no: vendor.gst_no || '',
      address: vendor.address || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = (vendor) => {
    showDeleteModal({
      title: 'Are you sure?',
      message: `Confirm to delete vendor: ${vendor.name}!`,
      itemName: vendor.name,
      onConfirm: async () => {
        try {
          await vendorService.delete(vendor.id);
          toast.success('Vendor deleted successfully');
          fetchVendors();
        } catch (error) {
          console.error('Delete error:', error);
          const message = error.response?.data?.message || 'Delete failed';
          toast.error(message);
        }
      }
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVendor(null);
    setFormData({
      name: '',
      contact: '',
      email: '',
      gst_no: '',
      address: '',
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const filteredVendors = Array.isArray(vendors) ? vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.contact.includes(searchTerm) ||
    (vendor.email && vendor.email.toLowerCase().includes(searchTerm.toLowerCase()))
  ) : [];

  // Pagination logic
  const totalPages = Math.ceil(filteredVendors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVendors = filteredVendors.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const canModify = hasPermission(['admin', 'super_admin']);
  const canDelete = hasPermission(['super_admin']);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-600">Manage your suppliers and vendors</p>
        </div>
        {canModify && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary btn-md"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Vendor
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search vendors..."
          className="input pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentVendors.map((vendor) => (
          <div key={vendor.id} className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{vendor.name}</h3>
                {vendor.gst_no && (
                  <p className="text-sm text-gray-500">GST: {vendor.gst_no}</p>
                )}
              </div>
              {canModify && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(vendor)}
                    className="text-gray-400 hover:text-primary-600 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(vendor)}
                      className="text-gray-400 hover:text-danger-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="h-4 w-4 mr-2" />
                {vendor.contact}
              </div>
              {vendor.email && (
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  {vendor.email}
                </div>
              )}
              {vendor.address && (
                <p className="text-sm text-gray-600 mt-2">{vendor.address}</p>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Added on {new Date(vendor.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {filteredVendors.length > itemsPerPage && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredVendors.length)} of {filteredVendors.length} vendors
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`px-3 py-1 text-sm border rounded-md ${
                        currentPage === pageNum
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredVendors.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No vendors found</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input
              type="text"
              name="name"
              required
              className="input"
              placeholder="Enter vendor company name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label className="label">Contact *</label>
            <input
              type="tel"
              name="contact"
              required
              className="input"
              placeholder="Enter phone number (e.g., +91 9876543210)"
              value={formData.contact}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              name="email"
              className="input"
              placeholder="Enter email address (optional)"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label className="label">GST Number</label>
            <input
              type="text"
              name="gst_no"
              className="input"
              placeholder="Enter GST number (optional)"
              value={formData.gst_no}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label className="label">Address</label>
            <textarea
              name="address"
              rows="3"
              className="input"
              placeholder="Enter complete address (optional)"
              value={formData.address}
              onChange={handleChange}
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              className="btn btn-secondary btn-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-md"
            >
              {editingVendor ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Vendors;
