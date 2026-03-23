import React, { useState, useEffect, useRef, useMemo } from "react";
import dxPieChart from "devextreme/viz/pie_chart";
import dxChart from "devextreme/viz/chart";
import { useOutletContext } from "react-router-dom";
import DataTable from "../components/DataTable";

const ChartsAndTableComponent = () => {
  const dataTableRef = useRef(null);
  const pieSectionRef = useRef(null);
  const { detailedHealthCheckLogs, differencesData } = useOutletContext();
  const [selectedScriptType, setSelectedScriptType] = useState(null);
  const pieChartRef = useRef(null);
  const pieChartDifferencesRef = useRef(null);
  const barChartRef = useRef(null);

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

  const [healthCheckCount, setHealthCheckCount] = useState();
  const [selectedHealthCheckNumber, setSelectedHealthCheckNumber] = useState();
  const [pieChartData, setPieChartData] = useState([]);
  const [pieChartDifferencesData, setPieChartDifferencesData] = useState([]);
  const [selectedData, setSelectedData] = useState([]);
  const [selectedDifferencesData, setSelectedDifferencesData] = useState([]);
  const [colorPalette, setColorPalette] = useState("Bright");
  const [activeTab, setActiveTab] = useState("dataTable");
  const [groupBy, setGroupBy] = useState("table_name");

  useEffect(() => {
    if (parsedData.length > 0) {
      setHealthCheckCount(Math.min(10, parsedData.length));
      setSelectedHealthCheckNumber(parsedData.length);
      const latestHealthCheck = parsedData[parsedData.length - 1];
      updatePieCharts(latestHealthCheck);
      setSelectedData([...latestHealthCheck.New, ...latestHealthCheck.Modified]);
      setSelectedDifferencesData(
        latestHealthCheck.Differences.length > 0
          ? [...latestHealthCheck.Differences]
          : [],
      );
    } else {
      setPieChartData([]);
      setPieChartDifferencesData([]);
      setSelectedData([]);
      setSelectedDifferencesData([]);
      setSelectedHealthCheckNumber(undefined);
    }
  }, [parsedData, detailedHealthCheckLogs]);

  const updatePieCharts = (healthCheckData) => {
    setSelectedScriptType(null); // reset filter on new selection

    const scriptTypeCount = healthCheckData.New.concat(
      healthCheckData.Modified,
    ).reduce((acc, entry) => {
      const scriptType = entry.script_type;
      if (scriptType) {
        acc[scriptType] = (acc[scriptType] || 0) + 1;
      }
      return acc;
    }, {});

    setPieChartData(
      Object.entries(scriptTypeCount).map(([name, value]) => ({ name, value })),
    );

    const differencesScriptTypeCount = healthCheckData.Differences.reduce(
      (acc, entry) => {
        const scriptType = entry.script_type;
        if (scriptType) {
          acc[scriptType] = (acc[scriptType] || 0) + 1;
        }
        return acc;
      },
      {},
    );

    setPieChartDifferencesData(
      Object.entries(differencesScriptTypeCount).map(([name, value]) => ({
        name,
        value,
      })),
    );
  };

  useEffect(() => {
    const barChartData = parsedData
      .slice(-healthCheckCount)
      .map((entry, index) => ({
        index: parsedData.length - healthCheckCount + index,
        name:
          "Health Check " + (parsedData.length - healthCheckCount + index + 1),
        newEntries: entry.New.length,
        modifiedEntries: entry.Modified.length,
        differencesEntries: entry.Differences.length,
      }));

    const pieChart = new dxPieChart(pieChartRef.current, {
      dataSource: pieChartData,
      series: [
        {
          argumentField: "name",
          valueField: "value",
          label: { visible: false },
        },
      ],
      palette: colorPalette,
      legend: {
        /* unchanged */
      },
      onPointClick: (e) => {
        setActiveTab("dataTable");
        setSelectedScriptType(e.target.argument);
        scrollToDataTable();
      },
    });

    function toggleVisibility(item) {
      if (item.isVisible()) {
        item.hide();
      } else {
        item.show();
      }
    }

    const pieChartDifferences = new dxPieChart(
      pieChartDifferencesRef.current,
      {
      dataSource: pieChartDifferencesData,
      series: [
        {
          argumentField: "name",
          valueField: "value",
          label: { visible: false },
        },
      ],
      palette: colorPalette,
      legend: {
        /* unchanged */
      },
      onPointClick: (e) => {
        setActiveTab("differencesDataTable");
        setSelectedScriptType(e.target.argument);
        scrollToDataTable();
      },
    });

    const barChart = new dxChart(barChartRef.current, {
      dataSource: barChartData,
      series: [
        {
          valueField: "newEntries",
          name: "New",
          color: "#4caf50",
          stack: "stack1",
        },
        {
          valueField: "modifiedEntries",
          name: "Modified",
          color: "#f44336",
          stack: "stack1",
        },
        {
          valueField: "differencesEntries",
          name: "Differences",
          type: "line",
          color: "yellow",
          valueAxis: "axis1",
        },
      ],
      commonSeriesSettings: {
        argumentField: "name",
        type: "stackedBar",
        label: { visible: false, connector: { visible: true, width: 1 } },
      },
      valueAxis: [
        {
          name: "axis1",
          position: "left",
          title: { text: "Differences" },
        },
      ],
      legend: {
        verticalAlignment: "bottom",
        horizontalAlignment: "center",
        customizeText: (e) =>
          e.seriesName === "New"
            ? "New Scripts Added"
            : e.seriesName === "Modified"
              ? "Modified Scripts"
              : "Difference Scripts",
      },
      onPointClick: (e) => {
        const healthCheckIndex = e.target.data.index;
        const healthCheckData = parsedData[healthCheckIndex];

        if (healthCheckData) {
          updatePieCharts(healthCheckData);
          setSelectedHealthCheckNumber(healthCheckIndex + 1);
          setSelectedData([
            ...healthCheckData.New,
            ...healthCheckData.Modified,
          ]);
          setSelectedDifferencesData(
            healthCheckData.Differences.length > 0
              ? [...healthCheckData.Differences]
              : [],
          );

          setActiveTab("dataTable");
          scrollToPieCharts();
        }
      },
    });

    return () => {
      pieChart.dispose();
      pieChartDifferences.dispose();
      barChart.dispose();
    };
  }, [
    parsedData,
    pieChartData,
    pieChartDifferencesData,
    colorPalette,
    healthCheckCount,
  ]);

  const filteredSelectedData = useMemo(() => {
    if (!selectedScriptType) return selectedData;
    return selectedData.filter(
      (item) => item.script_type === selectedScriptType,
    );
  }, [selectedData, selectedScriptType]);

  const filteredSelectedDifferencesData = useMemo(() => {
    if (!selectedScriptType) return selectedDifferencesData;
    return selectedDifferencesData.filter(
      (item) => item.script_type === selectedScriptType,
    );
  }, [selectedDifferencesData, selectedScriptType]);

  const scrollToDataTable = () => {
    dataTableRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const scrollToPieCharts = () => {
    pieSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="container mx-auto p-4">
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
        id="oob-historical-overview"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            HealthCheck Historical Overview
          </h2>
          <div className="flex items-center">
            <label
              htmlFor="healthCheckCount"
              className="mr-2 text-gray-700 dark:text-gray-300"
            >
              Show:
            </label>
            <select
              id="healthCheckCount"
              value={healthCheckCount}
              onChange={(e) => setHealthCheckCount(Number(e.target.value))}
              className="p-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            >
              {[...Array(parsedData.length)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          ref={barChartRef}
          style={{ height: "300px" }}
          className="w-full"
          id="oob-bar-chart"
        ></div>

        <div
          ref={pieSectionRef}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
              Scripts {selectedHealthCheckNumber} By Type
            </h2>
            <div
              ref={pieChartRef}
              style={{ height: "300px" }}
              className="w-full"
              id="oob-pie-chart"
            ></div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
              Differences in Script {selectedHealthCheckNumber} By Type
            </h2>
            <div
              ref={pieChartDifferencesRef}
              style={{ height: "300px" }}
              className="w-full"
            ></div>
          </div>
        </div>
      </div>

      <div
        ref={dataTableRef}
        className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
        id="oob-data-table"
      >
        <div className="mb-4 border-b-2 border-gray-300 dark:border-gray-600">
          <div
            className={`inline-block py-2 px-4 cursor-pointer ${
              activeTab === "dataTable"
                ? "font-semibold text-sky-500"
                : "text-gray-500 dark:text-gray-300"
            }`}
            onClick={() => setActiveTab("dataTable")}
          >
            Data Table
          </div>

          <div
            className={`inline-block py-2 px-4 cursor-pointer ml-4 ${
              activeTab === "differencesDataTable"
                ? "font-semibold text-sky-500"
                : "text-gray-500 dark:text-gray-300"
            }`}
            onClick={() => setActiveTab("differencesDataTable")}
          >
            Differences Data Table
          </div>
        </div>

        {activeTab === "dataTable" && (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
              Data Table
            </h2>
            <DataTable
              data={filteredSelectedData}
              groupBy={groupBy}
              onGroupByChange={setGroupBy}
            />
          </div>
        )}

        {activeTab === "differencesDataTable" && (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
              Differences Data Table
            </h2>
            <DataTable
              data={filteredSelectedDifferencesData}
              groupBy={groupBy}
              onGroupByChange={setGroupBy}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartsAndTableComponent;
