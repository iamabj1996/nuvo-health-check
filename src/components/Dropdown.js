import React, { useRef, useState, useEffect } from 'react';
import { FiChevronDown } from 'react-icons/fi';


const Dropdown = ({ items, selectedItem, onItemSelect, icon, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside() {
            if (dropdownRef.current) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleDropdown = () => setIsOpen(!isOpen);

    const handleItemClick = (item) => {
        onItemSelect(item);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleDropdown}
                className="w-full bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md flex items-center justify-between border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-shadow"
            >
                <span className="flex items-center">
                    {icon}
                    {selectedItem ? selectedItem.display : label}
                </span>
                <FiChevronDown className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-300 dark:border-gray-700 max-h-60 overflow-y-auto">
                    {items?.map((item, index) => (
                        <div
                            key={index}
                            className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                            onClick={() => handleItemClick(item)}
                        >
                            {item.display}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dropdown;