import React, { useRef, useState, useEffect } from 'react';
import { FiChevronDown } from 'react-icons/fi';

const ApplicationSelectionDropdown = ({ items, selectedItem, onItemSelect, icon, label, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleDropdown = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
        }
    };

    const handleItemClick = (item) => {
        if (!disabled) {
            onItemSelect(item); // Pass the entire item
            setIsOpen(false);
        }
    };

    // Filter items based on search term
    const filteredItems = items.filter(item =>
        item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleDropdown}
                disabled={disabled} // Disable button if disabled prop is true
                className={
                    'w-full p-3 rounded-lg shadow-md flex items-center justify-between border transition-shadow ' +
                    (disabled
                        ? 'bg-[#e5e7eb] dark:bg-[#111827] border-gray-300 dark:border-gray-700 cursor-not-allowed opacity-50'
                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:border-gray-400') +
                    ' focus:outline-none focus:ring-2 focus:ring-sky-500'
                }
            >
                <span className="flex items-center">
                    {icon}
                    <span className='ml-2'></span>
                    {selectedItem ? selectedItem.name : label} {/* Assuming `name` is the display value */}
                </span>
                <FiChevronDown className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && !disabled && (
                <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-300 dark:border-gray-700 max-h-60 overflow-y-auto">
                    <div className="p-2">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                        />
                    </div>
                    {filteredItems.map((item, index) => (
                        <div
                            key={index}
                            className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                            onClick={() => handleItemClick(item)}
                        >
                            {item.name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ApplicationSelectionDropdown;
