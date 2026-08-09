import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import "./MonthlyProfitReport.css";

function MonthlyProfitReport() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  

  // ================= OTHER INCOME =================

  const [otherIncome, setOtherIncome] = useState([]);
  const [incomeDate, setIncomeDate] = useState("");
  const [incomeDescription, setIncomeDescription] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("");

  const [reports, setReports] = useState([]);

  // ================= LOAD SAVED OTHER INCOME =================

  useEffect(() => {
    const savedIncome =
      JSON.parse(
        localStorage.getItem("MonthlyOtherIncome")
      ) || [];

    setOtherIncome(savedIncome);
  }, []);

  // ================= LOAD REPORTS =================

  const loadReports = () => {
    const reportDates =
      JSON.parse(
        localStorage.getItem("DailySaleReports")
      ) || [];

    const filteredReports = [];

    reportDates.forEach((date) => {
      if (
        (!fromDate || date >= fromDate) &&
        (!toDate || date <= toDate)
      ) {
        const saved = localStorage.getItem(
          `DailySaleReport-${date}`
        );

        if (!saved) return;

        try {
          const report = JSON.parse(saved);

          // ================= FUEL PROFIT =================

          const getNozzleSale = (
            nozzles,
            prefix,
            count
          ) => {
            let total = 0;

            for (let i = 1; i <= count; i++) {
              const nozzle =
                nozzles?.[`${prefix}-${i}`] || {};

              const opening =
                Number(nozzle.opening || 0);

              const closing =
                Number(nozzle.closing || 0);

              total += closing - opening;
            }

            return total;
          };

          const hsdSale = getNozzleSale(
            report.nozzles,
            "HSD",
            8
          );

          const pmgSale = getNozzleSale(
            report.nozzles,
            "PMG",
            4
          );

          const svpSale = getNozzleSale(
            report.nozzles,
            "SVP",
            2
          );

          const hsdProfit =
            hsdSale *
            (
              Number(
                report.fuel?.HSD?.saleRate || 0
              ) -
              Number(
                report.fuel?.HSD?.purchaseRate || 0
              )
            );

          const pmgProfit =
            pmgSale *
            (
              Number(
                report.fuel?.PMG?.saleRate || 0
              ) -
              Number(
                report.fuel?.PMG?.purchaseRate || 0
              )
            );

          const svpProfit =
            svpSale *
            (
              Number(
                report.fuel?.SVP?.saleRate || 0
              ) -
              Number(
                report.fuel?.SVP?.purchaseRate || 0
              )
            );

          const fuelProfit =
            hsdProfit +
            pmgProfit +
            svpProfit;

          // ================= LUBRICANT PROFIT =================

          let lubricantProfit = 0;

          const lubeData =
            report.lubeData || {};

          const lubeRates =
            report.lubeRates || {};

          Object.keys(lubeData).forEach(
            (product) => {
              const item =
                lubeData[product] || {};

              const rate =
                lubeRates[product] || {};

              const opening =
                Number(item.opening || 0);

              const received =
                Number(item.received || 0);

              const closing =
                Number(item.closing || 0);

              const sale =
                opening +
                received -
                closing;

              const purchaseRate =
                Number(
                  rate.purchaseRate || 0
                );

              const saleRate =
                Number(
                  rate.saleRate || 0
                );

              lubricantProfit +=
                sale *
                (saleRate - purchaseRate);
            }
          );

          // ================= PRICE GAIN / LOSS =================

          const hsdPrice =
            report.priceGain?.HSD || {};

          const pmgPrice =
            report.priceGain?.PMG || {};

          const svpPrice =
            report.priceGain?.SVP || {};

          const hsdPriceGain =
            Number(hsdPrice.liters || 0) *
            (
              Number(hsdPrice.newRate || 0) -
              Number(hsdPrice.oldRate || 0)
            );

          const pmgPriceGain =
            Number(pmgPrice.liters || 0) *
            (
              Number(pmgPrice.newRate || 0) -
              Number(pmgPrice.oldRate || 0)
            );

          const svpPriceGain =
            Number(svpPrice.liters || 0) *
            (
              Number(svpPrice.newRate || 0) -
              Number(svpPrice.oldRate || 0)
            );

          const priceGain =
            hsdPriceGain +
            pmgPriceGain +
            svpPriceGain;

          // ================= STOCK GAIN / LOSS =================

          const getMonthlyStockGainLoss = (
            product,
            sale
          ) => {
            const opening =
              Number(
                report.stockGain?.[product]?.opening || 0
              );

            const receipt =
              Number(
                report.stockGain?.[product]?.receipt || 0
              );

            const actualClosing =
              Number(
                report.stockGain?.[product]?.closing || 0
              );

            const expectedClosing =
              opening +
              receipt -
              sale;

            const gainLossLiters =
              actualClosing -
              expectedClosing;

            const purchaseRate =
              Number(
                report.fuel?.[product]?.purchaseRate || 0
              );

            return (
              gainLossLiters *
              purchaseRate
            );
          };

          const stockHSDGainLoss =
            getMonthlyStockGainLoss(
              "HSD",
              hsdSale
            );

          const stockPMGGainLoss =
            getMonthlyStockGainLoss(
              "PMG",
              pmgSale
            );

          const stockSVPGainLoss =
            getMonthlyStockGainLoss(
              "SVP",
              svpSale
            );

          const stockGainLoss =
            stockHSDGainLoss +
            stockPMGGainLoss +
            stockSVPGainLoss;

          // ================= EXPENSE =================

          let expense = 0;

          if (
            Array.isArray(report.expenses)
          ) {
            expense =
              report.expenses.reduce(
                (sum, item) =>
                  sum +
                  Number(
                    item?.amount || 0
                  ),
                0
              );
          } else if (
            report.expenses &&
            typeof report.expenses === "object"
          ) {
            expense =
              Object.values(
                report.expenses
              ).reduce(
                (sum, item) => {
                  if (
                    typeof item === "number"
                  ) {
                    return sum + item;
                  }

                  return (
                    sum +
                    Number(
                      item?.amount || 0
                    )
                  );
                },
                0
              );
          }

          // ================= DAILY NET PROFIT =================

          const netProfit =
            fuelProfit +
            lubricantProfit +
            priceGain +
            stockGainLoss -
            expense;

          // ================= ADD REPORT =================

          filteredReports.push({
            date,
            fuelProfit,
            lubricantProfit,
            priceGain,
            stockGainLoss,
            expense,
            netProfit,
          });

        } catch (error) {
          console.error(
            `Error loading report: ${date}`,
            error
          );
        }
      }
    });

    // ================= LOAD OTHER INCOME =================

    const savedIncome =
      JSON.parse(
        localStorage.getItem(
          "MonthlyOtherIncome"
        )
      ) || [];

    const filteredIncome =
      savedIncome.filter((item) => {
        return (
          (!fromDate ||
            item.date >= fromDate) &&
          (!toDate ||
            item.date <= toDate)
        );
      });

    setOtherIncome(filteredIncome);

    // ================= SORT =================

    filteredReports.sort(
      (a, b) =>
        a.date.localeCompare(b.date)
    );

    setReports(filteredReports);
  };

  // ================= ADD OTHER INCOME =================

  const addOtherIncome = () => {
    if (
      !incomeDate ||
      !incomeDescription ||
      !incomeAmount
    ) {
      alert(
        "⚠ Please enter Date, Description and Amount"
      );
      return;
    }

    const savedIncome =
      JSON.parse(
        localStorage.getItem(
          "MonthlyOtherIncome"
        )
      ) || [];

    const newIncome = {
      id: Date.now(),
      date: incomeDate,
      description: incomeDescription,
      amount: Number(incomeAmount),
    };

    const updatedIncome = [
      ...savedIncome,
      newIncome,
    ];

    localStorage.setItem(
      "MonthlyOtherIncome",
      JSON.stringify(updatedIncome)
    );

    setOtherIncome(updatedIncome);

    setIncomeDate("");
    setIncomeDescription("");
    setIncomeAmount("");

    alert(
      "✅ Other Income Added Successfully"
    );
  };

  // ================= DELETE OTHER INCOME =================

  const deleteOtherIncome = (id) => {
    const savedIncome =
      JSON.parse(
        localStorage.getItem(
          "MonthlyOtherIncome"
        )
      ) || [];

    const updatedIncome =
      savedIncome.filter(
        (item) => item.id !== id
      );

    localStorage.setItem(
      "MonthlyOtherIncome",
      JSON.stringify(updatedIncome)
    );

    setOtherIncome(updatedIncome);
  };

  // ================= TOTALS =================

  const totalFuelProfit =
    reports.reduce(
      (sum, item) =>
        sum +
        Number(
          item.fuelProfit || 0
        ),
      0
    );

  const totalLubricantProfit =
    reports.reduce(
      (sum, item) =>
        sum +
        Number(
          item.lubricantProfit || 0
        ),
      0
    );

  const totalPriceGain =
    reports.reduce(
      (sum, item) =>
        sum +
        Number(
          item.priceGain || 0
        ),
      0
    );

  const totalStockGainLoss =
    reports.reduce(
      (sum, item) =>
        sum +
        Number(
          item.stockGainLoss || 0
        ),
      0
    );

  const totalExpense =
    reports.reduce(
      (sum, item) =>
        sum +
        Number(
          item.expense || 0
        ),
      0
    );

  // IMPORTANT: totalOtherIncome pehle calculate hoga

  const totalOtherIncome =
    otherIncome.reduce(
      (sum, item) =>
        sum +
        Number(item.amount || 0),
      0
    );

  const totalNetProfit =
    totalFuelProfit +
    totalLubricantProfit +
    totalPriceGain +
    totalStockGainLoss +
    totalOtherIncome -
    totalExpense;

    // ================= PRINT REPORT =================

