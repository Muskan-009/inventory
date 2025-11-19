import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDeleteModal } from '../context/DeleteModalContext';
import GlobalTableView from '../components/GlobalTableView';
import api from '../services/api';
import toast from 'react-hot-toast';

const Categories = () => {
  const { user } = useAuth();
  const { showDeleteModal } = useDeleteModal();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Global table configuration
  const tableColumns = [
    { key: 'name', label: 'Name', searchable: true },
    { key: 'description', label: 'Description', searchable: true },
    { key: 'parent_name', label: 'Parent Category' },
    { key: 'product_count', label: 'Products', type: 'number' },
    { key: 'is_active', label: 'Status', type: 'status' },
    { key: 'actions', label: 'Actions', type: 'actions' }
  ];

  const statusConfig = {
    true: { color: 'bg-green-500', text: 'Active' },
    false: { color: 'bg-red-500', text: 'Inactive' }
  };

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_id: null,
    is_active: true
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  // Debug: Log categories data
  useEffect(() => {
    console.log('Categories data:', categories);
    console.log('Categories length:', categories.length);
  }, [categories]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await api.get('/categories');
      let categoriesData = [];
      if (response.data && Array.isArray(response.data)) {
        categoriesData = response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        categoriesData = response.data.data;
      }
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to fetch categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, formData);
        toast.success('Category updated successfully!');
      } else {
        await api.post('/categories', formData);
        toast.success('Category created successfully!');
      }

      setShowModal(false);
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        parent_id: null,
        is_active: true
      });
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      const message = error.response?.data?.message || 'Failed to save category';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      parent_id: category.parent_id,
      is_active: category.is_active
    });
    setShowModal(true);
  };

  const handleDelete = (category) => {
    showDeleteModal({
      title: 'Delete Category',
      message: `Are you sure you want to delete "${category.name}"?`,
      itemName: category.name,
      onConfirm: async () => {
        try {
          await api.delete(`/categories/${category.id}`);
          toast.success('Category deleted successfully!');
          fetchCategories();
        } catch (error) {
          console.error('Error deleting category:', error);
          const message = error.response?.data?.message || 'Failed to delete category';
          toast.error(message);
        }
      }
    });
  };




  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
          <p className="text-gray-600 mt-1">Organize your products into categories and subcategories</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Category
        </button>
      </div>
      {/* Debug Info */}


      {/* Global Table View */}
      <GlobalTableView
        title="Categories"
        data={categories}
        columns={tableColumns}
        loading={loading}
        searchPlaceholder="Search categories..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        statusConfig={statusConfig}
        addButtonText="Add Category"
        onAddClick={() => setShowModal(true)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onExport={() => toast.success('Export functionality coming soon!')}
        renderActions={(item) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleEdit(item)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(item)}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Delete
            </button>
          </div>
        )}
      />
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter category name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter category description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
                  <select
                    value={formData.parent_id || ''}
                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value || null })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">No Parent (Main Category)</option>
                    {categories.filter(cat => !cat.parent_id).map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingCategory(null);
                      setFormData({
                        name: '',
                        description: '',
                        parent_id: null,
                        is_active: true
                      });
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : (editingCategory ? 'Update' : 'Save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
