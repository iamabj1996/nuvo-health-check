import React, { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import * as XLSX from "xlsx";
import { RiFileExcel2Fill } from "react-icons/ri";

const UpgradeConflict = () => {
  const { detailedUpgradeConflictLogs } = useOutletContext();
  const [nuvoloTablesCount, setNuvoloTablesCount] = useState(0);
  const [activeTab, setActiveTab] = useState("P1"); // Default to P1
  const [currentPage, setCurrentPage] = useState({ P1: 1, P2: 1 });
  const itemsPerPage = 15;

  const downloadAllUpgradeConflicts = () => {
    try {
      const workbook = XLSX.utils.book_new();

      const addSheet = (history, sheetName) => {
        const parsed = JSON.parse(history);

        if (
          Array.isArray(parsed) &&
          parsed[0]?.message === "No conflicts have been found."
        ) {
          return;
        }

        const worksheet = XLSX.utils.json_to_sheet(parsed);
        XLSX.utils.book_append_sheet(
          workbook,
          worksheet,
          sheetName.substring(0, 31),
        );
      };

      addSheet(upgradeConflicts.upgradeHistoryP1, "Upgrade_History_P1");
      addSheet(upgradeConflicts.upgradeHistoryP2, "Upgrade_History_P2");

      XLSX.writeFile(workbook, "Upgrade_Conflicts.xlsx");
    } catch (error) {
      console.error("Excel download failed:", error);
    }
  };

  const upgradeConflicts = useMemo(() => {
    if (
      !detailedUpgradeConflictLogs ||
      detailedUpgradeConflictLogs.length === 0
    ) {
      console.error("detailedUpgradeConflictLogs is empty or not provided");
      return null;
    }
    const firstItem = detailedUpgradeConflictLogs[0];
    const result = JSON.parse(firstItem?.result);
    return result?.upgradeConflicts;
  }, [detailedUpgradeConflictLogs]);

  const getConflictCount = (history) => {
    try {
      const parsedHistory = JSON.parse(history);
      if (
        Array.isArray(parsedHistory) &&
        parsedHistory[0] &&
        parsedHistory[0].message === "No conflicts have been found."
      ) {
        return 0;
      }
      return parsedHistory.length;
    } catch (error) {
      console.error("Error parsing history data:", error);
      return 0;
    }
  };

  useEffect(() => {
    if (upgradeConflicts) {
      setNuvoloTablesCount(
        upgradeConflicts?.nuvoloTablesCount.split("@")[0] || 0,
      );
    }
  }, [upgradeConflicts]);

  const renderConflictTable = (history, title, pageKey) => {
    try {
      const parsedHistory = JSON.parse(history);
      if (
        Array.isArray(parsedHistory) &&
        parsedHistory[0] &&
        parsedHistory[0].message === "No conflicts have been found."
      ) {
        return (
          <div className="mt-4">
            <h4 className="text-lg font-semibold mb-2">{title}</h4>
            <p>No conflicts found.</p>
          </div>
        );
      }

      const startIndex = (currentPage[pageKey] - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedData = parsedHistory.slice(startIndex, endIndex);
      const totalPages = Math.ceil(parsedHistory.length / itemsPerPage);

      return (
        <div className="mt-4">
          <h4 className="text-lg font-semibold mb-2">{title}</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  {[
                    "File Name",
                    "Priority",
                    "Comments",
                    "Disposition",
                    "Type",
                    "Plugin",
                    "Table",
                    "Target Name",
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-4 py-2 text-left text-gray-700 dark:text-gray-300"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((conflict, index) => (
                  <tr
                    key={index}
                    className={
                      index % 2 === 0
                        ? "bg-gray-50 dark:bg-gray-600"
                        : "bg-white dark:bg-gray-700"
                    }
                  >
                    {[
                      "fileName",
                      "priority",
                      "comments",
                      "disposition",
                      "type",
                      "plugin",
                      "table",
                      "targetName",
                    ].map((key) => (
                      <td
                        key={key}
                        className="px-4 py-2 text-gray-800 dark:text-gray-200"
                      >
                        {conflict[key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={() =>
                setCurrentPage((prev) => ({
                  ...prev,
                  [pageKey]: Math.max(1, prev[pageKey] - 1),
                }))
              }
              disabled={currentPage[pageKey] === 1}
              className="px-4 py-2 bg-sky-500 text-white rounded disabled:bg-gray-300"
            >
              Previous
            </button>
            <span>
              Page {currentPage[pageKey]} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => ({
                  ...prev,
                  [pageKey]: Math.min(totalPages, prev[pageKey] + 1),
                }))
              }
              disabled={currentPage[pageKey] === totalPages}
              className="px-4 py-2 bg-sky-500 text-white rounded disabled:bg-gray-300"
            >
              Next
            </button>
          </div>
        </div>
      );
    } catch (error) {
      console.error("Error rendering conflict table:", error);
      return <p>Error rendering conflict data.</p>;
    }
  };

  const renderCard = (title, count) => (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md text-center border-white">
      <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
        {title}
      </h4>
      <p className="text-2xl font-bold text-sky-500">{count}</p>
    </div>
  );

  if (!upgradeConflicts) {
    return (
      <div className="text-center text-gray-600 dark:text-gray-400">
        No upgrade conflict data available.
      </div>
    );
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      {nuvoloTablesCount > 0 && (
        <p className="mb-4 text-gray-600 dark:text-gray-400">
          Nuvolo's Table Count: {nuvoloTablesCount}
        </p>
      )}

      {/* Cards for both P1 and P2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {renderCard(
          "Upgrade History P1",
          getConflictCount(upgradeConflicts.upgradeHistoryP1),
        )}
        {renderCard(
          "Upgrade History P2",
          getConflictCount(upgradeConflicts.upgradeHistoryP2),
        )}
      </div>

      <div className="flex items-center justify-between border-b border-gray-300 mb-4">
        <div className="flex flex-1">
          <button
            onClick={() => setActiveTab("P1")}
            className={`flex-1 py-2 px-4 text-center focus:outline-none ${
              activeTab === "P1" ? "bg-sky-500 text-white" : "text-white"
            }`}
          >
            Upgrade History P1
          </button>

          <button
            onClick={() => setActiveTab("P2")}
            className={`flex-1 py-2 px-4 text-center focus:outline-none ${
              activeTab === "P2" ? "bg-sky-500 text-white" : "text-white"
            }`}
          >
            Upgrade History P2
          </button>
        </div>

        {/* SINGLE Excel Icon */}
        <RiFileExcel2Fill
          size="2.4rem"
          color="#33C481"
          className="ml-4 cursor-pointer"
          title="Download all upgrade conflicts"
          onClick={downloadAllUpgradeConflicts}
        />
      </div>

      {/* Render Tables Based on Active Tab */}
      {activeTab === "P1" &&
        renderConflictTable(
          upgradeConflicts.upgradeHistoryP1,
          "Upgrade History P1",
          "P1",
        )}
      {activeTab === "P2" &&
        renderConflictTable(
          upgradeConflicts.upgradeHistoryP2,
          "Upgrade History P2",
          "P2",
        )}
    </div>
  );
};

export default UpgradeConflict;
