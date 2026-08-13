import "./DailySalesReport.css";
import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { supabase } from "../supabase";

const nozzleRows = [
  { nozzle: "HSD-1", product: "HSD" },
  { nozzle: "HSD-2", product: "HSD" },
  { nozzle: "HSD-3", product: "HSD" },
  { nozzle: "HSD-4", product: "HSD" },
  { nozzle: "HSD-5", product: "HSD" },
  { nozzle: "HSD-6", product: "HSD" },
  { nozzle: "HSD-7", product: "HSD" },
  { nozzle: "HSD-8", product: "HSD" },

  { nozzle: "PMG-1", product: "PMG" },
  { nozzle: "PMG-2", product: "PMG" },
  { nozzle: "PMG-3", product: "PMG" },
  { nozzle: "PMG-4", product: "PMG" },

  { nozzle: "SVP-1", product: "SVP" },
  { nozzle: "SVP-2", product: "SVP" }
];

function DailySalesReport() {
  

  // ================= MASTER RATES =================

const savedRates = localStorage.getItem("MasterRates");

const masterRates = savedRates
  ? JSON.parse(savedRates)
  : {
      fuel: {
        fromDate: "",
        tillDate: "",
        rates: [],
      },
      lubricant: {
        fromDate: "",
        tillDate: "",
        rates: [],
      },
    };

  // ================= DATE =================

const today = new Date().toISOString().split("T")[0];

const [reportInfo, setReportInfo] = useState({
  date: today,
  shiftIncharge: "",
});

// ================= SALES =================

const [sales, setSales] = useState({
  HSD: 0,
  PMG: 0,
  SVP: 0,
});

const [nozzles, setNozzles] = useState({});
const [tastingHSD, setTastingHSD] = useState(0);
const [tastingPMG, setTastingPMG] = useState(0);
const [tastingSVP, setTastingSVP] = useState(0);

const [stockGain, setStockGain] = useState({
  HSD1: {
    opening: 0,
    receipt: 0,
    closing: 0,
  },
  HSD2: {
    opening: 0,
    receipt: 0,
    closing: 0,
  },
  HSD3: {
    opening: 0,
    receipt: 0,
    closing: 0,
  },
  PMG: {
    opening: 0,
    receipt: 0,
    closing: 0,
  },
  SVP: {
    opening: 0,
    receipt: 0,
    closing: 0,
  },
});


// ================= FUEL RATES =================

const [fuel, setFuel] = useState({
  HSD: {
    purchaseRate: "",
    saleRate: "",
  },
  PMG: {
    purchaseRate: "",
    saleRate: "",
  },
  SVP: {
    purchaseRate: "",
    saleRate: "",
  },
});

// ================= LUBRICANT =================

const [lubricant, setLubricant] = useState({
  sale: 0,
  purchaseRate: 0,
  saleRate: 0,
});

const [lubeData, setLubeData] = useState({});
const [lubeRates, setLubeRates] = useState({});

// ================= FUEL MASTER RATES ONLINE =================

useEffect(() => {
  const loadFuelRates = async () => {
    if (!reportInfo.date) return;

    const { data, error } = await supabase
      .from("master_rates")
      .select("*")
      .eq("category", "fuel");

    if (error) {
      console.error("Fuel Rates Load Error:", error);
      return;
    }

    const reportDate = new Date(reportInfo.date);

    const validRates = (data || []).filter((item) => {
      if (!item.from_date || !item.till_date) return false;

      const from = new Date(item.from_date);
      const till = new Date(item.till_date);

      return reportDate >= from && reportDate <= till;
    });

    const updatedFuel = {};

    validRates.forEach((item) => {
      updatedFuel[item.product] = {
        purchaseRate: item.purchase_rate,
        saleRate: item.sale_rate,
      };
    });

    setFuel((prev) => ({
      ...prev,
      ...updatedFuel,
    }));
  };

  loadFuelRates();
}, [reportInfo.date]);

// ================= LUBRICANT MASTER RATES ONLINE =================

useEffect(() => {
  const loadLubricantRates = async () => {
    if (!reportInfo.date) return;

    const { data, error } = await supabase
      .from("master_rates")
      .select("*")
      .eq("category", "lubricant");

    if (error) {
      console.error("Lubricant Rates Load Error:", error);
      return;
    }

    const reportDate = new Date(reportInfo.date);

    const validRates = (data || []).filter((item) => {
      if (!item.from_date || !item.till_date) return false;

      const from = new Date(item.from_date);
      const till = new Date(item.till_date);

      return reportDate >= from && reportDate <= till;
    });

    const updatedLube = {};

    validRates.forEach((item) => {
      updatedLube[item.product] = {
        purchaseRate: item.purchase_rate,
        saleRate: item.sale_rate,
      };
    });

    setLubeRates(updatedLube);
  };

  loadLubricantRates();
}, [reportInfo.date]);
  // ================= EXPENSES =================

  const [expenses, setExpenses] = useState({});

  const handleExpenseChange = (name, value) => {
    setExpenses((prev) => ({
      ...prev,
      [name]: Number(value) || 0,
    }));
  };

  const getTotalExpense = () => {
    return Object.values(expenses).reduce(
      (a, b) => a + b,
      0
    );
  };

  // ================= PRICE GAIN / LOSS =================

  const [priceGain, setPriceGain] = useState({
  HSD: {
    particular: "",
    liters: 0,
    oldRate: 0,
    newRate: 0,
  },

  PMG: {
    particular: "",
    liters: 0,
    oldRate: 0,
    newRate: 0,
  },

  SVP: {
    particular: "",
    liters: 0,
    oldRate: 0,
    newRate: 0,
  },
});

  const handlePriceGainChange = (product, field, value) => {
  setPriceGain((prev) => ({
    ...prev,
    [product]: {
      ...prev[product],
      [field]:
        field === "particular"
          ? value
          : Number(value) || 0,
    },
  }));
};

  const getPriceGainLoss = (product) => {
  const item = priceGain[product] || {};

  const liters = Number(item.liters || 0);
  const oldRate = Number(item.oldRate || 0);
  const newRate = Number(item.newRate || 0);

  return liters * (newRate - oldRate);
};

  const getTotalPriceGainLoss = () => {

    return (
      getPriceGainLoss("HSD") +
      getPriceGainLoss("PMG") +
      getPriceGainLoss("SVP")
    );

  };

  // ================= PRINT =================

  const handlePrint = () => {
    window.print();
  };

  // ================= EXCEL EXPORT =================

   const exportToExcel = () => {

  const data = [

    {
      Product: "HSD",
      Liters: getTotalSaleHSD(),
      PurchaseRate: fuel.HSD.purchaseRate,
      SaleRate: fuel.HSD.saleRate,
      Profit: getTotalProfit("HSD").toFixed(2),
    },

    {
      Product: "PMG",
      Liters: getTotalSalePMG(),
      PurchaseRate: fuel.PMG.purchaseRate,
      SaleRate: fuel.PMG.saleRate,
      Profit: getTotalProfit("PMG").toFixed(2),
    },

    {
      Product: "SVP",
      Liters: getTotalSaleSVP(),
      PurchaseRate: fuel.SVP.purchaseRate,
      SaleRate: fuel.SVP.saleRate,
      Profit: getTotalProfit("SVP").toFixed(2),
    },

    {
      Product: "",
      Liters: "",
      PurchaseRate: "",
      SaleRate: "TOTAL FUEL PROFIT",
      Profit: getTotalFuelProfit().toFixed(2),
    },

    {
      Product: "",
      Liters: "",
      PurchaseRate: "",
      SaleRate: "STOCK GAIN / LOSS",
      Profit: (
        getStockGainLoss("HSD") +
        getStockGainLoss("PMG") +
        getStockGainLoss("SVP")
      ).toFixed(2),
    },

    {
      Product: "",
      Liters: "",
      PurchaseRate: "",
      SaleRate: "PRICE GAIN / LOSS",
      Profit: getTotalPriceGainLoss().toFixed(2),
    },

    {
      Product: "",
      Liters: "",
      PurchaseRate: "",
      SaleRate: "LUBRICANT PROFIT",
      Profit: getTotalLubricantProfit().toFixed(2),
    },


    {
      Product: "",
      Liters: "",
      PurchaseRate: "",
      SaleRate: "DAILY EXPENSE",
      Profit: getTotalExpense().toFixed(2),
    },

    {
      Product: "",
      Liters: "",
      PurchaseRate: "",
      SaleRate: "NET PROFIT",
      Profit: getNetProfit().toFixed(2),
    },

  ];

  const worksheet = XLSX.utils.json_to_sheet(data);

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Daily Report"
  );

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const file = new Blob(
    [excelBuffer],
    {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    }
  );

  saveAs(
    file,
    `Daily_Report_${reportInfo.date || "Report"}.xlsx`
  );
};

// ================= SAVE DAILY REPORT =================

const handleSave = async () => {
  if (!reportInfo.date) {
    alert("⚠ Please Enter Date First");
    return;
  }

  const report = {
    reportInfo,
    nozzles,
    lubeData,
    lubeRates,
    fuel,
    lubricant,
    expenses,
    priceGain,
    stockGain,
  };

  try {
    const { error } = await supabase
      .from("daily_sales_reports")
      .upsert(
        {
          report_date: reportInfo.date,
          report_data: report,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "report_date",
        }
      );

    if (error) {
      console.error("Supabase Save Error:", error);
      alert("❌ Online Save Error: " + error.message);
      return;
    }


    alert("✅ Report Saved Online Successfully");

  } catch (error) {
    console.error("Save Error:", error);
    alert("❌ Something went wrong while saving report.");
  }
};

const handleLoad = async () => {
  if (!reportInfo.date) {
    alert("⚠ Please Enter Date First");
    return;
  }

  try {
    const { data, error } = await supabase
      .from("daily_sales_reports")
      .select("report_data")
      .eq("report_date", reportInfo.date)
      .maybeSingle();

    if (error) {
      console.error("Supabase Load Error:", error);
      alert("❌ Online Load Error: " + error.message);
      return;
    }

    if (!data?.report_data) {
      alert("❌ No Saved Report Found");
      return;
    }

    const report = data.report_data;

    setReportInfo(
      report.reportInfo || {
        date: reportInfo.date,
        shiftIncharge: "",
      }
    );

    setNozzles(report.nozzles || {});
    setLubeData(report.lubeData || {});
    setLubeRates(report.lubeRates || {});

    setFuel(
      report.fuel || {
        HSD: {
          purchaseRate: "",
          saleRate: "",
        },
        PMG: {
          purchaseRate: "",
          saleRate: "",
        },
        SVP: {
          purchaseRate: "",
          saleRate: "",
        },
      }
    );

    setPriceGain(
      report.priceGain || {
        HSD: {
          liters: 0,
          oldRate: 0,
          newRate: 0,
        },
        PMG: {
          liters: 0,
          oldRate: 0,
          newRate: 0,
        },
        SVP: {
          liters: 0,
          oldRate: 0,
          newRate: 0,
        },
      }
    );

    setExpenses(report.expenses || {});

    setLubricant(
      report.lubricant || {
        sale: 0,
        purchaseRate: 0,
        saleRate: 0,
      }
    );

    setStockGain(
      report.stockGain || {
        HSD1: { opening: 0, receipt: 0, closing: 0 },
        HSD2: { opening: 0, receipt: 0, closing: 0 },
        HSD3: { opening: 0, receipt: 0, closing: 0 },
        PMG: { opening: 0, receipt: 0, closing: 0 },
        SVP: { opening: 0, receipt: 0, closing: 0 },
      }
    );

    // Keep today's Received/Closing values editable, but force Opening from previous day's Closing.
    await carryForwardOpenings(reportInfo.date);

    alert("✅ Report Loaded Online Successfully");

  } catch (error) {
    console.error("Load Error:", error);
    alert("❌ Something went wrong while loading report.");
  }
};


