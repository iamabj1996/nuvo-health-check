import React, { useState, useEffect, useRef } from 'react';
import { LuChevronDown, LuX, LuAlertCircle, LuSearch } from 'react-icons/lu';
import { GrOrganization } from 'react-icons/gr';
import { MdSettingsApplications, MdDateRange } from 'react-icons/md';
import axios from 'axios';
import moment from 'moment/moment';

// Toast component
const Toast = ({ message, onClose, error }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);
    return (
        <div
            className={
                error
                    ? 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg flex items-center'
                    : 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg flex items-center'
            }
        >
            <LuAlertCircle className="mr-2" />
            <span>{message}</span>
            <button onClick={onClose} className="ml-2 text-white hover:text-gray-200">
                <LuX />
            </button>
        </div>
    );
};

// Dropdown Component
const Dropdown = ({ options, value, onChange, placeholder, icon: Icon }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const filteredOptions = options.filter(option =>
        option.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-3 py-2 text-left bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 flex items-center"
            >
                {Icon && <Icon className="mr-2 text-gray-400" />}
                <span className="flex-grow">{value ? value.name : placeholder}</span>
                <LuChevronDown className="ml-2" />
            </button>
            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg">
                    <div className="p-2">
                        <div className="relative">
                            <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                            />
                        </div>
                    </div>
                    <ul className="max-h-60 overflow-auto">
                        {filteredOptions.map((option) => (
                            <li
                                key={option.sys_id}
                                onClick={() => {
                                    onChange(option);
                                    setIsOpen(false);
                                    setSearchTerm('');
                                }}
                                className="px-3 py-2 hover:bg-gray-700 cursor-pointer"
                            >
                                {option.name}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

// MultiSelect Component
const MultiSelect = ({ options, value, onChange, placeholder, icon: Icon }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const multiSelectRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (multiSelectRef.current && !multiSelectRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelect = (option) => {
        const newValue = value.includes(option)
            ? value.filter((item) => item !== option)
            : [...value, option];
        onChange(newValue);
    };

    const filteredOptions = options.filter(option =>
        option.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="relative" ref={multiSelectRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 cursor-pointer min-h-[38px] flex items-center"
            >
                {Icon && <Icon className="mr-2 text-gray-400" />}
                {value.length > 0 ? (
                    <div className="flex flex-wrap gap-1 flex-grow">
                        {value.map((item) => (
                            <span
                                key={item.sys_id}
                                className="bg-sky-700 text-sky-100 text-sm px-2 py-1 rounded flex items-center"
                            >
                                {item.name}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelect(item);
                                    }}
                                    className="ml-1 text-sky-300 hover:text-sky-100"
                                >
                                    <LuX size={14} />
                                </button>
                            </span>
                        ))}
                    </div>
                ) : (
                    <span className="text-gray-400 flex-grow">{placeholder}</span>
                )}
                <LuChevronDown className="ml-2" />
            </div>
            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg">
                    <div className="p-2">
                        <div className="relative">
                            <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                            />
                        </div>
                    </div>
                    <ul className="max-h-60 overflow-auto">
                        {filteredOptions.map((option) => (
                            <li
                                key={option.sys_id}
                                onClick={() => handleSelect(option)}
                                className="px-3 py-2 hover:bg-gray-700 cursor-pointer flex items-center"
                            >
                                <input
                                    type="checkbox"
                                    checked={value.includes(option)}
                                    onChange={() => { }}
                                    className="mr-2"
                                />
                                {option.name}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default function HealthCheckForm() {
    const [clientData, setClientData] = useState([]);
    const [applicationData, setApplicationData] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [selectedApplications, setSelectedApplications] = useState([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Setting default date and time to current date and time
    const setDefaultDateTime = () => {
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().split('T')[0]; // 'YYYY-MM-DD'
        const formattedTime = currentDate.toLocaleTimeString('en-GB').slice(0, 5); // 'HH:MM'

        setSelectedDate(formattedDate);
        setSelectedTime(formattedTime);
    };

    useEffect(() => {
        // Set the default date and time when the component mounts
        setDefaultDateTime();

        // Fetch client data (example: your API call)
        const fetchClientData = async () => {
            try {
                const response = await axios.get('/api/now/table/x_nuvo_health_scan_client_healthcheck_config?sysparm_fields=name%2Csys_id%2Cclient_instance&sysparm_limit=1000');
                setClientData(response?.data?.result || []);
            } catch (error) {
                console.error('Error fetching client data:', error);
                setErrorMessage('Failed to fetch client data. Please try again.');
            }
        };
        fetchClientData();

        // Fetch application data
        const fetchApplicationData = async () => {
            try {
                const response = await axios.get('/api/now/table/x_nuvo_diag_probe_type?sysparm_display_value=true&sysparm_fields=name%2Csys_id&sysparm_limit=100');
                setApplicationData(response?.data?.result || []);
            } catch (error) {
                console.error('Error fetching application data:', error);
                setErrorMessage('Failed to fetch application data. Please try again.');
            }
        };
        fetchApplicationData();
    }, []);

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedAccount !== null && selectedApplications.length > 0 && selectedDate && selectedTime) {
                const selectedDateTime = selectedDate + ' ' + selectedTime;
                const utcDateTime = moment(selectedDateTime).utc().format('YYYY-MM-DD HH:mm:ss');

                const finalData = {
                    client_healthcheck_config: selectedAccount.sys_id,
                    applications: selectedApplications.map(app => app.sys_id).join(','),
                    start_date: utcDateTime,
                    execution_type: 'manual',
                    status: 'scheduled'
                };
                await axios.post('/api/now/table/x_nuvo_health_scan_healthcheck_instance', finalData);
                // Reset the form after successful submission
                setSelectedAccount(null);
                setSelectedApplications([]);
                setSelectedDate('');
                setSelectedTime('');
                setErrorMessage('Health Check initiated successfully');
            } else {
                setErrorMessage('Please fill in all required fields.');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            setErrorMessage('Failed to submit the form. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100">
            <div className="container mx-auto px-4 py-8">
                <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-2xl font-bold mb-6 text-sky-500">Start Health Check</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="account" className="block text-sm font-medium text-gray-300 mb-2">
                                Account *
                            </label>
                            <Dropdown
                                options={clientData}
                                value={selectedAccount}
                                onChange={setSelectedAccount}
                                placeholder="Select an account"
                                icon={GrOrganization}
                            />
                        </div>
                        <div>
                            <label htmlFor="applications" className="block text-sm font-medium text-gray-300 mb-2">
                                Applications *
                            </label>
                            <MultiSelect
                                options={applicationData}
                                value={selectedApplications}
                                onChange={setSelectedApplications}
                                placeholder="Select applications"
                                icon={MdSettingsApplications}
                            />
                        </div>
                        <div>
                            <label htmlFor="dateTime" className="block text-sm font-medium text-gray-300 mb-2">
                                Date and Time
                            </label>
                            <div className="flex items-center space-x-2">
                                <div className="relative flex-grow">
                                    <MdDateRange className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}  // Disable past dates
                                        className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 text-gray-100"
                                    />
                                </div>
                                <div className="relative flex-grow">
                                    <input
                                        type="time"
                                        value={selectedTime}
                                        onChange={(e) => setSelectedTime(e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 text-gray-100"
                                    />
                                </div>
                            </div>
                        </div>
                        <div>
                            <button
                                type="submit"
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                            >
                                Start Health Check
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            {errorMessage && (
                <Toast
                    message={errorMessage}
                    onClose={() => setErrorMessage('')}
                    error={errorMessage.startsWith('Health Check initiated successfully') ? false : true} />
            )}
        </div>
    );
}