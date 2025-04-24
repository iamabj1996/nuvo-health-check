import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FiChevronDown } from 'react-icons/fi';
import dxChart from 'devextreme/viz/chart';
import dxPieChart from 'devextreme/viz/pie_chart';

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
        onItemSelect({ name: item.name, clientConfigId: item.sys_id, client_instance: item.client_instance });
        setIsOpen(false);
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleDropdown}
                className="text-white w-full bg-gray-700 p-3 rounded-lg shadow-md flex items-center justify-between border border-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-shadow"
            >
                <span className="flex items-center">
                    {icon}
                    {selectedItem ? selectedItem : label}
                </span>
                <FiChevronDown className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute z-10 w-full mt-2 bg-gray-800 rounded-lg shadow-lg border border-gray-700 max-h-60 overflow-y-auto">
                    <div className="p-2">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-2 rounded border border-gray-700 bg-gray-700 text-gray-800 text-white"
                        />
                    </div>
                    {filteredItems.map((item, index) => (
                        <div
                            key={index}
                            className="p-3 bg-gray-700 cursor-pointer transition-colors text-white"
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

const BarChart = ({ data }) => {
    const chartRef = useRef(null);

    useEffect(() => {
        if (!data || data.length === 0) return;

        const chartData = data.map(item => ({
            category: item.probe_item.display_value,
            value: parseFloat(item.result) || 0
        }));

        const chart = new dxChart(chartRef.current, {
            dataSource: chartData,
            series: {
                argumentField: 'category',
                valueField: 'value',
                name: 'Value',
                type: 'bar',
                color: '#ffaa66'
            },
            legend: {
                visible: false
            },
            argumentAxis: {
                label: {
                    overlappingBehavior: 'rotate',
                    rotationAngle: 45
                }
            },
            valueAxis: {
                title: {
                    text: 'Value'
                }
            },
            export: {
                enabled: true
            },
            title: 'Bar Chart',
            tooltip: {
                enabled: true,
                customizeTooltip: function (arg) {
                    return {
                        text: arg.seriesName + ': ' + arg.valueText
                    };
                }
            }
        });

        return () => {
            chart.dispose();
        };
    }, [data]);

    return <div ref={chartRef} style={{ height: '400px', width: '100%' }} />;
};

const PieChart = ({ data }) => {
    const chartRef = useRef(null);

    useEffect(() => {
        const chart = new dxPieChart(chartRef.current, {
            dataSource: data,
            series: [{
                argumentField: 'probe_item.display_value',
                valueField: 'result'
            }],
            legend: {
                visible: false
            },
            export: {
                enabled: true
            },
            title: 'Pie Chart'
        });

        return () => {
            chart.dispose();
        };
    }, [data]);

    return <div ref={chartRef} style={{ height: '300px' }} />;
};

const Table = ({ data }) => {
    return (
        <div className="h-40 bg-gray-600 overflow-auto">
            <table className="w-full text-white">
                <thead>
                    <tr>
                        <th className="p-2 border-b border-gray-500">Item</th>
                        <th className="p-2 border-b border-gray-500">Result</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((item, index) => (
                        <tr key={index}>
                            <td className="p-2 border-b border-gray-500">{item.probe_item.display_value}</td>
                            <td className="p-2 border-b border-gray-500">{item.result}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const SingleNumberCard = ({ data }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.map((item, index) => (
                <div key={index} className="h-40 bg-gray-600 flex flex-col items-center justify-center text-white">
                    <div className="text-3xl font-bold">{item.result}</div>
                    <div className="text-sm mt-2">{item.probe_item.display_value}</div>
                </div>
            ))}
        </div>
    );
};

const Dashboard = () => {
    const [departmentList, setDepartmentList] = useState([]);
    const [tabList, setTabList] = useState([]);
    const [dashboardList, setDashboardList] = useState([]);
    const [dashboardInsideData, setDashboardInsidedata] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [activeTab, setActiveTab] = useState('');

    useEffect(() => {
        const getDepartmentListData = async () => {
            try {
                const response = await axios.get('/api/now/table/x_nuvo_health_scan_dashboard?sysparm_fields=sys_id%2Cname');
                return response?.data?.result || [];
            } catch (error) {
                console.error('Error fetching client data:', error);
                return [];
            }
        };

        const fetchDepartmentListData = async () => {
            const departmentDataReturned = await getDepartmentListData();
            if (departmentDataReturned?.length > 0) {
                setDepartmentList(departmentDataReturned);
            }
        };

        fetchDepartmentListData();
    }, []);

    useEffect(() => {
        const getTabsList = async () => {
            try {
                const response = await axios.get(`/api/now/table/x_nuvo_health_scan_dashboard_tab`, {
                    params: {
                        sysparm_query: 'dashboard=' + selectedDepartment?.clientConfigId,
                        sysparm_fields: 'name,sys_id',
                    }
                });
                return response?.data?.result || [];
            } catch (error) {
                console.error('Error fetching client data:', error);
                return [];
            }
        };

        const fetchTabListData = async () => {
            const tabDataReturned = await getTabsList();
            if (tabDataReturned?.length > 0) {
                setTabList(tabDataReturned);
                setActiveTab(tabDataReturned[0].sys_id);
            }
        };

        if (selectedDepartment) {
            fetchTabListData();
        }
    }, [selectedDepartment?.clientConfigId]);

    useEffect(() => {
        const getDashboardType = async () => {
            try {
                const response = await axios.get(`/api/now/table/x_nuvo_health_scan_dashboard_card`, {
                    params: {
                        sysparm_query: 'dashboard=' + selectedDepartment?.clientConfigId + '^tab=' + activeTab,
                        sysparm_fields: 'data_visualization,sys_id,name,probe',
                    }
                });
                return response?.data?.result || [];
            } catch (error) {
                console.error('Error fetching client data:', error);
                return [];
            }
        };

        const fetchDashboardType = async () => {
            const dashboardDataReturned = await getDashboardType();
            if (dashboardDataReturned?.length > 0) {
                setDashboardList(dashboardDataReturned);
            }
        };

        if (activeTab) {
            fetchDashboardType();
        }
    }, [activeTab, selectedDepartment?.clientConfigId]);

    useEffect(() => {
        const getDashboardInsideData = async (probeValue) => {
            try {
                const response = await axios.get(`/api/now/table/x_nuvo_health_scan_dashboard_card_result`, {
                    params: {
                        sysparm_query: 'dashboard_card=' + probeValue,
                        sysparm_fields: 'sys_id,probe_item,result',
                        sysparm_display_value: 'true'
                    }
                });
                return response?.data?.result || [];
            } catch (error) {
                console.error('Error fetching client data:', error);
                return [];
            }
        };

        const fetchDashboardType = async () => {
            if (dashboardList.length > 0) {
                const promises = dashboardList.map(async (dashboard) => {
                    const dashboardInsideData = await getDashboardInsideData(dashboard.sys_id);
                    return { dashboardType: dashboard?.data_visualization, dashboardData: dashboardInsideData };
                });

                const resolvedData = await Promise.all(promises);
                setDashboardInsidedata(resolvedData);
            }
        };

        fetchDashboardType();
    }, [dashboardList]);

    const handleDepartmentSelect = (department) => {
        setSelectedDepartment(department);
    };

    const renderDashboardItem = (dashboard) => {
        switch (dashboard.dashboardType) {
            case 'bar_chart':
                return <BarChart data={dashboard.dashboardData} />;
            case 'pie_chart':
                return <PieChart data={dashboard.dashboardData} />;
            case 'table':
                return <Table data={dashboard.dashboardData} />;
            case 'single_number_card':
                return <SingleNumberCard data={dashboard.dashboardData} />;
            default:
                return (
                    <div className="h-40 bg-gray-600 flex items-center justify-center text-white">
                        Unsupported visualization type: {dashboard.dashboardType}
                    </div>
                );
        }
    };

    return (
        <div className="bg-gray-800 min-h-screen">
            <header className="bg-gray-800">
                <div className="max-w-7xl py-6 px-4 sm:px-6 lg:px-8">
                    <h1 className="text-2xl font-bold mb-4 text-sky-500">Dashboard</h1>
                </div>
            </header>

            <div className="mb-8 flex justify-center">
                <div className="w-[300px]">
                    <ClientSelectionDropdown
                        items={departmentList}
                        selectedItem={selectedDepartment ? selectedDepartment.name : null}
                        onItemSelect={handleDepartmentSelect}
                        icon={<FiChevronDown className="mr-2" />}
                        label="Select a department"
                    />
                </div>
            </div>

            <div className="flex space-x-4 mb-6 justify-center">
                {tabList.map((tab) => (
                    <button
                        key={tab.sys_id}
                        onClick={() => setActiveTab(tab.sys_id)}
                        className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeTab === tab.sys_id
                            ? 'bg-sky-500 text-white shadow-lg'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                    >
                        {tab.name}
                    </button>
                ))}
            </div>

            <div className="mt-6 bg-gray-800">
                <div className="rounded-lg bg-gray-700 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4 text-white">{tabList.find(tab => tab.sys_id === activeTab)?.name} Content</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dashboardInsideData.map((dashboard, index) => (
                            <div key={index} className="bg-gray-800 p-4 rounded-md">
                                <h4 className="text-md font-semibold mb-2 text-white">{dashboard.dashboardType}</h4>
                                {renderDashboardItem(dashboard)}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;