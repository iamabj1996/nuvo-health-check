import React, { useRef, useState, useEffect } from 'react';
import { FiChevronDown } from 'react-icons/fi';

const StartDateSelectionDropdown = ({ items, selectedItem, onItemSelect, icon, label, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
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

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleDropdown}
                disabled={disabled}
                className={
                    'w-full p-3 rounded-lg shadow-md flex items-center justify-between border transition-shadow ' +
                    (disabled
                        ? 'bg-[#e5e7eb] dark:bg-[#111827] border-gray-300 cursor-not-allowed opacity-50 '
                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:border-gray-400 ') +
                    'focus:outline-none focus:ring-2 focus:ring-sky-500'
                }

            >
                <span className="flex items-center">
                    {icon}
                    <span className='ml-2'></span>
                    {selectedItem ? selectedItem.start_date.split(' ')[0] : label}
                </span>
                <FiChevronDown className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && !disabled && (
                <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-300 dark:border-gray-700 max-h-60 overflow-y-auto">
                    {items && items
                        .filter(item => item.start_date) // Only show items with a valid start_date
                        .map((item, index) => (
                            <div
                                key={index}
                                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                                onClick={() => handleItemClick(item)}
                            >
                                {item.start_date.split(' ')[0]}
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
};

export default StartDateSelectionDropdown;