// ================= LOAD DAILY REPORT =================

// Previous day's closing becomes today's opening.
const getPreviousDate = (dateString) => {
  const d = new Date(`${dateString}T00:00:00`);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
};

const carryForwardOpenings = async (dateString) => {
  if (!dateString) return false;

  const previousDate = getPreviousDate(dateString);
  let previousReport = null;

  try {
    const { data, error } = await supabase
      .from("daily_sales_reports")
      .select("report_data")
      .eq("report_date", previousDate)
      .maybeSingle();

    if (!error && data?.report_data) {
      previousReport = data.report_data;
    }
  } catch (error) {
    console.error("Previous report online load error:", error);
  }

  // Local backup fallback
  if (!previousReport) {
    try {
      const local = localStorage.getItem(`DailySaleReport-${previousDate}`);
      if (local) previousReport = JSON.parse(local);
    } catch (error) {
      console.error("Previous report local load error:", error);
    }
  }

  if (!previousReport) return false;

  // 1) Nozzle closing -> today's nozzle opening
  if (previousReport.nozzles) {
    setNozzles((current) => {
      const next = { ...current };
      Object.keys(previousReport.nozzles).forEach((nozzle) => {
        const closing = previousReport.nozzles[nozzle]?.closing;
        if (closing !== undefined && closing !== null) {
          next[nozzle] = {
            ...(next[nozzle] || {}),
            opening: Number(closing) || 0,
          };
        }
      });
      return next;
    });
  }

  // 2) Fuel Profit closing -> today's Opening
if (previousReport.stockGain) {
  setStockGain((current) => {
    const next = { ...current };

    ["HSD1", "HSD2", "HSD3", "PMG", "SVP"].forEach((product) => {
      const closing = previousReport.stockGain?.[product]?.closing;

      next[product] = {
        ...(next[product] || {}),
        opening:
          closing !== undefined && closing !== null
            ? Number(closing) || 0
            : "",
        closing: "", // IMPORTANT: today's closing blank
      };
    });

    return next;
  });
}

 // 3) Lubricant closing -> today's Opening
if (previousReport.lubeData) {
  setLubeData((current) => {
    const next = { ...current };

    Object.keys(previousReport.lubeData).forEach((product) => {
      const closing = previousReport.lubeData[product]?.closing;

      next[product] = {
        ...(next[product] || {}),
        opening:
          closing !== undefined && closing !== null
            ? Number(closing) || 0
            : "",
        closing: "", // IMPORTANT: today's closing blank
      };
    });

    return next;
  });
}

  return true;
};

// Automatically carry forward whenever the report date changes.
useEffect(() => {
  if (reportInfo.date) {
    carryForwardOpenings(reportInfo.date);
  }
}, [reportInfo.date]);

  // ================= NO CURRENT OR PREVIOUS REPORT =================

  


// ================= NOZZLE CHANGE =================

const handleChange = (nozzle, field, value) => {
  setNozzles((prev) => ({
    ...prev,
    [nozzle]: {
      ...prev[nozzle],
      [field]: Number(value) || 0,
    },
  }));
};


// ================= LUBRICANT CHANGE =================

const handleLubeChange = (
  product,
  field,
  value
) => {
  setLubeData((prev) => ({
    ...prev,
    [product]: {
      ...prev[product],
      [field]: Number(value) || 0,
    },
  }));
};

// ================= FUEL PROFIT STOCK CHANGE =================
const handleStockGainChange = (product, field, value) => {
  setStockGain((prev) => ({
    ...prev,
    [product]: {
      ...prev[product],
      [field]: Number(value) || 0,
    },
  }));
};


// ================= LUBRICANT SALE =================

const getLubeSale = (product) => {
  const opening =
    Number(lubeData[product]?.opening || 0);

  const received =
    Number(lubeData[product]?.received || 0);

  const closing =
    Number(lubeData[product]?.closing || 0);

  return opening + received - closing;
};


// ================= NOZZLE SALE =================

const getSale = (nozzle) => {
  const opening =
    Number(nozzles[nozzle]?.opening || 0);

  const closing =
    Number(nozzles[nozzle]?.closing || 0);

  return closing - opening;
};


// ================= FUEL CHANGE =================

const handleFuelChange = (
  product,
  field,
  value
) => {
  setFuel((prev) => ({
    ...prev,

    [product]: {
      ...prev[product],
      [field]: Number(value) || 0,
    },
  }));
};


// ================= HSD TOTAL =================

const getHSDTotal = () => {
  let total = 0;

  for (let i = 1; i <= 8; i++) {
    total += getSale(`HSD-${i}`);
  }

  return total;
};


// ================= PMG TOTAL =================

const getPMGTotal = () => {
  let total = 0;

  for (let i = 1; i <= 4; i++) {
    total += getSale(`PMG-${i}`);
  }

  return total;
};


// ================= SVP TOTAL =================

const getSVPTotal = () => {
  return (
    getSale("SVP-1") +
    getSale("SVP-2")
  );
};

const getDayName = (dateString) => {
  if (!dateString) return "";

  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
  });
};
// ================= FINAL TOTAL SALE AFTER TASTING =================



const getTotalSaleHSD1 = () => {
  return (
    getSale("HSD-1") +
    getSale("HSD-2") -
    Number(tastingHSD || 0)
  );
};

const getTotalSaleHSD2 = () => {
  return (
    getSale("HSD-3") +
    getSale("HSD-4")
  );
};

const getTotalSaleHSD3 = () => {
  return (
    getSale("HSD-5") +
    getSale("HSD-6") +
    getSale("HSD-7") +
    getSale("HSD-8")
  );
};

// ================= TOTAL HSD SALE =================
const getTotalSaleHSD = () => {
  return (
    getTotalSaleHSD1() +
    getTotalSaleHSD2() +
    getTotalSaleHSD3()
  );
};


// ================= LUBRICANT TOTAL PROFIT =================

const getLubricantTotalProfit = () => {
  return (
    Number(lubricant.sale || 0) *
    getLubricantPerLiterProfit()
  );
};


// ================= TOTAL FUEL PROFIT =================

const getTotalFuelProfit = () => {
  // HSD has 8 nozzles split into 3 HSD sale groups.
  // Keep the existing tasting adjustment inside getTotalSaleHSD1().
  const totalHSD =
    getTotalSaleHSD1() +
    getTotalSaleHSD2() +
    getTotalSaleHSD3();

  const hsdProfit =
    totalHSD * getPerLiterProfit("HSD");

  const pmgProfit =
    getTotalSalePMG() * getPerLiterProfit("PMG");

  const svpProfit =
    getTotalSaleSVP() * getPerLiterProfit("SVP");

  return hsdProfit + pmgProfit + svpProfit;
};

// Total HSD sale used by reports and summaries.



const getTotalSalePMG = () => {
  const nozzleSale =
    (Number(nozzles["PMG-1"]?.closing || 0) -
      Number(nozzles["PMG-1"]?.opening || 0)) +
    (Number(nozzles["PMG-2"]?.closing || 0) -
      Number(nozzles["PMG-2"]?.opening || 0)) +
    (Number(nozzles["PMG-3"]?.closing || 0) -
      Number(nozzles["PMG-3"]?.opening || 0)) +
    (Number(nozzles["PMG-4"]?.closing || 0) -
      Number(nozzles["PMG-4"]?.opening || 0));

  return nozzleSale - Number(tastingPMG || 0);
};

const getTotalSaleSVP = () => {
  const nozzleSale =
    (Number(nozzles["SVP-1"]?.closing || 0) -
      Number(nozzles["SVP-1"]?.opening || 0)) +
    (Number(nozzles["SVP-2"]?.closing || 0) -
      Number(nozzles["SVP-2"]?.opening || 0));

  return nozzleSale - Number(tastingSVP || 0);
};


// ================= TOTAL LUBRICANT PROFIT =================

const getTotalLubricantProfit = () => {
  return Object.keys(lubeData).reduce(
    (sum, product) => {

      const sale =
        getLubeSale(product);

      const purchase =
        Number(
          lubeRates[product]?.purchaseRate ??
          lubeData[product]?.purchaseRate ??
          0
        );

      const saleRate =
        Number(
          lubeRates[product]?.saleRate ??
          lubeData[product]?.saleRate ??
          0
        );

      return (
        sum +
        sale * (saleRate - purchase)
      );
    },
    0
  );
};


// ================= NET PROFIT =================

const getNetProfit = () => {
  const totalStockGainLoss =
    getStockGainLoss("HSD") +
    getStockGainLoss("PMG") +
    getStockGainLoss("SVP");

  return (
    getTotalFuelProfit() +
    getTotalLubricantProfit() +
    getTotalPriceGainLoss() +
    totalStockGainLoss -
    getTotalExpense()
  );
};

const getPerLiterProfit = (product) => {
  let purchase = 0;
  let sale = 0;

  if (
    product === "HSD1" ||
    product === "HSD2" ||
    product === "HSD3"
  ) {
    purchase = Number(
      fuel?.HSD?.purchaseRate || 0
    );

    sale = Number(
      fuel?.HSD?.saleRate || 0
    );
  } else {
    purchase = Number(
      fuel?.[product]?.purchaseRate || 0
    );

    sale = Number(
      fuel?.[product]?.saleRate || 0
    );
  }

  return sale - purchase;
};

const getTotalProfit = (product) => {
  let totalSale = 0;

  if (product === "HSD1") {
    totalSale =
      (Number(nozzles["HSD-1"]?.closing || 0) -
        Number(nozzles["HSD-1"]?.opening || 0)) +
      (Number(nozzles["HSD-2"]?.closing || 0) -
        Number(nozzles["HSD-2"]?.opening || 0));
  }

  else if (product === "HSD2") {
    totalSale =
      (Number(nozzles["HSD-3"]?.closing || 0) -
        Number(nozzles["HSD-3"]?.opening || 0)) +
      (Number(nozzles["HSD-4"]?.closing || 0) -
        Number(nozzles["HSD-4"]?.opening || 0));
  }

  else if (product === "HSD3") {
    totalSale =
      (Number(nozzles["HSD-5"]?.closing || 0) -
        Number(nozzles["HSD-5"]?.opening || 0)) +
      (Number(nozzles["HSD-6"]?.closing || 0) -
        Number(nozzles["HSD-6"]?.opening || 0)) +
      (Number(nozzles["HSD-7"]?.closing || 0) -
        Number(nozzles["HSD-7"]?.opening || 0)) +
      (Number(nozzles["HSD-8"]?.closing || 0) -
        Number(nozzles["HSD-8"]?.opening || 0));
  }

  else if (product === "PMG") {
    totalSale = getTotalSalePMG();
  }

  else if (product === "SVP") {
    totalSale = getTotalSaleSVP();
  }

  return totalSale * getPerLiterProfit(product);
};

// ================= STOCK GAIN / LOSS LITERS =================

