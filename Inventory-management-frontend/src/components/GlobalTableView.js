import React, { useState } from 'react';
import { Search, Filter, Download, Plus, Edit, Trash2, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

const GlobalTableView = ({
  // Table configuration
  title = "Data Table",
  data = [],
  columns = [],
  
  // Pagination
  itemsPerPage = 15,
  showPagination = true,
  
  // Actions
  showSearch = true,
  showFilters = true,
  showExport = true,
  showAddButton = true,
  
  // Button configurations
  addButtonText = "Add Item",
  onAddClick,
  onEdit,
  onDelete,
  onExport,
  
  // Search and filter
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  
  // Status configuration
  statusConfig = {
    active: { color: "bg-green-500", text: "Active" },
    inactive: { color: "bg-red-500", text: "Inactive" },
    pending: { color: "bg-yellow-500", text: "Pending" }
  },
  
  // Loading state
  loading = false,
  
  // Custom render functions
  renderCell,
  renderActions,
  
  // Filter options
  filterOptions = [],
  selectedFilters = {},
  onFilterChange
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [localSearchValue, setLocalSearchValue] = useState(searchValue);

  // Handle search
  const handleSearchChange = (value) => {
    setLocalSearchValue(value);
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  // Debug: Log data received
  console.log('GlobalTableView received data:', data);
  console.log('GlobalTableView data length:', data?.length);

  // Ensure data is an array
  const safeData = Array.isArray(data) ? data : [];

  // Filter and search data
  const filteredData = safeData.filter(item => {
    // Search filter
    if (localSearchValue) {
      const searchLower = localSearchValue.toLowerCase();
      const matchesSearch = columns.some(column => {
        if (column.searchable !== false && column.key) {
          const cellValue = item[column.key];
          return cellValue && cellValue.toString().toLowerCase().includes(searchLower);
        }
        return false;
      });
      if (!matchesSearch) return false;
    }

    // Custom filters
    if (Object.keys(selectedFilters).length > 0) {
      return Object.entries(selectedFilters).every(([key, value]) => {
        if (!value) return true;
        return item[key] === value;
      });
    }

    return true;
  });

  console.log('Filtered data:', filteredData);
  console.log('Filtered data length:', filteredData.length);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  console.log('Current data for display:', currentData);
  console.log('Current data length:', currentData.length);

  // Pagination handlers
  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  // Render cell content
  const renderCellContent = (item, column) => {
    if (renderCell && typeof renderCell === 'function') {
      return renderCell(item, column);
    }

    const value = item[column.key];
    
    // Status column with colored dots
    if (column.type === 'status' && statusConfig[value]) {
      const status = statusConfig[value];
      return (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${status.color}`}></div>
          <span className="text-sm">{status.text}</span>
        </div>
      );
    }

    // Date column
    if (column.type === 'date' && value) {
      return new Date(value).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    // Actions column
    if (column.type === 'actions') {
      if (renderActions && typeof renderActions === 'function') {
        return renderActions(item);
      }
      return (
        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(item)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(item)}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Delete
            </button>
          )}
        </div>
      );
    }

    // Default text rendering
    return <span className="text-sm">{value || '-'}</span>;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <div className="flex items-center gap-2">
            {showExport && onExport && (
              <button
                onClick={onExport}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Download className="h-4 w-4 mr-2 inline" />
                Export
              </button>
            )}
            {showAddButton && onAddClick && (
              <button
                onClick={onAddClick}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Plus className="h-4 w-4 mr-2 inline" />
                {addButtonText}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          {showSearch && (
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={localSearchValue}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Filters */}
          {showFilters && filterOptions.length > 0 && (
            <div className="flex gap-2">
              {filterOptions.map((filter) => (
                <select
                  key={filter.key}
                  value={selectedFilters[filter.key] || ''}
                  onChange={(e) => onFilterChange && onFilterChange(filter.key, e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">{filter.label}</option>
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500">
                    No data found
                  </td>
                </tr>
              ) : (
                currentData.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-gray-50">
                    {columns.map((column, colIndex) => (
                      <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                        {renderCellContent(item, column)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {showPagination && !loading && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Rows per page</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setCurrentPage(1)}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-gray-700">
                {startIndex + 1}-{Math.min(endIndex, filteredData.length)} of {filteredData.length} rows
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
              >
                <ChevronLeft className="h-4 w-4" />
                <ChevronLeft className="h-4 w-4 -ml-1" />
              </button>
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, currentPage - 2) + i;
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`px-3 py-1 text-sm rounded ${
                      pageNum === currentPage
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
              >
                <ChevronRight className="h-4 w-4" />
                <ChevronRight className="h-4 w-4 -ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalTableView;
