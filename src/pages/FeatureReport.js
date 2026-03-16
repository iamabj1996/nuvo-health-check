import React, { useState, useMemo, useEffect } from "react";
import {
  FiChevronRight,
  FiChevronDown,
  FiSearch,
  FiExternalLink,
} from "react-icons/fi";
import { useOutletContext } from "react-router-dom";
import ClockLoader from "react-spinners/ClockLoader";
import * as XLSX from "xlsx";
import { RiFileExcel2Fill } from "react-icons/ri";
import Tooltip from "../components/Tooltip";

const override = {
  display: "block",
  margin: "0 auto",
  borderColor: "#28b3d8",
};

const FeatureReport = () => {
  const { featureUsageCount } = useOutletContext();
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [parsedData, setParsedData] = useState({});

  useEffect(() => {
    const parseData = async () => {
      setLoading(true);
      if (featureUsageCount) {
        setParsedData(JSON.parse(featureUsageCount));
      } else {
        setParsedData({});
      }
      setLoading(false);
    };

    parseData();
  }, [featureUsageCount]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return parsedData;

    const lowercaseSearchTerm = searchTerm.toLowerCase();

    return Object.entries(parsedData).reduce((acc, [group, values]) => {
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
  }, [searchTerm, parsedData]);

  const downloadExcel = () => {
    const rows = [];

    Object.entries(parsedData).forEach(([group, values]) => {
      Object.entries(values).forEach(([subKey, data]) => {
        rows.push({
          "Feature Group": group,
          "Feature Name": subKey,
          "Current HealthCheck": data.count ?? "-",
          "Previous HealthCheck": data.pastCount ?? "-",
          Threshold: data.threshold ?? "-",
          Status:
            Number(data.count) <= Number(data.threshold)
              ? "Action Needed"
              : "Good",
          URL: data.url ?? "",
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Feature Report");

    // This triggers download directly
    XLSX.writeFile(
      workbook,
      `Feature_Report_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  const toggleGroup = (group) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(group)) {
        newSet.delete(group);
      } else {
        newSet.add(group);
      }
      return newSet;
    });
  };

  const getGroupStatus = (values) => {
    const allZero = Object.values(values).every((v) => v.count === "0");
    const allNonZero = Object.values(values).every((v) => v.count !== "0");
    if (allZero)
      return {
        status: "Inactive",
        color: "bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200",
      };
    if (allNonZero)
      return {
        status: "Active",
        color:
          "bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200",
      };
    return {
      status: "Partial",
      color:
        "bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200",
    };
  };

  return (
    <div className="overflow-x-auto">
      {loading ? (
        <ClockLoader
          color="#28b3d8"
          loading={loading}
          cssOverride={override}
          size={200}
        />
      ) : (
        <>
          <div className="mb-4 flex items-center space-x-4">
            <div className="mb-6 w-full flex items-center gap-4">
              <div
                id="feature-search"
                className="flex-1 relative"
              >
                <input
                  type="text"
                  placeholder="Search features..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>

              <Tooltip text="Export to Excel" position="left">
                <RiFileExcel2Fill
                  id="feature-download-excel"
                  size="2.2rem"
                  color="#33C481"
                  onClick={downloadExcel}
                  className="cursor-pointer flex-shrink-0"
                />
              </Tooltip>
            </div>
          </div>
          <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
            <table
              className="min-w-full bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden"
              id="feature-group-accordion"
            >
              <thead className="bg-gray-200 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">
                    Feature Group
                  </th>
                  <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">
                    Current HealthCheck
                  </th>
                  <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">
                    Previous HealthCheck
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(filteredData).map(([group, values]) => {
                  const { status, color } = getGroupStatus(values);
                  return (
                    <React.Fragment key={group}>
                      <tr
                        className="bg-gray-100 dark:bg-gray-600 cursor-pointer"
                        onClick={() => toggleGroup(group)}
                      >
                        <td className="px-4 py-2 font-bold text-gray-800 dark:text-gray-200">
                          {expandedGroups.has(group) ? (
                            <FiChevronDown className="inline mr-2" />
                          ) : (
                            <FiChevronRight className="inline mr-2" />
                          )}
                          {group}
                        </td>
                        <td className={"px-4 py-1"}>
                          <span
                            className={
                              "rounded-full text-xs font-bold px-2 py-1" + color
                            }
                          >
                            {status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-800 dark:text-gray-200"></td>
                        <td className="px-4 py-2 text-gray-800 dark:text-gray-200"></td>
                      </tr>
                      {expandedGroups.has(group) &&
                        Object.entries(values).map(([subKey, data]) => (
                          <tr
                            key={subKey}
                            className="border-t border-gray-200 dark:border-gray-700"
                          >
                            <td className="px-8 py-2 text-gray-800 dark:text-gray-200">
                              <a
                                href={data.url}
                                target="_blank"
                                className={
                                  "flex items-center " + highlightClass(2)
                                }
                                rel="noopener noreferrer"
                              >
                                {subKey}
                                <FiExternalLink className="ml-2" />
                              </a>
                            </td>
                            <td className="px-4 py-2 text-gray-800 dark:text-gray-200">
                              {/* <span className={`rounded-full text-xs font-bold px-2 py-1 ${data.count === "0" ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200' : 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200'}`}>
                                                            {data.count === "0" ? 'Good' : 'Action Needed'}
                                                        </span> */}
                            </td>
                            <td className="text-center">
                              {" "}
                              <span
                                style={{ marginRight: "4rem" }}
                                className={
                                  "text-sm font-medium px-2 py-1 rounded-full min-w-[40px] text-center " +
                                  (Number(data.count) <= Number(data.threshold)
                                    ? "bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200"
                                    : "bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200")
                                }
                              >
                                {data.count}
                              </span>{" "}
                            </td>
                            <td className="px-4 py-2 text-gray-800 dark:text-gray-200 text-center">
                              <span
                                style={{ marginRight: "4rem" }}
                                className={
                                  "text-sm font-medium px-2 py-1 rounded-full min-w-[40px] text-center " +
                                  (Number(data.pastCount) <=
                                  Number(data.threshold)
                                    ? "bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200"
                                    : "bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200")
                                }
                              >
                                {" "}
                                {data.pastCount ? data.pastCount : "-"}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          {Object.entries(filteredData).length === 0 && (
            <div className="text-center text-gray-600 dark:text-gray-400 mt-8">
              No results found.
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FeatureReport;
