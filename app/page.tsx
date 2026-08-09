/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Calculator,
  Download,
  Copy,
  Printer,
  Trophy,
  Sliders,
  PieChart,
  ListChecks,
  Users,
  Shield,
  Utensils,
  Wrench,
  Search,
  CheckCircle2,
  Table,
  Sparkles,
  PenTool
} from 'lucide-react';

// Competition Data Item Interface
interface CompetitionItem {
  id: number;
  name: string;
  category: string;
  group: 'Dewasa' | 'Anak';
  teamSize: number;
}

// Initial 21 Competitions List
const INITIAL_COMPETITIONS: CompetitionItem[] = [
  { id: 1, name: 'Toktak', category: 'Bapa', group: 'Dewasa', teamSize: 2 },
  { id: 2, name: 'Voli Tirai', category: 'Bapa', group: 'Dewasa', teamSize: 3 },
  { id: 3, name: 'PES', category: 'All', group: 'Dewasa', teamSize: 1 },
  { id: 4, name: 'Toktak', category: 'Ibu', group: 'Dewasa', teamSize: 2 },
  { id: 5, name: 'Voli Tirai', category: 'Ibu', group: 'Dewasa', teamSize: 3 },
  { id: 6, name: 'Pasang Sarung Melambungkan Balon', category: 'Ibu', group: 'Dewasa', teamSize: 1 },
  { id: 7, name: 'Paku Sekali Pukul', category: 'Bapa', group: 'Dewasa', teamSize: 5 },
  { id: 8, name: 'Injak Balon', category: 'Ibu', group: 'Dewasa', teamSize: 1 },
  { id: 9, name: 'Karnaval', category: 'All', group: 'Dewasa', teamSize: 1 },
  { id: 10, name: 'Pindah Bendera', category: '2-3 Tahun', group: 'Anak', teamSize: 1 },
  { id: 11, name: 'Spon Air', category: '4-5 Tahun', group: 'Anak', teamSize: 1 },
  { id: 12, name: 'Pindah Bola', category: '4-5 Tahun', group: 'Anak', teamSize: 1 },
  { id: 13, name: 'Makan Kerupuk', category: '1-3 SD', group: 'Anak', teamSize: 1 },
  { id: 14, name: 'Masukkan Air Topeng Kerucut', category: '1-3 SD', group: 'Anak', teamSize: 1 },
  { id: 15, name: 'Masukkan Bola Di Keranjang Kepala', category: '1-3 SD', group: 'Anak', teamSize: 1 },
  { id: 16, name: 'Makan Kerupuk', category: '4-6 SD', group: 'Anak', teamSize: 1 },
  { id: 17, name: 'Masukkan Air Topeng Kerucut', category: '4-6 SD', group: 'Anak', teamSize: 1 },
  { id: 18, name: 'Masukkan Bola Di Keranjang Kepala', category: '4-6 SD', group: 'Anak', teamSize: 1 },
  { id: 19, name: 'Makan Kerupuk', category: '1-3 SMP', group: 'Anak', teamSize: 1 },
  { id: 20, name: 'Melambungkan Bola Pakai Sarung', category: '1-3 SMP', group: 'Anak', teamSize: 1 },
  { id: 21, name: 'Masukkan Pensil Pakai Spion', category: '1-3 SMP', group: 'Anak', teamSize: 1 },
];

const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount || 0);
};

