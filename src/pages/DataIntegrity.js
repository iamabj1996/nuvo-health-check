import React, { useState, useEffect, useMemo } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiTool,
  FiClipboard,
  FiShoppingCart,
  FiList,
  FiMonitor,
  FiBox,
  FiSearch,
  FiPackage,
} from "react-icons/fi";
import { RiFileExcel2Fill } from "react-icons/ri";
import { FaFileDownload } from "react-icons/fa";
import { useOutletContext } from "react-router-dom";
import ClockLoader from "react-spinners/ClockLoader";
import Tooltip from "../components/Tooltip";
import * as XLSX from "xlsx";

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
  Checklist: FiList,
  "Facilities Devices": FiMonitor,
  "Facilities Models": FiBox,
  "Facilities Maintenance Definition": FiPackage,
};

export default function DataIntegrity() {
  const { healthCheckLogs, selectedDate, dataIntegrity } = useOutletContext();
  const [searchTerm, setSearchTerm] = useState("");
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

  const getSafeSheetName = (name) => {
    return name
      .replace(/[\\/?*[\]:]/g, "") // remove invalid chars
      .substring(0, 31); // Excel limit
  };

  const downloadCategoryExcel = (category, items) => {
    const rows = [];

    Object.entries(items).forEach(([item, data]) => {
      rows.push({
        Category: category,
        "Check Name": item,
        "Current Count": data.count ?? "-",
        "Previous Count": data.pastCount ?? "-",
        Threshold: data.threshold ?? "-",
        "Current Status":
          Number(data.count) > Number(data.threshold)
            ? "Action Needed"
            : "Good",
        "Previous Status":
          Number(data.pastCount) > Number(data.threshold)
            ? "Action Needed"
            : "Good",
        URL: data.url ?? "",
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      getSafeSheetName(category),
    );

    XLSX.writeFile(
      workbook,
      `${category.replace(/\s+/g, "_")}_Data_Integrity_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`,
    );
  };

  const downloadExcel = () => {
    const rows = [];

    Object.entries(filteredResults).forEach(([category, items]) => {
      Object.entries(items).forEach(([item, data]) => {
        rows.push({
          Category: category,
          "Check Name": item,
          "Current Count": data.count ?? "-",
          "Previous Count": data.pastCount ?? "-",
          Threshold: data.threshold ?? "-",
          "Current Status":
            Number(data.count) > Number(data.threshold)
              ? "Action Needed"
              : "Good",
          "Previous Status":
            Number(data.pastCount) > Number(data.threshold)
              ? "Action Needed"
              : "Good",
          URL: data.url ?? "",
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Integrity");

    XLSX.writeFile(
      workbook,
      `Data_Integrity_Report_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

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
        subKey.toLowerCase().includes(lowercaseSearchTerm),
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
          <div className="mb-6 relative flex items-center gap-4">
            <div className="flex-1 relative" id="data-integrity-search">
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <Tooltip text="Export all Data Integrity checks to Excel" position="left">
              <RiFileExcel2Fill
                id="data-integrity-download-excel"
                display={!Object.keys(filteredResults).length}
                size="2.2rem"
                color="#33C481"
                onClick={downloadExcel}
                cursor="pointer"
              />
            </Tooltip>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto max-h-[calc(100vh-300px)]">
            {Object.entries(filteredResults).map(([category, items]) => {
              const Icon = iconMap[category] || FiAlertCircle;
              return (
                <div
                  key={category}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-all duration-300 hover:shadow-lg"
                  id={category === Object.keys(filteredResults)[0] ? "data-integrity-card" : undefined}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Icon className="text-sky-500 mr-2 text-2xl" />
                      <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                        {category}
                      </h2>
                    </div>
                    <Tooltip text="Export to Excel">
                      <FaFileDownload
                        onClick={() => downloadCategoryExcel(category, items)}
                        color="#33C481"
                        cursor="pointer"
                        size="1.5rem"
                      />
                    </Tooltip>
                  </div>

                  <div className="flex justify-end mb-2 space-x-5">
                    <Tooltip text="Previous">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-9 text-center flex items-center">
                        Prev
                      </span>
                    </Tooltip>
                    <Tooltip text="Current">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-9 text-center flex items-center">
                        Curr
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
                              "text-sm font-medium px-2 py-1 rounded-full w-12 text-center " +
                              (Number(data.pastCount) > Number(data.threshold)
                                ? "bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200"
                                : "bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200")
                            }
                          >
                            {data.pastCount}
                          </span>
                          <span
                            className={
                              "text-sm font-medium px-2 py-1 rounded-full w-12 text-center " +
                              (Number(data.count) > Number(data.threshold)
                                ? "bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200"
                                : "bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200")
                            }
                          >
                            {data.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
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