const getStockGainLossLiters = (product) => {
  // HSD in the summary is the combined result of all 3 HSD tanks.
  if (product === "HSD") {
    return (
      getStockGainLossLiters("HSD1") +
      getStockGainLossLiters("HSD2") +
      getStockGainLossLiters("HSD3")
    );
  }

  const opening = Number(
    stockGain[product]?.opening || 0
  );

  const receipt = Number(
    stockGain[product]?.receipt || 0
  );

  let sale = 0;

  // HSD Tank 1 = HSD-1 + HSD-2
  if (product === "HSD1") {
    sale =
      getSale("HSD-1") +
      getSale("HSD-2");
  }

  // HSD Tank 2 = HSD-3 + HSD-4
  else if (product === "HSD2") {
    sale =
      getSale("HSD-3") +
      getSale("HSD-4");
  }

  // HSD Tank 3 = HSD-5 + HSD-6 + HSD-7 + HSD-8
  else if (product === "HSD3") {
    sale =
      getSale("HSD-5") +
      getSale("HSD-6") +
      getSale("HSD-7") +
      getSale("HSD-8");
  }

  // PMG
  else if (product === "PMG") {
    sale = getPMGTotal();
  }

  // SVP
  else if (product === "SVP") {
    sale = getSVPTotal();
  }

  const actualClosing = Number(
    stockGain[product]?.closing || 0
  );

  const expectedClosing =
    opening + receipt - sale;

  return actualClosing - expectedClosing;
};



// ================= STOCK GAIN / LOSS =================

const getStockGainLoss = (product) => {

  let purchaseRate = 0;

  // Gain / Loss Liters
  const gainLossLiters =
    Number(getStockGainLossLiters(product)) || 0;

  if (
    product === "HSD" ||
    product === "HSD1" ||
    product === "HSD2" ||
    product === "HSD3"
  ) {
    purchaseRate =
      Number(fuel?.HSD?.purchaseRate || 0);
  }

  else if (
    product === "PMG" ||
    product === "SVP"
  ) {
    purchaseRate =
      Number(
        fuel?.[product]?.purchaseRate || 0
      );
  }

  return gainLossLiters * purchaseRate;
};


/* ================= RETURN ================= */

