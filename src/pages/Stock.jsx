import React, { useEffect, useMemo, useState } from "react";
import "./Stock.css";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function Stock() {
  const today = new Date().toISOString().split("T")[0];

  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  const [reports, setReports] = useState([]);

  // ================= LOAD DAILY REPORTS =================

  const loadReports = () => {
    const reportsIndex =
      JSON.parse(
        localStorage.getItem("DailySaleReports")
      ) || [];

    const loadedReports = reportsIndex
      .map((date) => {
        const saved = localStorage.getItem(
          `DailySaleReport-${date}`
        );

        if (!saved) return null;

        try {
          return JSON.parse(saved);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    setReports(loadedReports);
  };

  useEffect(() => {
    loadReports();
  }, []);

  // ================= DATE FILTER =================

  const filteredReports = useMemo(() => {
    return reports
      .filter((report) => {
        const date = report?.reportInfo?.date;

        if (!date) return false;

        return date >= fromDate && date <= toDate;
      })
      .sort((a, b) => {
        const dateA = a?.reportInfo?.date || "";
        const dateB = b?.reportInfo?.date || "";

        return dateA.localeCompare(dateB);
      });
  }, [reports, fromDate, toDate]);

  // ================= FUEL DATA =================

  const getFuelRows = (product) => {
    return filteredReports.map((report) => {
      const date = report?.reportInfo?.date || "";

      const stock =
        report?.stockGain?.[product] || {};

      const opening =
        Number(stock.opening || 0);

      const received =
        Number(stock.receipt || 0);

      const sale =
        product === "HSD"
          ? getHSDTotal(report)
          : product === "PMG"
          ? getPMGTotal(report)
          : getSVPTotal(report);

      const closing =
        Number(stock.closing || 0);

      // Physical stock gain/loss
      // Opening + Received - Sale - Closing
      const gainLoss =
  closing - (opening + received - sale);

      return {
        date,
        opening,
        received,
        sale,
        closing,
        gainLoss,
      };
    });
  };

  // ================= HSD SALE =================

  const getHSDTotal = (report) => {
    const nozzles =
      report?.nozzles || {};

    let total = 0;

    for (let i = 1; i <= 8; i++) {
      const nozzle =
        nozzles[`HSD-${i}`] || {};

      const opening =
        Number(nozzle.opening || 0);

      const closing =
        Number(nozzle.closing || 0);

      total += closing - opening;
    }

    return total;
  };

  // ================= PMG SALE =================

  const getPMGTotal = (report) => {
    const nozzles =
      report?.nozzles || {};

    let total = 0;

    for (let i = 1; i <= 4; i++) {
      const nozzle =
        nozzles[`PMG-${i}`] || {};

      const opening =
        Number(nozzle.opening || 0);

      const closing =
        Number(nozzle.closing || 0);

      total += closing - opening;
    }

    return total;
  };

  // ================= SVP SALE =================

  const getSVPTotal = (report) => {
    const nozzles =
      report?.nozzles || {};

    const svp1 =
      nozzles["SVP-1"] || {};

    const svp2 =
      nozzles["SVP-2"] || {};

    return (
      Number(svp1.closing || 0) -
        Number(svp1.opening || 0) +
      Number(svp2.closing || 0) -
        Number(svp2.opening || 0)
    );
  };

  // ================= LUBRICANT DATA =================

  const lubricantRows = useMemo(() => {
    const rows = [];

    filteredReports.forEach((report) => {
      const date =
        report?.reportInfo?.date || "";

      const lubeData =
        report?.lubeData || {};

      Object.keys(lubeData).forEach(
        (product) => {
          const item =
            lubeData[product] || {};

          const opening =
            Number(item.opening || 0);

          const received =
            Number(item.received || 0);

          const closing =
            Number(item.closing || 0);

          const sale =
            opening + received - closing;

          const gainLoss =
          closing - (opening + received - sale);

          rows.push({
            date,
            product,
            opening,
            received,
            sale,
            closing,
            gainLoss,
          });
        }
      );
    });

    return rows;
  }, [filteredReports]);

  // ================= TOTALS =================

  const getFuelTotals = (rows) => {
    return rows.reduce(
      (total, row) => ({
        opening:
          total.opening + row.opening,

        received:
          total.received + row.received,

        sale:
          total.sale + row.sale,

        closing:
          total.closing + row.closing,

        gainLoss:
          total.gainLoss + row.gainLoss,
      }),
      {
        opening: 0,
        received: 0,
        sale: 0,
        closing: 0,
        gainLoss: 0,
      }
    );
  };

  const hsdRows = getFuelRows("HSD");
  const pmgRows = getFuelRows("PMG");
  const svpRows = getFuelRows("SVP");

  const hsdTotals = getFuelTotals(hsdRows);
  const pmgTotals = getFuelTotals(pmgRows);
  const svpTotals = getFuelTotals(svpRows);

  const lubricantTotals = lubricantRows.reduce(
    (total, row) => ({
      received:
        total.received + row.received,

      sale:
        total.sale + row.sale,

      gainLoss:
        total.gainLoss + row.gainLoss,
    }),
    {
      received: 0,
      sale: 0,
      gainLoss: 0,
    }
  );

  // ================= FORMAT =================

  const number = (value) =>
    Number(value || 0).toFixed(2);

  // ================= EXPORT EXCEL =================

const exportExcel = () => {
  if (filteredReports.length === 0) {
    alert("❌ No data available for selected dates");
    return;
  }

  const workbook = XLSX.utils.book_new();

  const addFuelSheet = (sheetName, title, rows, totals) => {
    const data = [
      [title],
      [`From Date: ${fromDate}`, `To Date: ${toDate}`],
      [],
      [
        "Date",
        "Opening",
        "Received",
        "Sale",
        "Closing",
        "Gain / Loss",
      ],
      ...rows.map((row) => [
        row.date,
        row.opening,
        row.received,
        row.sale,
        row.closing,
        row.gainLoss,
      ]),
      [],
      [
        "TOTAL",
        totals.opening,
        totals.received,
        totals.sale,
        totals.closing,
        totals.gainLoss,
      ],
    ];

    const worksheet =
      XLSX.utils.aoa_to_sheet(data);

    worksheet["!cols"] = [
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 },
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      sheetName
    );
  };

  addFuelSheet(
    "HSD",
    "HSD STOCK REGISTER",
    hsdRows,
    hsdTotals
  );

  addFuelSheet(
    "PMG",
    "PMG STOCK REGISTER",
    pmgRows,
    pmgTotals
  );

  addFuelSheet(
    "SVP",
    "SVP STOCK REGISTER",
    svpRows,
    svpTotals
  );

  // ================= LUBRICANT =================

  const lubricantData = [
    ["LUBRICANT STOCK REGISTER"],
    [`From Date: ${fromDate}`, `To Date: ${toDate}`],
    [],
    [
      "Date",
      "Product",
      "Opening",
      "Received",
      "Sale",
      "Closing",
      "Gain / Loss",
    ],
    ...lubricantRows.map((row) => [
      row.date,
      row.product,
      row.opening,
      row.received,
      row.sale,
      row.closing,
      row.gainLoss,
    ]),
    [],
    [
      "TOTAL",
      "",
      "",
      lubricantTotals.received,
      lubricantTotals.sale,
      "",
      lubricantTotals.gainLoss,
    ],
  ];

  const lubricantSheet =
    XLSX.utils.aoa_to_sheet(lubricantData);

  lubricantSheet["!cols"] = [
    { wch: 15 },
    { wch: 25 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(
    workbook,
    lubricantSheet,
    "Lubricant"
  );

  const fileName =
    `Stock_Register_${fromDate}_to_${toDate}.xlsx`;

  XLSX.writeFile(workbook, fileName);
};


// ================= EXPORT PDF =================

const exportPDF = () => {
  if (filteredReports.length === 0) {
    alert("❌ No data available for selected dates");
    return;
  }

  const doc = new jsPDF("landscape");

  doc.setFontSize(18);
  doc.setTextColor(11, 53, 104);

  doc.text(
    "AL-HAJ PETROLEUM SERVICES",
    148,
    15,
    { align: "center" }
  );

  doc.setFontSize(14);

  doc.text(
    "MONTHLY STOCK REGISTER",
    148,
    23,
    { align: "center" }
  );

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  doc.text(
    `From Date: ${fromDate}    To Date: ${toDate}`,
    148,
    31,
    { align: "center" }
  );

  let currentY = 38;

  const addFuelPDF = (
    title,
    rows,
    totals
  ) => {
    doc.setFontSize(12);
    doc.setTextColor(11, 53, 104);

    doc.text(
      title,
      14,
      currentY
    );

    currentY += 5;

    const body = rows.map((row) => [
      row.date,
      number(row.opening),
      number(row.received),
      number(row.sale),
      number(row.closing),
      number(row.gainLoss),
    ]);

    body.push([
      "TOTAL",
      number(totals.opening),
      number(totals.received),
      number(totals.sale),
      number(totals.closing),
      number(totals.gainLoss),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [[
        "Date",
        "Opening",
        "Received",
        "Sale",
        "Closing",
        "Gain / Loss",
      ]],
      body,
      theme: "grid",

      headStyles: {
        fillColor: [11, 53, 104],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },

      footStyles: {
        fillColor: [220, 236, 249],
        textColor: [0, 0, 0],
        fontStyle: "bold",
      },

      styles: {
        fontSize: 8,
        halign: "center",
      },

      didParseCell: (data) => {
        if (
          data.section === "body" &&
          data.column.index === 5 &&
          data.row.index < rows.length
        ) {
          const value =
            rows[data.row.index]?.gainLoss || 0;

          if (value > 0) {
            data.cell.styles.textColor =
              [0, 128, 0];
            data.cell.styles.fontStyle =
              "bold";
          }

          if (value < 0) {
            data.cell.styles.textColor =
              [208, 0, 0];
            data.cell.styles.fontStyle =
              "bold";
          }
        }
      },
    });

    currentY =
      doc.lastAutoTable.finalY + 10;

    if (currentY > 175) {
      doc.addPage();
      currentY = 15;
    }
  };

  addFuelPDF(
    "HSD STOCK REGISTER",
    hsdRows,
    hsdTotals
  );

  addFuelPDF(
    "PMG STOCK REGISTER",
    pmgRows,
    pmgTotals
  );

  addFuelPDF(
    "SVP STOCK REGISTER",
    svpRows,
    svpTotals
  );

  // ================= LUBRICANT PDF =================

  doc.setFontSize(12);
  doc.setTextColor(11, 53, 104);

  doc.text(
    "LUBRICANT STOCK REGISTER",
    14,
    currentY
  );

  currentY += 5;

  const lubricantBody =
    lubricantRows.map((row) => [
      row.date,
      row.product,
      number(row.opening),
      number(row.received),
      number(row.sale),
      number(row.closing),
      number(row.gainLoss),
    ]);

  lubricantBody.push([
    "TOTAL",
    "",
    "",
    number(lubricantTotals.received),
    number(lubricantTotals.sale),
    "",
    number(lubricantTotals.gainLoss),
  ]);

  autoTable(doc, {
    startY: currentY,

    head: [[
      "Date",
      "Product",
      "Opening",
      "Received",
      "Sale",
      "Closing",
      "Gain / Loss",
    ]],

    body: lubricantBody,

    theme: "grid",

    headStyles: {
      fillColor: [11, 53, 104],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },

    styles: {
      fontSize: 8,
      halign: "center",
    },

    didParseCell: (data) => {
      if (
        data.section === "body" &&
        data.column.index === 6 &&
        data.row.index < lubricantRows.length
      ) {
        const value =
          lubricantRows[data.row.index]
            ?.gainLoss || 0;

        if (value > 0) {
          data.cell.styles.textColor =
            [0, 128, 0];
          data.cell.styles.fontStyle =
            "bold";
        }

        if (value < 0) {
          data.cell.styles.textColor =
            [208, 0, 0];
          data.cell.styles.fontStyle =
            "bold";
        }
      }
    },
  });

  const fileName =
    `Stock_Register_${fromDate}_to_${toDate}.pdf`;

  doc.save(fileName);
};

  // ================= RENDER TABLE =================

  const renderFuelTable = (
    title,
    rows,
    totals
  ) => (
    <div className="stock-section">
      <h2>{title}</h2>

      <table className="stock-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Opening</th>
            <th>Received</th>
            <th>Sale</th>
            <th>Closing</th>
            <th>Gain / Loss</th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan="6"
                className="no-data"
              >
                No Data Found
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={index}>
                <td>{row.date}</td>

                <td>
                  {number(row.opening)}
                </td>

                <td>
                  {number(row.received)}
                </td>

                <td>
                  {number(row.sale)}
                </td>

                <td>
                  {number(row.closing)}
                </td>

                <td
                  className={
                    row.gainLoss > 0
                      ? "gain"
                      : row.gainLoss < 0
                      ? "loss"
                      : ""
                  }
                >
                  {number(row.gainLoss)}
                </td>
              </tr>
            ))
          )}

          {rows.length > 0 && (
            <tr className="total-row">
              <td>TOTAL</td>

              <td>
                {number(totals.opening)}
              </td>

              <td>
                {number(totals.received)}
              </td>

              <td>
                {number(totals.sale)}
              </td>

              <td>
                {number(totals.closing)}
              </td>

              <td
                className={
                  totals.gainLoss > 0
                    ? "gain"
                    : totals.gainLoss < 0
                    ? "loss"
                    : ""
                }
              >
                {number(totals.gainLoss)}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="stock-page">

      {/* ================= HEADER ================= */}

      <div className="stock-header">
        <h1>
          AL-HAJ PETROLEUM SERVICES
        </h1>

        <h2>
          MONTHLY STOCK REGISTER
        </h2>
      </div>

      {/* ================= DATE FILTER ================= */}

      <div className="stock-filter">

        <div className="date-box">
          <label>From Date</label>

          <input
            type="date"
            value={fromDate}
            onChange={(e) =>
              setFromDate(e.target.value)
            }
          />
        </div>

        <div className="date-box">
          <label>To Date</label>

          <input
            type="date"
            value={toDate}
            onChange={(e) =>
              setToDate(e.target.value)
            }
          />
        </div>

        <button
          className="stock-button"
          onClick={exportExcel}
        >
       📊 Export Excel
        </button>

        <button
         className="stock-button"
         onClick={exportPDF}
        >
       📄 Export PDF
        </button>

        <button
          className="stock-button"
          onClick={loadReports}
        >
          🔄 Refresh
        </button>

        <button
          className="stock-button print-button"
          onClick={() => window.print()}
        >
          🖨 Print
        </button>

      </div>

      {/* ================= HSD ================= */}

      {renderFuelTable(
        "HSD STOCK REGISTER",
        hsdRows,
        hsdTotals
      )}

      {/* ================= PMG ================= */}

      {renderFuelTable(
        "PMG STOCK REGISTER",
        pmgRows,
        pmgTotals
      )}

      {/* ================= SVP ================= */}

      {renderFuelTable(
        "SVP STOCK REGISTER",
        svpRows,
        svpTotals
      )}

      {/* ================= LUBRICANT ================= */}

      <div className="stock-section">

        <h2>LUBRICANT STOCK REGISTER</h2>

        <table className="stock-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Product</th>
              <th>Opening</th>
              <th>Received</th>
              <th>Sale</th>
              <th>Closing</th>
              <th>Gain / Loss</th>
            </tr>
          </thead>

          <tbody>

            {lubricantRows.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="no-data"
                >
                  No Data Found
                </td>
              </tr>
            ) : (
              lubricantRows.map(
                (row, index) => (
                  <tr key={index}>

                    <td>
                      {row.date}
                    </td>

                    <td>
                      {row.product}
                    </td>

                    <td>
                      {number(row.opening)}
                    </td>

                    <td>
                      {number(row.received)}
                    </td>

                    <td>
                      {number(row.sale)}
                    </td>

                    <td>
                      {number(row.closing)}
                    </td>

                    <td
                      className={
                        row.gainLoss > 0
                          ? "gain"
                          : row.gainLoss < 0
                          ? "loss"
                          : ""
                      }
                    >
                      {number(row.gainLoss)}
                    </td>

                  </tr>
                )
              )
            )}

            {lubricantRows.length > 0 && (
              <tr className="total-row">

                <td colSpan="2">
                  TOTAL
                </td>

                <td>—</td>

                <td>
                  {number(
                    lubricantTotals.received
                  )}
                </td>

                <td>
                  {number(
                    lubricantTotals.sale
                  )}
                </td>

                <td>—</td>

                <td
                  className={
                    lubricantTotals.gainLoss > 0
                      ? "gain"
                      : lubricantTotals.gainLoss < 0
                      ? "loss"
                      : ""
                  }
                >
                  {number(
                    lubricantTotals.gainLoss
                  )}
                </td>

              </tr>
            )}

          </tbody>
        </table>

      </div>

    </div>
  );
}

export default Stock;