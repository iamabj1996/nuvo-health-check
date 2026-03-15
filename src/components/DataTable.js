import React, { useState, useMemo, useCallback } from "react";
import {
  FiChevronUp,
  FiChevronDown,
  FiSearch,
  FiChevronRight,
  FiChevronLeft,
  FiChevronsLeft,
  FiChevronsRight,
  FiDownload,
} from "react-icons/fi";
import { useOutletContext } from "react-router-dom";
import * as XLSX from "xlsx";
import Tooltip from "../components/Tooltip";
import { RiFileExcel2Fill } from "react-icons/ri";

const CustomInput = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <input
      className={
        "px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500" +
        className
      }
      ref={ref}
      {...props}
    />
  );
});
CustomInput.displayName = "CustomInput";

const CustomButton = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <button
      className={
        "px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-50" +
        className
      }
      ref={ref}
      {...props}
    />
  );
});
CustomButton.displayName = "CustomButton";

const CustomTable = ({ data = [], groupBy, onGroupByChange }) => {
  const { clientInstanceName } = useOutletContext();
  const [sortConfig, setSortConfig] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [searchFilters, setSearchFilters] = useState({});
  const itemsPerPage = 50;
  const columnsToExclude = [
    "servicenow_version",
    "nuvolo_version",
    "hash_value",
    "script_id",
  ];

  // Define the order of columns to display
  const columnOrder = [
    "script_name",
    "script_type",
    "last_updated",
    "table_name",
    "script_state",
  ];

  const sortedData = useMemo(() => {
    let sortableData = [...data];
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [data, sortConfig]);

  const filteredAndGroupedData = useMemo(() => {
    let result = sortedData.filter((item) =>
      Object.entries(searchFilters).every(([key, value]) =>
        String(item[key]).toLowerCase().includes(value.toLowerCase()),
      ),
    );

    if (groupBy !== "none") {
      const groups = {};
      result.forEach((item) => {
        const key = item[groupBy];
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(item);
      });
      return groups;
    }

    return { All: result };
  }, [sortedData, searchFilters, groupBy]);

  const totalPages = Math.ceil(
    Object.values(filteredAndGroupedData).flat().length / itemsPerPage,
  );

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return Object.fromEntries(
      Object.entries(filteredAndGroupedData).map(([group, items]) => [
        group,
        items.slice(startIndex, endIndex),
      ]),
    );
  }, [filteredAndGroupedData, currentPage]);

  const requestSort = (key) => {
    let direction = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnName) => {
    if (sortConfig?.key === columnName) {
      return sortConfig.direction === "ascending" ? (
        <FiChevronUp className="inline" />
      ) : (
        <FiChevronDown className="inline" />
      );
    }
    return null;
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

  const handleSearchChange = useCallback((column, value) => {
    setSearchFilters((prev) => ({
      ...prev,
      [column]: value,
    }));
    setCurrentPage(1);
  }, []);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(
      data.map((item) => ({
        ...item,
        script_name: {
          v: item.script_name,
          l: {
            Target:
              "https://" +
              clientInstanceName +
              ".service-now.com/nav_to.do?uri=" +
              item.script_type +
              ".do?sys_id=" +
              item.script_id,
            Tooltip: "Click to open in ServiceNow",
          },
        },
      })),
    );

    // Set column widths
    const columnWidths = [
      { wch: 30 }, // script_name
      { wch: 20 }, // script_type
      { wch: 20 }, // last_updated
      { wch: 20 }, // table_name
      { wch: 15 }, // script_state
    ];
    worksheet["!cols"] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, "oob_percentage_nuvolo.xlsx");
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <select
          value={groupBy}
          onChange={(e) => onGroupByChange(e.target.value)}
          className="px-4 py-2 rounded-lg border bg-gray-700 text-gray-300"
        >
          <option value="none">No Grouping</option>
          <option value="script_type">Group by Script Type</option>
          <option value="table_name">Group by Table Name</option>
          <option value="script_state">Group by Script State</option>
        </select>
        <Tooltip text="Export to Excel">
          <RiFileExcel2Fill
            size="2.2rem"
            color="#33C481"
            onClick={exportToExcel}
            cursor="pointer"
          />
        </Tooltip>
        {/* <CustomButton onClick={exportToExcel} className="flex items-center">
            <FiDownload className="mr-2" />
            Export to Excel
          </CustomButton> */}
      </div>
      {/* <div className="mb-4 flex items-center space-x-4">
                <select
                    value={groupBy}
                    onChange={(e) => onGroupByChange(e.target.value)} // pass groupBy change to parent
                    className="px-4 py-2 rounded-lg border bg-sky-500" >
                    <option value="none">No Grouping</option>
                    <option value="script_type">Group by Script Type</option>
                    <option value="table_name">Group by Table Name</option>
                    <option value="script_state">Group by Script State</option>
                </select>
            </div> */}
      <div className="overflow-x-auto">
        <div className="max-h-[calc(100vh-350px)] overflow-y-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
            <thead className="bg-gray-200 dark:bg-gray-700">
              <tr>
                {columnOrder.map((key) => (
                  <th
                    key={key}
                    className="px-4 py-2 text-left text-gray-700 dark:text-gray-300"
                  >
                    <div className="flex flex-col space-y-2">
                      <div
                        className="flex items-center cursor-pointer"
                        onClick={() => requestSort(key)}
                      >
                        <span className="font-semibold">
                          {key
                            .replace(/_/g, " ")
                            .toLowerCase()
                            .replace(/\b\w/g, (c) => c.toUpperCase())}
                        </span>
                        <span className="ml-1">{getSortIcon(key)}</span>
                      </div>
                      <div className="relative">
                        <CustomInput
                          type="text"
                          placeholder={`Search ${key}`}
                          value={searchFilters[key] || ""}
                          onChange={(e) =>
                            handleSearchChange(key, e.target.value)
                          }
                          className="w-full pr-8 text-sm"
                        />
                        <FiSearch className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(paginatedData).map(([group, items]) => (
                <React.Fragment key={group}>
                  {groupBy !== "none" && (
                    <tr
                      className="bg-gray-300 dark:bg-gray-600 cursor-pointer"
                      onClick={() => toggleGroup(group)}
                    >
                      <td
                        colSpan={columnOrder.length}
                        className="px-4 py-2 font-bold text-gray-800 dark:text-gray-200"
                      >
                        {expandedGroups.has(group) ? (
                          <FiChevronDown className="inline mr-2" />
                        ) : (
                          <FiChevronRight className="inline mr-2" />
                        )}
                        {group} ({filteredAndGroupedData[group].length})
                      </td>
                    </tr>
                  )}
                  {(groupBy === "none" || expandedGroups.has(group)) &&
                    items.map((item, index) => (
                      <tr
                        key={index}
                        className={
                          index % 2 === 0
                            ? "bg-gray-100 dark:bg-gray-700"
                            : "bg-white dark:bg-gray-600"
                        }
                      >
                        {columnOrder.map((key) => (
                          <td
                            key={key}
                            className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200"
                          >
                            {key === "script_name" ? (
                              <a
                                href={
                                  "https://" +
                                  clientInstanceName +
                                  ".service-now.com/nav_to.do?uri=" +
                                  item.script_type +
                                  ".do?sys_id=" +
                                  item.script_id
                                }
                                className="text-sky-500 hover:underline"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {item[key]}
                              </a>
                            ) : (
                              item[key]
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <div>
          Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
          {Math.min(
            currentPage * itemsPerPage,
            Object.values(filteredAndGroupedData).flat().length,
          )}{" "}
          of {Object.values(filteredAndGroupedData).flat().length} entries
        </div>
        <div className="flex space-x-2">
          <CustomButton
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="p-2"
            aria-label="First page"
          >
            <FiChevronsLeft className="h-4 w-4" />
          </CustomButton>
          <CustomButton
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2"
            aria-label="Previous page"
          >
            <FiChevronLeft className="h-4 w-4" />
          </CustomButton>
          <span className="px-4 py-2">
            Page {currentPage} of {totalPages}
          </span>
          <CustomButton
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2"
            aria-label="Next page"
          >
            <FiChevronRight className="h-4 w-4" />
          </CustomButton>
          <CustomButton
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="p-2"
            aria-label="Last page"
          >
            <FiChevronsRight className="h-4 w-4" />
          </CustomButton>
        </div>
      </div>
    </div>
  );
};

export default function DataTable({ data = [], groupBy, onGroupByChange }) {
  return (
    <div className="p-4">
      <CustomTable
        data={data}
        groupBy={groupBy}
        onGroupByChange={onGroupByChange}
      />
    </div>
  );
}
