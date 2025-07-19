// frontend/src/components/common/SearchInput.js
import React, { useState, useEffect, useMemo } from 'react'; // Added useMemo
import { useDebounce } from '../../hooks/useDebounce';
import config from '../../config/config';
import Fuse from 'fuse.js'; // Import Fuse.js

const { THEME_COLORS } = config;

// Added new props: data, searchKeys, onSelectResult, renderResult
const SearchInput = ({ onSearch, placeholder = "Search...", debounceMs = 300, data = [], searchKeys = [], onSelectResult, renderResult }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false); // New state to control dropdown visibility
  const debouncedSearchTerm = useDebounce(searchTerm, debounceMs);

  // Initialize Fuse.js with provided data and keys
  const fuse = useMemo(() => new Fuse(data, {
    keys: searchKeys,
    threshold: 0.3, // Adjust threshold for fuzziness (0.0 exact, 1.0 all matches)
    ignoreLocation: true,
  }), [data, searchKeys]);

  const filteredResults = useMemo(() => {
    if (!debouncedSearchTerm) {
      return [];
    }
    // Perform fuzzy search
    return fuse.search(debouncedSearchTerm).map(result => result.item);
  }, [debouncedSearchTerm, fuse]);

  useEffect(() => {
    // Only call onSearch if it's explicitly provided and debouncedSearchTerm is not empty
    if (onSearch && debouncedSearchTerm) {
      onSearch(debouncedSearchTerm);
    }
    // Control dropdown visibility based on results and search term
    setShowDropdown(debouncedSearchTerm.length > 0 && filteredResults.length > 0);
  }, [debouncedSearchTerm, onSearch, filteredResults]);

  const handleChange = (e) => {
    setSearchTerm(e.target.value);
    // Show dropdown immediately when typing, even before debounce
    setShowDropdown(e.target.value.length > 0);
  };

  const handleClear = () => {
    setSearchTerm('');
    setShowDropdown(false); // Hide dropdown on clear
    onSelectResult(null); // Clear selected item if any
  };

  const handleResultClick = (item) => {
    onSelectResult(item);
    setSearchTerm(item[searchKeys[0]] || ''); // Set input to the primary search key of selected item
    setShowDropdown(false); // Hide dropdown after selection
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={searchTerm}
        onChange={handleChange}
        onFocus={() => searchTerm.length > 0 && filteredResults.length > 0 && setShowDropdown(true)} // Show on focus if there's a term and results
        onBlur={() => setTimeout(() => setShowDropdown(false), 100)} // Hide after a short delay to allow click
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
        style={{ '--tw-ring-color': THEME_COLORS.secondary }}
      />
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      {searchTerm && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {showDropdown && filteredResults.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredResults.map(item => (
            <li
              key={item.id}
              className="p-3 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
              onMouseDown={(e) => e.preventDefault()} // Prevent blur from hiding dropdown immediately
              onClick={() => handleResultClick(item)}
            >
              {renderResult ? renderResult(item) : item[searchKeys[0]]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchInput;
export { SearchInput };