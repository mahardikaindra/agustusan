/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Trophy, 
  ListFilter, 
  Home, 
  Upload, 
  FileSpreadsheet, 
  Printer, 
  Shuffle, 
  Search, 
  Download, 
  Trash2, 
  RefreshCw,
  MessageCircle,
  Sparkles,
  AlertTriangle,
  Users2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Crown,
} from 'lucide-react';

// --- TypeScript Interfaces ---

interface Participant {
  id: number;
  nama: string;
  blok: string;
  wa: string;
  kategori: string;
  daftarLomba: string[];
}

interface GroupedLomba {
  categoryGroup: string;
  lombaTitle: string;
  participants: Participant[];
}

interface GroupedLombaMap {
  [key: string]: GroupedLomba;
}

interface Team {
  teamId: string;
  teamName: string;
  members: Participant[];
  isComplete: boolean;
  missingCount?: number;
  blokSummary: string;
  isBye?: boolean;
}

interface Session {
  sessionId: string;
  sessionName: string;
  items: Team[];
  isFull: boolean;
  count: number;
}

// Utility to determine team size, race type, and default rules based on competition title
function getLombaConfig(lombaTitle = '', categoryGroup = '') {
  const name = (lombaTitle + ' ' + categoryGroup).toLowerCase();

  // 1. Team Size Rules
  let teamSize = 1;
  if (name.includes('palu paku') || name.includes('palu sekali pukul') || name.includes('palu pukul')) teamSize = 5;
  else if (name.includes('toktak') || name.includes('tok-tak') || name.includes('tok tak')) teamSize = 2;
  else if (name.includes('voli tirai')) teamSize = 3;
  else if (name.includes('tarik tambang')) teamSize = 5;
  else if (name.includes('sarung') || name.includes('melambungkan bola')) teamSize = 1; // Berpasangan 2 orang/sarung

  // 2. Race / Session-based Games Detection (e.g. 15 participants divided into 3 sessions of 5)
  const isSessionGame = (
    name.includes('pindah bendera') ||
    name.includes('spon air') ||
    name.includes('spons air') ||
    name.includes('pindah bola') ||
    name.includes('makan kerupuk') ||
    name.includes('topeng kerucut') ||
    name.includes('keranjang kepala') ||
    name.includes('balap karung') ||
    name.includes('kelereng') ||
    name.includes('pensil') ||
    name.includes('spion') ||
    name.includes('melambungkan bola') ||
    name.includes('injak') ||
    name.includes('sarung')
  );

  return {
    teamSize,
    isSessionGame,
    defaultCapacity: 5 // Default participants/teams per session
  };
}

// Utility to helper group participants into teams
function buildTeamsFromParticipants(
  participants: Participant[] = [], 
  teamSize = 1,
  shouldShuffle = true
): Team[] {
  if (!participants || participants.length === 0) return [];
  
  // Acak peserta hanya jika diminta
  const participantList = shouldShuffle 
    ? [...participants].sort(() => Math.random() - 0.5)
    : participants;

  // If it's an individual competition, just return the shuffled list of participants as "teams" of 1
  if (teamSize <= 1) {
    // Untuk lomba perorangan, kita hanya perlu mengembalikan daftar yang sudah diacak
    return participantList.map((p, idx) => ({
      teamId: `team_indiv_${p.id || idx}`,
      teamName: p.nama,
      members: [p],
      isComplete: true,
      missingCount: 0,
      blokSummary: p.blok
    }));
  }

  const teams: Team[] = [];
  let currentMembers: Participant[] = [];
  let teamNumber = 1;

  participantList.forEach((p, index) => {
    currentMembers.push(p);

    if (currentMembers.length === teamSize || index === participants.length - 1) {
      const isComplete = currentMembers.length === teamSize;
      const missingCount = teamSize - currentMembers.length;
      const bloks = Array.from(new Set(currentMembers.map(m => m.blok))).join(', ');

      teams.push({
        teamId: `team_${teamNumber}`,
        teamName: `Tim ${teamNumber}`,
        members: [...currentMembers],
        isComplete,
        missingCount,
        blokSummary: bloks || '-'
      });

      teamNumber++;
      currentMembers = [];
    }
  });

  return teams;
}

// Helper to split array of items (teams/individuals) into sessions
function buildSessions(items: Team[] = [], perSession = 5): Session[] {
  if (!items || items.length === 0) return [];
  const validPerSession = Math.max(1, perSession);
  const sessions: Session[] = [];
  let currentSession: Team[] = [];
  let sessionNumber = 1;

  items.forEach((item, index) => {
    currentSession.push(item);

    if (currentSession.length === validPerSession || index === items.length - 1) {
      sessions.push({
        sessionId: `sesi_${sessionNumber}`,
        sessionName: `Sesi ${sessionNumber}`,
        items: [...currentSession],
        isFull: currentSession.length === validPerSession,
        count: currentSession.length
      });
      sessionNumber++;
      currentSession = [];
    }
  });

  return sessions;
}

// Utility to parse CSV text into JS objects safely handling quotes and commas
function parseCSV(text: string): Record<string, string>[] {
  const lines = [];
  let row = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      row.push(current.trim());
      current = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(current.trim());
      if (row.length > 0 && !(row.length === 1 && row[0] === '')) {
        lines.push(row);
      }
      row = [];
      current = '';
    } else {
      current += char;
    }
  }
  if (current || row.length > 0) {
    row.push(current.trim());
    lines.push(row);
  }

  if (lines.length < 2) return [];

  const headers = lines[0].map(h => h.trim().replace(/^"|"$/g, ''));
  const results: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i];
    if (values.length === 0 || (values.length === 1 && !values[0])) continue;
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] ? values[index].replace(/^"|"$/g, '') : '';
    });
    results.push(obj);
  }

  return results;
}

function formatWhatsApp(phoneStr: string): string {
  if (!phoneStr) return '-';
  let clean = phoneStr.replace(/\D/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  }
  return clean;
}

