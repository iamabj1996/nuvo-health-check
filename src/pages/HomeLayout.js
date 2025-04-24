import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { FiLayers, FiCheckCircle, FiAlertCircle, FiGitPullRequest } from 'react-icons/fi';
import { MdSettingsApplications, MdDateRange } from "react-icons/md";
import { GrOrganization } from "react-icons/gr";
import { LuMoon, LuSun } from 'react-icons/lu';
import axios from 'axios';
import ClientSelectionDropdown from '../components/ClientSelectionDropdown';
import ApplicationSelectionDropdown from '../components/ApplicationSelectionDropdown';
import StartDateSelectionDropdown from '../components/StartDateSelectionDropdown';

const HomeLayout = () => {
    const navigate = useNavigate();
    const [isDarkMode, setIsDarkMode] = useState(true); // Start in dark mode
    const [featureUsage, setfeatureUsage] = useState();
    const [featureUsageCount, setFeatureUsageCount] = useState();
    const [dataIntegrity, setDataIntegrity] = useState();
    const [activeTab, setActiveTab] = useState('');
    const [clientData, setClientData] = useState([]);
    const [applicationData, setApplicationData] = useState([]);
    const [startDateData, setStartDateData] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [clientConfigId, setClientConfigId] = useState(null);
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [healthCheckLogs, setHealthCheckLogs] = useState([]);
    const [ootbHealthCheckLogs, setOotbHealthCheckLogs] = useState([]);
    const [upgradeHealthCheckLogs, setUpgradeHealthCheckLogs] = useState([]);
    const [detailedHealthCheckLogs, setDetailedHealthCheckLogs] = useState([]);
    const [differencesData, setDifferencesData] = useState([])
    const [detailedUpgradeConflictLogs, setDetailedUpgradeConflicLogs] = useState([]);
    const [clientInstanceName, setClientInstanceName] = useState('')

    console.log('activeTab', activeTab);

    console.log('clientData for config check', clientData);

    const toggleDarkMode = () => {
        setIsDarkMode(prev => !prev);
        document.documentElement.classList.toggle('dark');
    };

    const tabs = [
        { id: '', label: 'Feature Report', icon: FiLayers },
        { id: 'data-integrity', label: 'Data Integrity', icon: FiCheckCircle },
        { id: 'oob-conflict', label: 'OOB Conflict', icon: FiAlertCircle },
        { id: 'upgrade-conflict', label: 'Upgrade Conflict', icon: FiGitPullRequest },
    ];

    console.log('detailedHealthCheckLogs', detailedHealthCheckLogs[0]);

    const parsedData = useMemo(() => {
        if (detailedHealthCheckLogs && detailedHealthCheckLogs.length > 0) {
            try {
                return detailedHealthCheckLogs.map((log) => {
                    const parsedResult = JSON.parse(log.result);
                    return {
                        New: Array.isArray(parsedResult.New) ? parsedResult.New : [],
                        Modified: Array.isArray(parsedResult.Modified) ? parsedResult.Modified : [],
                        Differences: log.differences_between_healthchecks !== '' ? JSON.parse(log.differences_between_healthchecks) : [],
                    };
                });
            } catch (error) {
                console.error("Error parsing detailedHealthCheckLogs:", error);
                return [];
            }
        }
        return [];
    }, [detailedHealthCheckLogs]);

    console.log('parsedData', parsedData[0]?.Modified[0]?.table_name);

    useEffect(() => {
        const path = window.location.hash.replace('#/', '');
        if (path && tabs.some(tab => tab.id === path)) {
            setActiveTab(path);
        } else {
            navigate('/');
        }
    }, [navigate]);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    // Fetch client data
    useEffect(() => {
        const getClientData = async () => {
            try {
                const response = await axios.get('/api/now/table/x_nuvo_health_scan_client_healthcheck_config?sysparm_fields=name%2Csys_id%2Cclient_instance&sysparm_limit=1000');
                return response?.data?.result || [];
            } catch (error) {
                console.error('Error fetching client data:', error);
                return [];
            }
        };

        const fetchClientData = async () => {
            const clientReturnedData = await getClientData();
            if (clientReturnedData?.length > 0) {
                setClientData(clientReturnedData);
            }
        };

        fetchClientData();
    }, []);

    const formatApplications = (applicationData) => {
        console.log("function applicationData", applicationData);
        if (applicationData.length === 0) {
            return [];
        }
        const { display_value, value } = applicationData.applications;

        const names = display_value.split(',').map(s => s.trim());
        const ids = value.split(',').map(s => s.trim());

        const formatted = names.map((name, index) => ({
            sys_id: ids[index],
            name
        }));

        return formatted;
    };


    // Fetch application data
    useEffect(() => {
        if (!selectedClient) return;

        const getApplicationData = async () => {
            try {
                console.log('Fetching application data...');
                const query = 'client_healthcheck_config=' + clientConfigId + '^status=completed^ORDERBYDESCupdated';

                const response = await axios.get(`/api/now/table/x_nuvo_health_scan_healthcheck_instance`, {
                    params: {
                        sysparm_query: query,
                        sysparm_display_value: 'all',
                        sysparm_fields: 'applications',
                        sysparm_limit: 1
                    }
                });

                console.log('Response:', response?.data?.result[0]);
                return response?.data?.result[0] || [];

            } catch (error) {
                console.error('Error fetching application data:', error);
                return [];
            }
        };

        const fetchApplicationData = async () => {
            const applicationReturnedData = await getApplicationData();
            console.log('applicationsReturnedData1', applicationReturnedData);

            console.log('applicationsReturnedData', formatApplications(applicationReturnedData));
            if (applicationReturnedData) {
                const applicationsArray = formatApplications(applicationReturnedData);
                console.log('applicationsArray', applicationsArray);
                setApplicationData(applicationsArray);

            }
        };

        fetchApplicationData();

        console.log('applicationData1234', applicationData);
    }, [selectedClient, clientConfigId]);


    // Fetch start date data
    useEffect(() => {
        const getStartDateData = async () => {
            if (!selectedClient || !selectedApplication) return;

            try {
                const clientId = encodeURIComponent(selectedClient);
                const applicationId = encodeURIComponent(selectedApplication.sys_id);
                const query = 'client_healthcheck_config=' + clientConfigId + '^applicationsLIKE' + applicationId + '^status=completed^ORDERBYDESCstart_date';

                const response = await axios.get(`/api/now/table/x_nuvo_health_scan_healthcheck_instance`, {
                    params: {
                        sysparm_query: query,
                        sysparm_display_value: true,
                        sysparm_fields: 'start_date,sys_id',
                        sysparm_limit: 1000
                    }
                });

                return response?.data?.result || [];
            } catch (error) {
                console.error('Error fetching start date data:', error);
                return [];
            }
        };

        const fetchStartDateData = async () => {
            const startDateDataReturned = await getStartDateData();
            if (startDateDataReturned?.length > 0) {
                setStartDateData(startDateDataReturned);
            } else {
                setStartDateData([])
            }
        };

        fetchStartDateData();
    }, [selectedClient, selectedApplication]);

    // Fetch health check logs
    useEffect(() => {
        const getHealthCheckLogs = async () => {
            if (!selectedDate) return;

            try {
                const selectedDateId = encodeURIComponent(selectedDate.sys_id);

                const query = 'x_nuvo_health_scan_healthcheck_instance=' + selectedDateId;

                const response = await axios.get(`/api/now/table/x_nuvo_health_scan_m2m_x_nuvo_diag_x_nuvo_healt`, {
                    params: {
                        sysparm_query: query,
                        sysparm_display_value: 'all',
                        sysparm_fields: 'x_nuvo_diag_healthcheck_logs',
                        sysparm_limit: 100
                    }
                });

                setHealthCheckLogs(response?.data?.result || []);
            } catch (error) {
                console.error('Error fetching health check logs:', error);
            }
        };

        getHealthCheckLogs();
    }, [selectedDate]);


    useEffect(() => {
        // Example healthCheckLogs data
        if (!healthCheckLogs || healthCheckLogs.length <= 1) return;
        // Extract sys_ids from healthCheckLogs
        const sysIds = healthCheckLogs.map(item => item.x_nuvo_diag_healthcheck_logs.value);

        // Construct the query string for the API call
        const sysIdQuery = sysIds.map(function (id) {
            return 'sys_id=' + id;
        }).join('^OR');
        const query = 'sysparm_query=' + sysIdQuery + '^probe_category=' + selectedApplication.sys_id + '^healthcheck_type=feature_usage^ORhealthcheck_type=data_integrity&sysparm_fields=healthcheck_type,result,feature_usage&sysparm_limit=10';


        // Make the API call
        const fetchHealthCheckDetails = async () => {
            const apiUrl = '/api/now/table/x_nuvo_diag_healthcheck_logs?' + query;

            try {
                const response = await axios.get(apiUrl)



                const data = response?.data?.result;

                data?.map((logs) => {
                    if (logs.healthcheck_type === 'feature_usage') {
                        setFeatureUsageCount(logs.result)
                        setfeatureUsage(logs.feature_usage)
                    }
                    if (logs.healthcheck_type === 'data_integrity') {
                        setDataIntegrity(logs.result)
                    }
                })

            } catch (error) {
                console.error('Error fetching health check details:', error);
            }
        };

        fetchHealthCheckDetails();
    }, [clientConfigId, selectedDate, selectedClient, selectedApplication, healthCheckLogs]); // Empty dependency array, meaning this effect will run once on mount

    // Fetch OOTB health check logs and detailed logs
    useEffect(() => {
        const fetchOotbHealthCheckLogs = async () => {
            if (!selectedClient) return;
            try {
                const clientId = encodeURIComponent(selectedClient.value);
                const query = 'x_nuvo_health_scan_healthcheck_instance.client_healthcheck_config=' + clientConfigId + '^x_nuvo_diag_healthcheck_logs.healthcheck_type=ootb^ORDERBYDESCsys_created_on';

                const response = await axios.get('/api/now/table/x_nuvo_health_scan_m2m_x_nuvo_diag_x_nuvo_healt', {
                    params: {
                        sysparm_query: query,
                        sysparm_fields: 'x_nuvo_diag_healthcheck_logs',
                        sysparm_limit: 10,
                    }
                });

                const logs = response?.data?.result || [];
                setOotbHealthCheckLogs(logs);

                // Extract sys_ids from the response to make the second API call
                const sysIds = logs.map(log => log.x_nuvo_diag_healthcheck_logs.value).join('^ORsys_id=');


                // Make the second API call if sysIds are available
                if (sysIds) {
                    const detailedResponse = await axios.get('/api/now/table/x_nuvo_diag_healthcheck_logs', {
                        params: {
                            sysparm_query: 'sys_id=' + sysIds + '^ORDERBYsys_created_on',
                            sysparm_fields: 'result,differences_between_healthchecks',
                            sysparm_limit: 10,
                        }
                    });

                    setDetailedHealthCheckLogs(detailedResponse?.data?.result || []);
                    setDifferencesData(detailedResponse?.data?.differences_between_healthchecks || [])
                } else {
                    setDetailedHealthCheckLogs([]);
                    setDifferencesData([])
                }
            } catch (error) {
                console.error('Error fetching OOTB health check logs or detailed logs:', error);
            }
        };

        fetchOotbHealthCheckLogs();
    }, [selectedClient]);

    useEffect(() => {
        const fetchUpgradeConflictsLogs = async () => {
            if (!selectedClient) return;

            try {
                const clientId = encodeURIComponent(selectedClient.value);
                const query = 'x_nuvo_health_scan_healthcheck_instance.client_healthcheck_config=' + clientConfigId + '^x_nuvo_diag_healthcheck_logs.healthcheck_type=upgrade_conflicts^ORDERBYDESCsys_created_on';

                const response = await axios.get('/api/now/table/x_nuvo_health_scan_m2m_x_nuvo_diag_x_nuvo_healt', {
                    params: {
                        sysparm_query: query,
                        sysparm_fields: 'x_nuvo_diag_healthcheck_logs',
                        sysparm_limit: 1,
                    }
                });

                const logs = response?.data?.result || [];
                setUpgradeHealthCheckLogs(logs);

                // Extract sys_ids from the response to make the second API call
                const sysIds = logs.map(log => log.x_nuvo_diag_healthcheck_logs.value).join('^ORsys_id=');

                // Make the second API call if sysIds are available
                if (sysIds) {
                    const detailedResponse = await axios.get('/api/now/table/x_nuvo_diag_healthcheck_logs', {
                        params: {
                            sysparm_query: 'sys_id=' + sysIds + '^ORDERBYsys_created_on',
                            sysparm_fields: 'result',
                            sysparm_limit: 1,
                        }
                    });

                    setDetailedUpgradeConflicLogs(detailedResponse?.data?.result || []);
                }
            } catch (error) {
                console.error('Error fetching OOTB health check logs or detailed logs:', error);
            }
        };

        fetchUpgradeConflictsLogs();
    }, [selectedClient]);

    const handleClientSelect = (client) => {
        setSelectedClient(client.name);  // Storing the name of the selected client
        setClientConfigId(client.clientConfigId);  // Storing the sys_id as clientConfigId
        setClientInstanceName(client.client_instance);
        setSelectedApplication(null);
        setSelectedDate(null);
        setFeatureUsageCount(null);
        setfeatureUsage(null);
        setDataIntegrity(null);
        setHealthCheckLogs([])
    };


    const handleApplicationSelect = (application) => {
        setSelectedApplication(application);
        setSelectedDate(null);
        setFeatureUsageCount(null);
        setfeatureUsage(null);
        setDataIntegrity(null);
        setHealthCheckLogs([])

    };

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        setFeatureUsageCount(null);
        setfeatureUsage(null);
        setDataIntegrity(null);
        setHealthCheckLogs([])

    };


    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
            <div className="container mx-auto px-4 py-8">
                <div className='w-full flex justify-end'>
                    <button className='mb-4' onClick={toggleDarkMode}>
                        {isDarkMode ? <LuSun className='h-6 w-6' /> : <LuMoon className='h-6 w-6' />}
                    </button>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <ClientSelectionDropdown
                        items={clientData}
                        label='Select Client'
                        icon={<GrOrganization />}
                        selectedItem={selectedClient}
                        onItemSelect={handleClientSelect}
                    />
                    {(activeTab !== 'oob-conflict' && activeTab !== 'upgrade-conflict') &&
                        <ApplicationSelectionDropdown
                            items={applicationData}
                            label='Select Application'
                            icon={<MdSettingsApplications />}
                            selectedItem={selectedApplication}
                            onItemSelect={handleApplicationSelect}
                            disabled={!selectedClient}
                        />
                    }

                    {(activeTab !== 'oob-conflict' && activeTab !== 'upgrade-conflict') &&
                        <StartDateSelectionDropdown
                            items={startDateData}
                            label='Select Date'
                            icon={<MdDateRange />}
                            selectedItem={selectedDate}
                            onItemSelect={handleDateSelect}
                            disabled={!selectedApplication}
                        />
                    }

                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8 transition-all duration-300">
                    <div className="flex justify-between">
                        <div className='flex space-x-4 mb-6'>
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        navigate(tab.id);
                                    }}
                                    className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeTab === tab.id
                                        ? 'bg-sky-500 text-white shadow-lg'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    <tab.icon className="mr-2" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <div className='flex'>
                            {parsedData[0]?.Modified[0]?.nuvolo_version && <h2 className="text-base text-gray-800 dark:text-gray-200 mr-4"> <span className='text-sky-500'>Nuvolo Version:</span> {parsedData[0]?.Modified[0]?.nuvolo_version}</h2>}
                            {parsedData[0]?.Modified[0]?.servicenow_version && <h2 className="text-base text-gray-800 dark:text-gray-200"> <span className='text-sky-500'>ServiceNow Version:</span> {parsedData[0]?.Modified[0]?.servicenow_version}</h2>}
                        </div>

                    </div>
                    <div className="bg-gray-100 dark:bg-gray-900 p-6 rounded-lg transition-all duration-300">
                        <div className="text-gray-700 dark:text-gray-300">
                            <Outlet context={{ healthCheckLogs, selectedDate, ootbHealthCheckLogs, detailedHealthCheckLogs, upgradeHealthCheckLogs, detailedUpgradeConflictLogs, featureUsage, featureUsageCount, dataIntegrity, differencesData, clientInstanceName }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeLayout;