return (
  <div className="daily-report">
    <div className="report-header">

      <div className="header-left">
        <h2>AL-HAJ PETROLEUM SERVICES - II</h2>
        <p>N-5 Kotri Kabir Distt: Noushahro Feroze</p>
      </div>

      <div className="header-center">
        <h1>DAILY SALE REPORT</h1>
      </div>

      <div className="header-right">

  <div className="field">
  <label>Date</label>

  <input
  type="date"
  value={reportInfo.date}
  onChange={(e) =>
    setReportInfo({
      ...reportInfo,
      date: e.target.value,
    })
  }
/>

  <p style={{ fontWeight: "600", color: "#1565c0" }}>
  {reportInfo.date
    ? `${new Date(reportInfo.date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })} (${getDayName(reportInfo.date)})`
    : ""}
</p>
</div>

  <div className="field">
    <label>Shift Incharge</label>
    <input
      type="text"
      value={reportInfo.shiftIncharge}
      onChange={(e)=>
        setReportInfo({
          ...reportInfo,
          shiftIncharge:e.target.value
        })
      }
    />
  </div>

</div>

 </div>
    {/* Header End */}

    <div className="action-buttons">
  <button
  className="save-btn"
  onClick={handleSave}
>
  💾 Save
</button>

<button
  className="load-btn"
  onClick={handleLoad}
>
  📂 Load
</button>

  <button className="print-btn" onClick={handlePrint}>
    🖨 Print
  </button>

  <button className="excel-btn" onClick={exportToExcel}>
    📊 Export Excel
  </button>

  <button className="pdf-btn">
    📄 Export PDF
  </button>

  <div className="report-box">

    <h2>Diesel Nozzles</h2>

    <table>

      <thead>

        <tr>

          <th>Nozzle</th>
          <th>Opening</th>
          <th>Closing</th>
          <th>Sale</th>

          <th>Nozzle</th>
          <th>Opening</th>
          <th>Closing</th>
          <th>Sale</th>

        </tr>

      </thead>

      <tbody>

        {[0,1,2,3].map(i=>(

          <tr key={i}>

          <td>{`HSD-${i + 1}`}
         </td>  
         

         <td>
  <input
    type="number"
    value={nozzles[`HSD-${i + 1}`]?.opening || ""}
    readOnly
    onChange={(e) =>
      handleChange(`HSD-${i + 1}`, "opening", e.target.value)
    }
  />
</td>

<td>
  <input
    type="number"
    value={nozzles[`HSD-${i + 1}`]?.closing || ""}
    onChange={(e) =>
      handleChange(`HSD-${i + 1}`, "closing", e.target.value)
    }
  />
</td>

<td>{getSale(`HSD-${i + 1}`)}</td>

<td>{`HSD-${i + 5}`}</td>

            <td>
  <input
    type="number"
    value={nozzles[`HSD-${i + 5}`]?.opening || ""}
    readOnly
    onChange={(e) =>
      handleChange(`HSD-${i + 5}`, "opening", e.target.value)
    }
  />
</td>

<td>
  <input
    type="number"
    value={nozzles[`HSD-${i + 5}`]?.closing || ""}
    onChange={(e) =>
      handleChange(`HSD-${i + 5}`, "closing", e.target.value)
    }
  />
</td>

<td>{getSale(`HSD-${i + 5}`)}</td>

          </tr>

        ))}

      </tbody>

    </table>

  </div>




{/* ================= HSD TASTING ================= */}

<tr>
  <td
    colSpan="3"
    style={{
      border: "1px solid #999",
      textAlign: "right",
      fontWeight: "bold",
    }}
    
  >
    Tasting HSD
  </td>
  

  <td style={{ border: "1px solid #999" }}>
    <input
      type="number"
      value={tastingHSD ?? ""}
      onChange={(e) =>
        setTastingHSD(Number(e.target.value) || 0)
      }
    />
  </td>
</tr>

{/* ================= TOTAL SALE HSD ================= */}
<tr>
  <td
    colSpan="3"
    style={{
      border: "1px solid #999",
      textAlign: "right",
      fontWeight: "bold",
    }}
  >
    TOTAL SALE HSD
  </td>

  <td
    style={{
      border: "1px solid #999",
      fontWeight: "bold",
    }}
  >
    {(getHSDTotal() - Number(tastingHSD || 0)).toFixed(2)}
  </td>
</tr>




  <div className="report-box">

    <h2>Super Nozzles</h2>

    <table>

      <thead>

        <tr>

          <th>Nozzle</th>
          <th>Opening</th>
          <th>Closing</th>
          <th>Sale</th>

          <th>Nozzle</th>
          <th>Opening</th>
          <th>Closing</th>
          <th>Sale</th>

        </tr>

      </thead>

      <tbody>

        {[1,2].map(i=>(

          <tr key={i}>

            <td>{`PMG-${i}`}</td>

<td>
  <input
    type="number"
    value={nozzles[`PMG-${i}`]?.opening || ""}
    readOnly
    onChange={(e) =>
      handleChange(`PMG-${i}`, "opening", e.target.value)
    }
  />
</td>

<td>
  <input
    type="number"
    value={nozzles[`PMG-${i}`]?.closing || ""}
    onChange={(e) =>
      handleChange(`PMG-${i}`, "closing", e.target.value)
    }
  />
</td>

<td>{getSale(`PMG-${i}`)}</td>

            <td>{`PMG-${i + 2}`}</td>

<td>
  <input
    type="number"
    value={nozzles[`PMG-${i + 2}`]?.opening || ""}
    readOnly
    onChange={(e) =>
      handleChange(`PMG-${i + 2}`, "opening", e.target.value)
    }
  />
</td>

<td>
  <input
    type="number"
    value={nozzles[`PMG-${i + 2}`]?.closing || ""}
    onChange={(e) =>
      handleChange(`PMG-${i + 2}`, "closing", e.target.value)
    }
  />
</td>

<td>{getSale(`PMG-${i + 2}`)}</td>

          </tr>

        ))}

      </tbody>

    </table>

  </div>

{/* ================= PMG TASTING ================= */}
<tr>
  <td
    colSpan="3"
    style={{
      border: "1px solid #999",
      textAlign: "right",
      fontWeight: "bold",
    }}
  >
    Tasting PMG
  </td>

  <td style={{ border: "1px solid #999" }}>
    <input
      type="number"
      value={tastingPMG ?? ""}
      onChange={(e) =>
        setTastingPMG(Number(e.target.value) || 0)
      }
    />
  </td>
</tr>

{/* ================= TOTAL SALE PMG ================= */}
<tr>
  <td
    colSpan="3"
    style={{
      border: "1px solid #999",
      textAlign: "right",
      fontWeight: "bold",
    }}
  >
    TOTAL SALE PMG
  </td>

  <td
    style={{
      border: "1px solid #999",
      fontWeight: "bold",
    }}
  >
    {(getPMGTotal() - Number(tastingPMG || 0)).toFixed(2)}
  </td>
</tr>



  <div className="report-box">

    <h2>V-Power Nozzles</h2>

    <table>

      <thead>

        <tr>

          <th>Nozzle</th>
          <th>Opening</th>
          <th>Closing</th>
          <th>Sale</th>

          <th>Nozzle</th>
          <th>Opening</th>
          <th>Closing</th>
          <th>Sale</th>

        </tr>

      </thead>

      <tbody>

        <tr>

            <td>SVP-1</td>

<td>
  <input
    type="number"
    value={nozzles["SVP-1"]?.opening || ""}
    readOnly
    onChange={(e) =>
      handleChange("SVP-1", "opening", e.target.value)
    }
  />
</td>

<td>
  <input
    type="number"
    value={nozzles["SVP-1"]?.closing || ""}
    onChange={(e) =>
      handleChange("SVP-1", "closing", e.target.value)
    }
  />
</td>

<td>{getSale("SVP-1")}</td>

          <td>SVP-2</td>

<td>
  <input
    type="number"
    value={nozzles["SVP-2"]?.opening || ""}
    readOnly
    onChange={(e) =>
      handleChange("SVP-2", "opening", e.target.value)
    }
  />
</td>

<td>
  <input
    type="number"
    value={nozzles["SVP-2"]?.closing || ""}
    onChange={(e) =>
      handleChange("SVP-2", "closing", e.target.value)
    }
  />
</td>

<td>{getSale("SVP-2")}</td>

        </tr>

      </tbody>

    </table>

  </div>

{/* ================= SVP TASTING ================= */}
<tr>
  <td
    colSpan="3"
    style={{
      border: "1px solid #999",
      textAlign: "right",
      fontWeight: "bold",
    }}
  >
    Tasting SVP
  </td>

  <td style={{ border: "1px solid #999" }}>
    <input
      type="number"
      value={tastingSVP ?? ""}
      onChange={(e) =>
        setTastingSVP(Number(e.target.value) || 0)
      }
    />
  </td>
</tr>

{/* ================= TOTAL SALE SVP ================= */}
<tr>
  <td
    colSpan="3"
    style={{
      border: "1px solid #999",
      textAlign: "right",
      fontWeight: "bold",
    }}
  >
    TOTAL SALE SVP
  </td>

  <td
    style={{
      border: "1px solid #999",
      fontWeight: "bold",
    }}
  >
    {(getSVPTotal() - Number(tastingSVP || 0)).toFixed(2)}
  </td>
</tr>

</div>

      {/* Fuel Profit + Price Gain Row */}

      <div className="top-section">

        <div className="report-box">

          <h2>Fuel Profit</h2>

       <table
  style={{
    width: "100%",
    borderCollapse: "collapse",
  }}
>
  <thead>
    <tr>
      <th style={{ border: "1px solid #999" }}>Product</th>
      <th style={{ border: "1px solid #999" }}>Opening</th>
      <th style={{ border: "1px solid #999" }}>Received</th>
      <th style={{ border: "1px solid #999" }}>Sale</th>
      <th style={{ border: "1px solid #999" }}>Closing</th>
      <th style={{ border: "1px solid #999" }}>Purchase Rate</th>
      <th style={{ border: "1px solid #999" }}>Sale Rate</th>
      <th style={{ border: "1px solid #999" }}>Per Unit Profit</th>
      <th style={{ border: "1px solid #999" }}>Total Profit</th>
    </tr>
  </thead>

  <tbody>

   {/* ================= HSD TANK 1 ================= */}
<tr>
  <td style={{ border: "1px solid #999", fontWeight: "bold" }}>
    HSD TANK 1
  </td>

  {/* Opening - Previous Day Closing - AUTO */}
  <td style={{ border: "1px solid #999" }}>
    <input
      type="number"
      value={stockGain.HSD1?.opening ?? ""}
      readOnly
    />
  </td>

  {/* Received - MANUAL */}
  <td style={{ border: "1px solid #999" }}>
    <input
      type="number"
      value={stockGain.HSD1?.receipt ?? ""}
      onChange={(e) =>
        handleStockGainChange(
          "HSD1",
          "receipt",
          e.target.value
        )
      }
    />
  </td>

  {/* Sale - HSD-1 + HSD-2 */}
  <td style={{ border: "1px solid #999" }}>
    <input
      type="number"
      value={getTotalSaleHSD1().toFixed(2)}
      readOnly
    />
  </td>

  {/* Closing - MANUAL */}
  <td style={{ border: "1px solid #999" }}>
    <input
      type="number"
      value={stockGain.HSD1?.closing ?? ""}
      onChange={(e) =>
        handleStockGainChange(
          "HSD1",
          "closing",
          e.target.value
        )
      }
    />
  </td>

  {/* Purchase Rate */}
  <td style={{ border: "1px solid #999" }}>
    <input
      type="number"
      value={fuel?.HSD?.purchaseRate || ""}
      readOnly
    />
  </td>

  {/* Sale Rate */}
  <td style={{ border: "1px solid #999" }}>
    <input
      type="number"
      value={fuel?.HSD?.saleRate || ""}
      readOnly
    />
  </td>

  {/* Per Unit Profit */}
  <td style={{ border: "1px solid #999" }}>
    {getPerLiterProfit("HSD1").toFixed(2)}
  </td>

  {/* Total Profit */}
  <td style={{ border: "1px solid #999" }}>
    {getTotalProfit("HSD1").toFixed(2)}
  </td>
</tr>

{/* ================= HSD TANK 2 ================= */}
<tr>
  <td style={{ border: "1px solid #999", fontWeight: "bold" }}>
    HSD TANK 2
  </td>

  {/* Opening - Previous Day Closing - AUTO */}
  <td style={{ border: "1px solid #999" }}>
    <input
      type="number"
      value={stockGain.HSD2?.opening ?? ""}
      readOnly
    />
  </td>

  {/* Received - MANUAL */}
  <td style={{ border: "1px solid #999" }}>
    <input
      type="number"
      value={stockGain.HSD2?.receipt ?? ""}
      onChange={(e) =>
        handleStockGainChange(
          "HSD2",
          "receipt",
          e.target.value
        )
      }
    />
  </td>

  {/* Sale - HSD-3 + HSD-4 */}
  <td style={{ border: "1px solid #999" }}>
    <input
      type="number"
      value={getTotalSaleHSD2().toFixed(2)}
      readOnly
    />
  </td>

  {/* Closing - MANUAL */}
  <td style={{ border: "1px solid #999" }}>
    <input
      type="number"
      value={stockGain.HSD2?.closing ?? ""}
      onChange={(e) =>
        handleStockGainChange(
          "HSD2",
          "closing",
          e.target.value
        )
      }
    />
  </td>

  {/* Purchase Rate */}
  <td style={{ border: "1px solid #999" }}>
    <input
      type="number"
      value={fuel?.HSD?.purchaseRate || ""}
      readOnly
    />
  </td>

  {/* Sale Rate */}
  <td style={{ border: "1px solid #999" }}>
    <input
      type="number"
      value={fuel?.HSD?.saleRate || ""}
      readOnly
    />
  </td>

  {/* Per Unit Profit */}
  <td style={{ border: "1px solid #999" }}>
    {getPerLiterProfit("HSD2").toFixed(2)}
  </td>

  {/* Total Profit */}
  <td style={{ border: "1px solid #999" }}>
    {getTotalProfit("HSD2").toFixed(2)}
  </td>
</tr>

{/* ================= HSD TANK 3 ================= */}
<tr>
  <td style={{ border: "1px solid #999", fontWeight: "bold" }}>
    HSD TANK 3
  </td>

  {/* Opening - Previous Day Closing - AUTO */}
  <td style={{ border: "1px solid #999" }}>
    <input
      type="number"
      value={stockGain.HSD3?.opening ?? ""}
      readOnly
    />
  </td>

  {/* Received - MANUAL */}
  <td style={{ border: "1px solid #999" }}>
    <input
      type="number"
      value={stockGain.HSD3?.receipt ?? ""}
      onChange={(e) =>
        handleStockGainChange(
          "HSD3",
          "receipt",
          e.target.value
        )
      }
    />
  </td>

  {/* Sale - HSD-5 + HSD-6 + HSD-7 + HSD-8 */}
  <td style={{ border: "1px solid #999" }}>
    <input
      type="number"
      value={getTotalSaleHSD3().toFixed(2)}
      readOnly
    />
  </td>

  {/* Closing - MANUAL */}
  <td style={{ border: "1px solid #999" }}>
    <input
      type="number"
      value={stockGain.HSD3?.closing ?? ""}
      onChange={(e) =>
        handleStockGainChange(
          "HSD3",
          "closing",
          e.target.value
        )
      }
    />
  </td>

  {/* Purchase Rate */}
  <td style={{ border: "1px solid #999" }}>
    <input
      type="number"
      value={fuel?.HSD?.purchaseRate || ""}
      readOnly
    />
  </td>

  {/* Sale Rate */}
  <td style={{ border: "1px solid #999" }}>
    <input
      type="number"
      value={fuel?.HSD?.saleRate || ""}
      readOnly
    />
  </td>

  {/* Per Unit Profit */}
  <td style={{ border: "1px solid #999" }}>
    {getPerLiterProfit("HSD3").toFixed(2)}
  </td>

  {/* Total Profit */}
  <td style={{ border: "1px solid #999" }}>
    {getTotalProfit("HSD3").toFixed(2)}
  </td>
</tr>
    


    {/* ================= PMG ================= */}
    <tr>
      <td style={{ border: "1px solid #999", fontWeight: "bold" }}>
        PMG
      </td>

      {/* Opening - Manual */}
      <td style={{ border: "1px solid #999" }}>
        <input
          type="number"
          value={stockGain.PMG?.opening ?? ""}
     readOnly
          onChange={(e) =>
            handleStockGainChange(
              "PMG",
              "opening",
              e.target.value
            )
          }
        />
      </td>

      {/* Received - Manual */}
      <td style={{ border: "1px solid #999" }}>
        <input
          type="number"
          value={stockGain.PMG?.receipt ?? ""}
          onChange={(e) =>
            handleStockGainChange(
              "PMG",
              "receipt",
              e.target.value
            )
          }
        />
      </td>

      {/* Sale - Nozzle Automatic */}
      <td style={{ border: "1px solid #999" }}>
        <input
          type="number"
          value={getTotalSalePMG().toFixed(2)}
          readOnly
        />
      </td>

      {/* Closing - Manual */}
      <td style={{ border: "1px solid #999" }}>
        <input
          type="number"
          value={stockGain.PMG?.closing ?? ""}
          onChange={(e) =>
            handleStockGainChange(
              "PMG",
              "closing",
              e.target.value
            )
          }
        />
      </td>

      {/* Purchase Rate - Master Rate */}
      <td style={{ border: "1px solid #999" }}>
        <input
          type="number"
          value={fuel?.PMG?.purchaseRate || ""}
          readOnly
        />
      </td>

      {/* Sale Rate - Master Rate */}
      <td style={{ border: "1px solid #999" }}>
        <input
          type="number"
          value={fuel?.PMG?.saleRate || ""}
          readOnly
        />
      </td>

      {/* Per Unit Profit */}
      <td style={{ border: "1px solid #999" }}>
        {getPerLiterProfit("PMG").toFixed(2)}
      </td>

      {/* Total Profit */}
      <td style={{ border: "1px solid #999" }}>
        {getTotalProfit("PMG").toFixed(2)}
      </td>
    </tr>


    {/* ================= SVP ================= */}
    <tr>
      <td style={{ border: "1px solid #999", fontWeight: "bold" }}>
        SVP
      </td>

      {/* Opening - Manual */}
      <td style={{ border: "1px solid #999" }}>
        <input
          type="number"
          value={stockGain.SVP?.opening ?? ""}
     readOnly
          onChange={(e) =>
            handleStockGainChange(
              "SVP",
              "opening",
              e.target.value
            )
          }
        />
      </td>

      {/* Received - Manual */}
      <td style={{ border: "1px solid #999" }}>
        <input
          type="number"
          value={stockGain.SVP?.receipt ?? ""}
          onChange={(e) =>
            handleStockGainChange(
              "SVP",
              "receipt",
              e.target.value
            )
          }
        />
      </td>

      {/* Sale - Nozzle Automatic */}
      <td style={{ border: "1px solid #999" }}>
        <input
          type="number"
          value={getTotalSaleSVP().toFixed(2)}
          readOnly
        />
      </td>

      {/* Closing - Manual */}
      <td style={{ border: "1px solid #999" }}>
        <input
          type="number"
          value={stockGain.SVP?.closing ?? ""}
          onChange={(e) =>
            handleStockGainChange(
              "SVP",
              "closing",
              e.target.value
            )
          }
        />
      </td>

      {/* Purchase Rate - Master Rate */}
      <td style={{ border: "1px solid #999" }}>
        <input
          type="number"
          value={fuel?.SVP?.purchaseRate || ""}
          readOnly
        />
      </td>

      {/* Sale Rate - Master Rate */}
      <td style={{ border: "1px solid #999" }}>
        <input
          type="number"
          value={fuel?.SVP?.saleRate || ""}
          readOnly
        />
      </td>

      {/* Per Unit Profit */}
      <td style={{ border: "1px solid #999" }}>
        {getPerLiterProfit("SVP").toFixed(2)}
      </td>

      {/* Total Profit */}
      <td style={{ border: "1px solid #999" }}>
        {getTotalProfit("SVP").toFixed(2)}
      </td>
    </tr>


    {/* ================= TOTAL FUEL PROFIT ================= */}
    <tr>
      <td
        colSpan="8"
        style={{
          border: "1px solid #999",
          textAlign: "right",
          fontWeight: "bold",
        }}
      >
        TOTAL FUEL PROFIT
      </td>

      <td
        style={{
          border: "1px solid #999",
          fontWeight: "bold",
        }}
      >
        {getTotalFuelProfit().toFixed(2)}
      </td>
    </tr>

  </tbody>
</table>

        </div>

{/* ================= STOCK GAIN / LOSS ================= */}

<div className="report-box">
  <h2>Stock Gain / Loss</h2>

  <table>
    <thead>
      <tr>
        <th>Product</th>
        <th>Particular</th>
        <th>Liters</th>
        <th>Current Purchase Rate</th>
        <th>Profit / Loss</th>
      </tr>
    </thead>

    <tbody>

      {/* ================= HSD ================= */}
      <tr>
        <td>HSD</td>

        <td>
           <input></input>
        </td>

        <td>
          {getStockGainLossLiters("HSD").toFixed(2)}
        </td>

        <td>
          {Number(
            fuel.HSD?.purchaseRate || 0
          ).toFixed(2)}
        </td>

        <td
          style={{
            fontWeight: "bold",
            color:
              getStockGainLoss("HSD") >= 0
                ? "green"
                : "red",
          }}
        >
          {getStockGainLoss("HSD") >= 0
            ? `GAIN ${getStockGainLoss("HSD").toFixed(2)}`
            : `LOSS ${Math.abs(
                getStockGainLoss("HSD")
              ).toFixed(2)}`}
        </td>
      </tr>


      {/* ================= PMG ================= */}
      <tr>
        <td>PMG</td>

        <td>
           <input></input>
        </td>

        <td>
          {getStockGainLossLiters("PMG").toFixed(2)}
        </td>

        <td>
          {Number(
            fuel.PMG?.purchaseRate || 0
          ).toFixed(2)}
        </td>

        <td
          style={{
            fontWeight: "bold",
            color:
              getStockGainLoss("PMG") >= 0
                ? "green"
                : "red",
          }}
        >
          {getStockGainLoss("PMG") >= 0
            ? `GAIN ${getStockGainLoss("PMG").toFixed(2)}`
            : `LOSS ${Math.abs(
                getStockGainLoss("PMG")
              ).toFixed(2)}`}
        </td>
      </tr>


      {/* ================= SVP ================= */}
      <tr>
        <td>SVP</td>

        <td>
           <input></input>
        </td>

        <td>
          {getStockGainLossLiters("SVP").toFixed(2)}
        </td>

        <td>
          {Number(
            fuel.SVP?.purchaseRate || 0
          ).toFixed(2)}
        </td>

        <td
          style={{
            fontWeight: "bold",
            color:
              getStockGainLoss("SVP") >= 0
                ? "green"
                : "red",
          }}
        >
          {getStockGainLoss("SVP") >= 0
            ? `GAIN ${getStockGainLoss("SVP").toFixed(2)}`
            : `LOSS ${Math.abs(
                getStockGainLoss("SVP")
              ).toFixed(2)}`}
        </td>
      </tr>


      {/* ================= TOTAL ================= */}
      <tr>
        <td
          colSpan="4"
          style={{
            textAlign: "right",
            fontWeight: "bold",
          }}
        >
          TOTAL STOCK PROFIT / LOSS
        </td>

        <td
      
        >
        </td>
      </tr>

    </tbody>
  </table>
</div>

              <div className="report-box">

          <h2>Price Gain / Loss</h2>

        <table
  style={{
    width: "100%",
    borderCollapse: "collapse",
  }}
>
  <thead>
    <tr>
      <th style={{ border: "1px solid #999" }}>Product</th>
      <th style={{ border: "1px solid #999" }}>Particular</th>
      <th style={{ border: "1px solid #999" }}>Liters</th>
      <th style={{ border: "1px solid #999" }}>Old Rate</th>
      <th style={{ border: "1px solid #999" }}>New Rate</th>
      <th style={{ border: "1px solid #999" }}>
        Price Gain / Loss
      </th>
    </tr>
  </thead>

  <tbody>

    {/* ================= HSD ================= */}
    <tr>
      <td
        style={{
          border: "1px solid #999",
          fontWeight: "bold",
        }}
      >
        HSD
      </td>

      <td style={{ border: "1px solid #999" }}>
        <input
          type="text"
          value={priceGain.HSD?.particular || ""}
          onChange={(e) =>
            handlePriceGainChange(
              "HSD",
              "particular",
              e.target.value
            )
          }
        />
      </td>

      <td style={{ border: "1px solid #999" }}>
        <input
          type="number"
          value={priceGain.HSD?.liters ?? ""}
          onChange={(e) =>
            handlePriceGainChange(
              "HSD",
              "liters",
              e.target.value
            )
          }
        />
      </td>

      <td style={{ border: "1px solid #999" }}>
        <input
          type="number"
          value={priceGain.HSD?.oldRate ?? ""}
          onChange={(e) =>
            handlePriceGainChange(
              "HSD",
              "oldRate",
              e.target.value
            )
          }
        />
      </td>

      <td style={{ border: "1px solid #999" }}>
        <input
          type="number"
          value={priceGain.HSD?.newRate ?? ""}
          onChange={(e) =>
            handlePriceGainChange(
              "HSD",
              "newRate",
              e.target.value
            )
          }
        />
      </td>

      <td
        style={{
          border: "1px solid #999",
          fontWeight: "bold",
          color:
            getPriceGainLoss("HSD") >= 0
              ? "green"
              : "red",
        }}
      >
        {getPriceGainLoss("HSD") >= 0
          ? `GAIN ${getPriceGainLoss("HSD").toFixed(2)}`
          : `LOSS ${Math.abs(
              getPriceGainLoss("HSD")
            ).toFixed(2)}`}
      </td>
    </tr>


    {/* ================= PMG ================= */}
    <tr>
      <td
        style={{
          border: "1px solid #999",
          fontWeight: "bold",
        }}
      >
        PMG
      </td>

      <td style={{ border: "1px solid #999" }}>
        <input
          type="text"
          value={priceGain.PMG?.particular || ""}
          onChange={(e) =>
            handlePriceGainChange(
              "PMG",
              "particular",
              e.target.value
            )
          }
        />
      </td>

      <td style={{ border: "1px solid #999" }}>
        <input
          type="number"
          value={priceGain.PMG?.liters ?? ""}
          onChange={(e) =>
            handlePriceGainChange(
              "PMG",
              "liters",
              e.target.value
            )
          }
        />
      </td>

      <td style={{ border: "1px solid #999" }}>
        <input
          type="number"
          value={priceGain.PMG?.oldRate ?? ""}
          onChange={(e) =>
            handlePriceGainChange(
              "PMG",
              "oldRate",
              e.target.value
            )
          }
        />
      </td>

      <td style={{ border: "1px solid #999" }}>
        <input
          type="number"
          value={priceGain.PMG?.newRate ?? ""}
          onChange={(e) =>
            handlePriceGainChange(
              "PMG",
              "newRate",
              e.target.value
            )
          }
        />
      </td>

      <td
        style={{
          border: "1px solid #999",
          fontWeight: "bold",
          color:
            getPriceGainLoss("PMG") >= 0
              ? "green"
              : "red",
        }}
      >
        {getPriceGainLoss("PMG") >= 0
          ? `GAIN ${getPriceGainLoss("PMG").toFixed(2)}`
          : `LOSS ${Math.abs(
              getPriceGainLoss("PMG")
            ).toFixed(2)}`}
      </td>
    </tr>


    {/* ================= SVP ================= */}
    <tr>
      <td
        style={{
          border: "1px solid #999",
          fontWeight: "bold",
        }}
      >
        SVP
      </td>

      <td style={{ border: "1px solid #999" }}>
        <input
          type="text"
          value={priceGain.SVP?.particular || ""}
          onChange={(e) =>
            handlePriceGainChange(
              "SVP",
              "particular",
              e.target.value
            )
          }
        />
      </td>

      <td style={{ border: "1px solid #999" }}>
        <input
          type="number"
          value={priceGain.SVP?.liters ?? ""}
          onChange={(e) =>
            handlePriceGainChange(
              "SVP",
              "liters",
              e.target.value
            )
          }
        />
      </td>

      <td style={{ border: "1px solid #999" }}>
        <input
          type="number"
          value={priceGain.SVP?.oldRate ?? ""}
          onChange={(e) =>
            handlePriceGainChange(
              "SVP",
              "oldRate",
              e.target.value
            )
          }
        />
      </td>

      <td style={{ border: "1px solid #999" }}>
        <input
          type="number"
          value={priceGain.SVP?.newRate ?? ""}
          onChange={(e) =>
            handlePriceGainChange(
              "SVP",
              "newRate",
              e.target.value
            )
          }
        />
      </td>

      <td
        style={{
          border: "1px solid #999",
          fontWeight: "bold",
          color:
            getPriceGainLoss("SVP") >= 0
              ? "green"
              : "red",
        }}
      >
        {getPriceGainLoss("SVP") >= 0
          ? `GAIN ${getPriceGainLoss("SVP").toFixed(2)}`
          : `LOSS ${Math.abs(
              getPriceGainLoss("SVP")
            ).toFixed(2)}`}
      </td>
    </tr>


    {/* ================= TOTAL ================= */}
    <tr>
      <td
        colSpan="5"
        style={{
          border: "1px solid #999",
          textAlign: "right",
          fontWeight: "bold",
        }}
      >
        TOTAL PRICE GAIN / LOSS
      </td>

      <td
        style={{
          border: "1px solid #999",
          fontWeight: "bold",
          color:
            getTotalPriceGainLoss() >= 0
              ? "green"
              : "red",
        }}
      >
        {getTotalPriceGainLoss() >= 0
          ? `GAIN ${getTotalPriceGainLoss().toFixed(2)}`
          : `LOSS ${Math.abs(
              getTotalPriceGainLoss()
            ).toFixed(2)}`}
      </td>
    </tr>

  </tbody>
</table>
        </div>

      </div>

            {/* ================= Lubricant Profit ================= */}

      <div className="report-box full-width">

        <h2>Lubricant Profit</h2>

        <table>

          <thead>

            <tr>

              <th>Product</th>
              <th>Opening</th>
              <th>Received</th>
              <th>Closing</th>
              <th>Sale</th>
              <th>Purchase Rate</th>
              <th>Sale Rate</th>
              <th>Per Unit Profit</th>
              <th>Total Profit</th>

            </tr>

          </thead>

          <tbody>

<tr>
  <td>Rimula C 4L R-1</td>

  {/* Opening */}
  <td>
    <input
      type="number"
      value={lubeData["Rimula C 4L R-1"]?.opening || 0}
     readOnly
      onChange={(e) =>
        handleLubeChange("Rimula C 4L R-1", "opening", e.target.value)
      }
    />
  </td>

  {/* Received */}
  <td>
    <input
      type="number"
      value={lubeData["Rimula C 4L R-1"]?.received || 0}
      onChange={(e) =>
        handleLubeChange("Rimula C 4L R-1", "received", e.target.value)
      }
    />
  </td>

  {/* Closing */}
  <td>
    <input
      type="number"
      value={lubeData["Rimula C 4L R-1"]?.closing || 0}
      onChange={(e) =>
        handleLubeChange("Rimula C 4L R-1", "closing", e.target.value)
      }
    />
  </td>

  {/* Sale Auto */}
  <td>{getLubeSale("Rimula C 4L R-1")}</td>

  {/* Purchase Rate */}
  <td>
    <input
      type="number"
      value={lubeRates["Rimula C 4L R-1"]?.purchaseRate || 0}
      readOnly
    />
  </td>

  {/* Sale Rate */}
  <td>
    <input
      type="number"
      value={lubeRates["Rimula C 4L R-1"]?.saleRate || 0}
      readOnly
    />
  </td>

  {/* Per Unit Profit */}
  <td>
    {(
      (lubeRates["Rimula C 4L R-1"]?.saleRate || 0) -
      (lubeRates["Rimula C 4L R-1"]?.purchaseRate || 0)
    ).toFixed(2)}
  </td>

  {/* Total Profit */}
  <td>
    {(
      getLubeSale("Rimula C 4L R-1") *
      (
        (lubeRates["Rimula C 4L R-1"]?.saleRate || 0) -
        (lubeRates["Rimula C 4L R-1"]?.purchaseRate || 0)
      )
    ).toFixed(2)}
  </td>
</tr>
<tr>
  <td>Rimula C 10L R-1</td>

  {/* Opening */}
  <td>
    <input
      type="number"
      value={lubeData["Rimula C 10L R-1"]?.opening || 0}
     readOnly
      onChange={(e) =>
        handleLubeChange("Rimula C 10L R-1", "opening", e.target.value)
      }
    />
  </td>

  {/* Received */}
  <td>
    <input
      type="number"
      value={lubeData["Rimula C 10L R-1"]?.received || 0}
      onChange={(e) =>
        handleLubeChange("Rimula C 10L R-1", "received", e.target.value)
      }
    />
  </td>

  {/* Closing */}
  <td>
    <input
      type="number"
      value={lubeData["Rimula C 10L R-1"]?.closing || 0}
      onChange={(e) =>
        handleLubeChange("Rimula C 10L R-1", "closing", e.target.value)
      }
    />
  </td>

  {/* Sale */}
  <td>{getLubeSale("Rimula C 10L R-1")}</td>

  {/* Purchase Rate */}
  <td>
    <input
      type="number"
      value={lubeRates["Rimula C 10L R-1"]?.purchaseRate || 0}
      readOnly
    />
  </td>

  {/* Sale Rate */}
  <td>
    <input
      type="number"
      value={lubeRates["Rimula C 10L R-1"]?.saleRate || 0}
      readOnly
    />
  </td>

  {/* Per Unit Profit */}
  <td>
    {(
      (lubeRates["Rimula C 10L R-1"]?.saleRate || 0) -
      (lubeRates["Rimula C 10L R-1"]?.purchaseRate || 0)
    ).toFixed(2)}
  </td>

  {/* Total Profit */}
  <td>
    {(
      getLubeSale("Rimula C 10L R-1") *
      (
        (lubeRates["Rimula C 10L R-1"]?.saleRate || 0) -
        (lubeRates["Rimula C 10L R-1"]?.purchaseRate || 0)
      )
    ).toFixed(2)}
  </td>
</tr>

<tr>
  <td>Rimula D 4L R-2</td>

  {/* Opening */}
  <td>
    <input
      type="number"
      value={lubeData["Rimula D 4L R-2"]?.opening || 0}
     readOnly
      onChange={(e) =>
        handleLubeChange("Rimula D 4L R-2", "opening", e.target.value)
      }
    />
  </td>

  {/* Received */}
  <td>
    <input
      type="number"
      value={lubeData["Rimula D 4L R-2"]?.received || 0}
      onChange={(e) =>
        handleLubeChange("Rimula D 4L R-2", "received", e.target.value)
      }
    />
  </td>

  {/* Closing */}
  <td>
    <input
      type="number"
      value={lubeData["Rimula D 4L R-2"]?.closing || 0}
      onChange={(e) =>
        handleLubeChange("Rimula D 4L R-2", "closing", e.target.value)
      }
    />
  </td>

  {/* Sale */}
  <td>{getLubeSale("Rimula D 4L R-2")}</td>

  {/* Purchase Rate */}
  <td>
    <input
      type="number"
      value={lubeRates["Rimula D 4L R-2"]?.purchaseRate || 0}
      readOnly
    />
  </td>

  {/* Sale Rate */}
  <td>
    <input
      type="number"
      value={lubeRates["Rimula D 4L R-2"]?.saleRate || 0}
      readOnly
    />
  </td>

  {/* Per Unit Profit */}
  <td>
    {(
      (lubeRates["Rimula D 4L R-2"]?.saleRate || 0) -
      (lubeRates["Rimula D 4L R-2"]?.purchaseRate || 0)
    ).toFixed(2)}
  </td>

  {/* Total Profit */}
  <td>
    {(
      getLubeSale("Rimula D 4L R-2") *
      (
        (lubeRates["Rimula D 4L R-2"]?.saleRate || 0) -
        (lubeRates["Rimula D 4L R-2"]?.purchaseRate || 0)
      )
    ).toFixed(2)}
  </td>
</tr>
<tr>
  <td>Rimula D 10L R-2</td>

  {/* Opening */}
  <td>
    <input
      type="number"
      value={lubeData["Rimula D 10L R-2"]?.opening || 0}
     readOnly
      onChange={(e) =>
        handleLubeChange("Rimula D 10L R-2", "opening", e.target.value)
      }
    />
  </td>

  {/* Received */}
  <td>
    <input
      type="number"
      value={lubeData["Rimula D 10L R-2"]?.received || 0}
      onChange={(e) =>
        handleLubeChange("Rimula D 10L R-2", "received", e.target.value)
      }
    />
  </td>

  {/* Closing */}
  <td>
    <input
      type="number"
      value={lubeData["Rimula D 10L R-2"]?.closing || 0}
      onChange={(e) =>
        handleLubeChange("Rimula D 10L R-2", "closing", e.target.value)
      }
    />
  </td>

  {/* Sale */}
  <td>{getLubeSale("Rimula D 10L R-2")}</td>

  {/* Purchase Rate */}
  <td>
    <input
      type="number"
      value={lubeRates["Rimula D 10L R-2"]?.purchaseRate || 0}
      readOnly
    />
  </td>

  {/* Sale Rate */}
  <td>
    <input
      type="number"
      value={lubeRates["Rimula D 10L R-2"]?.saleRate || 0}
      readOnly
    />
  </td>

  {/* Per Unit Profit */}
  <td>
    {(
      (lubeRates["Rimula D 10L R-2"]?.saleRate || 0) -
      (lubeRates["Rimula D 10L R-2"]?.purchaseRate || 0)
    ).toFixed(2)}
  </td>

  {/* Total Profit */}
  <td>
    {(
      getLubeSale("Rimula D 10L R-2") *
      (
        (lubeRates["Rimula D 10L R-2"]?.saleRate || 0) -
        (lubeRates["Rimula D 10L R-2"]?.purchaseRate || 0)
      )
    ).toFixed(2)}
  </td>
</tr>
<tr>
  <td>Rimula X 4L R-4</td>

  <td>
    <input
      type="number"
      value={lubeData["Rimula X 4L R-4"]?.opening || 0}
     readOnly
      onChange={(e) =>
        handleLubeChange("Rimula X 4L R-4", "opening", e.target.value)
      }
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeData["Rimula X 4L R-4"]?.received || 0}
      onChange={(e) =>
        handleLubeChange("Rimula X 4L R-4", "received", e.target.value)
      }
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeData["Rimula X 4L R-4"]?.closing || 0}
      onChange={(e) =>
        handleLubeChange("Rimula X 4L R-4", "closing", e.target.value)
      }
    />
  </td>

  <td>{getLubeSale("Rimula X 4L R-4")}</td>

  <td>
    <input
      type="number"
      value={lubeRates["Rimula X 4L R-4"]?.purchaseRate || 0}
      readOnly
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeRates["Rimula X 4L R-4"]?.saleRate || 0}
      readOnly
    />
  </td>

  <td>
    {(
      (lubeRates["Rimula X 4L R-4"]?.saleRate || 0) -
      (lubeRates["Rimula X 4L R-4"]?.purchaseRate || 0)
    ).toFixed(2)}
  </td>

  <td>
    {(
      getLubeSale("Rimula X 4L R-4") *
      (
        (lubeRates["Rimula X 4L R-4"]?.saleRate || 0) -
        (lubeRates["Rimula X 4L R-4"]?.purchaseRate || 0)
      )
    ).toFixed(2)}
  </td>
