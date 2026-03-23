import React, { useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Joyride from "react-joyride";
import {
  FiLayers,
  FiCheckCircle,
  FiAlertCircle,
  FiGitPullRequest,
} from "react-icons/fi";
import { MdSettingsApplications, MdDateRange } from "react-icons/md";
import { GrOrganization } from "react-icons/gr";
import { LuMoon, LuSun } from "react-icons/lu";
import axios from "axios";
import ClientSelectionDropdown from "../components/ClientSelectionDropdown";
import ApplicationSelectionDropdown from "../components/ApplicationSelectionDropdown";
import StartDateSelectionDropdown from "../components/StartDateSelectionDropdown";

const HomeLayout = () => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(true); // Start in dark mode
  const [featureUsage, setfeatureUsage] = useState();
  const [featureUsageCount, setFeatureUsageCount] = useState();
  const [dataIntegrity, setDataIntegrity] = useState();
  const [activeTab, setActiveTab] = useState("");
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
  const [differencesData, setDifferencesData] = useState([]);
  const [detailedUpgradeConflictLogs, setDetailedUpgradeConflicLogs] = useState(
    [],
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [runTour, setRunTour] = useState(false);
  const [clientInstanceName, setClientInstanceName] = useState("");

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
    document.documentElement.classList.toggle("dark");
  };

  const tabs = [
    { id: "", label: "Feature Report", icon: FiLayers },
    { id: "data-integrity", label: "Data Integrity", icon: FiCheckCircle },
    { id: "oob-conflict", label: "OOB Conflict", icon: FiAlertCircle },
    {
      id: "upgrade-conflict",
      label: "Upgrade Conflict",
      icon: FiGitPullRequest,
    },
  ];

  const parsedData = useMemo(() => {
    if (detailedHealthCheckLogs && detailedHealthCheckLogs.length > 0) {
      try {
        return detailedHealthCheckLogs.map((log) => {
          const parsedResult = JSON.parse(log.result);
          return {
            New: Array.isArray(parsedResult.New) ? parsedResult.New : [],
            Modified: Array.isArray(parsedResult.Modified)
              ? parsedResult.Modified
              : [],
            Differences:
              log.differences_between_healthchecks !== ""
                ? JSON.parse(log.differences_between_healthchecks)
                : [],
          };
        });
      } catch (error) {
        console.error("Error parsing detailedHealthCheckLogs:", error);
        return [];
      }
    }
    return [];
  }, [detailedHealthCheckLogs]);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("hasSeenTour");

    if (!hasSeenTour) {
      setRunTour(true);
    }
  }, []);

  useEffect(() => {
    const path = window.location.hash.replace("#/", "");
    if (path && tabs.some((tab) => tab.id === path)) {
      setActiveTab(path);
    } else {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Fetch client data
  useEffect(() => {
    const getClientData = async () => {
      try {
        const response = await axios.get(
          "/api/now/table/x_nuvo_health_scan_client_healthcheck_config?sysparm_fields=name%2Csys_id%2Cclient_instance&sysparm_limit=1000",
        );
        return response?.data?.result || [];
      } catch (error) {
        console.error("Error fetching client data:", error);
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
    if (applicationData.length === 0) {
      return [];
    }
    const { display_value, value } = applicationData.applications;

    const names = display_value.split(",").map((s) => s.trim());
    const ids = value.split(",").map((s) => s.trim());

    const formatted = names.map((name, index) => ({
      sys_id: ids[index],
      name,
    }));

    return formatted;
  };

  // Fetch application data
  useEffect(() => {
    if (!selectedClient) return;

    const getApplicationData = async () => {
      try {
        const query =
          "client_healthcheck_config=" +
          clientConfigId +
          "^status=completed^ORDERBYDESCupdated";

        const response = await axios.get(
          `/api/now/table/x_nuvo_health_scan_healthcheck_instance`,
          {
            params: {
              sysparm_query: query,
              sysparm_display_value: "all",
              sysparm_fields: "applications",
              sysparm_limit: 1,
            },
          },
        );

        return response?.data?.result[0] || [];
      } catch (error) {
        console.error("Error fetching application data:", error);
        return [];
      }
    };

    const fetchApplicationData = async () => {
      const applicationReturnedData = await getApplicationData();

      if (applicationReturnedData) {
        const applicationsArray = formatApplications(applicationReturnedData);
        setApplicationData(applicationsArray);
      }
    };

    fetchApplicationData();
  }, [selectedClient, clientConfigId]);

  // Fetch start date data
  useEffect(() => {
    const getStartDateData = async () => {
      if (!selectedClient || !selectedApplication) return;

      try {
        const clientId = encodeURIComponent(selectedClient);
        const applicationId = encodeURIComponent(selectedApplication.sys_id);
        const query =
          "client_healthcheck_config=" +
          clientConfigId +
          "^applicationsLIKE" +
          applicationId +
          "^status=completed^ORDERBYDESCstart_date";

        const response = await axios.get(
          `/api/now/table/x_nuvo_health_scan_healthcheck_instance`,
          {
            params: {
              sysparm_query: query,
              sysparm_display_value: true,
              sysparm_fields: "start_date,sys_id",
              sysparm_limit: 1000,
            },
          },
        );

        return response?.data?.result || [];
      } catch (error) {
        console.error("Error fetching start date data:", error);
        return [];
      }
    };

    const fetchStartDateData = async () => {
      const startDateDataReturned = await getStartDateData();
      if (startDateDataReturned?.length > 0) {
        setStartDateData(startDateDataReturned);
      } else {
        setStartDateData([]);
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

        const query =
          "u_x_nuvo_health_scan_healthcheck_instance=" + selectedDateId;

        const response = await axios.get(
          `/api/now/table/x_nuvo_health_scan_m2m_x_nuvo_healt_x_nuvo_healt`,
          {
            params: {
              sysparm_query: query,
              sysparm_display_value: "all",
              sysparm_fields: "u_x_nuvo_health_scan_healthcheck_logs",
              sysparm_limit: 100,
            },
          },
        );

        setHealthCheckLogs(response?.data?.result || []);
      } catch (error) {
        console.error("Error fetching health check logs:", error);
      }
    };

    getHealthCheckLogs();
  }, [selectedDate]);

  useEffect(() => {
    // Example healthCheckLogs data
    if (!healthCheckLogs || healthCheckLogs.length <= 1) return;
    // Extract sys_ids from healthCheckLogs
    const sysIds = healthCheckLogs.map(
      (item) => item.u_x_nuvo_health_scan_healthcheck_logs.value,
    );

    // Construct the query string for the API call
    const sysIdQuery = sysIds
      .map(function (id) {
        return "sys_id=" + id;
      })
      .join("^OR");
    const query =
      "sysparm_query=" +
      sysIdQuery +
      "^probe_category=" +
      selectedApplication.sys_id +
      "^healthcheck_type=feature_usage^ORhealthcheck_type=data_integrity&sysparm_fields=healthcheck_type,result,feature_usage&sysparm_limit=10";

    // Make the API call
    const fetchHealthCheckDetails = async () => {
      //V2 MODIFIED
      // const apiUrl = '/api/now/table/x_nuvo_diag_healthcheck_logs?' + query;
      const apiUrl =
        "/api/now/table/x_nuvo_health_scan_healthcheck_logs?" + query;

      try {
        const response = await axios.get(apiUrl);

        const data = response?.data?.result;

        data?.map((logs) => {
          if (logs.healthcheck_type === "feature_usage") {
            setFeatureUsageCount(logs.result);
            setfeatureUsage(logs.feature_usage);
          }
          if (logs.healthcheck_type === "data_integrity") {
            setDataIntegrity(logs.result);
          }
        });
      } catch (error) {
        console.error("Error fetching health check details:", error);
      }
    };

    fetchHealthCheckDetails();
  }, [
    clientConfigId,
    selectedDate,
    selectedClient,
    selectedApplication,
    healthCheckLogs,
  ]); // Empty dependency array, meaning this effect will run once on mount

  // Fetch OOTB health check logs and detailed logs
  useEffect(() => {
    const fetchOotbHealthCheckLogs = async () => {
      if (!selectedClient) return;
      try {
        const clientId = encodeURIComponent(selectedClient.value);
        const query =
          "u_x_nuvo_health_scan_healthcheck_instance.client_healthcheck_config=" +
          clientConfigId +
          "^u_x_nuvo_health_scan_healthcheck_logs.healthcheck_type=ootb^ORDERBYDESCsys_created_on";

        const response = await axios.get(
          "/api/now/table/x_nuvo_health_scan_m2m_x_nuvo_healt_x_nuvo_healt",
          {
            params: {
              sysparm_query: query,
              sysparm_fields: "u_x_nuvo_health_scan_healthcheck_logs",
              sysparm_limit: 10,
            },
          },
        );

        const logs = response?.data?.result || [];
        setOotbHealthCheckLogs(logs);

        // Extract sys_ids from the response to make the second API call
        const sysIds = logs
          .map((log) => log.u_x_nuvo_health_scan_healthcheck_logs.value)
          .join("^ORsys_id=");

        // Make the second API call if sysIds are available
        if (sysIds) {
          //V2 Modified
          // const detailedResponse = await axios.get('/api/now/table/x_nuvo_diag_healthcheck_logs', {
          const detailedResponse = await axios.get(
            "/api/now/table/x_nuvo_health_scan_healthcheck_logs",
            {
              params: {
                sysparm_query: "sys_id=" + sysIds + "^ORDERBYsys_created_on",
                sysparm_fields: "result,differences_between_healthchecks",
                sysparm_limit: 10,
              },
            },
          );

          setDetailedHealthCheckLogs(detailedResponse?.data?.result || []);
          setDifferencesData(
            detailedResponse?.data?.differences_between_healthchecks || [],
          );
        } else {
          setDetailedHealthCheckLogs([]);
          setDifferencesData([]);
        }
      } catch (error) {
        console.error(
          "Error fetching OOTB health check logs or detailed logs:",
          error,
        );
      }
    };

    fetchOotbHealthCheckLogs();
  }, [selectedClient]);

  useEffect(() => {
    const fetchUpgradeConflictsLogs = async () => {
      if (!selectedClient) return;

      try {
        const clientId = encodeURIComponent(selectedClient.value);
        const query =
          "u_x_nuvo_health_scan_healthcheck_instance.client_healthcheck_config=" +
          clientConfigId +
          "^u_x_nuvo_health_scan_healthcheck_logs.healthcheck_type=upgrade_conflicts^ORDERBYDESCsys_created_on";

        const response = await axios.get(
          "/api/now/table/x_nuvo_health_scan_m2m_x_nuvo_healt_x_nuvo_healt",
          {
            params: {
              sysparm_query: query,
              sysparm_fields: "u_x_nuvo_health_scan_healthcheck_logs",
              sysparm_limit: 1,
            },
          },
        );

        const logs = response?.data?.result || [];
        setUpgradeHealthCheckLogs(logs);

        // Extract sys_ids from the response to make the second API call
        const sysIds = logs
          .map((log) => log.u_x_nuvo_health_scan_healthcheck_logs.value)
          .join("^ORsys_id=");

        // Make the second API call if sysIds are available
        if (sysIds) {
          //V2 Modified
          // const detailedResponse = await axios.get('/api/now/table/x_nuvo_diag_healthcheck_logs', {
          const detailedResponse = await axios.get(
            "/api/now/table/x_nuvo_health_scan_healthcheck_logs",
            {
              params: {
                sysparm_query: "sys_id=" + sysIds + "^ORDERBYsys_created_on",
                sysparm_fields: "result",
                sysparm_limit: 1,
              },
            },
          );

          setDetailedUpgradeConflicLogs(detailedResponse?.data?.result || []);
        }
      } catch (error) {
        console.error(
          "Error fetching OOTB health check logs or detailed logs:",
          error,
        );
      }
    };

    fetchUpgradeConflictsLogs();
  }, [selectedClient]);

  const handleClientSelect = (client) => {
    setSelectedClient(client.name); // Storing the name of the selected client
    setClientConfigId(client.clientConfigId); // Storing the sys_id as clientConfigId
    setClientInstanceName(client.client_instance);
    setSelectedApplication(null);
    setSelectedDate(null);
    setFeatureUsageCount(null);
    setfeatureUsage(null);
    setDataIntegrity(null);
    setHealthCheckLogs([]);
  };

  const handleApplicationSelect = (application) => {
    setSelectedApplication(application);
    setSelectedDate(null);
    setFeatureUsageCount(null);
    setfeatureUsage(null);
    setDataIntegrity(null);
    setHealthCheckLogs([]);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setFeatureUsageCount(null);
    setfeatureUsage(null);
    setDataIntegrity(null);
    setHealthCheckLogs([]);
  };

  const steps = useMemo(() => [
    {
      target: "#client-dropdown",
      content:
        "Start by selecting a client. For this walkthrough, we automatically select the 'Nuvolo- Dev' client for you.",
      placement: "bottom",
    },
    {
      target: "#application-dropdown",
      content:
        "Next, choose the Facilities application you want to analyze from this list.",
      placement: "bottom",
    },
    {
      target: "#date-dropdown",
      content:
        "Now pick the Health Check run date. For this tour we use the scan from 2026-02-04.",
      placement: "bottom",
    },

    {
      target: "#tab-feature",
      content:
        "This is the Feature Report tab, where you can review feature usage grouped by feature areas.",
      placement: "bottom",
    },
    {
      target: "#feature-search",
      content:
        "Use this search box to quickly find specific feature groups or individual features by name.",
      placement: "bottom",
    },
    {
      target: "#feature-group-accordion",
      content:
        "Here each row is a Feature Group. Expand a group to see feature names, current and previous HealthCheck counts, thresholds, and deep links to each feature.",
      placement: "top",
    },
    {
      target: "#feature-download-excel",
      content:
        "Click this Excel icon to download the full Feature Report as an Excel file for offline review or sharing.",
      placement: "left",
    },

    // Other tabs
    {
      target: "#tab-data-integrity",
      content: "This tab shows Data Integrity issues.",
      placement: "bottom",
    },
    {
      target: "#data-integrity-search",
      content:
        "On the Data Integrity tab, use this search to quickly filter checks by category or check name.",
      placement: "bottom",
    },
    {
      target: "#data-integrity-download-excel",
      content:
        "Use this Excel button to download all visible Data Integrity checks to an Excel file.",
      placement: "left",
    },
    {
      target: "#data-integrity-card",
      content:
        "Each card is a Data Integrity category. 'Curr' refers to the current HealthCheck count, and 'Prev' refers to the previous run. You can also download Excel just for this card using the download icon.",
      placement: "top",
    },

    // OOB Conflict tab
    {
      target: "#tab-oob-conflict",
      content:
        "Now let's look at OOB Conflicts to understand script changes across health checks.",
      placement: "bottom",
    },
    {
      target: "#oob-historical-overview",
      content:
        "This section shows the HealthCheck Historical Overview for scripts. The legend explains New Scripts Added, Modified Scripts, and Difference Scripts between runs.",
      placement: "top",
    },
    {
      target: "#oob-bar-chart",
      content:
        "This bar chart shows script counts across health check runs. Click any bar to drill into that run's script-type breakdown.",
      placement: "top",
    },
    {
      target: "#oob-pie-chart",
      content:
        "This pie chart shows how scripts are distributed by script type for the selected health check. Click any slice to filter the data table below.",
      placement: "top",
    },
    {
      target: "#oob-data-table",
      content:
        "The data table updates based on your selection. You can change grouping (by script type, table, or script state) and review columns like script name, type, last updated, and state.",
      placement: "top",
    },
    {
      target: "#oob-download-excel",
      content:
        "Use this Excel icon to download the current table view, including your grouping and filtering, for offline analysis.",
      placement: "left",
    },

    // Upgrade Conflict tab
    {
      target: "#tab-upgrade-conflict",
      content:
        "Finally, let's review Upgrade Conflicts — scripts that may conflict with an upcoming ServiceNow upgrade.",
      placement: "bottom",
    },
    {
      target: "#upgrade-cards",
      content:
        "These cards summarize upgrade conflicts for P1 and P2. Each card shows how many conflicts were detected for that phase.",
      placement: "top",
    },
    {
      target: "#upgrade-tab-p1",
      content:
        "This tab shows the detailed Upgrade History P1 conflicts. Review the file names, priorities, and dispositions here.",
      placement: "top",
    },
    {
      target: "#upgrade-tab-p2",
      content:
        "This tab shows Upgrade History P2 conflicts. Switch here after reviewing P1 to see P2 details.",
      placement: "top",
    },
    {
      target: "#upgrade-excel-download",
      content:
        "Use this Excel icon to download all upgrade conflicts (both P1 and P2) into a single Excel file.",
      placement: "left",
    },
    {
      target: "#version-summary",
      content:
        "Here you can review Nuvolo's table count for additional context about the upgrade. That completes the full tour!",
      placement: "top",
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Joyride
        steps={steps}
        run={runTour}
        stepIndex={stepIndex}
        continuous={true}
        showSkipButton={true}
        showProgress={true}
        disableOverlayClose={true}
        spotlightClicks={false}
        styles={{
          options: {
            zIndex: 10000,
            primaryColor: "#74caf2", // Sky Blue (Tailwind sky-500)
            textColor: "#1f2937", // Dark text
            backgroundColor: "#ffffff", // Tooltip background
            arrowColor: "#ffffff",
          },
        }}
        callback={(data) => {
          const { status, index, type, action } = data;

          // When a target isn't in the DOM yet, briefly pause and restart
          // Joyride at the same step once the DOM has settled.
          if (type === "error:target_not_found") {
            setRunTour(false);
            setTimeout(() => setRunTour(true), 300);
            return;
          }

          if (type === "step:after") {
            const nextIndex =
              action === "next"
                ? index + 1
                : action === "prev"
                  ? index - 1
                  : index;

            if (action === "next") {
              // ── Auto-select demo data ──────────────────────────────────
              if (index === 0 && !selectedClient && clientData.length > 0) {
                const normalize = (str) =>
                  (str || "").toLowerCase().replace(/[\s-_]+/g, "");
                const defaultClient =
                  clientData.find((c) =>
                    normalize(c.name).includes("nuvolodev"),
                  ) || clientData[0];
                handleClientSelect({
                  name: defaultClient.name,
                  clientConfigId: defaultClient.sys_id,
                  client_instance: defaultClient.client_instance,
                });
              }

              if (
                index === 1 &&
                !selectedApplication &&
                applicationData.length > 0
              ) {
                const preferredApplication =
                  applicationData.find((app) =>
                    app.name?.toLowerCase().includes("facilit"),
                  ) || applicationData[0];
                handleApplicationSelect(preferredApplication);
              }

              if (index === 2 && !selectedDate && startDateData.length > 0) {
                const targetDate = startDateData.find(
                  (item) =>
                    item.start_date &&
                    item.start_date.startsWith("2026-02-04"),
                );
                handleDateSelect(targetDate || startDateData[0]);
              }

              // ── Same-tab navigation steps ──────────────────────────────
              if (nextIndex === 3) {
                setActiveTab("");
                navigate("");
              }
              if (nextIndex === 7) {
                setActiveTab("data-integrity");
                navigate("data-integrity");
              }

              // ── Cross-tab navigation steps ─────────────────────────────
              // Stop the tour, navigate, update step, then restart so
              // Joyride re-initialises cleanly on the new page.
              if (nextIndex === 11) {
                setStepIndex(11);
                setRunTour(false);
                setActiveTab("oob-conflict");
                navigate("oob-conflict");
                setTimeout(() => setRunTour(true), 150);
                return;
              }
              if (nextIndex === 17) {
                setStepIndex(17);
                setRunTour(false);
                setActiveTab("upgrade-conflict");
                navigate("upgrade-conflict");
                setTimeout(() => setRunTour(true), 150);
                return;
              }
            }

            if (action === "prev") {
              if (index === 2) setSelectedDate(null);
              if (index === 1) {
                setSelectedApplication(null);
                setSelectedDate(null);
              }
              if (index === 11) {
                setStepIndex(10);
                setRunTour(false);
                setActiveTab("data-integrity");
                navigate("data-integrity");
                setTimeout(() => setRunTour(true), 150);
                return;
              }
              if (index === 17) {
                setStepIndex(16);
                setRunTour(false);
                setActiveTab("oob-conflict");
                navigate("oob-conflict");
                setTimeout(() => setRunTour(true), 150);
                return;
              }
            }

            setStepIndex(nextIndex);
          }

          if (status === "finished" || status === "skipped") {
            localStorage.setItem("hasSeenTour", "true");
            setRunTour(false);
            setStepIndex(0);
          }
        }}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="w-full flex justify-end items-center space-x-3 mb-4">
          <button
            onClick={() => {
              localStorage.removeItem("hasSeenTour");
              setRunTour(true);
              setStepIndex(0);
            }}
            className="px-4 py-2 rounded-full bg-sky-500 text-white text-sm font-medium shadow hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            Start Tour
          </button>
          <button
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700"
            onClick={toggleDarkMode}
          >
            {isDarkMode ? (
              <LuSun className="h-5 w-5" />
            ) : (
              <LuMoon className="h-5 w-5" />
            )}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div id="client-dropdown">
            <ClientSelectionDropdown
              items={clientData}
              label="Select Client"
              icon={<GrOrganization />}
              selectedItem={selectedClient}
              onItemSelect={handleClientSelect}
            />
          </div>
          {activeTab !== "oob-conflict" && activeTab !== "upgrade-conflict" && (
            <div id="application-dropdown">
              <ApplicationSelectionDropdown
                items={applicationData}
                label="Select Application"
                icon={<MdSettingsApplications />}
                selectedItem={selectedApplication}
                onItemSelect={handleApplicationSelect}
                disabled={!selectedClient}
              />
            </div>
          )}

          {activeTab !== "oob-conflict" && activeTab !== "upgrade-conflict" && (
            <div id="date-dropdown">
              <StartDateSelectionDropdown
                items={startDateData}
                label="Select Date"
                icon={<MdDateRange />}
                selectedItem={selectedDate}
                onItemSelect={handleDateSelect}
                disabled={!selectedApplication}
              />
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8 transition-all duration-300">
          <div className="flex justify-between">
            <div className="flex space-x-4 mb-6">
              {tabs.map((tab) => {
                const tabId = tab.id === "" ? "tab-feature" : `tab-${tab.id}`;

                return (
                  <button
                    id={tabId}
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      navigate(tab.id);
                    }}
                    className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      activeTab === tab.id
                        ? "bg-sky-500 text-white shadow-lg"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    <tab.icon className="mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <div className="flex">
              {parsedData[0]?.Modified[0]?.nuvolo_version && (
                <h2 className="text-base text-gray-800 dark:text-gray-200 mr-4">
                  {" "}
                  <span className="text-sky-500">Nuvolo Version:</span>{" "}
                  {parsedData[0]?.Modified[0]?.nuvolo_version}
                </h2>
              )}
              {parsedData[0]?.Modified[0]?.servicenow_version && (
                <h2 className="text-base text-gray-800 dark:text-gray-200">
                  {" "}
                  <span className="text-sky-500">ServiceNow Version:</span>{" "}
                  {parsedData[0]?.Modified[0]?.servicenow_version}
                </h2>
              )}
            </div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-900 p-6 rounded-lg transition-all duration-300">
            <div className="text-gray-700 dark:text-gray-300">
              <Outlet
                context={{
                  healthCheckLogs,
                  selectedDate,
                  ootbHealthCheckLogs,
                  detailedHealthCheckLogs,
                  upgradeHealthCheckLogs,
                  detailedUpgradeConflictLogs,
                  featureUsage,
                  featureUsageCount,
                  dataIntegrity,
                  differencesData,
                  clientInstanceName,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeLayout;
