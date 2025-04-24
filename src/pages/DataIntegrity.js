import React, { useState, useEffect, useMemo } from 'react';
import { FiAlertCircle, FiCheckCircle, FiTool, FiClipboard, FiShoppingCart, FiList, FiMonitor, FiBox, FiSearch, FiPackage } from 'react-icons/fi';
import { useOutletContext } from 'react-router-dom';
import ClockLoader from 'react-spinners/ClockLoader';
import Tooltip from '../components/Tooltip';

const override = {
    display: "block",
    margin: "0 auto",
    borderColor: "#28b3d8",
};

const iconMap = {
    "Location Hierarchy": FiAlertCircle,
    "Facilities Work Rounds": FiCheckCircle,
    "Facilities Parts": FiTool,
    "Facilities Work Orders": FiClipboard,
    "Facilities Purchase Requisition": FiShoppingCart,
    "Checklist": FiList,
    "Facilities Devices": FiMonitor,
    "Facilities Models": FiBox,
    "Facilities Maintenance Definition": FiPackage
};

export default function DataIntegrity() {
    const { healthCheckLogs, selectedDate, dataIntegrity } = useOutletContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [additionalData, setAdditionalData] = useState({});
    const [loading, setLoading] = useState(true);
    const [parsedResultNumber, setParsedResultNumber] = useState({});

    useEffect(() => {
        const fetchAdditionalData = async () => {
            setLoading(true);
            setAdditionalData({});
            setParsedResultNumber({});

            if (dataIntegrity) {
                setParsedResultNumber(JSON.parse(dataIntegrity));
            }
            setLoading(false);
        };

        fetchAdditionalData();
    }, [selectedDate?.sys_id, healthCheckLogs, dataIntegrity]);

    const filteredResults = useMemo(() => {
        if (!searchTerm) return parsedResultNumber;

        const lowercaseSearchTerm = searchTerm.toLowerCase();

        return Object.entries(parsedResultNumber).reduce((acc, [group, values]) => {
            // If the search term is in the group name, include the entire group
            if (group.toLowerCase().includes(lowercaseSearchTerm)) {
                acc[group] = values;
                return acc;
            }

            // Filter subkeys that match the search term
            const filteredValues = Object.entries(values).filter(([subKey]) =>
                subKey.toLowerCase().includes(lowercaseSearchTerm)
            );

            // If any subkeys match, include the filtered group
            if (filteredValues.length > 0) {
                acc[group] = Object.fromEntries(filteredValues);
            }

            return acc;
        }, {});
    }, [searchTerm, parsedResultNumber]);

    return (
        <div className="bg-gray-100 dark:bg-gray-900 p-4">
            {loading ? (
                <ClockLoader
                    color="#28b3d8"
                    loading={loading}
                    cssOverride={override}
                    size={200}
                />
            ) : (
                <>
                    <div className="mb-6 relative">
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                        <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto max-h-[calc(100vh-300px)]">
                        {Object.entries(filteredResults).map(([category, items]) => {
                            const Icon = iconMap[category] || FiAlertCircle
                            return (
                                <div key={category} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-all duration-300 hover:shadow-lg">
                                    <div className="flex mb-4">
                                        <Icon className="text-sky-500 mr-2 text-2xl" />
                                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{category}</h2>
                                    </div>
                                    <div className="flex justify-end mb-2 space-x-4">
                                        <Tooltip text="Current">
                                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-9 text-center flex items-center">
                                                C
                                            </span>
                                        </Tooltip>
                                        <Tooltip text="Previous">
                                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-9 text-center flex items-center">
                                                P
                                            </span>
                                        </Tooltip>
                                    </div>

                                    <div className="space-y-2">
                                        {Object.entries(items).map(([item, data]) => (
                                            <div key={item} className="flex items-center">
                                                <a
                                                    href={data.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-gray-600 dark:text-gray-300 hover:underline flex-grow"
                                                >
                                                    {item}
                                                </a>
                                                <div className="flex items-center space-x-2 flex-shrink-0">
                                                    <span
                                                        className={
                                                            'text-sm font-medium px-2 py-1 rounded-full w-12 text-center ' +
                                                            (Number(data.pastCount) > Number(data.threshold)
                                                                ? 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200'
                                                                : 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200')
                                                        }
                                                    >
                                                        {data.pastCount}
                                                    </span>
                                                    <span
                                                        className={
                                                            'text-sm font-medium px-2 py-1 rounded-full w-12 text-center ' +
                                                            (Number(data.count) > Number(data.threshold)
                                                                ? 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200'
                                                                : 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200')
                                                        }
                                                    >
                                                        {data.count}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {Object.keys(filteredResults).length === 0 && (
                        <div className="text-center text-gray-600 dark:text-gray-400 mt-8">
                            No results found.
                        </div>
                    )}
                </>
            )}
        </div>
    );
}