</tr>
<tr>
  <td>Rimula X 10L R-4</td>

  <td>
    <input
      type="number"
      value={lubeData["Rimula X 10L R-4"]?.opening || 0}
     readOnly
      onChange={(e) =>
        handleLubeChange("Rimula X 10L R-4", "opening", e.target.value)
      }
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeData["Rimula X 10L R-4"]?.received || 0}
      onChange={(e) =>
        handleLubeChange("Rimula X 10L R-4", "received", e.target.value)
      }
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeData["Rimula X 10L R-4"]?.closing || 0}
      onChange={(e) =>
        handleLubeChange("Rimula X 10L R-4", "closing", e.target.value)
      }
    />
  </td>

  <td>{getLubeSale("Rimula X 10L R-4")}</td>

  <td>
    <input
      type="number"
      value={lubeRates["Rimula X 10L R-4"]?.purchaseRate || 0}
      readOnly
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeRates["Rimula X 10L R-4"]?.saleRate || 0}
      readOnly
    />
  </td>

  <td>
    {(
      (lubeRates["Rimula X 10L R-4"]?.saleRate || 0) -
      (lubeRates["Rimula X 10L R-4"]?.purchaseRate || 0)
    ).toFixed(2)}
  </td>

  <td>
    {(
      getLubeSale("Rimula X 10L R-4") *
      (
        (lubeRates["Rimula X 10L R-4"]?.saleRate || 0) -
        (lubeRates["Rimula X 10L R-4"]?.purchaseRate || 0)
      )
    ).toFixed(2)}
  </td>