export default function App() {
  // Overall Financial State
  const totalBudget = 12000000;
  const [activeTab, setActiveTab] = useState<'summary' | 'prizes' | 'other_posts'>('summary');
  const [activePrizePreset, setActivePrizePreset] = useState<'fit_4_5m' | 'original_6m' | 'flat'>('fit_4_5m');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCell, setSelectedCell] = useState({ name: 'A1', formula: '=SUM(Pos 1:Pos 6)' });
  const [toast, setToast] = useState({ show: false, message: '' });

  // Pos Allocations
  const [posBudget, setPosBudget] = useState({
    hadiah: 4500000,
    panggung: 3200000,
    konsumsi: 1500000,
    peralatan: 1500000,
    panitia: 1000000,
    cadangan: 300000
  });

  // Prize Rate Parameters per Individual Winner
  const [rates, setRates] = useState({
    dewasa: { j1: 90000, j2: 60000, j3: 35000 },
    anak: { j1: 35000, j2: 25000, j3: 15000 }
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).XLSX) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast({ show: true, message: msg });
    setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 3000);
  }, []);

  const competitionRows = useMemo(() => {
    return INITIAL_COMPETITIONS.map((item) => {
      const rateJ1 = item.group === 'Dewasa' ? rates.dewasa.j1 : rates.anak.j1;
      const rateJ2 = item.group === 'Dewasa' ? rates.dewasa.j2 : rates.anak.j2;
      const rateJ3 = item.group === 'Dewasa' ? rates.dewasa.j3 : rates.anak.j3;

      const valJ1 = rateJ1 * item.teamSize;
      const valJ2 = rateJ2 * item.teamSize;
      const valJ3 = rateJ3 * item.teamSize;
      const totalCost = valJ1 + valJ2 + valJ3;

      return {
        ...item,
        rateJ1,
        rateJ2,
        rateJ3,
        valJ1,
        valJ2,
        valJ3,
        totalCost
      };
    });
  }, [rates]);

  // Filtered rows for Search
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return competitionRows;
    const q = searchQuery.toLowerCase();
    return competitionRows.filter(
      (item) => item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
    );
  }, [competitionRows, searchQuery]);

  // Aggregate Metrics
  const totalPrizeCost = useMemo(() => {
    return competitionRows.reduce((acc, curr) => acc + curr.totalCost, 0);
  }, [competitionRows]);

  const totalPeople = useMemo(() => {
    return competitionRows.reduce((acc, curr) => acc + curr.teamSize * 3, 0);
  }, []);

  const sumJ1 = useMemo(() => competitionRows.reduce((acc, curr) => acc + curr.valJ1, 0), [competitionRows]);
  const sumJ2 = useMemo(() => competitionRows.reduce((acc, curr) => acc + curr.valJ2, 0), [competitionRows]);
  const sumJ3 = useMemo(() => competitionRows.reduce((acc, curr) => acc + curr.valJ3, 0), [competitionRows]);

  // Sync Hadiah Pos Budget whenever Total Prize Cost changes
  useEffect(() => {
    setPosBudget((prev) => ({ ...prev, hadiah: totalPrizeCost }));
  }, [totalPrizeCost]);

  const grandTotalExpenses = useMemo(() => {
    return (
      posBudget.hadiah +
      posBudget.panggung +
      posBudget.konsumsi +
      posBudget.peralatan +
      posBudget.panitia +
      posBudget.cadangan
    );
  }, [posBudget]);

  const remainingEventBudget = totalBudget - grandTotalExpenses;

  const applyMasterPreset = (type: 'balanced' | 'prize_heavy') => {
    if (type === 'balanced') {
      setPosBudget({
        hadiah: 4500000,
        panggung: 3200000,
        konsumsi: 1500000,
        peralatan: 1500000,
        panitia: 1000000,
        cadangan: 300000
      });
      applyPrizePreset('fit_4_5m');
      showToast('Skenario Seimbang 12 Juta Diterapkan!');
    } else {
      setPosBudget({
        hadiah: 5950000,
        panggung: 2200000,
        konsumsi: 1500000,
        peralatan: 1100000,
        panitia: 1000000,
        cadangan: 250000
      });
      applyPrizePreset('original_6m');
      showToast('Skenario Fokus Hadiah Besar Diterapkan!');
    }
  };

  const applyPrizePreset = (type: 'fit_4_5m' | 'original_6m' | 'flat') => {
    setActivePrizePreset(type);
    if (type === 'fit_4_5m') {
      setRates({
        dewasa: { j1: 90000, j2: 60000, j3: 35000 },
        anak: { j1: 35000, j2: 25000, j3: 15000 }
      });
    } else if (type === 'original_6m') {
      setRates({
        dewasa: { j1: 120000, j2: 80000, j3: 50000 },
        anak: { j1: 50000, j2: 30000, j3: 20000 }
      });
    } else if (type === 'flat') {
      setRates({
        dewasa: { j1: 70000, j2: 50000, j3: 30000 },
        anak: { j1: 70000, j2: 50000, j3: 30000 }
      });
    }
  };

  const exportToExcel = () => {
    const XLSX = (window as any).XLSX;
    if (!XLSX) {
      showToast('Library Excel sedang dimuat, harap tunggu sebentar...');
      return;
    }

    const workbook = XLSX.utils.book_new();

    // Sheet 1: Master Rekap 12 Juta
    const masterData = [
      { No: 1, 'Pos Pengeluaran': 'Hadiah Lomba (21 Cabang)', Rincian: '93 Pemenang Individual (Dewasa & Anak)', 'Alokasi Budget (Rp)': posBudget.hadiah },
      { No: 2, 'Pos Pengeluaran': 'Budget Panggung & Rias', Rincian: 'Panggung, sound system, dekorasi & rias MC', 'Alokasi Budget (Rp)': posBudget.panggung },
      { No: 3, 'Pos Pengeluaran': 'Konsumsi Acara', Rincian: 'Snack lomba & nasi kotak malam puncak', 'Alokasi Budget (Rp)': posBudget.konsumsi },
      { No: 4, 'Pos Pengeluaran': 'Peralatan & Logistik Lomba', Rincian: 'Bahan lomba, kertas kado, P3K, kebersihan', 'Alokasi Budget (Rp)': posBudget.peralatan },
      { No: 5, 'Pos Pengeluaran': 'Apresiasi Panitia (20 Org)', Rincian: 'Bingkisan/kaos/apresiasi 20 panitia', 'Alokasi Budget (Rp)': posBudget.panitia },
      { No: 6, 'Pos Pengeluaran': 'Dana Tak Terduga / Cadangan', Rincian: 'Antisipasi kebutuhan mendadak saat acara', 'Alokasi Budget (Rp)': posBudget.cadangan },
      { No: '', 'Pos Pengeluaran': 'TOTAL PENGELUARAN', Rincian: `Sisa Dana: ${formatRupiah(remainingEventBudget)}`, 'Alokasi Budget (Rp)': grandTotalExpenses }
    ];
    const sheet1 = XLSX.utils.json_to_sheet(masterData);
    XLSX.utils.book_append_sheet(workbook, sheet1, 'Rekap_Master_12Juta');

    // Sheet 2: Detail Hadiah
    const exportPrizes: any[] = competitionRows.map((row) => ({
      No: row.id,
      'Nama Lomba': row.name,
      'Kategori Usia': row.category,
      'Peserta / Tim (Orang)': row.teamSize,
      'Juara 1 (Rp)': row.valJ1,
      'Juara 2 (Rp)': row.valJ2,
      'Juara 3 (Rp)': row.valJ3,
      'Total Hadiah (Rp)': row.totalCost
    }));

    exportPrizes.push({
      No: '',
      'Nama Lomba': 'TOTAL HADIAH LOMBA',
      'Kategori Usia': '',
      'Peserta / Tim (Orang)': totalPeople,
      'Juara 1 (Rp)': sumJ1,
      'Juara 2 (Rp)': sumJ2,
      'Juara 3 (Rp)': sumJ3,
      'Total Hadiah (Rp)': totalPrizeCost
    });

    const sheet2 = XLSX.utils.json_to_sheet(exportPrizes);
    XLSX.utils.book_append_sheet(workbook, sheet2, 'Detail_Hadiah_Lomba');

    XLSX.writeFile(workbook, 'Anggaran_Event_12Juta_NextJS.xlsx');
    showToast('File Excel (.xlsx) berhasil diunduh!');
  };

  const copyToClipboard = () => {
    let text = 'REKAPITULASI ANGGARAN EVENT (TOTAL RP 12.000.000)\n';
    text += 'No\tPos Pengeluaran\tRincian\tAlokasi Budget (Rp)\n';
    text += `1\tHadiah Lomba\t21 Cabang Lomba (93 Pemenang)\t${posBudget.hadiah}\n`;
    text += `2\tPanggung & Rias\tSewa Panggung, Sound, Dekorasi & Rias\t${posBudget.panggung}\n`;
    text += `3\tKonsumsi\tSnack & Nasi Kotak Malam Puncak\t${posBudget.konsumsi}\n`;
    text += `4\tPeralatan & Logistik\tBahan Lomba, Kertas Kado, P3K\t${posBudget.peralatan}\n`;
    text += `5\tHadiah Panitia\tApresiasi 20 Orang Panitia\t${posBudget.panitia}\n`;
    text += `6\tDana Cadangan\tCadangan Tak Terduga\t${posBudget.cadangan}\n`;
    text += `\tTOTAL PENGELUARAN\t\t${grandTotalExpenses}\n`;

    navigator.clipboard.writeText(text).then(() => {
      showToast('Data berhasil disalin! Tinggal Paste (Ctrl+V) di Google Sheets / Excel.');
    });
  };

  return (
    <div className="bg-slate-100 text-slate-800 min-h-screen flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="bg-[#107c41] text-white print:hidden shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-white text-[#107c41] p-2 rounded-lg font-bold text-xl shadow">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
                Master Budget Event 17-an & Hadiah Lomba
                <span className="text-[10px] bg-emerald-800 text-emerald-100 px-2 py-0.5 rounded-full border border-emerald-600">
                  Next.js Edition
                </span>
              </h1>
              <p className="text-emerald-100 text-xs">
                Total Iuran Warga: Rp12.000.000 | Multi-Pos Interactive Spreadsheet
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportToExcel}
              className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold px-3 py-1.5 rounded border border-emerald-600 transition flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Download className="w-4 h-4" /> Export Excel (.xlsx)
            </button>
            <button
              onClick={copyToClipboard}
              className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold px-3 py-1.5 rounded border border-emerald-600 transition flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Copy className="w-4 h-4" /> Copy Google Sheets
            </button>
            <button
              onClick={() => window.print()}
              className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded transition flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Printer className="w-4 h-4" /> Cetak / PDF
            </button>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 border border-slate-700 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-4 py-4 flex-1 flex flex-col gap-4">
        {/* Summary Metric Cards */}
        {}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print:hidden">
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Iuran Warga</div>
            <div className="text-xl font-bold text-slate-800 mt-0.5">{formatRupiah(totalBudget)}</div>
            <div className="text-[10px] text-slate-400">Pagu Anggaran Utama</div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Rencana Pengeluaran</div>
            <div
              className={`text-xl font-bold mt-0.5 ${
                grandTotalExpenses > totalBudget ? 'text-red-600' : 'text-emerald-700'
              }`}
            >
              {formatRupiah(grandTotalExpenses)}
            </div>
            <div className="text-[10px] text-slate-400">=SUM(Pos 1 : Pos 6)</div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Sisa / Defisit Dana</div>
            <div
              className={`text-xl font-bold mt-0.5 ${
                remainingEventBudget < 0 ? 'text-red-600' : 'text-blue-700'
              }`}
            >
              {formatRupiah(remainingEventBudget)}
            </div>
            <div className="text-[10px] text-slate-400">
              {remainingEventBudget >= 0 ? 'Aman (Pas / Surpluss)' : 'Peringatan Overbudget!'}
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Status Kelompok Pos</div>
            <div className="text-xl font-bold text-amber-600 mt-0.5">6 Pos Utama</div>
            <div className="text-[10px] text-slate-400">Hadiah, Panggung, Konsumsi, dll</div>
          </div>
        </div>

        {/* Tab Navigation */}
        {}
        <div className="bg-white border-b border-slate-200 rounded-t-lg shadow-sm flex flex-wrap gap-1 p-1.5 print:hidden">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 rounded-md text-xs transition flex items-center gap-2 ${
              activeTab === 'summary'
                ? 'bg-emerald-700 text-white font-bold'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <PieChart className="w-4 h-4" /> Tab 1: Rekap 6 Pos Anggaran (12 Juta)
          </button>
          <button
            onClick={() => setActiveTab('prizes')}
            className={`px-4 py-2 rounded-md text-xs transition flex items-center gap-2 ${
              activeTab === 'prizes'
                ? 'bg-emerald-700 text-white font-bold'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4" /> Tab 2: Detail Spreadsheet Hadiah (21 Lomba)
          </button>
          <button
            onClick={() => setActiveTab('other_posts')}
            className={`px-4 py-2 rounded-md text-xs transition flex items-center gap-2 ${
              activeTab === 'other_posts'
                ? 'bg-emerald-700 text-white font-bold'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ListChecks className="w-4 h-4" /> Tab 3: Rincian Panggung, Panitia & Peralatan
          </button>
        </div>

        {/* TAB 1: SUMMARY OF ALL 6 POS ANGGARAN */}
        {activeTab === 'summary' && (
          <div className="flex flex-col gap-4">
            <div className="bg-white p-4 rounded-b-lg border border-slate-200 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2 border-b pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                    <Table className="w-4 h-4 text-emerald-600" /> Matriks Pembagian Anggaran Acara (Total Rp12.000.000)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Ubah estimasi per pos di bawah ini untuk menguji simulasi anggaran secara fleksibel.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => applyMasterPreset('balanced')}
                    className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded text-xs font-semibold hover:bg-emerald-100 flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Preset A: Rekomendasi Seimbang
                  </button>
                  <button
                    onClick={() => applyMasterPreset('prize_heavy')}
                    className="px-3 py-1 bg-slate-50 text-slate-700 border border-slate-300 rounded text-xs font-semibold hover:bg-slate-100"
                  >
                    Preset B: Fokus Hadiah Lomba Besar
                  </button>
                </div>
              </div>

              {/* Budget Allocation Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                      <th className="py-2 px-3 w-12 border-r border-slate-300 text-center">No</th>
                      <th className="py-2 px-3 border-r border-slate-300 min-w-[200px]">Pos Pengeluaran</th>
                      <th className="py-2 px-3 border-r border-slate-300 min-w-[250px]">Keterangan & Rincian</th>
                      <th className="py-2 px-3 border-r border-slate-300 text-right w-32">Target %</th>
                      <th className="py-2 px-3 border-r border-slate-300 text-right min-w-[140px] bg-emerald-50">
                        Alokasi Budget (Rp)
                      </th>
                      <th className="py-2 px-3 border-r border-slate-300 text-center w-28 print:hidden">Navigasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {/* Pos 1 */}
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-bold">1</td>
                      <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-slate-800 flex items-center gap-1.5">
                        <Trophy className="w-4 h-4 text-amber-500" /> Hadiah Lomba (21 Cabang)
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-slate-600">
                        93 Pemenang individual (Dewasa & Anak). Terhubung otomatis ke Tab 2.
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono">
                        {((posBudget.hadiah / totalBudget) * 100).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono font-bold text-emerald-800 bg-emerald-50/40">
                        {formatRupiah(posBudget.hadiah)}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center print:hidden">
                        <button
                          onClick={() => setActiveTab('prizes')}
                          className="text-blue-600 hover:text-blue-800 text-[11px] font-semibold underline"
                        >
                          Atur di Tab 2
                        </button>
                      </td>
                    </tr>

                    {/* Pos 2 */}
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-bold">2</td>
                      <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-slate-800">
                        Budget Panggung & Rias
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-slate-600">
                        Sewa panggung, sound system, dekorasi, banner backdrop, & rias pengisi acara/MC.
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono">
                        {((posBudget.panggung / totalBudget) * 100).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono font-bold text-slate-800">
                        <input
                          type="number"
                          step={50000}
                          value={posBudget.panggung}
                          onChange={(e) => setPosBudget({ ...posBudget, panggung: Number(e.target.value) })}
                          className="w-full text-right bg-transparent border-b border-dashed border-slate-400 font-mono font-bold text-slate-800 focus:outline-none focus:border-emerald-600"
                        />
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center print:hidden">
                        <button
                          onClick={() => setActiveTab('other_posts')}
                          className="text-blue-600 hover:text-blue-800 text-[11px] font-semibold underline"
                        >
                          Rincian Tab 3
                        </button>
                      </td>
                    </tr>

                    {/* Pos 3 */}
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-bold">3</td>
                      <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-slate-800 flex items-center gap-1.5">
                        <Utensils className="w-4 h-4 text-orange-500" /> Konsumsi Acara
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-slate-600">
                        Snack panitia/juri saat lomba & nasi kotak malam puncak. (Target: Rp1,5 Juta).
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono">
                        {((posBudget.konsumsi / totalBudget) * 100).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono font-bold text-slate-800">
                        <input
                          type="number"
                          step={50000}
                          value={posBudget.konsumsi}
                          onChange={(e) => setPosBudget({ ...posBudget, konsumsi: Number(e.target.value) })}
                          className="w-full text-right bg-transparent border-b border-dashed border-slate-400 font-mono font-bold text-slate-800 focus:outline-none focus:border-emerald-600"
                        />
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center print:hidden">
                        <button
                          onClick={() => setActiveTab('other_posts')}
                          className="text-blue-600 hover:text-blue-800 text-[11px] font-semibold underline"
                        >
                          Rincian Tab 3
                        </button>
                      </td>
                    </tr>

                    {/* Pos 4 */}
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-bold">4</td>
                      <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-slate-800 flex items-center gap-1.5">
                        <Wrench className="w-4 h-4 text-slate-600" /> Peralatan & Logistik Lomba
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-slate-600">
                        Beli alat-alat lomba, tali, spion, balon, plastik kado, Sewa PS, P3K, & kebersihan.
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono">
                        {((posBudget.peralatan / totalBudget) * 100).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono font-bold text-slate-800">
                        <input
                          type="number"
                          step={50000}
                          value={posBudget.peralatan}
                          onChange={(e) => setPosBudget({ ...posBudget, peralatan: Number(e.target.value) })}
                          className="w-full text-right bg-transparent border-b border-dashed border-slate-400 font-mono font-bold text-slate-800 focus:outline-none focus:border-emerald-600"
                        />
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center print:hidden">
                        <button
                          onClick={() => setActiveTab('other_posts')}
                          className="text-blue-600 hover:text-blue-800 text-[11px] font-semibold underline"
                        >
                          Rincian Tab 3
                        </button>
                      </td>
                    </tr>

                    {/* Pos 5 */}
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-bold">5</td>
                      <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-slate-800 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-blue-600" /> Hadiah / Apresiasi Panitia (20 Org)
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-slate-600">
                        Apresiasi / bingkisan / seragam kaos untuk ~20 orang panitia penanggung jawab.
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono">
                        {((posBudget.panitia / totalBudget) * 100).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono font-bold text-slate-800">
                        <input
                          type="number"
                          step={50000}
                          value={posBudget.panitia}
                          onChange={(e) => setPosBudget({ ...posBudget, panitia: Number(e.target.value) })}
                          className="w-full text-right bg-transparent border-b border-dashed border-slate-400 font-mono font-bold text-slate-800 focus:outline-none focus:border-emerald-600"
                        />
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center print:hidden">
                        <button
                          onClick={() => setActiveTab('other_posts')}
                          className="text-blue-600 hover:text-blue-800 text-[11px] font-semibold underline"
                        >
                          Rincian Tab 3
                        </button>
                      </td>
                    </tr>

                    {/* Pos 6 */}
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-bold">6</td>
                      <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-slate-800 flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-teal-600" /> Dana Tak Terduga / Cadangan
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-slate-600">
                        Dana darurat/kebijakan untuk kebutuhan mendadak saat pelaksanaan acara.
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono">
                        {((posBudget.cadangan / totalBudget) * 100).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono font-bold text-slate-800">
                        <input
                          type="number"
                          step={10000}
                          value={posBudget.cadangan}
                          onChange={(e) => setPosBudget({ ...posBudget, cadangan: Number(e.target.value) })}
                          className="w-full text-right bg-transparent border-b border-dashed border-slate-400 font-mono font-bold text-slate-800 focus:outline-none focus:border-emerald-600"
                        />
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center text-slate-400 font-mono text-[11px] print:hidden">
                        -
                      </td>
                    </tr>
                  </tbody>

                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400 text-slate-800">
                    <tr>
                      <td
                        colSpan={3}
                        className="py-3 px-3 border-r border-slate-300 text-right font-bold uppercase tracking-wider"
                      >
                        TOTAL KESELURUHAN PENGELUARAN (=SUM)
                      </td>
                      <td className="py-3 px-3 border-r border-slate-300 text-right font-mono text-slate-800 font-extrabold">
                        {((grandTotalExpenses / totalBudget) * 100).toFixed(0)}%
                      </td>
                      <td className="py-3 px-3 border-r border-slate-300 text-right font-mono text-sm text-emerald-900 bg-emerald-200 font-black">
                        {formatRupiah(grandTotalExpenses)}
                      </td>
                      <td className="print:hidden"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Visual Allocation Bars */}
            {}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-600" /> Visual Proporsi Pembagian Dana Rp12.000.000
              </h3>
              <div className="w-full bg-slate-200 h-6 rounded-lg overflow-hidden flex font-mono text-[10px] text-white font-bold">
                <div
                  style={{ width: `${(posBudget.hadiah / totalBudget) * 100}%` }}
                  className="bg-amber-500 h-full flex items-center justify-center"
                  title="Hadiah Lomba"
                >
                  {((posBudget.hadiah / totalBudget) * 100).toFixed(0)}%
                </div>
                <div
                  style={{ width: `${(posBudget.panggung / totalBudget) * 100}%` }}
                  className="bg-indigo-600 h-full flex items-center justify-center"
                  title="Panggung & Rias"
                >
                  {((posBudget.panggung / totalBudget) * 100).toFixed(0)}%
                </div>
                <div
                  style={{ width: `${(posBudget.konsumsi / totalBudget) * 100}%` }}
                  className="bg-orange-500 h-full flex items-center justify-center"
                  title="Konsumsi"
                >
                  {((posBudget.konsumsi / totalBudget) * 100).toFixed(0)}%
                </div>
                <div
                  style={{ width: `${(posBudget.peralatan / totalBudget) * 100}%` }}
                  className="bg-slate-600 h-full flex items-center justify-center"
                  title="Peralatan"
                >
                  {((posBudget.peralatan / totalBudget) * 100).toFixed(0)}%
                </div>
                <div
                  style={{ width: `${(posBudget.panitia / totalBudget) * 100}%` }}
                  className="bg-blue-600 h-full flex items-center justify-center"
                  title="Panitia"
                >
                  {((posBudget.panitia / totalBudget) * 100).toFixed(0)}%
                </div>
                <div
                  style={{ width: `${(posBudget.cadangan / totalBudget) * 100}%` }}
                  className="bg-teal-500 h-full flex items-center justify-center"
                  title="Cadangan"
                >
                  {((posBudget.cadangan / totalBudget) * 100).toFixed(0)}%
                </div>
              </div>

              <div className="flex flex-wrap justify-between gap-2 mt-3 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-500 inline-block"></span> Hadiah Lomba (
                  {formatRupiah(posBudget.hadiah)})
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-indigo-600 inline-block"></span> Panggung & Rias (
                  {formatRupiah(posBudget.panggung)})
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-orange-500 inline-block"></span> Konsumsi (
                  {formatRupiah(posBudget.konsumsi)})
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-slate-600 inline-block"></span> Peralatan (
                  {formatRupiah(posBudget.peralatan)})
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-blue-600 inline-block"></span> Apresiasi Panitia (
                  {formatRupiah(posBudget.panitia)})
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-teal-500 inline-block"></span> Dana Cadangan (
                  {formatRupiah(posBudget.cadangan)})
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DETAILED SPREADSHEET FOR 21 PRIZES */}
        {}
        {activeTab === 'prizes' && (
          <div className="flex flex-col gap-4">
            {/* Quick Preset Controls */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-3 print:hidden">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-emerald-600" /> Preset Tarif Hadiah:
                </span>
                <button
                  onClick={() => applyPrizePreset('fit_4_5m')}
                  className={`px-2.5 py-1 text-xs border rounded transition ${
                    activePrizePreset === 'fit_4_5m'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-400 font-bold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  A: Pas Budget Rp4,5 Juta
                </button>
                <button
                  onClick={() => applyPrizePreset('original_6m')}
                  className={`px-2.5 py-1 text-xs border rounded transition ${
                    activePrizePreset === 'original_6m'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-400 font-bold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  B: Pas Budget Rp6.0 Juta
                </button>
                <button
                  onClick={() => applyPrizePreset('flat')}
                  className={`px-2.5 py-1 text-xs border rounded transition ${
                    activePrizePreset === 'flat'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-400 font-bold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  C: Nominal Per Orang Sama
                </button>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative w-full md:w-52">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama lomba/kategori..."
                    className="pl-8 pr-3 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 outline-none w-full"
                  />
                </div>
              </div>
            </div>

            {/* Excel Formula Bar Simulation */}
            <div className="bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden flex items-center text-xs print:hidden">
              <div className="bg-slate-100 px-3 py-1.5 font-mono font-bold text-slate-600 border-r border-slate-300 w-16 text-center">
                {selectedCell.name}
              </div>
              <div className="px-3 py-1.5 text-slate-400 font-serif italic border-r border-slate-300">fx</div>
              <div className="px-3 py-1.5 font-mono text-slate-800 flex-1 overflow-x-auto whitespace-nowrap bg-slate-50">
                {selectedCell.formula}
              </div>
            </div>

            {/* Main Excel Table Grid for 21 Lomba */}
            {}
            <div className="bg-white border border-slate-300 rounded-lg shadow-sm overflow-x-auto flex-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 border-b border-slate-300 select-none text-center font-semibold text-[11px]">
                    <th className="w-10 py-1.5 border-r border-slate-300 bg-slate-200"></th>
                    <th className="py-1.5 px-2 border-r border-slate-300 w-12">A</th>
                    <th className="py-1.5 px-3 border-r border-slate-300 min-w-[200px] text-left">B</th>
                    <th className="py-1.5 px-3 border-r border-slate-300 min-w-[120px] text-left">C</th>
                    <th className="py-1.5 px-2 border-r border-slate-300 w-24">D</th>
                    <th className="py-1.5 px-3 border-r border-slate-300 min-w-[110px] text-right">E</th>
                    <th className="py-1.5 px-3 border-r border-slate-300 min-w-[110px] text-right">F</th>
                    <th className="py-1.5 px-3 border-r border-slate-300 min-w-[110px] text-right">G</th>
                    <th className="py-1.5 px-3 border-r border-slate-300 min-w-[130px] text-right bg-emerald-50 text-emerald-900">
                      H
                    </th>
                  </tr>
                  <tr className="bg-slate-100 font-bold border-b border-slate-300 text-slate-700">
                    <td className="bg-slate-200 border-r border-slate-300 py-2 text-center text-[10px] font-mono">
                      1
                    </td>
                    <td className="py-2 px-2 border-r border-slate-300 text-center">No</td>
                    <td className="py-2 px-3 border-r border-slate-300">Nama Lomba</td>
                    <td className="py-2 px-3 border-r border-slate-300">Kategori Usia</td>
                    <td className="py-2 px-2 border-r border-slate-300 text-center">Peserta/Tim</td>
                    <td className="py-2 px-3 border-r border-slate-300 text-right">Juara 1 (Total)</td>
                    <td className="py-2 px-3 border-r border-slate-300 text-right">Juara 2 (Total)</td>
                    <td className="py-2 px-3 border-r border-slate-300 text-right">Juara 3 (Total)</td>
                    <td className="py-2 px-3 border-r border-slate-300 text-right bg-emerald-100 text-emerald-900 font-extrabold">
                      Total Hadiah (=E+F+G)
                    </td>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRows.map((row, index) => (
                    <tr key={row.id} className="hover:bg-amber-50/50 transition">
                      <td className="bg-slate-100 border-r border-slate-300 text-center font-mono text-[10px] text-slate-500">
                        {index + 2}
                      </td>

                      <td className="py-1.5 px-2 border-r border-slate-200 text-center text-slate-500 font-mono">
                        {row.id}
                      </td>

                      <td
                        onClick={() => setSelectedCell({ name: `B${index + 2}`, formula: row.name })}
                        className="py-1.5 px-3 border-r border-slate-200 font-semibold text-slate-800 cursor-pointer"
                      >
                        {row.name}
                      </td>

                      <td
                        onClick={() => setSelectedCell({ name: `C${index + 2}`, formula: row.category })}
                        className="py-1.5 px-3 border-r border-slate-200 cursor-pointer"
                      >
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                            row.group === 'Dewasa'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {row.category}
                        </span>
                      </td>

                      <td
                        onClick={() => setSelectedCell({ name: `D${index + 2}`, formula: String(row.teamSize) })}
                        className="py-1.5 px-2 border-r border-slate-200 text-center font-bold text-slate-700 bg-slate-50/50 cursor-pointer"
                      >
                        <span>{row.teamSize}</span>
                        <span className="text-[10px] text-slate-400 font-normal"> org</span>
                      </td>

                      <td
                        onClick={() =>
                          setSelectedCell({
                            name: `E${index + 2}`,
                            formula: `=D${index + 2}*${row.rateJ1} (${formatRupiah(row.valJ1)})`
                          })
                        }
                        className="py-1.5 px-3 border-r border-slate-200 text-right font-mono cursor-pointer"
                      >
                        <div className="font-medium text-slate-800">{formatRupiah(row.valJ1)}</div>
                        {row.teamSize > 1 && (
                          <div className="text-[10px] text-slate-400">@ {formatRupiah(row.rateJ1)}</div>
                        )}
                      </td>

                      <td
                        onClick={() =>
                          setSelectedCell({
                            name: `F${index + 2}`,
                            formula: `=D${index + 2}*${row.rateJ2} (${formatRupiah(row.valJ2)})`
                          })
                        }
                        className="py-1.5 px-3 border-r border-slate-200 text-right font-mono cursor-pointer"
                      >
                        <div className="font-medium text-slate-800">{formatRupiah(row.valJ2)}</div>
                        {row.teamSize > 1 && (
                          <div className="text-[10px] text-slate-400">@ {formatRupiah(row.rateJ2)}</div>
                        )}
                      </td>

                      <td
                        onClick={() =>
                          setSelectedCell({
                            name: `G${index + 2}`,
                            formula: `=D${index + 2}*${row.rateJ3} (${formatRupiah(row.valJ3)})`
                          })
                        }
                        className="py-1.5 px-3 border-r border-slate-200 text-right font-mono cursor-pointer"
                      >
                        <div className="font-medium text-slate-800">{formatRupiah(row.valJ3)}</div>
                        {row.teamSize > 1 && (
                          <div className="text-[10px] text-slate-400">@ {formatRupiah(row.rateJ3)}</div>
                        )}
                      </td>

                      <td
                        onClick={() =>
                          setSelectedCell({
                            name: `H${index + 2}`,
                            formula: `=SUM(E${index + 2}:G${index + 2}) (${formatRupiah(row.totalCost)})`
                          })
                        }
                        className="py-1.5 px-3 border-r border-slate-200 text-right font-mono font-bold text-emerald-800 bg-emerald-50/40 cursor-pointer"
                      >
                        {formatRupiah(row.totalCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>

                {/* Footer Total */}
                <tfoot className="bg-slate-200 font-bold border-t-2 border-slate-400 text-slate-800">
                  <tr>
                    <td className="bg-slate-300 border-r border-slate-300 py-2.5 text-center font-mono text-[10px]">
                      23
                    </td>
                    <td colSpan={3} className="py-2.5 px-3 border-r border-slate-300 text-right font-bold tracking-wide">
                      TOTAL HADIAH LOMBA (=SUM)
                    </td>
                    <td className="py-2.5 px-2 border-r border-slate-300 text-center font-extrabold text-blue-900">
                      {totalPeople} Pemenang
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-300 text-right font-mono text-emerald-800">
                      {formatRupiah(sumJ1)}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-300 text-right font-mono text-emerald-800">
                      {formatRupiah(sumJ2)}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-300 text-right font-mono text-emerald-800">
                      {formatRupiah(sumJ3)}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-300 text-right font-mono text-sm text-emerald-900 bg-emerald-200/80 font-black">
                      {formatRupiah(totalPrizeCost)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Parameter Rates Control Panel */}
            {}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm print:hidden">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
                <PenTool className="w-4 h-4 text-emerald-600" /> Edit Parameter Tarif Hadiah Per Orang (Simulasi Formula Live)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dewasa Rates */}
                <div className="bg-blue-50/50 p-3 rounded border border-blue-200">
                  <div className="text-xs font-bold text-blue-900 mb-2 flex items-center justify-between">
                    <span>Kelompok Dewasa / Umum (9 Lomba)</span>
                    <span className="text-[10px] bg-blue-100 px-2 py-0.5 rounded text-blue-800">Baris 2-10</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-600 block mb-1">Juara 1 (/org)</label>
                      <input
                        type="number"
                        step={5000}
                        value={rates.dewasa.j1}
                        onChange={(e) =>
                          setRates({ ...rates, dewasa: { ...rates.dewasa, j1: Number(e.target.value) } })
                        }
                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono font-bold text-slate-800 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-600 block mb-1">Juara 2 (/org)</label>
                      <input
                        type="number"
                        step={5000}
                        value={rates.dewasa.j2}
                        onChange={(e) =>
                          setRates({ ...rates, dewasa: { ...rates.dewasa, j2: Number(e.target.value) } })
                        }
                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono font-bold text-slate-800 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-600 block mb-1">Juara 3 (/org)</label>
                      <input
                        type="number"
                        step={5000}
                        value={rates.dewasa.j3}
                        onChange={(e) =>
                          setRates({ ...rates, dewasa: { ...rates.dewasa, j3: Number(e.target.value) } })
                        }
                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono font-bold text-slate-800 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Anak Rates */}
                <div className="bg-amber-50/50 p-3 rounded border border-amber-200">
                  <div className="text-xs font-bold text-amber-900 mb-2 flex items-center justify-between">
                    <span>Kelompok Anak-Anak / Pelajar (12 Lomba)</span>
                    <span className="text-[10px] bg-amber-100 px-2 py-0.5 rounded text-amber-800">Baris 11-22</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-600 block mb-1">Juara 1 (/org)</label>
                      <input
                        type="number"
                        step={5000}
                        value={rates.anak.j1}
                        onChange={(e) =>
                          setRates({ ...rates, anak: { ...rates.anak, j1: Number(e.target.value) } })
                        }
                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono font-bold text-slate-800 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-600 block mb-1">Juara 2 (/org)</label>
                      <input
                        type="number"
                        step={5000}
                        value={rates.anak.j2}
                        onChange={(e) =>
                          setRates({ ...rates, anak: { ...rates.anak, j2: Number(e.target.value) } })
                        }
                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono font-bold text-slate-800 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-600 block mb-1">Juara 3 (/org)</label>
                      <input
                        type="number"
                        step={5000}
                        value={rates.anak.j3}
                        onChange={(e) =>
                          setRates({ ...rates, anak: { ...rates.anak, j3: Number(e.target.value) } })
                        }
                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono font-bold text-slate-800 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: OTHER POSTS DETAILS */}
        {}
        {activeTab === 'other_posts' && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Detail Pos 2 */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wide mb-3 flex items-center justify-between">
                  <span>Detail Pos Panggung & Rias</span>
                  <span className="font-mono text-indigo-700 font-bold">{formatRupiah(posBudget.panggung)}</span>
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-200">
                    <div>
                      <div className="font-bold text-slate-800">Sewa Panggung & Sound System</div>
                      <div className="text-[10px] text-slate-500">Panggung mini 4x6m + Sound 2000W + Mic</div>
                    </div>
                    <div className="font-mono font-bold text-slate-700">Rp2.000.000</div>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-200">
                    <div>
                      <div className="font-bold text-slate-800">Dekorasi & Backdrop Spanduk</div>
                      <div className="text-[10px] text-slate-500">Cetak MMT 4x2.5m + Balon + Lampu Hias</div>
                    </div>
                    <div className="font-mono font-bold text-slate-700">Rp600.000</div>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-200">
                    <div>
                      <div className="font-bold text-slate-800">Rias & Kostum Pengisi Acara / MC</div>
                      <div className="text-[10px] text-slate-500">Makeup MC, Tarian Pembuka & Kostum</div>
                    </div>
                    <div className="font-mono font-bold text-slate-700">Rp600.000</div>
                  </div>
                </div>
              </div>

              {/* Detail Pos 3 */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-orange-900 uppercase tracking-wide mb-3 flex items-center justify-between">
                  <span>Detail Pos Konsumsi</span>
                  <span className="font-mono text-orange-700 font-bold">{formatRupiah(posBudget.konsumsi)}</span>
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-200">
                    <div>
                      <div className="font-bold text-slate-800">Snack & Air Mineral Hari H Lomba</div>
                      <div className="text-[10px] text-slate-500">Untuk juri, panitia, & peserta anak</div>
                    </div>
                    <div className="font-mono font-bold text-slate-700">Rp600.000</div>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-200">
                    <div>
                      <div className="font-bold text-slate-800">Nasi Kotak / Prasmanan Malam Puncak</div>
                      <div className="text-[10px] text-slate-500">60 Porsi @ Rp15.000 (Tamu & Panitia)</div>
                    </div>
                    <div className="font-mono font-bold text-slate-700">Rp900.000</div>
                  </div>
                </div>
              </div>

              {/* Detail Pos 4 */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center justify-between">
                  <span>Detail Pos Peralatan Lomba</span>
                  <span className="font-mono text-slate-700 font-bold">{formatRupiah(posBudget.peralatan)}</span>
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-200">
                    <div>
                      <div className="font-bold text-slate-800">Bahan & Alat Lomba (21 Cabang)</div>
                      <div className="text-[10px] text-slate-500">Kerupuk, spion, kerucut, spon, balon, bola, Sewa PS dll</div>
                    </div>
                    <div className="font-mono font-bold text-slate-700">Rp800.000</div>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-200">
                    <div>
                      <div className="font-bold text-slate-800">Pembungkus Kado & Atribut</div>
                      <div className="text-[10px] text-slate-500">Kertas kado, pita, tali rafia, name tag, spanduk</div>
                    </div>
                    <div className="font-mono font-bold text-slate-700">Rp450.000</div>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-200">
                    <div>
                      <div className="font-bold text-slate-800">P3K & Kebersihan</div>
                      <div className="text-[10px] text-slate-500">Obat-obatan, plastik sampah besar, sewa tenda</div>
                    </div>
                    <div className="font-mono font-bold text-slate-700">Rp250.000</div>
                  </div>
                </div>
              </div>

              {/* Detail Pos 5 */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-3 flex items-center justify-between">
                  <span>Detail Apresiasi Panitia (20 Orang)</span>
                  <span className="font-mono text-blue-700 font-bold">{formatRupiah(posBudget.panitia)}</span>
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-blue-50/50 rounded border border-blue-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-800">Kuota Panitia:</span>
                      <span className="font-bold text-blue-900 font-mono">20 Orang</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-slate-800">Alokasi Per Panitia:</span>
                      <span className="font-bold text-emerald-700 font-mono">
                        {formatRupiah(posBudget.panitia / 20)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Dapat dialokasikan dalam bentuk <strong>Seragam Kaos Panitia</strong>,{' '}
                      <strong>Bingkisan Sembako/Piala Panitia</strong>, atau <strong>Uang Lelah/Apresiasi</strong>{' '}
                      sebesar Rp50.000 per anggota.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}