import { useState, useEffect } from "react";
import "./MasterRates.css";
import { supabase } from "../supabase";

function MasterRates() {

const [fuelRates, setFuelRates] = useState([
  {
    product: "HSD",
    purchaseRate: "",
    saleRate: "",
    fromDate: "",
    tillDate: "",
  },
  {
    product: "PMG",
    purchaseRate: "",
    saleRate: "",
    fromDate: "",
    tillDate: "",
  },
  {
    product: "SVP",
    purchaseRate: "",
    saleRate: "",
    fromDate: "",
    tillDate: "",
  },
]);

const [lubricantRates, setLubricantRates] = useState([
  { product: "Rimula C 4L R-1", purchaseRate: "", saleRate: "", fromDate: "", tillDate: "" },
  { product: "Rimula C 10L R-1", purchaseRate: "", saleRate: "", fromDate: "", tillDate: "" },

  { product: "Rimula D 4L R-2", purchaseRate: "", saleRate: "", fromDate: "", tillDate: "" },
  { product: "Rimula D 10L R-2", purchaseRate: "", saleRate: "", fromDate: "", tillDate: "" },

  { product: "Rimula X 4L R-4", purchaseRate: "", saleRate: "", fromDate: "", tillDate: "" },
  { product: "Rimula X 10L R-4", purchaseRate: "", saleRate: "", fromDate: "", tillDate: "" },

  { product: "HELIX ULTRA PC-3", purchaseRate: "", saleRate: "", fromDate: "", tillDate: "" },
  { product: "HELIX ULTRA PC-4", purchaseRate: "", saleRate: "", fromDate: "", tillDate: "" },

  { product: "HX7 PC-3", purchaseRate: "", saleRate: "", fromDate: "", tillDate: "" },
  { product: "HX7 PC-4", purchaseRate: "", saleRate: "", fromDate: "", tillDate: "" },

  { product: "HX6 PC-3", purchaseRate: "", saleRate: "", fromDate: "", tillDate: "" },
  { product: "HX6 PC-4", purchaseRate: "", saleRate: "", fromDate: "", tillDate: "" },

  { product: "HX3 PC-3", purchaseRate: "", saleRate: "", fromDate: "", tillDate: "" },
  { product: "HX3 PC-4", purchaseRate: "", saleRate: "", fromDate: "", tillDate: "" },

  { product: "Helix V.Power PC-3", purchaseRate: "", saleRate: "", fromDate: "", tillDate: "" },
  { product: "Helix V.Power PC-4", purchaseRate: "", saleRate: "", fromDate: "", tillDate: "" },

  { product: "Shell Advance S4 0.7L", purchaseRate: "", saleRate: "", fromDate: "", tillDate: "" },
  { product: "Shell Advance AX-5 1L", purchaseRate: "", saleRate: "", fromDate: "", tillDate: "" },

  { product: "Shell Golden Oil", purchaseRate: "", saleRate: "", fromDate: "", tillDate: "" },
]);

const [fuelFromDate, setFuelFromDate] = useState("");
const [fuelTillDate, setFuelTillDate] = useState("");

const [lubeFromDate, setLubeFromDate] = useState("");
const [lubeTillDate, setLubeTillDate] = useState("");

const handleFuelChange = (index, field, value) => {
  const updated = [...fuelRates];
  updated[index][field] = value;
  setFuelRates(updated);
};

const handleSaveRates = async () => {
  try {
    // ================= FUEL RATES =================

    const fuelData = fuelRates.map((item) => ({
      category: "fuel",
      product: item.product,
      purchase_rate: Number(item.purchaseRate) || 0,
      sale_rate: Number(item.saleRate) || 0,
      from_date: fuelFromDate || null,
      till_date: fuelTillDate || null,
    }));

    // ================= LUBRICANT RATES =================

    const lubricantData = lubricantRates.map((item) => ({
      category: "lubricant",
      product: item.product,
      purchase_rate: Number(item.purchaseRate) || 0,
      sale_rate: Number(item.saleRate) || 0,
      from_date: lubeFromDate || null,
      till_date: lubeTillDate || null,
    }));

    const allRates = [...fuelData, ...lubricantData];

    // ================= SAVE TO SUPABASE =================

    const { error } = await supabase
      .from("master_rates")
      .upsert(allRates, {
        onConflict: "category,product",
      });

    if (error) {
      console.error("Supabase Save Error:", error);
      alert("❌ Rates save nahi hui: " + error.message);
      return;
    }

    // ================= LOCAL BACKUP =================

    const masterRates = {
      fuel: {
        fromDate: fuelFromDate,
        tillDate: fuelTillDate,
        rates: fuelRates,
      },
      lubricant: {
        fromDate: lubeFromDate,
        tillDate: lubeTillDate,
        rates: lubricantRates,
      },
    };

    localStorage.setItem(
      "MasterRates",
      JSON.stringify(masterRates)
    );

    alert("✅ Master Rates Online Successfully Saved");
  } catch (error) {
    console.error("Save Error:", error);
    alert("❌ Something went wrong while saving rates.");
  }
};

const handleLubeChange = (index, field, value) => {
   
  const updated = [...lubricantRates];
  updated[index][field] = value;
  setLubricantRates(updated);
};

useEffect(() => {
  const loadMasterRates = async () => {
    const { data, error } = await supabase
      .from("master_rates")
      .select("*");

    if (error) {
      console.error("Supabase Load Error:", error);
      return;
    }

    if (!data || data.length === 0) {
      return;
    }

    const fuelData = data.filter(
      (item) => item.category === "fuel"
    );

    const lubricantData = data.filter(
      (item) => item.category === "lubricant"
    );

    // ================= FUEL =================

    if (fuelData.length > 0) {
      setFuelRates((previous) =>
        previous.map((item) => {
          const saved = fuelData.find(
            (dbItem) => dbItem.product === item.product
          );

          if (!saved) return item;

          return {
            ...item,
            purchaseRate:
              saved.purchase_rate?.toString() || "",
            saleRate:
              saved.sale_rate?.toString() || "",
            fromDate:
              saved.from_date || "",
            tillDate:
              saved.till_date || "",
          };
        })
      );

      setFuelFromDate(
        fuelData[0]?.from_date || ""
      );

      setFuelTillDate(
        fuelData[0]?.till_date || ""
      );
    }

    // ================= LUBRICANT =================

    if (lubricantData.length > 0) {
      setLubricantRates((previous) =>
        previous.map((item) => {
          const saved = lubricantData.find(
            (dbItem) => dbItem.product === item.product
          );

          if (!saved) return item;

          return {
            ...item,
            purchaseRate:
              saved.purchase_rate?.toString() || "",
            saleRate:
              saved.sale_rate?.toString() || "",
            fromDate:
              saved.from_date || "",
            tillDate:
              saved.till_date || "",
          };
        })
      );

      setLubeFromDate(
        lubricantData[0]?.from_date || ""
      );

      setLubeTillDate(
        lubricantData[0]?.till_date || ""
      );
    }
  };

  loadMasterRates();
}, []);

  return (
    <div className="master-rates">

     <div className="report-header">
  <div className="header-content">
    <h1>AL-HAJ PETROLEUM SERVICES - II</h1>
    <h2>MASTER RATES</h2>
  </div>
</div>

     {/* Fuel Table */}

<div className="section-title">
  Fuel Rates
</div>

<div className="date-range">

  <div className="date-field">
    <label>From Date</label>
    <input
      type="date"
      value={fuelFromDate}
      onChange={(e) => setFuelFromDate(e.target.value)}
    />
  </div>

  <div className="date-field">
    <label>To Date</label>
    <input
      type="date"
      value={fuelTillDate}
      onChange={(e) => setFuelTillDate(e.target.value)}
    />
  </div>

</div>

<table className="master-table">

  <thead>
    <tr>
      <th>Product</th>
      <th>Purchase Rate</th>
      <th>Sale Rate</th>
    </tr>
  </thead>

  <tbody>
    {fuelRates.map((item, index) => (
      <tr key={index}>
        <td>{item.product}</td>

        <td>
          <input
            type="number"
            value={item.purchaseRate}
            onChange={(e) =>
              handleFuelChange(index, "purchaseRate", e.target.value)
            }
          />
        </td>

        <td>
          <input
            type="number"
            value={item.saleRate}
            onChange={(e) =>
              handleFuelChange(index, "saleRate", e.target.value)
            }
          />
        </td>
      </tr>
    ))}
  </tbody>

</table>


      {/* Lubricant Rates */}

<div className="section-title">
  Lubricant Rates
</div>

<div className="date-range">

  <div className="date-field">
    <label>From Date</label>
    <input
      type="date"
      value={lubeFromDate}
      onChange={(e) => setLubeFromDate(e.target.value)}
    />
  </div>

  <div className="date-field">
    <label>To Date</label>
    <input
      type="date"
      value={lubeTillDate}
      onChange={(e) => setLubeTillDate(e.target.value)}
    />
  </div>

</div>

<table className="master-table">

  <thead>
    <tr>
      <th>Product</th>
      <th>Purchase Rate</th>
      <th>Sale Rate</th>
    </tr>
  </thead>

  <tbody>
    {lubricantRates.map((item, index) => (
      <tr key={index}>
        <td>{item.product}</td>

        <td>
          <input
            type="number"
            value={item.purchaseRate}
            onChange={(e) =>
              handleLubeChange(index, "purchaseRate", e.target.value)
            }
          />
        </td>

        <td>
          <input
            type="number"
            value={item.saleRate}
            onChange={(e) =>
              handleLubeChange(index, "saleRate", e.target.value)
            }
          />
        </td>

      </tr>
    ))}
  </tbody>

</table>

      <div className="button-area">

        <button
           className="save-btn"
           onClick={handleSaveRates}
           >
          💾 Save All Rates
          </button>

      </div>

    </div>
  );
}

export default MasterRates;