</tr>

<tr>
  <td>HELIX ULTRA PC-3</td>

  <td>
    <input
      type="number"
      value={lubeData["HELIX ULTRA PC-3"]?.opening || 0}
     readOnly
      onChange={(e) =>
        handleLubeChange("HELIX ULTRA PC-3", "opening", e.target.value)
      }
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeData["HELIX ULTRA PC-3"]?.received || 0}
      onChange={(e) =>
        handleLubeChange("HELIX ULTRA PC-3", "received", e.target.value)
      }
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeData["HELIX ULTRA PC-3"]?.closing || 0}
      onChange={(e) =>
        handleLubeChange("HELIX ULTRA PC-3", "closing", e.target.value)
      }
    />
  </td>

  <td>{getLubeSale("HELIX ULTRA PC-3")}</td>

  <td>
    <input
      type="number"
      value={lubeRates["HELIX ULTRA PC-3"]?.purchaseRate || 0}
      readOnly
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeRates["HELIX ULTRA PC-3"]?.saleRate || 0}
      readOnly
    />
  </td>

  <td>
    {(
      (lubeRates["HELIX ULTRA PC-3"]?.saleRate || 0) -
      (lubeRates["HELIX ULTRA PC-3"]?.purchaseRate || 0)
    ).toFixed(2)}
  </td>

  <td>
    {(
      getLubeSale("HELIX ULTRA PC-3") *
      (
        (lubeRates["HELIX ULTRA PC-3"]?.saleRate || 0) -
        (lubeRates["HELIX ULTRA PC-3"]?.purchaseRate || 0)
      )
    ).toFixed(2)}
  </td>
</tr>

<tr>
  <td>HELIX ULTRA PC-4</td>

  <td>
    <input
      type="number"
      value={lubeData["HELIX ULTRA PC-4"]?.opening || 0}
     readOnly
      onChange={(e) =>
        handleLubeChange("HELIX ULTRA PC-4", "opening", e.target.value)
      }
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeData["HELIX ULTRA PC-4"]?.received || 0}
      onChange={(e) =>
        handleLubeChange("HELIX ULTRA PC-4", "received", e.target.value)
      }
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeData["HELIX ULTRA PC-4"]?.closing || 0}
      onChange={(e) =>
        handleLubeChange("HELIX ULTRA PC-4", "closing", e.target.value)
      }
    />
  </td>

  <td>{getLubeSale("HELIX ULTRA PC-4")}</td>

  <td>
    <input
      type="number"
      value={lubeRates["HELIX ULTRA PC-4"]?.purchaseRate || 0}
      readOnly
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeRates["HELIX ULTRA PC-4"]?.saleRate || 0}
      readOnly
    />
  </td>

  <td>
    {(
      (lubeRates["HELIX ULTRA PC-4"]?.saleRate || 0) -
      (lubeRates["HELIX ULTRA PC-4"]?.purchaseRate || 0)
    ).toFixed(2)}
  </td>

  <td>
    {(
      getLubeSale("HELIX ULTRA PC-4") *
      (
        (lubeRates["HELIX ULTRA PC-4"]?.saleRate || 0) -
        (lubeRates["HELIX ULTRA PC-4"]?.purchaseRate || 0)
      )
    ).toFixed(2)}
  </td>
</tr>