const SAMPLE_CSV = `Timestamp,Nama,Blok (Alamat Rumah),Nomor Whatsapp,Kategori,Lomba Bapa,Lomba Ibu,Lomba Anak 2-3 Tahun,Lomba Anak 4-6 Tahun,Lomba Anak 1-3 SD,Lomba Anak 4-6 SD,Lomba Anak 1-3 SMP,Dewasa
2026-08-01 08:00:00,Budi Santoso,A1/12,081234567891,Bapak,Toktak, Voli Tirai, Palu Paku Sekali Pukul, PES,,,,,,
2026-08-01 08:15:00,Ahmad Rifai,A2/05,081234567892,Bapak,Toktak, Palu Paku Sekali Pukul,,,,,,,
2026-08-01 08:30:00,Siti Aminah,A1/12,081234567893,Ibu,,Voli Tirai, Spon Air, Pindah Bendera,,,,,,
2026-08-01 09:00:00,Dewi Lestari,B3/08,081234567894,Ibu,,Voli Tirai, Spon Air, Pindah Bola,,,,,,
2026-08-01 09:20:00,Rian Hidayat,B1/02,081234567895,Anak 1-3 SD,,,,,,Makan Kerupuk, Pindah Bendera, PES,,
2026-08-01 09:40:00,Kevin Sanjaya,C2/10,081234567896,Anak 4-6 SD,,,,,,,PES, Masukkan Pensil Pakai Spion,
2026-08-01 10:00:00,Bambang Pamungkas,A3/01,081234567897,Bapak,Toktak, Palu Paku Sekali Pukul,,,,,,,
2026-08-01 10:10:00,Dedi Mulyadi,B2/11,081234567898,Bapak,Toktak, Palu Paku Sekali Pukul,,,,,,,
2026-08-01 10:30:00,Ratna Sari,C1/04,081234567899,Ibu,,Voli Tirai, Masukkan Air Topeng Kerucut,,,,,,
2026-08-01 10:45:00,Anisa Putri,A2/08,081234567800,Dewasa,,,,,,,,Masukkan Bola Di Keranjang Kepala, PES
2026-08-01 11:00:00,Randi Prasetya,C3/09,081234567801,Dewasa,,,,,,,,Masukkan Bola Di Keranjang Kepala, PES
2026-08-01 11:15:00,Eko Wijaya,B1/05,081234567802,Bapak,Toktak, Voli Tirai, Palu Paku Sekali Pukul,,,,,,
2026-08-01 11:30:00,Siska Kohl,A1/01,081234567803,Ibu,,Voli Tirai, Spon Air,,,,,,,
2026-08-01 11:45:00,Arief Muhammad,B3/02,081234567804,Bapak,Toktak, Voli Tirai, Palu Paku Sekali Pukul,,,,,,
2026-08-01 12:00:00,Lesti Kejora,A3/04,081234567805,Anak 1-3 SD,,,,,,Makan Kerupuk, Pindah Bendera,,
2026-08-01 12:15:00,Gilang Dirga,B2/04,081234567806,Anak 1-3 SD,,,,,,Makan Kerupuk, Pindah Bendera,,
2026-08-01 12:30:00,Raffi Ahmad,A1/09,081234567807,Anak 1-3 SD,,,,,,Makan Kerupuk, Pindah Bendera,,
2026-08-01 12:45:00,Nagita Slavina,A1/09,081234567808,Anak 1-3 SD,,,,,,Makan Kerupuk, Pindah Bendera,,
2026-08-01 13:00:00,Atta Halilintar,C1/01,081234567809,Anak 1-3 SD,,,,,,Makan Kerupuk, Pindah Bendera,,
2026-08-01 13:15:00,Aurel Hermansyah,C1/01,081234567810,Anak 1-3 SD,,,,,,Makan Kerupuk, Pindah Bendera,,
2026-08-01 13:30:00,Irphan Hakim,B3/10,081234567811,Anak 1-3 SD,,,,,,Makan Kerupuk, Pindah Bendera,,
2026-08-01 13:45:00,Denny Cagur,A2/15,081234567812,Anak 1-3 SD,,,,,,Makan Kerupuk, Pindah Bendera,,
2026-08-01 14:00:00,Sule Sutisna,B1/08,081234567813,Anak 1-3 SD,,,,,,Makan Kerupuk, Pindah Bendera,,
2026-08-01 14:15:00,Andre Taulany,A3/08,081234567814,Anak 1-3 SD,,,,,,Makan Kerupuk, Pindah Bendera,,
2026-08-01 14:30:00,Kaesang Pangarep,C2/02,081234567815,Anak 1-3 SD,,,,,,Makan Kerupuk, Pindah Bendera,,
2026-08-01 14:45:00,Erina Gudono,C2/02,081234567816,Anak 1-3 SD,,,, Mula, Melambungkan Bola Pakai Sarung,,
2026-08-01 15:00:00,Gibran Rakabuming,A1/03,081234567817,Anak 1-3 SD,,,, Melambungkan Bola Pakai Sarung,,
2026-08-01 15:15:00,Selvi Ananda,A1/03,081234567818,Anak 1-3 SD,,,, Melambungkan Bola Pakai Sarung,,
2026-08-01 15:30:00,Prabowo Subianto,C3/01,081234567819,Bapak,Palu Paku Sekali Pukul,,,,,,,,`;

