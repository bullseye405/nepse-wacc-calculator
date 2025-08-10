import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type BrokerageSlab = {
  limit: number;
  rate: number;
};

type TableRow = {
  qty: number;
  costPerShare: number;
};

export default function NepseWaccGraph() {
  // Inputs as strings for controlled inputs
  const [priceInput, setPriceInput] = useState<string>('1000');
  const [qtyInput, setQtyInput] = useState<string>('500');
//   const [stepInput, setStepInput] = useState<string>('10');

  // Parsed numbers (fallback to 0 if invalid)
  const price = Number(priceInput) || 0;
  const qty = Number(qtyInput) || 0;
//   const step = Number(stepInput) > 0 ? Number(stepInput) : 1;

  const brokerageSlabs: BrokerageSlab[] = [
    { limit: 50000, rate: 0.004 },
    { limit: 500000, rate: 0.0037 },
    { limit: 2000000, rate: 0.0034 },
    { limit: Infinity, rate: 0.0027 },
  ];

  const sebonRate = 0.00015;
  const dpFee = 25;

  // Calculate cost breakdown for exact qty + price input
  function calculateExactCost(qty: number, price: number) {
    if (qty <= 0 || price <= 0) return null;
    const tradeValue = qty * price;
    const slab = brokerageSlabs.find((s) => tradeValue <= s.limit)!;
    const brokerage = tradeValue * slab.rate;
    const sebonFee = tradeValue * sebonRate;
    const totalCost = tradeValue + brokerage + sebonFee + dpFee;
    const costPerShare = totalCost / qty;
    return {
      tradeValue,
      brokerage,
      sebonFee,
      dpFee,
      totalCost,
      costPerShare,
      brokerageRate: slab.rate,
    };
  }

  // Calculate table data in multiples of 10, plus extra points beyond maxQty
  function calculateTable(maxQty: number) {
    const step = 10;
    // Always show 10 x-axis points based on quantity input
    const endQty = Math.max(step, Math.ceil(maxQty / step) * step);
    const totalPoints = 10;
    const rows: TableRow[] = [];
    for (let i = 0; i < totalPoints; i++) {
      const q = Math.round((endQty / (totalPoints - 1)) * i);
      if (q < 5) continue; // start from 5
      const tradeValue = price * q;
      const slab = brokerageSlabs.find((s) => tradeValue <= s.limit)!;
      const brokerage = tradeValue * slab.rate;
      const sebonFee = tradeValue * sebonRate;
      const totalCost = tradeValue + brokerage + sebonFee + dpFee;
      const costPerShare = q > 0 ? totalCost / q : 0;
      rows.push({ qty: q, costPerShare });
    }
    return rows;
  }

  const tableData = calculateTable(qty > 0 ? qty : 500);

  const minCost = Math.min(...tableData.map((row) => row.costPerShare));
  const sweetSpot = tableData.find((row) => row.costPerShare <= minCost + 0.01);

  const exactCost = calculateExactCost(qty, price);

  // Dataset for chart
  const data = {
    labels: tableData.map((row) => row.qty),
    datasets: [
      {
        label: 'Cost per Share (Rs)',
        data: tableData.map((row) => row.costPerShare),
        borderColor: '#3b82f6', // blue
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.3,
        pointRadius: 3,
      },
      {
        label: 'Sweet Spot',
        data: tableData.map((row) =>
          row.qty === sweetSpot?.qty ? row.costPerShare : null
        ),
        borderColor: '#22c55e', // green
        backgroundColor: '#22c55e',
        pointRadius: 6,
        showLine: false,
      },
      exactCost && qty > 0
        ? {
            label: 'Your Purchase',
            data: tableData.map((row) =>
              row.qty === qty ? row.costPerShare : null
            ),
            borderColor: '#ef4444', // red
            backgroundColor: '#ef4444',
            pointRadius: 8,
            showLine: false,
          }
        : {},
    ].filter(Boolean),
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: {
        display: true,
        text: 'NEPSE WACC vs Quantity',
        font: { size: 18 },
      },
      tooltip: {
        callbacks: {
          label: (context: { parsed: { y: number } }) =>
            `Rs ${context.parsed.y.toFixed(4)}`,
        },
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: 'Cost per Share (Rs)',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Quantity',
        },
      },
    },
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-4xl w-full bg-white bg-opacity-70 backdrop-blur-lg rounded-3xl p-8 shadow-xl">
        <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-10">
          NEPSE WACC Calculator
        </h2>

        {/* Inputs row */}
        <div className="flex flex-col sm:flex-row gap-6 mb-10 justify-center">
          {/* Share Price */}
          <div className="flex-1 min-w-[140px]">
            <label className="block mb-2 font-semibold text-gray-700">
              Share Price (Rs)
            </label>
            <input
              type="number"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Quantity */}
          <div className="flex-1 min-w-[140px]">
            <label className="block mb-2 font-semibold text-gray-700">
              Quantity
            </label>
            <input
              type="number"
              value={qtyInput}
              onChange={(e) => setQtyInput(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Step */}
          {/* <div className="flex-1 min-w-[140px]">
            <label className="block mb-2 font-semibold text-gray-700">
              Step
            </label>
            <input
              type="number"
              min={1}
              value={stepInput}
              onChange={(e) => setStepInput(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-400"
            />
          </div> */}
        </div>

        {/* Fees summary row */}
        <div className="flex flex-wrap justify-center gap-4 mb-10">
          {/* Trade Value */}
          <div className="bg-blue-100 rounded-2xl p-6 shadow min-w-[160px] text-center">
            <div className="font-semibold text-blue-700 mb-2">Trade Value</div>
            <div className="text-2xl font-bold text-blue-900">
              Rs {exactCost?.tradeValue.toFixed(2)}
            </div>
          </div>

          {/* Brokerage */}
          <div className="bg-green-100 rounded-2xl p-6 shadow min-w-[160px] text-center">
            <div className="font-semibold text-green-700 mb-2">
              Brokerage (
              {exactCost ? (exactCost.brokerageRate * 100).toFixed(2) : '0'}%)
            </div>
            <div className="text-2xl font-bold text-green-900">
              Rs {exactCost?.brokerage.toFixed(2)}
            </div>
          </div>

          {/* SEBON Fee */}
          <div className="bg-yellow-100 rounded-2xl p-6 shadow min-w-[160px] text-center">
            <div className="font-semibold text-yellow-700 mb-2">
              SEBON Fee (0.015%)
            </div>
            <div className="text-2xl font-bold text-yellow-900">
              Rs {exactCost?.sebonFee.toFixed(2)}
            </div>
          </div>

          {/* DP Fee */}
          <div className="bg-purple-100 rounded-2xl p-6 shadow min-w-[160px] text-center">
            <div className="font-semibold text-purple-700 mb-2">
              DP Fee (Fixed)
            </div>
            <div className="text-2xl font-bold text-purple-900">Rs 25.00</div>
          </div>
        </div>

        {/* Total Cost box aligned center */}
        <div className="max-w-xs mx-auto bg-white rounded-3xl p-4 shadow-xl text-center mb-10">
          <div className="text-lg font-semibold text-gray-700 mb-2">
            Total Cost
          </div>
          <div className="text-3xl font-extrabold text-gray-900 mb-1">
            Rs {exactCost?.totalCost.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">
            Cost per Share: Rs {exactCost?.costPerShare.toFixed(4)}
          </div>
        </div>

        {/* Chart container */}
        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <Line data={data} options={options} />
        </div>
      </div>
    </div>
  );
}