<tr>
  <td>HX7 PC-3</td>

  <td>
    <input
      type="number"
      value={lubeData["HX7 PC-3"]?.opening || 0}
     readOnly
      onChange={(e) =>
        handleLubeChange("HX7 PC-3", "opening", e.target.value)
      }
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeData["HX7 PC-3"]?.received || 0}
      onChange={(e) =>
        handleLubeChange("HX7 PC-3", "received", e.target.value)
      }
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeData["HX7 PC-3"]?.closing || 0}
      onChange={(e) =>
        handleLubeChange("HX7 PC-3", "closing", e.target.value)
      }
    />
  </td>

  <td>{getLubeSale("HX7 PC-3")}</td>

  <td>
    <input
      type="number"
      value={lubeRates["HX7 PC-3"]?.purchaseRate || 0}
      readOnly
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeRates["HX7 PC-3"]?.saleRate || 0}
      readOnly
    />
  </td>

  <td>
    {(
      (lubeRates["HX7 PC-3"]?.saleRate || 0) -
      (lubeRates["HX7 PC-3"]?.purchaseRate || 0)
    ).toFixed(2)}
  </td>

  <td>
    {(
      getLubeSale("HX7 PC-3") *
      (
        (lubeRates["HX7 PC-3"]?.saleRate || 0) -
        (lubeRates["HX7 PC-3"]?.purchaseRate || 0)
      )
    ).toFixed(2)}
  </td>
</tr>

<tr>
  <td>HX7 PC-4</td>

  <td>
    <input
      type="number"
      value={lubeData["HX7 PC-4"]?.opening || 0}
     readOnly
      onChange={(e) =>
        handleLubeChange("HX7 PC-4", "opening", e.target.value)
      }
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeData["HX7 PC-4"]?.received || 0}
      onChange={(e) =>
        handleLubeChange("HX7 PC-4", "received", e.target.value)
      }
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeData["HX7 PC-4"]?.closing || 0}
      onChange={(e) =>
        handleLubeChange("HX7 PC-4", "closing", e.target.value)
      }
    />
  </td>

  <td>{getLubeSale("HX7 PC-4")}</td>

  <td>
    <input
      type="number"
      value={lubeRates["HX7 PC-4"]?.purchaseRate || 0}
      readOnly
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeRates["HX7 PC-4"]?.saleRate || 0}
      readOnly
    />
  </td>

  <td>
    {(
      (lubeRates["HX7 PC-4"]?.saleRate || 0) -
      (lubeRates["HX7 PC-4"]?.purchaseRate || 0)
    ).toFixed(2)}
  </td>

  <td>
    {(
      getLubeSale("HX7 PC-4") *
      (
        (lubeRates["HX7 PC-4"]?.saleRate || 0) -
        (lubeRates["HX7 PC-4"]?.purchaseRate || 0)
      )
    ).toFixed(2)}
  </td>
</tr>

<tr>
  <td>HX6 PC-3</td>

  <td>
    <input
      type="number"
      value={lubeData["HX6 PC-3"]?.opening || 0}
     readOnly
      onChange={(e) =>
        handleLubeChange("HX6 PC-3", "opening", e.target.value)
      }
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeData["HX6 PC-3"]?.received || 0}
      onChange={(e) =>
        handleLubeChange("HX6 PC-3", "received", e.target.value)
      }
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeData["HX6 PC-3"]?.closing || 0}
      onChange={(e) =>
        handleLubeChange("HX6 PC-3", "closing", e.target.value)
      }
    />
  </td>

  <td>{getLubeSale("HX6 PC-3")}</td>

  <td>
    <input
      type="number"
      value={lubeRates["HX6 PC-3"]?.purchaseRate || 0}
      readOnly
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeRates["HX6 PC-3"]?.saleRate || 0}
      readOnly
    />
  </td>

  <td>
    {(
      (lubeRates["HX6 PC-3"]?.saleRate || 0) -
      (lubeRates["HX6 PC-3"]?.purchaseRate || 0)
    ).toFixed(2)}
  </td>

  <td>
    {(
      getLubeSale("HX6 PC-3") *
      (
        (lubeRates["HX6 PC-3"]?.saleRate || 0) -
        (lubeRates["HX6 PC-3"]?.purchaseRate || 0)
      )
    ).toFixed(2)}
  </td>
</tr>

<tr>
  <td>HX6 PC-4</td>

  <td>
    <input
      type="number"
      value={lubeData["HX6 PC-4"]?.opening || 0}
     readOnly
      onChange={(e) =>
        handleLubeChange("HX6 PC-4", "opening", e.target.value)
      }
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeData["HX6 PC-4"]?.received || 0}
      onChange={(e) =>
        handleLubeChange("HX6 PC-4", "received", e.target.value)
      }
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeData["HX6 PC-4"]?.closing || 0}
      onChange={(e) =>
        handleLubeChange("HX6 PC-4", "closing", e.target.value)
      }
    />
  </td>

  <td>{getLubeSale("HX6 PC-4")}</td>

  <td>
    <input
      type="number"
      value={lubeRates["HX6 PC-4"]?.purchaseRate || 0}
      readOnly
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeRates["HX6 PC-4"]?.saleRate || 0}
      readOnly
    />
  </td>

  <td>
    {(
      (lubeRates["HX6 PC-4"]?.saleRate || 0) -
      (lubeRates["HX6 PC-4"]?.purchaseRate || 0)
    ).toFixed(2)}
  </td>

  <td>
    {(
      getLubeSale("HX6 PC-4") *
      (
        (lubeRates["HX6 PC-4"]?.saleRate || 0) -
        (lubeRates["HX6 PC-4"]?.purchaseRate || 0)
      )
    ).toFixed(2)}
  </td>
</tr>

<tr>
  <td>HX3 PC-3</td>

  <td>
    <input
      type="number"
      value={lubeData["HX3 PC-3"]?.opening || 0}
     readOnly
      onChange={(e) =>
        handleLubeChange("HX3 PC-3", "opening", e.target.value)
      }
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeData["HX3 PC-3"]?.received || 0}
      onChange={(e) =>
        handleLubeChange("HX3 PC-3", "received", e.target.value)
      }
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeData["HX3 PC-3"]?.closing || 0}
      onChange={(e) =>
        handleLubeChange("HX3 PC-3", "closing", e.target.value)
      }
    />
  </td>

  <td>{getLubeSale("HX3 PC-3")}</td>

  <td>
    <input
      type="number"
      value={lubeRates["HX3 PC-3"]?.purchaseRate || 0}
      readOnly
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeRates["HX3 PC-3"]?.saleRate || 0}
      readOnly
    />
  </td>

  <td>
    {(
      (lubeRates["HX3 PC-3"]?.saleRate || 0) -
      (lubeRates["HX3 PC-3"]?.purchaseRate || 0)
    ).toFixed(2)}
  </td>

  <td>
    {(
      getLubeSale("HX3 PC-3") *
      (
        (lubeRates["HX3 PC-3"]?.saleRate || 0) -
        (lubeRates["HX3 PC-3"]?.purchaseRate || 0)
      )
    ).toFixed(2)}
  </td>
</tr>

<tr>
  <td>HX3 PC-4</td>

  <td>
    <input
      type="number"
      value={lubeData["HX3 PC-4"]?.opening || 0}
     readOnly
      onChange={(e) =>
        handleLubeChange("HX3 PC-4", "opening", e.target.value)
      }
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeData["HX3 PC-4"]?.received || 0}
      onChange={(e) =>
        handleLubeChange("HX3 PC-4", "received", e.target.value)
      }
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeData["HX3 PC-4"]?.closing || 0}
      onChange={(e) =>
        handleLubeChange("HX3 PC-4", "closing", e.target.value)
      }
    />
  </td>

  <td>{getLubeSale("HX3 PC-4")}</td>

  <td>
    <input
      type="number"
      value={lubeRates["HX3 PC-4"]?.purchaseRate || 0}
      readOnly
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeRates["HX3 PC-4"]?.saleRate || 0}
      readOnly
    />
  </td>

  <td>
    {(
      (lubeRates["HX3 PC-4"]?.saleRate || 0) -
      (lubeRates["HX3 PC-4"]?.purchaseRate || 0)
    ).toFixed(2)}
  </td>

  <td>
    {(
      getLubeSale("HX3 PC-4") *
      (
        (lubeRates["HX3 PC-4"]?.saleRate || 0) -
        (lubeRates["HX3 PC-4"]?.purchaseRate || 0)
      )
    ).toFixed(2)}
  </td>
</tr>

<tr>
  <td>Helix V.Power PC-3</td>

  <td>
    <input
      type="number"
      value={lubeData["Helix V.Power PC-3"]?.opening || 0}
     readOnly
      onChange={(e) =>
        handleLubeChange("Helix V.Power PC-3", "opening", e.target.value)
      }
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeData["Helix V.Power PC-3"]?.received || 0}
      onChange={(e) =>
        handleLubeChange("Helix V.Power PC-3", "received", e.target.value)
      }
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeData["Helix V.Power PC-3"]?.closing || 0}
      onChange={(e) =>
        handleLubeChange("Helix V.Power PC-3", "closing", e.target.value)
      }
    />
  </td>

  <td>{getLubeSale("Helix V.Power PC-3")}</td>

  <td>
    <input
      type="number"
      value={lubeRates["Helix V.Power PC-3"]?.purchaseRate || 0}
      readOnly
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeRates["Helix V.Power PC-3"]?.saleRate || 0}
      readOnly
    />
  </td>

  <td>
    {(
      (lubeRates["Helix V.Power PC-3"]?.saleRate || 0) -
      (lubeRates["Helix V.Power PC-3"]?.purchaseRate || 0)
    ).toFixed(2)}
  </td>

  <td>
    {(
      getLubeSale("Helix V.Power PC-3") *
      (
        (lubeRates["Helix V.Power PC-3"]?.saleRate || 0) -
        (lubeRates["Helix V.Power PC-3"]?.purchaseRate || 0)
      )
    ).toFixed(2)}
  </td>
</tr>

<tr>
  <td>Helix V.Power PC-4</td>

  <td>
    <input
      type="number"
      value={lubeData["Helix V.Power PC-4"]?.opening || 0}
     readOnly
      onChange={(e) =>
        handleLubeChange("Helix V.Power PC-4", "opening", e.target.value)
      }
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeData["Helix V.Power PC-4"]?.received || 0}
      onChange={(e) =>
        handleLubeChange("Helix V.Power PC-4", "received", e.target.value)
      }
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeData["Helix V.Power PC-4"]?.closing || 0}
      onChange={(e) =>
        handleLubeChange("Helix V.Power PC-4", "closing", e.target.value)
      }
    />
  </td>

  <td>{getLubeSale("Helix V.Power PC-4")}</td>

  <td>
    <input
      type="number"
      value={lubeRates["Helix V.Power PC-4"]?.purchaseRate || 0}
      readOnly
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeRates["Helix V.Power PC-4"]?.saleRate || 0}
      readOnly
    />
  </td>

  <td>
    {(
      (lubeRates["Helix V.Power PC-4"]?.saleRate || 0) -
      (lubeRates["Helix V.Power PC-4"]?.purchaseRate || 0)
    ).toFixed(2)}
  </td>

  <td>
    {(
      getLubeSale("Helix V.Power PC-4") *
      (
        (lubeRates["Helix V.Power PC-4"]?.saleRate || 0) -
        (lubeRates["Helix V.Power PC-4"]?.purchaseRate || 0)
      )
    ).toFixed(2)}
  </td>
</tr>

