import React, { useRef, useState, useEffect } from 'react';
import { FiChevronDown } from 'react-icons/fi';

const ClientSelectionDropdown = ({ items, selectedItem, onItemSelect, icon, label }) => {
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

    const toggleDropdown = () => setIsOpen(!isOpen);

    const handleItemClick = (item) => {
        // Send both the name and sys_id when an item is selected
        onItemSelect({ name: item.name, clientConfigId: item.sys_id, client_instance: item.client_instance });
        setIsOpen(false);
    };

    // Filter items based on search term
    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())  // Directly check against the 'name' string
    );

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleDropdown}
                className="w-full bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md flex items-center justify-between border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-shadow"
            >
                <span className="flex items-center">
                    {icon}
                    <span className='ml-2'></span>
                    {selectedItem ? selectedItem : label}  {/* Display name of selected item */}
                </span>
                <FiChevronDown className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
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

export default ClientSelectionDropdown;