const handlePrint = () => {
  window.print();
};


// ================= EXPORT EXCEL =================

const handleExportExcel = () => {
  if (reports.length === 0 && otherIncome.length === 0) {
    alert("⚠ No data available to export");
    return;
  }

  const excelData = [];

  // Header
  excelData.push({
    Date: "MONTHLY PROFIT REPORT",
    "Fuel Profit": "",
    "Lubricant Profit": "",
    "Price G/L": "",
    "Stock G/L": "",
    Expense: "",
    "Other Income": "",
    "Net Profit": "",
  });

  // Daily reports
  reports.forEach((item) => {
    excelData.push({
      Date: item.date,
      "Fuel Profit": Number(item.fuelProfit || 0),
      "Lubricant Profit": Number(item.lubricantProfit || 0),
      "Price G/L": Number(item.priceGain || 0),
      "Stock G/L": Number(item.stockGainLoss || 0),
      Expense: Number(item.expense || 0),
      "Other Income": 0,
      "Net Profit": Number(item.netProfit || 0),
    });
  });

  // Other Income
  otherIncome.forEach((item) => {
    excelData.push({
      Date: item.date,
      "Fuel Profit": 0,
      "Lubricant Profit": 0,
      "Price G/L": 0,
      "Stock G/L": 0,
      Expense: 0,
      "Other Income": Number(item.amount || 0),
      "Net Profit": Number(item.amount || 0),
    });
  });

  // Total
  excelData.push({
    Date: "TOTAL",
    "Fuel Profit": totalFuelProfit,
    "Lubricant Profit": totalLubricantProfit,
    "Price G/L": totalPriceGain,
    "Stock G/L": totalStockGainLoss,
    Expense: totalExpense,
    "Other Income": totalOtherIncome,
    "Net Profit": totalNetProfit,
  });

  const worksheet = XLSX.utils.json_to_sheet(excelData);

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Monthly Profit"
  );

  // Column widths
  worksheet["!cols"] = [
    { wch: 15 },
    { wch: 18 },
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 18 },
    { wch: 18 },
  ];

  const fileName =
    fromDate && toDate
      ? `Monthly-Profit-${fromDate}-to-${toDate}.xlsx`
      : `Monthly-Profit-Report.xlsx`;

  XLSX.writeFile(workbook, fileName);
};

  // ================= NUMBER FORMAT =================

  const number = (value) =>
    Number(value || 0).toFixed(2);

  return (
    <div className="monthly-profit-report">

      {/* ================= HEADER ================= */}

      <div className="report-header">

        <h1>
          AL-HAJ PETROLEUM SERVICES - II
        </h1>

        <h2>
          MONTHLY PROFIT REPORT
        </h2>

      </div>

      {/* ================= FILTER + OTHER INCOME ================= */}

<div className="filter-income-row">

  {/* ================= FILTER ================= */}

  <div className="filter-section">

    <div>
      <label>From Date</label>

      <input
        type="date"
        value={fromDate}
        onChange={(e) =>
          setFromDate(e.target.value)
        }
      />
    </div>

    <div>
      <label>To Date</label>

      <input
        type="date"
        value={toDate}
        onChange={(e) =>
          setToDate(e.target.value)
        }
      />
    </div>

    <button onClick={loadReports}>
      🔍 Search
    </button>

<button
  type="button"
  className="print-btn"
  onClick={handlePrint}
>
  🖨️ Print
</button>

<button
  type="button"
  className="excel-btn"
  onClick={handleExportExcel}
>
  📊 Export Excel
</button>

  </div>


  {/* ================= OTHER INCOME ================= */}

  <div className="other-income-section">

    <div className="other-income-form">

      <div>
        <label>Date</label>

        <input
          type="date"
          value={incomeDate}
          onChange={(e) =>
            setIncomeDate(e.target.value)
          }
        />
      </div>

      <div>
        <label>Description</label>

        <input
          type="text"
          placeholder="Other Income"
          value={incomeDescription}
          onChange={(e) =>
            setIncomeDescription(e.target.value)
          }
        />
      </div>

      <div>
        <label>Amount</label>

        <input
          type="number"
          placeholder="0.00"
          value={incomeAmount}
          onChange={(e) =>
            setIncomeAmount(e.target.value)
          }
        />
      </div>

      <button onClick={addOtherIncome}>
        ➕ Add Income
      </button>

    </div>

  </div>

</div>


      {/* ================= DAILY PROFIT TABLE ================= */}

      <table className="profit-table">

        <thead>

          <tr>
            <th>Date</th>
            <th>Fuel Profit</th>
            <th>Lubricant Profit</th>
            <th>Price G/L</th>
            <th>Stock G/L</th>
            <th>Expense</th>
            <th>Net Profit</th>
          </tr>

        </thead>

        <tbody>

          {reports.length === 0 ? (

            <tr>

              <td
                colSpan="7"
                style={{
                  textAlign: "center",
                  fontWeight: "bold",
                  padding: "15px",
                }}
              >
                No Data Found
              </td>

            </tr>

          ) : (

            reports.map(
              (item, index) => (

                <tr key={index}>

                  <td>
                    {item.date}
                  </td>

                  <td>
                    {number(
                      item.fuelProfit
                    )}
                  </td>

                  <td>
                    {number(
                      item.lubricantProfit
                    )}
                  </td>

                  <td
                    className={
                      item.priceGain > 0
                        ? "gain"
                        : item.priceGain < 0
                        ? "loss"
                        : ""
                    }
                  >
                    {number(
                      item.priceGain
                    )}
                  </td>

                  <td
                    className={
                      item.stockGainLoss > 0
                        ? "gain"
                        : item.stockGainLoss < 0
                        ? "loss"
                        : ""
                    }
                  >
                    {number(
                      item.stockGainLoss
                    )}
                  </td>

                  <td>
                    {number(
                      item.expense
                    )}
                  </td>

                  <td
                    className={
                      item.netProfit > 0
                        ? "gain"
                        : item.netProfit < 0
                        ? "loss"
                        : ""
                    }
                  >
                    {number(
                      item.netProfit
                    )}
                  </td>

                </tr>

              )
            )

          )}

          {/* ================= TOTAL ================= */}

          {reports.length > 0 && (

            <tr className="total-row">

              <td>
                TOTAL
              </td>

              <td>
                {number(
                  totalFuelProfit
                )}
              </td>

              <td>
                {number(
                  totalLubricantProfit
                )}
              </td>

              <td
                className={
                  totalPriceGain > 0
                    ? "gain"
                    : totalPriceGain < 0
                    ? "loss"
                    : ""
                }
              >
                {number(
                  totalPriceGain
                )}
              </td>

              <td
                className={
                  totalStockGainLoss > 0
                    ? "gain"
                    : totalStockGainLoss < 0
                    ? "loss"
                    : ""
                }
              >
                {number(
                  totalStockGainLoss
                )}
              </td>

              <td>
                {number(
                  totalExpense
                )}
              </td>

              <td
                className={
                  totalNetProfit > 0
                    ? "gain"
                    : totalNetProfit < 0
                    ? "loss"
                    : ""
                }
              >
                {number(
                  totalNetProfit
                )}
              </td>

            </tr>

          )}

        </tbody>

      </table>

      {/* ================================================= */}
      {/* ============ OTHER INCOME DATA TABLE ============ */}
      {/* ================================================= */}

      <div className="other-income-table-wrapper">

        <table className="other-income-table">

          <thead>

            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Action</th>
            </tr>

          </thead>

          <tbody>

            {otherIncome.length === 0 ? (

              <tr>

                <td
                  colSpan="4"
                  className="no-income"
                >
                  No Other Income
                </td>

              </tr>

            ) : (

              otherIncome.map(
                (item) => (

                  <tr key={item.id}>

                    <td>
                      {item.date}
                    </td>

                    <td>
                      {item.description}
                    </td>

                    <td>
                      {number(
                        item.amount
                      )}
                    </td>

                    <td>

                      <button
                        className="delete-income"
                        onClick={() =>
                          deleteOtherIncome(
                            item.id
                          )
                        }
                      >
                        Delete
                      </button>

                    </td>

                  </tr>

                )
              )

            )}

            {otherIncome.length > 0 && (

              <tr className="other-income-total">

                <td colSpan="2">
                  TOTAL OTHER INCOME
                </td>

                <td>
                  {number(
                    totalOtherIncome
                  )}
                </td>

                <td></td>

              </tr>

            )}

          </tbody>

        </table>

      </div>

      {/* ================= SUMMARY / 7 CARDS ================= */}

      <div className="summary">

        <div className="summary-card">

          <h3>
            Total Fuel Profit
          </h3>

          <h2>
            {number(
              totalFuelProfit
            )}
          </h2>

        </div>

        <div className="summary-card">

          <h3>
            Total Lubricant Profit
          </h3>

          <h2>
            {number(
              totalLubricantProfit
            )}
          </h2>

        </div>

        <div className="summary-card">

          <h3>
            Total Price G/L
          </h3>

          <h2
            className={
              totalPriceGain > 0
                ? "gain"
                : totalPriceGain < 0
                ? "loss"
                : ""
            }
          >
            {number(
              totalPriceGain
            )}
          </h2>

        </div>

        <div className="summary-card">

          <h3>
            Total Stock G/L
          </h3>

          <h2
            className={
              totalStockGainLoss > 0
                ? "gain"
                : totalStockGainLoss < 0
                ? "loss"
                : ""
            }
          >
            {number(
              totalStockGainLoss
            )}
          </h2>

        </div>

        <div className="summary-card">

          <h3>
            Other Income
          </h3>

          <h2>
            {number(
              totalOtherIncome
            )}
          </h2>

        </div>

        <div className="summary-card">

          <h3>
            Total Expense
          </h3>

          <h2>
            {number(
              totalExpense
            )}
          </h2>

        </div>

        <div className="summary-card net">

          <h3>
            Net Profit
          </h3>

          <h2
            className={
              totalNetProfit > 0
                ? "gain"
                : totalNetProfit < 0
                ? "loss"
                : ""
            }
          >
            {number(
              totalNetProfit
            )}
          </h2>

        </div>

      </div>

    </div>
  );
}

export default MonthlyProfitReport;