<tr>
  <td>Shell Advance S4 0.7L</td>

  <td>
    <input
      type="number"
      value={lubeData["Shell Advance S4 0.7L"]?.opening || 0}
     readOnly
      onChange={(e) =>
        handleLubeChange("Shell Advance S4 0.7L", "opening", e.target.value)
      }
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeData["Shell Advance S4 0.7L"]?.received || 0}
      onChange={(e) =>
        handleLubeChange("Shell Advance S4 0.7L", "received", e.target.value)
      }
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeData["Shell Advance S4 0.7L"]?.closing || 0}
      onChange={(e) =>
        handleLubeChange("Shell Advance S4 0.7L", "closing", e.target.value)
      }
    />
  </td>

  <td>{getLubeSale("Shell Advance S4 0.7L")}</td>

  <td>
    <input
      type="number"
      value={lubeRates["Shell Advance S4 0.7L"]?.purchaseRate || 0}
      readOnly
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeRates["Shell Advance S4 0.7L"]?.saleRate || 0}
      readOnly
    />
  </td>

  <td>
    {(
      (lubeRates["Shell Advance S4 0.7L"]?.saleRate || 0) -
      (lubeRates["Shell Advance S4 0.7L"]?.purchaseRate || 0)
    ).toFixed(2)}
  </td>

  <td>
    {(
      getLubeSale("Shell Advance S4 0.7L") *
      (
        (lubeRates["Shell Advance S4 0.7L"]?.saleRate || 0) -
        (lubeRates["Shell Advance S4 0.7L"]?.purchaseRate || 0)
      )
    ).toFixed(2)}
  </td>
</tr>

<tr>
  <td>Shell Advance AX-5 1L</td>

  <td>
    <input
      type="number"
      value={lubeData["Shell Advance AX-5 1L"]?.opening || 0}
     readOnly
      onChange={(e) =>
        handleLubeChange("Shell Advance AX-5 1L", "opening", e.target.value)
      }
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeData["Shell Advance AX-5 1L"]?.received || 0}
      onChange={(e) =>
        handleLubeChange("Shell Advance AX-5 1L", "received", e.target.value)
      }
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeData["Shell Advance AX-5 1L"]?.closing || 0}
      onChange={(e) =>
        handleLubeChange("Shell Advance AX-5 1L", "closing", e.target.value)
      }
    />
  </td>

  <td>{getLubeSale("Shell Advance AX-5 1L")}</td>

  <td>
    <input
      type="number"
      value={lubeRates["Shell Advance AX-5 1L"]?.purchaseRate || 0}
      readOnly
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeRates["Shell Advance AX-5 1L"]?.saleRate || 0}
      readOnly
    />
  </td>

  <td>
    {(
      (lubeRates["Shell Advance AX-5 1L"]?.saleRate || 0) -
      (lubeRates["Shell Advance AX-5 1L"]?.purchaseRate || 0)
    ).toFixed(2)}
  </td>

  <td>
    {(
      getLubeSale("Shell Advance AX-5 1L") *
      (
        (lubeRates["Shell Advance AX-5 1L"]?.saleRate || 0) -
        (lubeRates["Shell Advance AX-5 1L"]?.purchaseRate || 0)
      )
    ).toFixed(2)}
  </td>
</tr>

<tr>
  <td>Shell Golden Oil</td>

  <td>
    <input
      type="number"
      value={lubeData["Shell Golden Oil"]?.opening || 0}
     readOnly
      onChange={(e) =>
        handleLubeChange("Shell Golden Oil", "opening", e.target.value)
      }
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeData["Shell Golden Oil"]?.received || 0}
      onChange={(e) =>
        handleLubeChange("Shell Golden Oil", "received", e.target.value)
      }
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeData["Shell Golden Oil"]?.closing || 0}
      onChange={(e) =>
        handleLubeChange("Shell Golden Oil", "closing", e.target.value)
      }
    />
  </td>

  <td>{getLubeSale("Shell Golden Oil")}</td>

  <td>
    <input
      type="number"
      value={lubeRates["Shell Golden Oil"]?.purchaseRate || 0}
      readOnly
    />
  </td>

  <td>
    <input
      type="number"
      value={lubeRates["Shell Golden Oil"]?.saleRate || 0}
      readOnly
    />
  </td>

  <td>
    {(
      (lubeRates["Shell Golden Oil"]?.saleRate || 0) -
      (lubeRates["Shell Golden Oil"]?.purchaseRate || 0)
    ).toFixed(2)}
  </td>

  <td>
    {(
      getLubeSale("Shell Golden Oil") *
      (
        (lubeRates["Shell Golden Oil"]?.saleRate || 0) -
        (lubeRates["Shell Golden Oil"]?.purchaseRate || 0)
      )
    ).toFixed(2)}
  </td>
</tr>

<tr>
  <td
    colSpan="8"
    style={{
      textAlign: "right",
      fontWeight: "bold",
      border: "1px solid #ccc",
    }}
  >
    TOTAL LUBRICANT PROFIT
  </td>

  <td
    style={{
      fontWeight: "bold",
      border: "1px solid #ccc",
      textAlign: "center",
    }}
  >
    {getTotalLubricantProfit().toFixed(2)}
  </td>
</tr>

</tbody>

        </table>

      </div>

            {/* ================= Daily Expense ================= */}

      <div className="expense-section">

        {/* Left Side */}

        <div className="expense-box">

          <h2>Daily Expense</h2>

          <table>

            <tbody>

<tr>
<td>Salary</td>
<td>
<input
type="number"
value={expenses["Salary"] || 0}
onChange={(e)=>handleExpenseChange("Salary",e.target.value)}
/>
</td>
</tr>

<tr>
<td>Electricity</td>
<td>
<input
type="number"
value={expenses["Electricity"] || 0}
onChange={(e)=>handleExpenseChange("Electricity",e.target.value)}
/>
</td>
</tr>

<tr>
<td>Mobile bill, Wifi Bill</td>
<td>
<input
type="number"
value={expenses["Mobile bill, Wifi Bill"] || 0}
onChange={(e)=>handleExpenseChange("Mobile bill, Wifi Bill",e.target.value)}
/>
</td>
</tr>

<tr>
<td>Government Disbursement</td>
<td>
<input
type="number"
value={expenses["Government Disbursement"] || 0}
onChange={(e)=>handleExpenseChange("Government Disbursement",e.target.value)}
/>
</td>
</tr>

<tr>
<td>EOBI Social Security</td>
<td>
<input
type="number"
value={expenses["EOBI Social Security"] || 0}
onChange={(e)=>handleExpenseChange("EOBI Social Security",e.target.value)}
/>
</td>
</tr>

<tr>
<td>Conveyance ( Diesel & Petrol )</td>
<td>
<input
type="number"
value={expenses["Conveyance ( Diesel & Petrol )"] || 0}
onChange={(e)=>handleExpenseChange("Conveyance ( Diesel & Petrol )",e.target.value)}
/>
</td>
</tr>

<tr>
<td>Water & Sewerage Board Bill</td>
<td>
<input
type="number"
value={expenses["Water & Sewerage Board Bill"] || 0}
onChange={(e)=>handleExpenseChange("Water & Sewerage Board Bill",e.target.value)}
/>
</td>
</tr>

<tr>
<td>Stationary Photocopy Exp</td>
<td>
<input
type="number"
value={expenses["Stationary Photocopy Exp"] || 0}
onChange={(e)=>handleExpenseChange("Stationary Photocopy Exp",e.target.value)}
/>
</td>
</tr>

<tr>
<td>Zakat & Donation</td>
<td>
<input
type="number"
value={expenses["Zakat & Donation"] || 0}
onChange={(e)=>handleExpenseChange("Zakat & Donation",e.target.value)}
/>
</td>
</tr>

</tbody>

          </table>

        </div>

        {/* Right Side */}

        <div className="expense-box">

          <h2>Daily Expense</h2>

          <table>

            <tbody>

<tr>
<td>Uniform & Repair Maintenance Exp</td>
<td>
<input
type="number"
value={expenses["Uniform & Repair Maintenance Exp"] || 0}
onChange={(e)=>handleExpenseChange("Uniform & Repair Maintenance Exp",e.target.value)}
/>
</td>
</tr>

<tr>
<td>Conveyance ( Diesel & Petrol ) 2</td>
<td>
<input
type="number"
value={expenses["Conveyance ( Diesel & Petrol ) 2"] || 0}
onChange={(e)=>handleExpenseChange("Conveyance ( Diesel & Petrol ) 2",e.target.value)}
/>
</td>
</tr>

<tr>
<td>House Keeping</td>
<td>
<input
type="number"
value={expenses["House Keeping"] || 0}
onChange={(e)=>handleExpenseChange("House Keeping",e.target.value)}
/>
</td>
</tr>

<tr>
<td>Staff Food Office Entertaiment Exp</td>
<td>
<input
type="number"
value={expenses["Staff Food Office Entertaiment Exp"] || 0}
onChange={(e)=>handleExpenseChange("Staff Food Office Entertaiment Exp",e.target.value)}
/>
</td>
</tr>

<tr>
<td>SHELL Card fee charges</td>
<td>
<input
type="number"
value={expenses["SHELL Card fee charges"] || 0}
onChange={(e)=>handleExpenseChange("SHELL Card fee charges",e.target.value)}
/>
</td>
</tr>

<tr>
<td>Incentives ( Bus customer and guest )</td>
<td>
<input
type="number"
value={expenses["Incentives ( Bus customer and guest )"] || 0}
onChange={(e)=>handleExpenseChange("Incentives ( Bus customer and guest )",e.target.value)}
/>
</td>
</tr>

<tr>
<td>Weight & Measurement</td>
<td>
<input
type="number"
value={expenses["Weight & Measurement"] || 0}
onChange={(e)=>handleExpenseChange("Weight & Measurement",e.target.value)}
/>
</td>
</tr>

<tr>
<td>Load Deleivery charges</td>
<td>
<input
type="number"
value={expenses["Load Deleivery charges"] || 0}
onChange={(e)=>handleExpenseChange("Load Deleivery charges",e.target.value)}
/>
</td>
</tr>

<tr>
<td>Bank Charges ABL HBL BAF</td>
<td>
<input
type="number"
value={expenses["Bank Charges ABL HBL BAF"] || 0}
onChange={(e)=>handleExpenseChange("Bank Charges ABL HBL BAF",e.target.value)}
/>
</td>
</tr>

</tbody>

          </table>

        </div>

      </div>

            {/* ================= Daily Summary ================= */}

      <div className="summary-section">

  {/* Fuel Profit */}
  <div className="summary-card fuel-card">
    <h3>Fuel Profit</h3>
    <h1>{getTotalFuelProfit().toFixed(2)}</h1>
  </div>

  {/* Stock Gain / Loss */}
  <div className="summary-card stock-card">
    <h3>Stock G/L</h3>
    <h1>{(
      getStockGainLoss("HSD") +
      getStockGainLoss("PMG") +
      getStockGainLoss("SVP")
    ).toFixed(2)}</h1>
  </div>

  {/* Price Gain / Loss */}
  <div className="summary-card price-card">
    <h3>Price G/L</h3>
    <h1>{getTotalPriceGainLoss().toFixed(2)}</h1>
  </div>

  {/* Lubricant Profit */}
  <div className="summary-card lub-card">
    <h3>Lub Profit</h3>
    <h1>{getTotalLubricantProfit().toFixed(2)}</h1>
  </div>

  {/* Daily Expense */}
  <div className="summary-card expense-card">
    <h3>Daily Expense</h3>
    <h1>{getTotalExpense().toFixed(2)}</h1>
  </div>

  {/* Net Profit */}
  <div className="summary-card net-card">
    <h3>Net Profit</h3>
    <h1>{getNetProfit().toFixed(2)}</h1>
  </div>

</div>

    </div>
  );
}

export default DailySalesReport;