export default function App() {
  const [rawParticipants, setRawParticipants] = useState<Participant[]>([]);
  const [groupedLombaMap, setGroupedLombaMap] = useState<GroupedLombaMap>({});
  const [selectedLombaKey, setSelectedLombaKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'peserta' | 'pembagian' | 'bagan' | 'master'>('peserta');

  // Search States
  const [searchLomba, setSearchLomba] = useState('');
  const [searchPeserta, setSearchPeserta] = useState('');
  const [searchMaster, setSearchMaster] = useState('');

  // State for team generation results
  const [generatedTeams, setGeneratedTeams] = useState<Team[]>([]);
  const [teamGenerationLombaKey, setTeamGenerationLombaKey] = useState<string | null>(null);

  type BracketWinnersMap = { [matchId: string]: Team };
  type SessionWinnersMap = { [sessionId: string]: Team[] };

  // Bracket Interactive State
  const [bracketLombaKey, setBracketLombaKey] = useState('');
  const [bracketWinners, setBracketWinners] = useState<BracketWinnersMap>({});
  const [shuffledBracketParticipants, setShuffledBracketParticipants] = useState<Participant[]>([]);
  const [attendance, setAttendance] = useState<Record<number, string>>({});
  
  // State untuk mengunci formasi tim
  const [isTeamFormationLocked, setIsTeamFormationLocked] = useState(false);
  const [lockedTeams, setLockedTeams] = useState<Team[] | null>(null);
  const [bracketZoom, setBracketZoom] = useState(100);
  
  // View Mode for Peserta Tab ('team' | 'individual')
  const [viewMode, setViewMode] = useState<'team' | 'individual'>('individual');

  // Competition Display Mode ('bracket' for Knockout Bracket | 'session' for Race/Session)
  const [competitionDisplayMode, setCompetitionDisplayMode] = useState<'bracket' | 'session'>('bracket');
  const [perSessionCapacity, setPerSessionCapacity] = useState(5);
  const [sessionWinners, setSessionWinners] = useState<SessionWinnersMap>({});

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load data from local storage on initial component mount
  useEffect(() => {
    async function loadInitialData() {
      const savedCSV = localStorage.getItem('dashboardLombaCSV');
      if (savedCSV) {
        processCSVContent(savedCSV);
        const savedAttendance = localStorage.getItem('dashboardLombaAttendance');
        if (savedAttendance) {
          try {
            setAttendance(JSON.parse(savedAttendance));
          } catch (e) { console.error("Gagal memuat data kehadiran.", e); }
        }
        showToast('Data terakhir berhasil dimuat dari penyimpanan lokal.');
      } else {
        try {
          const response = await fetch('/data-pendaftar.csv');
          if (!response.ok) throw new Error('Gagal mengambil data pendaftar awal.');
          const csvText = await response.text();
          processCSVContent(csvText);
          showToast('Berhasil memuat data pendaftar awal.');
        } catch (error) {
          console.error("Gagal memuat data CSV awal:", error);
        }
      }
    }
    loadInitialData();
  }, []);

  // Save attendance to local storage whenever it changes
  useEffect(() => {
    if (Object.keys(attendance).length > 0) {
      localStorage.setItem('dashboardLombaAttendance', JSON.stringify(attendance));
    }
  }, [attendance]);

  const handleZoomIn = () => {
    setBracketZoom(prev => Math.min(150, prev + 10));
  };

  const handleZoomOut = () => {
    setBracketZoom(prev => Math.max(50, prev - 10));
  };

  const handleResetZoom = () => {
    setBracketZoom(100);
  };

  function processCSVContent(csvString: string) {
    try {
      const parsedData = parseCSV(csvString);
      if (!parsedData || parsedData.length === 0) {
        showToast('File CSV tidak memiliki data valid.');
        return;
      }

      // Save to local storage on successful process
      localStorage.setItem('dashboardLombaCSV', csvString);

      const participants: Participant[] = [];
      const groupedMap: GroupedLombaMap = {};

      parsedData.forEach((row, index) => {
        // Extract fields dynamically
        const keys = Object.keys(row);
        const findField = (terms: string[]) => {
          const found = keys.find(k => terms.some(t => k.toLowerCase().includes(t.toLowerCase())));
          return found ? row[found] : '';
        };

        const nama = findField(['nama', 'name']);
        const blok = findField(['blok', 'alamat', 'rumah']);
        const wa = findField(['whatsapp', 'wa', 'telepon', 'hp', 'phone']);
        const kategori = findField(['kategori', 'category']);

        if (!nama || !nama.trim()) return;

        const participant: Participant = {
          id: index + 1,
          nama: nama.trim(),
          blok: blok ? blok.trim() : '-',
          wa: wa ? formatWhatsApp(wa) : '-',
          kategori: kategori ? kategori.trim() : 'Umum',
          daftarLomba: []
        };

        // Extract Lomba selections across columns
        keys.forEach(header => {
          const hLower = header.toLowerCase();
          const val = row[header];

          if ((hLower.includes('lomba') || hLower.includes('dewasa')) && val && val.trim() !== '') {
            const choices = val.split(',').map(s => s.trim()).filter(s => s !== '');
            choices.forEach(choice => {
              let categoryClean = header.replace(/^Lomba\s*/i, '').trim();
              let choiceName = choice;

              // Khusus Perlombaan PES / eFootball: Gabungkan Seluruh Kategori Usia
              const choiceLower = choice.toLowerCase();
              if (choiceLower.includes('pes') || choiceLower.includes('efootball') || choiceLower.includes('playstation')) {
                categoryClean = 'Semua Umur';
                choiceName = 'PES (Playstation)';
              }

              const fullLombaName = `${categoryClean}: ${choiceName}`;

              participant.daftarLomba.push(fullLombaName);

              if (!groupedMap[fullLombaName]) {
                groupedMap[fullLombaName] = {
                  categoryGroup: categoryClean,
                  lombaTitle: choiceName,
                  participants: []
                };
              }

              // Hindari duplikasi peserta jika terdaftar lebih dari sekali pada cabang PES
              const exists = groupedMap[fullLombaName].participants.some(p => p.id === participant.id);
              if (!exists) {
                groupedMap[fullLombaName].participants.push(participant);
              }
            });
          }
        });

        participants.push(participant);
      });

      setRawParticipants(participants);
      setGroupedLombaMap(groupedMap);

      const keys = Object.keys(groupedMap);
      if (keys.length > 0) {
        setSelectedLombaKey(keys[0]);
        setBracketLombaKey(keys[0]);
        setShuffledBracketParticipants(groupedMap[keys[0]].participants);
        
        // Auto set display mode based on game config
        const conf = getLombaConfig(groupedMap[keys[0]].lombaTitle, groupedMap[keys[0]].categoryGroup);
        setCompetitionDisplayMode(conf.isSessionGame ? 'session' : 'bracket');
      } else {
        setSelectedLombaKey(null);
        setBracketLombaKey('');
      }

      setBracketWinners({});
      setSessionWinners({});
      showToast(`Berhasil memuat ${participants.length} peserta!`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      showToast('Gagal memproses file CSV: ' + message);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result !== 'string') {
        showToast('File CSV tidak valid atau kosong.');
        return;
      }

      processCSVContent(result);
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    processCSVContent(SAMPLE_CSV);
  };

  const handleClearData = () => {
    localStorage.removeItem('dashboardLombaCSV');
    setRawParticipants([]);
    setGroupedLombaMap({});
    setSelectedLombaKey(null);
    setBracketLombaKey('');
    setBracketWinners({});
    setSessionWinners({});
    setAttendance({});
    setIsTeamFormationLocked(false);
    setLockedTeams(null);
    setSearchLomba('');
    showToast('Data berhasil dihapus dari penyimpanan.');
  };

  // Sync shuffled participants & auto switch display mode when bracket lomba selection changes
  useEffect(() => {
    if (bracketLombaKey && groupedLombaMap[bracketLombaKey]) {
      const currentLomba = groupedLombaMap[bracketLombaKey];
      const conf = getLombaConfig(currentLomba.lombaTitle, currentLomba.categoryGroup);
      
      // Use a batch update to avoid cascading renders
      queueMicrotask(() => {
        setShuffledBracketParticipants([...currentLomba.participants]);
        setBracketWinners({});
        setSessionWinners({});
        setCompetitionDisplayMode(conf.isSessionGame ? 'session' : 'bracket');
        setPerSessionCapacity(conf.defaultCapacity);
        setIsTeamFormationLocked(false); // Buka kunci saat ganti lomba
        setLockedTeams(null);
      });
    }
  }, [bracketLombaKey, groupedLombaMap]);

  const handleShuffleBracket = () => {
    if (!bracketLombaKey || !groupedLombaMap[bracketLombaKey]) return;
    const list = [...shuffledBracketParticipants];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    setShuffledBracketParticipants(list);
    setBracketWinners({});
    setSessionWinners({});
    // Jika tim sedang terkunci, buka kuncinya dan acak kembali
    if (isTeamFormationLocked) {
      setIsTeamFormationLocked(false);
      setLockedTeams(null);
    }
    showToast('Posisi peserta/tim berhasil diacak!');
  };

  const handleAttendanceChange = (participantId: number, value: string) => {
    setAttendance(prev => ({
      ...prev,
      [participantId]: value
    }));
  };

  const handleToggleLockTeams = () => {
    if (isTeamFormationLocked) {
      setIsTeamFormationLocked(false);
      setLockedTeams(null);
      showToast('Kunci pembagian tim dibuka. Tim akan diacak ulang.');
    } else {
      const currentTeams = buildTeamsFromParticipants(shuffledBracketParticipants, getLombaConfig(groupedLombaMap[bracketLombaKey]?.lombaTitle, groupedLombaMap[bracketLombaKey]?.categoryGroup).teamSize, false);
      setLockedTeams(currentTeams);
      setIsTeamFormationLocked(true);
      showToast('Pembagian anggota tim telah dikunci!');
    }
  };

  const handleGenerateTeams = () => {
    if (!selectedLombaKey || !groupedLombaMap[selectedLombaKey]) return;
    const currentLomba = groupedLombaMap[selectedLombaKey];
    const conf = getLombaConfig(currentLomba.lombaTitle, currentLomba.categoryGroup);
    const teams = buildTeamsFromParticipants(currentLomba.participants, conf.teamSize, true);
    
    setGeneratedTeams(teams);
    setTeamGenerationLombaKey(selectedLombaKey);
    setActiveTab('pembagian');
    showToast(`Berhasil membagi ${teams.length} tim untuk ${currentLomba.lombaTitle}.`);
  };

  const handleProcessToBracket = () => {
    setBracketLombaKey(teamGenerationLombaKey || '');
    setActiveTab('bagan');
  };

  // Calculate Summary Metrics
  const metrics = useMemo(() => {
    const totalPeserta = rawParticipants.length;
    const totalLomba = Object.keys(groupedLombaMap).length;
    let totalPartisipasi = 0;
    Object.values(groupedLombaMap).forEach(g => totalPartisipasi += g.participants.length);
    const totalBlok = new Set(rawParticipants.map(p => p.blok).filter(b => b !== '-')).size;
    return { totalPeserta, totalLomba, totalPartisipasi, totalBlok };
  }, [rawParticipants, groupedLombaMap]);

  // Filtered Lomba List for Sidebar
  const filteredLombaKeys = useMemo(() => {
    return Object.keys(groupedLombaMap).filter(key => 
      key.toLowerCase().includes(searchLomba.toLowerCase()) ||
      groupedLombaMap[key].lombaTitle.toLowerCase().includes(searchLomba.toLowerCase())
    );
  }, [groupedLombaMap, searchLomba]);

  // Export current lomba to CSV
  const exportLombaCSV = () => {
    if (!selectedLombaKey || !groupedLombaMap[selectedLombaKey]) return;
    const item = groupedLombaMap[selectedLombaKey];
    
    let csvContent = "data:text/csv;charset=utf-8,No,Nama Peserta,Blok,Nomor WhatsApp,Kategori\n";
    item.participants.forEach((p, idx) => {
      csvContent += `${idx + 1},"${p.nama}","${p.blok}","${p.wa}","${p.kategori}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Peserta_${item.categoryGroup}_${item.lombaTitle}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV berhasil diunduh!');
  };

  const renderSessionView = () => {
    if (!bracketLombaKey || !groupedLombaMap[bracketLombaKey]) return null;

    const currentLomba = groupedLombaMap[bracketLombaKey];
    const conf = getLombaConfig(currentLomba.lombaTitle, currentLomba.categoryGroup);
    const rawList = shuffledBracketParticipants;
    
    const items = isTeamFormationLocked && lockedTeams 
      ? lockedTeams 
      : buildTeamsFromParticipants(rawList, conf.teamSize, !isTeamFormationLocked);

    if (items.length === 0) {
      return (
        <div className="text-center py-12 text-slate-400">
          <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-semibold">Belum ada peserta terdaftar untuk lomba ini.</p>
        </div>
      );
    }

    const sessions = buildSessions(items, perSessionCapacity);

    // Toggle Session Winner Selection
    const toggleSessionWinner = (sessionId: string, item: Team) => {
      setSessionWinners(prev => {
        const currentWinners = prev[sessionId] || [];
        const exists = currentWinners.some(w => w.teamId === item.teamId || w.teamName === item.teamName);
        let updated;
        if (exists) {
          updated = currentWinners.filter(w => w.teamId !== item.teamId && w.teamName !== item.teamName);
        } else {
          updated = [...currentWinners, item];
        }
        return { ...prev, [sessionId]: updated };
      });
    };

    // Gather all winners into Final Session
    const allSessionWinners = Object.values(sessionWinners).flat();

    return (
      <div className="w-full py-2">
        {/* Session Rule Banner */}
        <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="font-extrabold text-amber-950 text-sm">
                Skema Sesi / Gelombang: {currentLomba.lombaTitle}
              </p>
              <p className="text-amber-800 mt-0.5">
                Total <strong>{items.length} {conf.teamSize > 1 ? 'Tim' : 'Peserta'}</strong> terbagi menjadi <strong>{sessions.length} Sesi Pertandingan</strong> ({perSessionCapacity} {conf.teamSize > 1 ? 'Tim' : 'Peserta'}/sesi).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto bg-white p-1.5 rounded-xl border border-amber-200">
            <span className="font-bold text-amber-900 text-[11px] px-1">Kapasitas Sesi:</span>
            {[3, 4, 5, 6, 8].map(cap => (
              <button
                key={cap}
                onClick={() => setPerSessionCapacity(cap)}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs transition ${
                  perSessionCapacity === cap ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cap}
              </button>
            ))}
          </div>
        </div>

        {/* Sessions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => {
            const winnersInThisSession = sessionWinners[session.sessionId] || [];

            return (
              <div key={session.sessionId} className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm hover:border-amber-400 transition flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                    <span className="font-black text-sm text-slate-800 flex items-center gap-2">
                      <span className="w-6 h-6 bg-amber-100 text-amber-800 rounded-lg flex items-center justify-center text-xs">
                        {session.sessionName.replace('Sesi ', '')}
                      </span>
                      {session.sessionName}
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                      {session.count} {conf.teamSize > 1 ? 'Tim' : 'Peserta'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {session.items.map((item, idx) => {
                      const isWinner = winnersInThisSession.some(w => w.teamId === item.teamId || w.teamName === item.teamName);

                      return (
                        <div
                          key={item.teamId}
                          onClick={() => toggleSessionWinner(session.sessionId, item)}
                          className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between text-xs ${
                            isWinner
                              ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <p className="truncate font-extrabold flex items-center gap-1.5">
                              <span>{idx + 1}. {item.teamName}</span>
                              {!item.isComplete && (
                                <span className="bg-amber-300 text-amber-950 text-[9px] px-1 rounded font-normal">
                                  Kurang {item.missingCount}
                                </span>
                              )}
                            </p>
                            {item.members && item.members.length > 0 && (
                              <p className={`text-[10px] mt-0.5 truncate ${isWinner ? 'text-emerald-100 font-normal' : 'text-slate-500'}`}>
                                {item.members.map(m => m.nama).join(', ')}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                              isWinner ? 'bg-emerald-600 text-white' : 'bg-white border text-slate-500'
                            }`}>
                              {item.blokSummary}
                            </span>
                            {isWinner && <Crown className="w-4 h-4 text-amber-300 animate-pulse ml-1" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400 italic text-center">
                  Klik nama untuk memilih/batal pemenang yang lolos ke Final.
                </div>
              </div>
            );
          })}
        </div>

        {/* Final Session / Champion Showcase */}
        <div className="mt-8 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
                <Crown className="w-10 h-10 text-amber-100 animate-bounce" />
              </div>
              <div>
                <span className="bg-amber-900/40 text-amber-100 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  BABAK PENENTUAN / SESI FINAL
                </span>
                <h3 className="text-xl font-black mt-1">Finalis Lolos dari Tiap Sesi ({allSessionWinners.length} Finalis)</h3>
                <p className="text-amber-100 text-xs mt-0.5">Pemenang yang terpilih dari setiap sesi pertandingan akan bertanding di sesi penutup ini.</p>
              </div>
            </div>

            {allSessionWinners.length > 0 ? (
              <div className="flex flex-wrap gap-2 max-w-md justify-center md:justify-end">
                {allSessionWinners.map((winner, idx) => (
                  <span key={idx} className="bg-white text-amber-950 font-bold text-xs px-3 py-1.5 rounded-xl shadow flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-600" /> {winner.teamName} ({winner.blokSummary})
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-center md:text-right text-xs text-amber-100 italic bg-amber-700/30 px-4 py-2 rounded-xl border border-amber-400/30">
                Belum ada pemenang sesi terpilih. Klik nama peserta/tim di atas untuk memasukkan ke Sesi Final.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderBracketView = () => {
    if (!bracketLombaKey || !groupedLombaMap[bracketLombaKey]) {
      return (
        <div className="text-center py-12 text-slate-400">
          <Trophy className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-semibold">Silakan pilih cabang lomba terlebih dahulu.</p>
        </div>
      );
    }

    const currentLomba = groupedLombaMap[bracketLombaKey];
    const conf = getLombaConfig(currentLomba.lombaTitle, currentLomba.categoryGroup);
    const teamSize = conf.teamSize;
    const rawList = shuffledBracketParticipants;

    // Prioritaskan tim dari tab "Pembagian Tim", lalu tim yang dikunci, terakhir buat baru
    const teams = teamGenerationLombaKey === bracketLombaKey && generatedTeams.length > 0
      ? generatedTeams
      : isTeamFormationLocked && lockedTeams ? lockedTeams
      : buildTeamsFromParticipants(rawList, teamSize, !isTeamFormationLocked);

    if (teams.length < 2) {
      return (
        <div className="text-center py-12 text-slate-400">
          <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-semibold">Minimal dibutuhkan 2 {teamSize > 1 ? 'Tim' : 'Peserta'} untuk membuat bagan pertandingan.</p>
          <p className="text-xs text-slate-400 mt-1">Saat ini baru ada {teams.length} {teamSize > 1 ? 'Tim' : 'Peserta'} ({rawList.length} pendaftar).</p>
        </div>
      );
    }

    // Bracket Size Calculation (Next power of 2: 2, 4, 8, 16...)
    const n = teams.length;
    let bracketSize = 2;
    while (bracketSize < n) {
      bracketSize *= 2;
    }

    const slots = [];
    for (let i = 0; i < bracketSize; i++) {
      if (i < n) {
        slots.push(teams[i]);
      } else {
        slots.push({
          teamId: `bye_${i}`,
          teamName: 'BYE (Lolos Otomatis)',
          members: [],
          isComplete: true,
          isBye: true,
          blokSummary: '-'
        });
      }
    }

    const totalRounds = Math.log2(bracketSize);
    const rounds = [];

    // Construct Rounds Data
    for (let r = 1; r <= totalRounds; r++) { // NOSONAR
      const matchesInRound = bracketSize / Math.pow(2, r);
      const roundMatches = [];

      for (let m = 0; m < matchesInRound; m++) {
        const matchId = `r${r}_m${m}`;

        if (r === 1) {
          const t1 = slots[m * 2];
          const t2 = slots[m * 2 + 1];

          // Auto-advance if opponent is BYE
          let autoWinner = null;
          if (t2.isBye && !t1.isBye) autoWinner = t1;
          else if (t1.isBye && !t2.isBye) autoWinner = t2;

          roundMatches.push({
            id: matchId,
            p1: t1,
            p2: t2,
            winner: bracketWinners[matchId] || autoWinner
          });
        } else {
          // Get winners from previous round
          const prevMatchId1 = `r${r - 1}_m${m * 2}`;
          const prevMatchId2 = `r${r - 1}_m${m * 2 + 1}`;

          const t1 = bracketWinners[prevMatchId1] || { teamName: `Pemenang Match ${m * 2 + 1}`, blokSummary: 'TBD', members: [] };
          const t2 = bracketWinners[prevMatchId2] || { teamName: `Pemenang Match ${m * 2 + 2}`, blokSummary: 'TBD', members: [] };

          roundMatches.push({
            id: matchId,
            p1: t1,
            p2: t2,
            winner: bracketWinners[matchId] || null
          });
        }
      }

      rounds.push({ roundIndex: r, matches: roundMatches });
    }

    const selectWinner = (matchId: string, team: Team) => {
      if (team.isBye || team.teamName.includes('Pemenang Match')) return;
      setBracketWinners(prev => ({
        ...prev,
        [matchId]: team
      }));
    };

    const finalMatchId = `r${totalRounds}_m0`;
    const champion = bracketWinners[finalMatchId];

    return (
      <div className="w-full py-2">
        {/* Team Format Status Notice */}
        {teamSize > 1 && (
          <div className="mb-4 max-w-2xl mx-auto bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between gap-3 text-xs text-blue-900 print:hidden">
            <div className="flex items-center gap-2">
              <Users2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>
                <strong>Format Lomba Tim:</strong> {currentLomba.lombaTitle} (1 Tim = {teamSize} Orang). Total {teams.length} Tim terbentuk.
              </span>
            </div>
            {teams.some(t => !t.isComplete) && (
              <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded flex items-center gap-1 text-[11px]">
                <AlertTriangle className="w-3 h-3" /> Ada Tim Kurang Anggota
              </span>
            )}
          </div>
        )}

        {/* Scrollable & Zoomable Viewport */}
        <div className="w-full overflow-auto max-h-[75vh] border border-slate-200 rounded-2xl bg-slate-50/50 p-4 sm:p-6 shadow-inner">
          <div 
            style={{ 
              zoom: `${bracketZoom}%`,
            } as any}
            className="inline-flex items-center space-x-8 min-w-max py-4 px-2 transition-all duration-150 ease-out"
          >
            {rounds.map((round) => {
              const isFinal = round.roundIndex === totalRounds;
              const isSemi = round.roundIndex === totalRounds - 1 && totalRounds > 1;
              const roundTitle = isFinal ? 'BABAK FINAL' : isSemi ? 'SEMI FINAL' : `BABAK ${round.roundIndex}`;

              return (
                <div key={round.roundIndex} className="flex flex-col justify-around h-full space-y-6">
                  <div className="text-center font-extrabold text-xs text-red-600 bg-red-50 border border-red-100 py-1 px-3 rounded-full uppercase tracking-wider shadow-sm">
                    {roundTitle}
                  </div>
                  <div className="flex flex-col justify-around flex-1 space-y-8">
                    {round.matches.map((match) => {
                      return (
                        <div key={match.id} className="bg-white border-2 border-slate-200 rounded-xl p-2.5 w-64 shadow-sm relative">
                          {/* Team / Participant 1 */}
                          <button
                            onClick={() => selectWinner(match.id, match.p1)}
                            disabled={match.p1.isBye}
                            className={`w-full flex flex-col text-xs p-2 rounded-lg font-bold transition text-left ${
                              match.p1.isBye 
                                ? 'bg-slate-50 text-slate-400 italic cursor-not-allowed'
                                : match.winner?.teamId === match.p1.teamId || match.winner?.teamName === match.p1.teamName 
                                  ? 'bg-emerald-500 text-white shadow-sm' 
                                  : 'text-slate-800 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex justify-between items-center w-full">
                              <span className="truncate flex items-center gap-1">
                                {match.p1.teamName}
                                {!match.p1.isComplete && !match.p1.isBye && (
                                  <span className="text-[9px] bg-amber-400 text-amber-950 px-1 rounded font-normal">
                                    Kurang {match.p1.missingCount}
                                  </span>
                                )}
                              </span>
                              <span className={`text-[10px] font-normal px-1.5 py-0.5 rounded ${
                                match.winner?.teamId === match.p1.teamId ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {match.p1.blokSummary}
                              </span>
                            </div>
                            {match.p1.members && match.p1.members.length > 0 && (
                              <p className={`text-[10px] font-normal mt-0.5 line-clamp-2 ${
                                match.winner?.teamId === match.p1.teamId ? 'text-emerald-100' : 'text-slate-500'
                              }`}>
                                Anggota: {match.p1.members.map(m => m.nama).join(', ')}
                              </p>
                            )}
                          </button>

                          <div className="my-1 border-t border-slate-100"></div>

                          {/* Team / Participant 2 */}
                          <button
                            onClick={() => selectWinner(match.id, match.p2)}
                            disabled={match.p2.isBye}
                            className={`w-full flex flex-col text-xs p-2 rounded-lg font-bold transition text-left ${
                              match.p2.isBye 
                                ? 'bg-slate-50 text-slate-400 italic cursor-not-allowed'
                                : match.winner?.teamId === match.p2.teamId || match.winner?.teamName === match.p2.teamName 
                                  ? 'bg-emerald-500 text-white shadow-sm' 
                                  : 'text-slate-800 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex justify-between items-center w-full">
                              <span className="truncate flex items-center gap-1">
                                {match.p2.teamName}
                                {!match.p2.isComplete && !match.p2.isBye && (
                                  <span className="text-[9px] bg-amber-400 text-amber-950 px-1 rounded font-normal">
                                    Kurang {match.p2.missingCount}
                                  </span>
                                )}
                              </span>
                              <span className={`text-[10px] font-normal px-1.5 py-0.5 rounded ${
                                match.winner?.teamId === match.p2.teamId ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {match.p2.blokSummary}
                              </span>
                            </div>
                            {match.p2.members && match.p2.members.length > 0 && (
                              <p className={`text-[10px] font-normal mt-0.5 line-clamp-2 ${
                                match.winner?.teamId === match.p2.teamId ? 'text-emerald-100' : 'text-slate-500'
                              }`}>
                                Anggota: {match.p2.members.map(m => m.nama).join(', ')}
                              </p>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Champion Trophy Display */}
            <div className="flex flex-col justify-center items-center pl-4">
              <div className={`border-2 rounded-2xl p-5 w-56 text-center shadow-lg transition-all ${
                champion ? 'bg-amber-500 border-amber-400 text-white scale-105' : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}>
                <Trophy className={`w-10 h-10 mx-auto mb-2 ${champion ? 'text-amber-100 animate-bounce' : 'text-amber-500'}`} />
                <p className="text-xs font-black uppercase tracking-wider">JUARA 1</p>
                <p className="text-sm font-extrabold mt-1 truncate">
                  {champion ? champion.teamName : 'Pemenang Final'}
                </p>
                {champion && champion.members && champion.members.length > 0 && (
                  <div className="mt-2 text-[10px] bg-amber-600/30 p-1.5 rounded-lg border border-amber-400/40 text-amber-50">
                    <p className="font-semibold">Anggota Tim:</p>
                    <p className="opacity-90">{champion.members.map(m => m.nama).join(', ')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 flex flex-col font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white shadow-lg print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white text-red-700 rounded-2xl flex items-center justify-center font-black text-2xl shadow-md border-2 border-red-200">
                🇮🇩
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Panitia HUT RI - Green Hill 2026</h1>
                <p className="text-red-100 text-xs sm:text-sm font-medium">Pengelompokan Peserta, Sesi Gelombang & Bagan Pertandingan</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleLoadSample}
                className="px-3.5 py-2 bg-red-800/90 hover:bg-red-900 text-xs font-semibold rounded-xl transition border border-red-500/30 flex items-center gap-1.5 shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Muat Contoh Data
              </button>
              <label className="px-4 py-2 bg-white text-red-700 hover:bg-red-50 text-xs sm:text-sm font-bold rounded-xl cursor-pointer transition shadow flex items-center gap-2 border border-red-100">
                <Upload className="w-4 h-4" /> Unggah File CSV
                <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
              </label>
              {rawParticipants.length > 0 && (
                <button
                  onClick={handleClearData}
                  className="px-3.5 py-2 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-semibold rounded-xl transition border border-red-200 flex items-center gap-1.5 shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus Data Tersimpan
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Upload Alert Notice */}
        {rawParticipants.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm print:hidden">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold">Silakan Unggah File CSV Pendaftaran Anda</p>
                <p className="text-xs text-amber-700">{`Mendukung file ekspor dari Google Form atau Excel. Klik "Muat Contoh Data" untuk simulasi cepat.`}</p>
              </div>
            </div>
            <label className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl cursor-pointer transition shadow flex items-center gap-1.5 whitespace-nowrap">
              <Upload className="w-3.5 h-3.5" /> Pilih CSV
              <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        )}

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 print:hidden">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Pendaftar</p>
              <h3 className="text-2xl font-extrabold text-slate-800">{metrics.totalPeserta}</h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Cabang Lomba</p>
              <h3 className="text-2xl font-extrabold text-slate-800">{metrics.totalLomba}</h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <ListFilter className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Partisipasi</p>
              <h3 className="text-2xl font-extrabold text-slate-800">{metrics.totalPartisipasi}</h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Home className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Rumah / Blok</p>
              <h3 className="text-2xl font-extrabold text-slate-800">{metrics.totalBlok}</h3>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 mb-6 flex space-x-2 print:hidden overflow-x-auto">
          <button
            onClick={() => setActiveTab('peserta')}
            className={`py-3 px-5 font-bold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'peserta'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ListFilter className="w-4 h-4" /> Daftar Per Lomba
          </button>
          <button
            onClick={() => setActiveTab('pembagian')}
            className={`py-3 px-5 font-bold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'pembagian'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users2 className="w-4 h-4" /> Hasil Pembagian Tim
          </button>
          <button
            onClick={() => setActiveTab('bagan')}
            className={`py-3 px-5 font-bold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'bagan'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Trophy className="w-4 h-4" /> Pembuat Bagan & Sesi
          </button>
          <button
            onClick={() => setActiveTab('master')}
            className={`py-3 px-5 font-bold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'master'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" /> Semua Master Data
          </button>
        </div>

        {/* TAB BARU: HASIL PEMBAGIAN TIM */}
        {activeTab === 'pembagian' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            {teamGenerationLombaKey && groupedLombaMap[teamGenerationLombaKey] ? (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4 mb-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-800">Hasil Pembagian Tim</h2>
                    <p className="text-sm font-semibold text-red-600">{groupedLombaMap[teamGenerationLombaKey].lombaTitle}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Total <strong>{generatedTeams.length} tim</strong> telah dibentuk secara acak. Klik "Acak Ulang" untuk hasil berbeda atau "Proses ke Bagan" jika sudah final.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleGenerateTeams}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-slate-200"
                    >
                      <Shuffle className="w-4 h-4" /> Acak Ulang
                    </button>
                    <button
                      onClick={handleProcessToBracket}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition shadow-md flex items-center gap-2"
                    >
                      <Trophy className="w-4 h-4" /> Proses ke Bagan
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {generatedTeams.map((t) => (
                    <div key={t.teamId} className={`border rounded-2xl p-4 shadow-sm relative ${
                      t.isComplete ? 'bg-white border-slate-200' : 'bg-amber-50/50 border-amber-200'
                    }`}>
                      <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100">
                        <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                          {t.teamName}
                          {!t.isComplete && (
                            <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                              Kurang {t.missingCount} Orang
                            </span>
                          )}
                        </h3>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
                          Blok: {t.blokSummary}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {t.members.map((m, idx) => (
                          <div key={m.id} className="text-xs bg-slate-50 p-2 rounded-xl">
                            <p className="font-bold text-slate-800">{idx + 1}. {m.nama}</p>
                            <p className="text-[10px] text-slate-500">Blok: {m.blok}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-center py-12 text-slate-400">Pilih lomba dan klik "Bagi Tim" untuk melihat hasilnya di sini.</p>
            )}
          </div>
        )}

        {/* TAB 1: DAFTAR PER LOMBA */}
        {activeTab === 'peserta' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Lomba */}
            <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm h-fit print:hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Pilih Lomba</span>
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">
                  {filteredLombaKeys.length}
                </span>
              </div>

              <div className="relative mb-3">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari lomba..."
                  value={searchLomba}
                  onChange={(e) => setSearchLomba(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                {filteredLombaKeys.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-2">Belum ada lomba terdaftar.</p>
                ) : (
                  filteredLombaKeys.map((key) => {
                    const item = groupedLombaMap[key];
                    const isSelected = key === selectedLombaKey;
                    const conf = getLombaConfig(item.lombaTitle, item.categoryGroup);

                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedLombaKey(key)}
                        className={`w-full text-left p-3 rounded-xl transition flex items-center justify-between text-xs font-semibold ${
                          isSelected
                            ? 'bg-red-50 text-red-700 border border-red-200 shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <p className="truncate font-bold flex items-center gap-1.5">
                            {item.lombaTitle}
                            {conf.teamSize > 1 && (
                              <span className="bg-blue-100 text-blue-700 text-[9px] px-1.5 py-0.2 rounded font-extrabold">
                                {conf.teamSize} Org/Tim
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-400 font-normal">{item.categoryGroup}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isSelected ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {item.participants.length}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Selected Lomba Content */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm print:border-0">
                {selectedLombaKey && groupedLombaMap[selectedLombaKey] ? (
                  <>
                    {/* Header Details */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4 mb-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="inline-block px-2.5 py-0.5 bg-red-100 text-red-700 font-bold text-xs rounded-full">
                            {groupedLombaMap[selectedLombaKey].categoryGroup}
                          </span>
                          {groupedLombaMap[selectedLombaKey].categoryGroup === 'Semua Umur' && (
                            <span className="inline-block px-2.5 py-0.5 bg-purple-100 text-purple-800 font-extrabold text-xs rounded-full">
                              🎮 Gabungan Semua Kategori Usia
                            </span>
                          )}
                          {getLombaConfig(groupedLombaMap[selectedLombaKey].lombaTitle, groupedLombaMap[selectedLombaKey].categoryGroup).teamSize > 1 && (
                            <span className="inline-block px-2.5 py-0.5 bg-blue-100 text-blue-800 font-extrabold text-xs rounded-full">
                              Lomba Tim ({getLombaConfig(groupedLombaMap[selectedLombaKey].lombaTitle, groupedLombaMap[selectedLombaKey].categoryGroup).teamSize} Orang / Tim)
                            </span>
                          )}
                          {getLombaConfig(groupedLombaMap[selectedLombaKey].lombaTitle, groupedLombaMap[selectedLombaKey].categoryGroup).isSessionGame && (
                            <span className="inline-block px-2.5 py-0.5 bg-amber-100 text-amber-900 font-extrabold text-xs rounded-full">
                              Lomba Sesi / Gelombang
                            </span>
                          )}
                        </div>
                        <h2 className="text-xl font-extrabold text-slate-800">
                          {groupedLombaMap[selectedLombaKey].lombaTitle}
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Total Pendaftar: {groupedLombaMap[selectedLombaKey].participants.length} Orang
                        </p>
                {getLombaConfig(groupedLombaMap[selectedLombaKey].lombaTitle, groupedLombaMap[selectedLombaKey].categoryGroup).teamSize > 1 && (
                  <button
                    onClick={handleGenerateTeams}
                    className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition shadow-md flex items-center gap-2"
                  >
                    <Users2 className="w-5 h-5" />
                    Bagi Tim & Lihat Hasil
                  </button>
                )}
                      </div>

                      <div className="flex items-center gap-2 print:hidden">
                        <button
                          onClick={exportLombaCSV}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-600" /> Export CSV
                        </button>
                        <button
                          onClick={() => window.print()}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition shadow flex items-center gap-1.5"
                        >
                          <Printer className="w-3.5 h-3.5" /> Cetak PDF
                        </button>
                      </div>
                    </div>

                    {/* Team Formation Banner */}
                    {(() => {
                      const conf = getLombaConfig(
                        groupedLombaMap[selectedLombaKey].lombaTitle,
                        groupedLombaMap[selectedLombaKey].categoryGroup
                      );
                      const participants = groupedLombaMap[selectedLombaKey].participants;
                      const teams = buildTeamsFromParticipants(participants, conf.teamSize);

                      if (conf.teamSize > 1) {
                        const incompleteTeam = teams.find(t => !t.isComplete);
                        return (
                          <div className="mb-4 space-y-3 print:hidden">
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-700 flex items-center gap-2">
                                <Users2 className="w-4 h-4 text-blue-600" /> Ketentuan Tim: {conf.teamSize} orang per tim.
                                Otomatis terbagi menjadi <strong>{teams.length} Tim</strong>.
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setViewMode('team')}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                                    viewMode === 'team' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border'
                                  }`}
                                >
                                  Tampilan Tim
                                </button>
                                <button
                                  onClick={() => setViewMode('individual')}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                                    viewMode === 'individual' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border'
                                  }`}
                                >
                                  Tampilan Perorangan
                                </button>
                              </div>
                            </div>

                            {incompleteTeam && (
                              <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl flex items-center gap-2 text-xs font-medium shadow-sm">
                                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                <div>
                                  <strong>Perhatian Anggota Kurang:</strong> {incompleteTeam.teamName} saat ini baru terisi <strong>{incompleteTeam.members.length} dari {conf.teamSize} orang</strong> (Kurang {incompleteTeam.missingCount} orang).
                                  <span className="block text-[11px] text-amber-700 mt-0.5">Panitia dapat mengisikan pendaftar susulan atau menggabungkan anggota antar blok.</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Search inside selected lomba */}
                    <div className="mb-4 print:hidden">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Cari nama peserta / blok..."
                          value={searchPeserta}
                          onChange={(e) => setSearchPeserta(e.target.value)}
                          className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                    </div>

                    {/* Table View Mode Switch (Team vs Individual) */}
                    {(() => {
                      const conf = getLombaConfig(
                        groupedLombaMap[selectedLombaKey].lombaTitle,
                        groupedLombaMap[selectedLombaKey].categoryGroup
                      );
                      const participants = groupedLombaMap[selectedLombaKey].participants;
                      const teams = buildTeamsFromParticipants(participants, conf.teamSize);
                      if (conf.teamSize > 1 && viewMode === 'team') {
                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {buildTeamsFromParticipants(participants, conf.teamSize)
                              .filter(t => 
                                t.teamName.toLowerCase().includes(searchPeserta.toLowerCase()) ||
                                t.members.some(m => m.nama.toLowerCase().includes(searchPeserta.toLowerCase())))
                              .map((t) => (
                              <div key={t.teamId} className={`border rounded-2xl p-4 shadow-sm relative ${
                                t.isComplete ? 'bg-white border-slate-200' : 'bg-amber-50/50 border-amber-200'
                              }`}>
                                <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100">
                                  <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                                    {t.teamName}
                                    {!t.isComplete && (
                                      <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                                        Kurang {t.missingCount} Orang
                                      </span>
                                    )}
                                  </h3>
                                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
                                    Blok: {t.blokSummary}
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  {t.members.map((m, idx) => (
                                    <div key={m.id} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-xl">
                                      <div>
                                        <p className="font-bold text-slate-800">{idx + 1}. {m.nama}</p>
                                        <p className="text-[10px] text-slate-500">Blok: {m.blok} • {m.kategori}</p>
                                      </div>
                                      {m.wa !== '-' && (
                                        <a
                                          href={`https://wa.me/${m.wa}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-emerald-600 text-[11px] font-bold hover:underline flex items-center gap-1"
                                        >
                                          <MessageCircle className="w-3 h-3" /> WA
                                        </a>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      }

                      return (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs text-slate-600">
                            <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200">
                              <tr>
                                <th className="py-3 px-3 w-12 text-center">No</th>
                                <th className="py-3 px-3">Nama Peserta</th>
                                <th className="py-3 px-3">Blok / Rumah</th>
                                <th className="py-3 px-3">WhatsApp</th>
                                <th className="py-3 px-3">Kategori</th>
                                <th className="py-3 px-3 w-24 text-center">Keterangan Hadir</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {participants
                                .slice() // Buat salinan untuk diurutkan tanpa mengubah data asli
                                .sort((a, b) => {
                                  const parseBlok = (blok: string) => {
                                    const match = blok.match(/^([A-Z]+)(\d+.*)$/i);
                                    if (!match) return { letter: blok.toLowerCase(), numbers: [] };

                                    const letterPart = match[1].toLowerCase();
                                    const numberParts = match[2].split(/[\/-]/).map(n => parseInt(n, 10)).filter(n => !isNaN(n));
                                    
                                    return { letter: letterPart, numbers: numberParts };
                                  };

                                  const blokA = parseBlok(a.blok);
                                  const blokB = parseBlok(b.blok);

                                  if (blokA.letter < blokB.letter) return -1;
                                  if (blokA.letter > blokB.letter) return 1;

                                  for (let i = 0; i < Math.min(blokA.numbers.length, blokB.numbers.length); i++) {
                                    if (blokA.numbers[i] !== blokB.numbers[i]) return blokA.numbers[i] - blokB.numbers[i];
                                  }
                                  return blokA.numbers.length - blokB.numbers.length;
                                })
                                .filter(p => 
                                  p.nama.toLowerCase().includes(searchPeserta.toLowerCase()) ||
                                  p.blok.toLowerCase().includes(searchPeserta.toLowerCase())
                                )
                                .map((p, i) => (
                                  <tr key={p.id} className="hover:bg-slate-50 transition">
                                    <td className="py-3 px-3 text-center font-bold text-slate-400">{i + 1}</td>
                                    <td className="py-3 px-3 font-bold text-slate-800">{p.nama}</td>
                                    <td className="py-3 px-3">
                                      <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200 font-medium">
                                        {p.blok}
                                      </span>
                                    </td>
                                    <td className="py-3 px-3">
                                      {p.wa !== '-' ? (
                                        <a
                                          href={`https://wa.me/${p.wa}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 text-emerald-600 font-semibold hover:underline"
                                        >
                                          <MessageCircle className="w-3.5 h-3.5" /> {p.wa}
                                        </a>
                                      ) : '-'}
                                    </td>
                                    <td className="py-3 px-3 text-slate-500">{p.kategori}</td>
                                    <td className="py-3 px-3 text-center">
                                      <input 
                                        type="text"
                                        value={attendance[p.id] || ''}
                                        onChange={(e) => handleAttendanceChange(p.id, e.target.value)}
                                        placeholder="Hadir/Izin/Sakit"
                                        className="w-24 text-center text-xs p-1 border border-slate-300 rounded-md focus:ring-1 focus:ring-red-500 focus:border-red-500 transition"
                                      />
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}

                  </>
                ) : (
                  <div className="text-center py-16 text-slate-400">
                    <ListFilter className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm font-semibold">Pilih cabang lomba dari panel sebelah kiri.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BAGAN & SESI PERTANDINGAN */}
        {activeTab === 'bagan' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 print:border-0">
            {/* Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4 mb-6 print:hidden">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800">Skema & Layout Pertandingan</h2>
                <p className="text-xs text-slate-500">
                  Dapat disesuaikan dalam mode <strong>Bagan Gugur (Knockout)</strong> atau <strong>Pembagian Sesi / Gelombang (Heat)</strong>.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={bracketLombaKey}
                  onChange={(e) => setBracketLombaKey(e.target.value)}
                  className="text-xs font-semibold px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                >
                  {Object.keys(groupedLombaMap).map(key => (
                    <option key={key} value={key}>
                      {groupedLombaMap[key].categoryGroup} - {groupedLombaMap[key].lombaTitle} ({groupedLombaMap[key].participants.length} org)
                    </option>
                  ))}
                </select>

                {/* Switch Mode: Bracket vs Session */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                  <button
                    onClick={() => setCompetitionDisplayMode('bracket')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                      competitionDisplayMode === 'bracket' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Trophy className="w-3.5 h-3.5" /> Bagan Gugur
                  </button>
                  <button
                    onClick={() => setCompetitionDisplayMode('session')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                      competitionDisplayMode === 'session' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" /> Pembagian Sesi
                  </button>
                </div>

                {/* Zoom Controls Bar (Only in bracket mode) */}
                {competitionDisplayMode === 'bracket' && (
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      onClick={handleZoomOut}
                      title="Perkecil (Zoom Out)"
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-bold px-2 text-slate-700 min-w-[42px] text-center select-none">
                      {bracketZoom}%
                    </span>
                    <button
                      onClick={handleZoomIn}
                      title="Perbesar (Zoom In)"
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    {bracketZoom !== 100 && (
                      <button
                        onClick={handleResetZoom}
                        title="Reset Zoom (100%)"
                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-white rounded-lg transition border-l border-slate-200 ml-0.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                <button
                  onClick={handleShuffleBracket}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-slate-200"
                >
                  <Shuffle className="w-3.5 h-3.5" /> Acak Posisi
                </button>

                {getLombaConfig(groupedLombaMap[bracketLombaKey]?.lombaTitle, groupedLombaMap[bracketLombaKey]?.categoryGroup).teamSize > 1 && (
                  <button
                    onClick={handleToggleLockTeams}
                    className={`px-3 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm ${
                      isTeamFormationLocked
                        ? 'bg-emerald-600 text-white border border-emerald-700'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {isTeamFormationLocked ? 'Buka Kunci Tim' : 'Kunci Pembagian Tim'}
                  </button>
                )}

                <button
                  onClick={() => window.print()}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-3.5 h-3.5" /> Cetak
                </button>
              </div>
            </div>

            {/* Print Header */}
            <div className="hidden print:block text-center mb-6">
              <h1 className="text-2xl font-black">SKEMA PERTANDINGAN HUT RI KE-81</h1>
              <h2 className="text-lg font-bold text-red-700 mt-1">
                {bracketLombaKey ? groupedLombaMap[bracketLombaKey]?.lombaTitle : ''}
              </h2>
            </div>

            {/* Render View Based on Mode */}
            {competitionDisplayMode === 'bracket' ? renderBracketView() : renderSessionView()}
          </div>
        )}

        {/* TAB 3: MASTER DATA */}
        {activeTab === 'master' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 print:border-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4 mb-4 print:hidden">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800">Master Data Pendaftar</h2>
                <p className="text-xs text-slate-500">Seluruh data mentah pendaftaran dari CSV Google Form.</p>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama, whatsapp, blok..."
                  value={searchMaster}
                  onChange={(e) => setSearchMaster(e.target.value)}
                  className="text-xs pl-8 pr-3 py-2 border border-slate-200 rounded-xl w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">No</th>
                    <th className="py-3 px-3">Nama</th>
                    <th className="py-3 px-3">Blok</th>
                    <th className="py-3 px-3">WhatsApp</th>
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-3">Daftar Lomba Diikuti</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rawParticipants
                    .filter(p =>
                      p.nama.toLowerCase().includes(searchMaster.toLowerCase()) ||
                      p.blok.toLowerCase().includes(searchMaster.toLowerCase()) ||
                      p.wa.includes(searchMaster)
                    )
                    .sort((a, b) => { // NOSONAR
                      const parseBlok = (blok: string) => {
                        const match = blok.match(/^([A-Z]+)(\d+.*)$/i);
                        if (!match) return { letter: blok.toLowerCase(), numbers: [] };

                        const letterPart = match[1].toLowerCase();
                        const numberParts = match[2].split(/[\/-]/).map(n => parseInt(n, 10)).filter(n => !isNaN(n));
                        
                        return { letter: letterPart, numbers: numberParts };
                      };

                      const blokA = parseBlok(a.blok);
                      const blokB = parseBlok(b.blok);

                      if (blokA.letter < blokB.letter) return -1;
                      if (blokA.letter > blokB.letter) return 1;

                      for (let i = 0; i < Math.min(blokA.numbers.length, blokB.numbers.length); i++) {
                        if (blokA.numbers[i] !== blokB.numbers[i]) {
                          return blokA.numbers[i] - blokB.numbers[i];
                        }
                      }
                      return blokA.numbers.length - blokB.numbers.length;
                    })
                    .map((p, i) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 text-center text-slate-400 font-bold">{i + 1}</td>
                        <td className="py-3 px-3 font-bold text-slate-800">{p.nama}</td>
                        <td className="py-3 px-3 font-medium">{p.blok}</td>
                        <td className="py-3 px-3">{p.wa}</td>
                        <td className="py-3 px-3">{p.kategori}</td>
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1">
                            {p.daftarLomba.map((l, idx) => (
                              <span key={idx} className="bg-red-50 text-red-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-red-100">
                                {l}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto print:hidden">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400 font-medium">
          &copy; 2026 Panitia Semarak HUT RI Ke-81 Perumahan Green Hill. Built with Next.js & React.
        </div>
      </footer>

    </div>
  );
}