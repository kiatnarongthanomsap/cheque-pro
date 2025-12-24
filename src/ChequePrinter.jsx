import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Printer, Settings, RefreshCcw, Check, Move, MousePointer2, RotateCcw, Languages, FileText, Download, Trash2, History, Building2, User, Loader2, Save, LogOut, LogIn, Landmark, Calendar, Hash, UserCheck, Banknote, Ban, Undo2, AlertTriangle, Type, Database, Facebook, Mail, Smartphone, Apple } from 'lucide-react';

// --- MOCK STORAGE KEYS & HELPERS ---
const STORAGE_KEYS = {
    USERS: 'cp_users', // Stores list of all users
    LAST_USER: 'cp_last_active_user',
    // Dynamic keys generator
    getUserHistoryKey: (uid) => `cp_history_${uid}`,
    getUserSettingsKey: (uid) => `cp_settings_${uid}`
};

// --- Helper: Thai Baht Text ---
const thaiNumberToText = (number) => {
    const num = parseFloat(number);
    if (isNaN(num)) return '';
    if (num === 0) return 'ศูนย์บาทถ้วน';

    const numbers = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
    const units = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

    let text = '';
    const numStr = num.toFixed(2);
    const [baht, satang] = numStr.split('.');

    if (parseInt(baht) > 0) {
        const len = baht.length;
        for (let i = 0; i < len; i++) {
            const digit = parseInt(baht[i]);
            const pos = len - i - 1;
            if (digit !== 0) {
                if (pos === 0 && digit === 1 && len > 1) text += 'เอ็ด';
                else if (pos === 1 && digit === 2) text += 'ยี่';
                else if (pos === 1 && digit === 1) { }
                else text += numbers[digit];
                text += units[pos % 6];
            }
            if (pos === 6) text += 'ล้าน';
        }
        text += 'บาท';
    }

    if (parseInt(satang) > 0) {
        const len = satang.length;
        for (let i = 0; i < len; i++) {
            const digit = parseInt(satang[i]);
            const pos = len - i - 1;
            if (digit !== 0) {
                if (pos === 0 && digit === 1 && len > 1) text += 'เอ็ด';
                else if (pos === 1 && digit === 2) text += 'ยี่';
                else if (pos === 1 && digit === 1) { }
                else text += numbers[digit];
                text += units[pos];
            }
        }
        text += 'สตางค์';
    } else {
        text += 'ถ้วน';
    }
    return text;
};

// --- Helper: English Baht Text ---
const englishNumberToText = (number) => {
    const num = parseFloat(number);
    if (isNaN(num)) return '';
    if (num === 0) return 'Zero Baht Only';

    const numToEn = (n) => {
        if (n < 0) return "";
        if (n < 20) return ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'][n];
        if (n < 100) return ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'][Math.floor(n / 10)] + (n % 10 ? '-' + numToEn(n % 10) : '');
        if (n < 1000) return numToEn(Math.floor(n / 100)) + ' Hundred' + (n % 100 ? ' ' + numToEn(n % 100) : '');
        if (n < 1000000) return numToEn(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + numToEn(n % 1000) : '');
        if (n < 1000000000) return numToEn(Math.floor(n / 1000000)) + ' Million' + (n % 1000000 ? ' ' + numToEn(n % 1000000) : '');
        return 'Number too large';
    }

    const numStr = num.toFixed(2);
    const [baht, satang] = numStr.split('.');
    const bahtInt = parseInt(baht);
    const satangInt = parseInt(satang);

    let text = '';
    if (bahtInt > 0) text += numToEn(bahtInt) + ' Baht';

    if (satangInt > 0) {
        if (text) text += ' and ';
        text += numToEn(satangInt) + ' Satang';
    }

    return text + ' Only';
};

const convertAmount = (amount, lang) => {
    if (!amount) return '';
    return lang === 'TH' ? thaiNumberToText(amount) : englishNumberToText(amount);
};

// --- Draggable Wrapper ---
const DraggableElement = ({ id, x, y, children, onDragStart, isDragging, className = '' }) => {
    return (
        <div
            onMouseDown={(e) => onDragStart(e, id)}
            className={`absolute cursor-move select-none ${isDragging ? 'opacity-70 z-50' : 'z-10'} ${className}`}
            style={{ left: `${x}mm`, top: `${y}mm`, touchAction: 'none' }}
        >
            <div className={`relative group ${isDragging ? 'ring-2 ring-blue-500 ring-dashed' : 'hover:ring-1 hover:ring-blue-300 hover:ring-dashed'}`}>
                {children}
                <div className="absolute -top-3 -right-3 hidden group-hover:flex bg-blue-500 text-white rounded-full p-0.5 w-4 h-4 items-center justify-center print:hidden">
                    <Move className="w-2 h-2" />
                </div>
            </div>
        </div>
    );
};

// --- Bank Presets Configuration ---
const bankPresets = {
    standard: {
        label: "มาตรฐานกลาง (Standard)",
        positions: { date: { x: 125, y: 12 }, payee: { x: 20, y: 26 }, amountText: { x: 25, y: 36 }, amountNumber: { x: 125, y: 35 }, acPayee: { x: 8, y: 8 }, bearerStrike: { x: 148, y: 28 } }
    },
    kbank: {
        label: "กสิกรไทย (KBank)",
        positions: { date: { x: 138, y: 8 }, payee: { x: 20, y: 22 }, amountText: { x: 30, y: 32 }, amountNumber: { x: 130, y: 33 }, acPayee: { x: 5, y: 5 }, bearerStrike: { x: 155, y: 28 } }
    },
    scb: {
        label: "ไทยพาณิชย์ (SCB)",
        positions: { date: { x: 130, y: 10 }, payee: { x: 15, y: 24 }, amountText: { x: 20, y: 34 }, amountNumber: { x: 135, y: 34 }, acPayee: { x: 8, y: 8 }, bearerStrike: { x: 150, y: 28 } }
    },
    bbl: {
        label: "กรุงเทพ (BBL)",
        positions: { date: { x: 132, y: 9 }, payee: { x: 18, y: 25 }, amountText: { x: 22, y: 35 }, amountNumber: { x: 132, y: 35 }, acPayee: { x: 10, y: 10 }, bearerStrike: { x: 152, y: 28 } }
    },
    ktb: {
        label: "กรุงไทย (KTB)",
        positions: { date: { x: 135, y: 11 }, payee: { x: 20, y: 26 }, amountText: { x: 25, y: 36 }, amountNumber: { x: 135, y: 36 }, acPayee: { x: 8, y: 8 }, bearerStrike: { x: 150, y: 28 } }
    },
    ttb: {
        label: "ทีทีบี (ttb)",
        positions: { date: { x: 136, y: 10 }, payee: { x: 20, y: 25 }, amountText: { x: 28, y: 35 }, amountNumber: { x: 136, y: 35 }, acPayee: { x: 6, y: 6 }, bearerStrike: { x: 154, y: 28 } }
    }
};

// --- Font Options ---
const fontOptions = [
    { value: 'Sarabun', label: 'สารบรรณ (ทางการ)', family: '"Sarabun", sans-serif' },
    { value: 'Charmonman', label: 'จามร (ลายมือสวย)', family: '"Charmonman", cursive' },
    { value: 'Krub', label: 'ครับ (ทันสมัย)', family: '"Krub", sans-serif' },
    { value: 'Courier New', label: 'พิมพ์ดีด (Classic)', family: '"Courier New", monospace' },
];

// --- Main Component ---
export default function ChequePrinter() {
    // --- States ---
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [dataLoading, setDataLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [emailInput, setEmailInput] = useState('');
    const [duplicateWarning, setDuplicateWarning] = useState(null);

    const [selectedBank, setSelectedBank] = useState('standard');
    const [positions, setPositions] = useState(bankPresets['standard'].positions);
    const [lang, setLang] = useState('TH');
    const [activeTab, setActiveTab] = useState('printer');

    // Font Settings State
    const [fontConfig, setFontConfig] = useState({
        family: 'Sarabun',
        size: 16, // Base size in px
        isBold: false
    });

    const [data, setData] = useState({
        date: new Date().toISOString().split('T')[0],
        chequeNo: '',
        payee: '',
        amount: '',
        amountText: '',
        acPayee: true,
        noBearer: true,
    });

    const [printMode, setPrintMode] = useState('textOnly');
    const [offsets, setOffsets] = useState({ x: 0, y: 0 });
    const [history, setHistory] = useState([]);

    const [dragState, setDragState] = useState({
        isDragging: false, draggedId: null, startX: 0, startY: 0, initialItemX: 0, initialItemY: 0, pixelsPerMm: 3.78
    });

    // --- Auth & Data Loading (Mock) ---
    useEffect(() => {
        // Check for last active session
        const lastUserId = localStorage.getItem(STORAGE_KEYS.LAST_USER);
        if (lastUserId) {
            const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
            const foundUser = users.find(u => u.id === lastUserId);
            if (foundUser) {
                setUser(foundUser);
            }
        }
        setAuthLoading(false);
    }, []);

    const loadUserData = useCallback((currentUser) => {
        if (!currentUser) return;
        setDataLoading(true);
        try {
            // Load History
            const historyKey = STORAGE_KEYS.getUserHistoryKey(currentUser.id);
            const savedHistory = localStorage.getItem(historyKey);
            if (savedHistory) {
                setHistory(JSON.parse(savedHistory));
            } else {
                setHistory([]);
            }

            // Load Settings
            const settingsKey = STORAGE_KEYS.getUserSettingsKey(currentUser.id);
            const savedSettings = localStorage.getItem(settingsKey);
            if (savedSettings) {
                const config = JSON.parse(savedSettings);
                if (config.positions) setPositions(config.positions);
                if (config.offsets) setOffsets(config.offsets);
                if (config.selectedBank) setSelectedBank(config.selectedBank);
                if (config.lang) setLang(config.lang);
                if (config.fontConfig) setFontConfig(config.fontConfig);
            } else {
                // Reset defaults for new user
                setPositions(bankPresets['standard'].positions);
                setOffsets({ x: 0, y: 0 });
                setSelectedBank('standard');
                setLang('TH');
                setFontConfig({ family: 'Sarabun', size: 16, isBold: false });
            }
        } catch (e) {
            console.error("Error loading user data", e);
        } finally {
            setDataLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUserData(user);
    }, [user, loadUserData]);

    // --- Login Handlers ---
    const performLogin = (userInfo) => {
        setAuthLoading(true);
        setTimeout(() => {
            // Update User DB
            const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
            if (!users.find(u => u.id === userInfo.id)) {
                users.push(userInfo);
                localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
            }

            // Set Session
            localStorage.setItem(STORAGE_KEYS.LAST_USER, userInfo.id);
            setUser(userInfo);
            setAuthLoading(false);
        }, 800);
    };

    const handleEmailLogin = (e) => {
        e.preventDefault();
        if (!emailInput.trim()) return;
        const id = `u_email_${emailInput.replace(/[^a-zA-Z0-9]/g, '_')}`;
        performLogin({
            id: id,
            provider: 'email',
            displayName: emailInput.split('@')[0],
            email: emailInput
        });
    };

    const handleSocialLogin = (provider) => {
        // Simulate Social IDs
        const names = {
            facebook: 'Facebook User',
            line: 'Line User',
            apple: 'Apple User'
        };
        const id = `u_${provider}_demo`;
        performLogin({
            id: id,
            provider: provider,
            displayName: names[provider] || 'User',
            email: `${provider}@mock.login`
        });
    };

    const handleLogout = async () => {
        localStorage.removeItem(STORAGE_KEYS.LAST_USER);
        setUser(null);
        setHistory([]);
        setEmailInput('');
        setPositions(bankPresets['standard'].positions);
        setOffsets({ x: 0, y: 0 });
        setFontConfig({ family: 'Sarabun', size: 16, isBold: false });
    };

    // --- Real-time Duplicate Warning Effect ---
    useEffect(() => {
        if (!data.chequeNo || data.chequeNo.trim() === '' || !user) {
            setDuplicateWarning(null);
            return;
        }

        const currentBankLabel = bankPresets[selectedBank].label;
        const foundDuplicate = history.find(item =>
            (item.chequeNo || '').toString().trim() === data.chequeNo.toString().trim() &&
            item.bank === currentBankLabel &&
            item.status !== 'VOID'
        );

        if (foundDuplicate) {
            setDuplicateWarning(foundDuplicate);
        } else {
            setDuplicateWarning(null);
        }
    }, [data.chequeNo, selectedBank, history, user]);

    // --- Handlers ---
    const saveSettings = (newPositions, newOffsets, newBank, newLang, newFontConfig) => {
        if (!user) return;
        const newSettings = {
            positions: newPositions || positions,
            offsets: newOffsets || offsets,
            selectedBank: newBank || selectedBank,
            lang: newLang || lang,
            fontConfig: newFontConfig || fontConfig,
            updatedAt: Date.now()
        };
        localStorage.setItem(STORAGE_KEYS.getUserSettingsKey(user.id), JSON.stringify(newSettings));
    };

    const handleBankChange = (e) => {
        const bankKey = e.target.value;
        setSelectedBank(bankKey);
        const newPositions = bankPresets[bankKey].positions;
        setPositions(newPositions);
        saveSettings(newPositions, null, bankKey, null, null);
    };

    const handleLangChange = (l) => {
        setLang(l);
        saveSettings(null, null, null, l, null);
    }

    const handleFontChange = (updates) => {
        const newConfig = { ...fontConfig, ...updates };
        setFontConfig(newConfig);
        saveSettings(null, null, null, null, newConfig);
    };

    // Dragging Setup
    useEffect(() => {
        const div = document.createElement('div');
        div.style.width = '100mm';
        div.style.height = '0';
        div.style.visibility = 'hidden';
        document.body.appendChild(div);
        const px = div.getBoundingClientRect().width;
        setDragState(prev => ({ ...prev, pixelsPerMm: px / 100 }));
        document.body.removeChild(div);
    }, []);

    useEffect(() => {
        if (data.amount) {
            setData(prev => ({ ...prev, amountText: convertAmount(prev.amount, lang) }));
        }
    }, [lang]);

    const handleDragStart = (e, id) => {
        if (e.button !== 0) return;
        e.preventDefault(); e.stopPropagation();
        setDragState(prev => ({
            ...prev, isDragging: true, draggedId: id, startX: e.clientX, startY: e.clientY,
            initialItemX: positions[id].x, initialItemY: positions[id].y
        }));
    };

    const handleDragMove = useCallback((e) => {
        if (!dragState.isDragging || !dragState.draggedId) return;
        const deltaX_mm = (e.clientX - dragState.startX) / dragState.pixelsPerMm;
        const deltaY_mm = (e.clientY - dragState.startY) / dragState.pixelsPerMm;
        setPositions(prev => ({
            ...prev, [dragState.draggedId]: { x: dragState.initialItemX + deltaX_mm, y: dragState.initialItemY + deltaY_mm }
        }));
    }, [dragState]);

    const handleDragEnd = useCallback(() => {
        if (dragState.isDragging) {
            setDragState(prev => ({ ...prev, isDragging: false, draggedId: null }));
            saveSettings(positions, null, null, null, null);
        }
    }, [dragState.isDragging, positions]);

    useEffect(() => {
        if (dragState.isDragging) {
            window.addEventListener('mousemove', handleDragMove);
            window.addEventListener('mouseup', handleDragEnd);
        } else {
            window.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
        }
        return () => { window.removeEventListener('mousemove', handleDragMove); window.removeEventListener('mouseup', handleDragEnd); };
    }, [dragState.isDragging, handleDragMove, handleDragEnd]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'amount') {
            const val = parseFloat(value);
            const text = val ? convertAmount(val, lang) : '';
            setData(prev => ({ ...prev, [name]: value, amountText: text }));
        } else {
            setData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        }
    };

    const handleResetPositions = () => {
        if (confirm(`คืนค่าตำแหน่งเริ่มต้นสำหรับ ${bankPresets[selectedBank].label}?`)) {
            const defaultPos = bankPresets[selectedBank].positions;
            setPositions(defaultPos);
            setOffsets({ x: 0, y: 0 });
            saveSettings(defaultPos, { x: 0, y: 0 }, null, null, null);
        }
    };

    const handleOffsetChange = (newOffsets) => {
        setOffsets(newOffsets);
        saveSettings(null, newOffsets, null, null, null);
    }

    // --- Print Handler (Mock) ---
    const handlePrintCheque = () => {
        if (!user || isSaving) return;

        // 1. Validation
        const amountVal = parseFloat(data.amount);
        if (!amountVal || amountVal <= 0) {
            alert("⚠️ ไม่สามารถพิมพ์ได้: กรุณาระบุจำนวนเงินให้ถูกต้อง (ต้องมากกว่า 0)");
            return;
        }

        // 2. Duplicate Check
        if (duplicateWarning) {
            const confirmPrint = window.confirm(
                `⚠️ แจ้งเตือน: เลขที่เช็ค "${data.chequeNo}" ซ้ำกับรายการในประวัติ!\n(จ่ายแก่: ${duplicateWarning.payee}, จำนวน: ${duplicateWarning.amount})\n\nคุณต้องการพิมพ์ซ้ำหรือไม่?`
            );
            if (!confirmPrint) return;
        }

        setIsSaving(true);

        // 3. Print Immediately
        setTimeout(() => {
            window.print();
        }, 50);

        // 4. Save to Mock DB (User Namespaced)
        const newItem = {
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            printDate: new Date().toLocaleString('th-TH'),
            ...data,
            chequeLang: lang,
            bank: bankPresets[selectedBank].label,
            status: 'SUCCESS'
        };

        setTimeout(() => {
            const newHistory = [newItem, ...history];
            setHistory(newHistory);
            localStorage.setItem(STORAGE_KEYS.getUserHistoryKey(user.id), JSON.stringify(newHistory));
            setIsSaving(false);
        }, 1000);
    };

    const handleToggleStatus = (id, currentStatus) => {
        const newStatus = currentStatus === 'VOID' ? 'SUCCESS' : 'VOID';
        const newHistory = history.map(item => item.id === id ? { ...item, status: newStatus } : item);
        setHistory(newHistory);
        localStorage.setItem(STORAGE_KEYS.getUserHistoryKey(user.id), JSON.stringify(newHistory));
    };

    const handlePrintReport = () => window.print();

    const handleClearHistory = () => {
        if (confirm('คุณแน่ใจหรือไม่ที่จะลบประวัติการพิมพ์ทั้งหมดของบัญชีนี้? (ข้อมูลใน Local Storage จะหายไป)')) {
            setHistory([]);
            localStorage.removeItem(STORAGE_KEYS.getUserHistoryKey(user.id));
        }
    };

    const handleExportCSV = () => {
        const headers = ["วันที่พิมพ์,เลขที่เช็ค,วันที่หน้าเช็ค,ธนาคาร,สั่งจ่ายแก่,จำนวนเงิน,รูปแบบ,สถานะ"];
        const rows = history.map(item =>
            `"${item.printDate}","${item.chequeNo || '-'}","${item.date}","${item.bank || '-'}","${item.payee}","${item.amount}","${item.chequeLang}","${item.status === 'VOID' ? 'ยกเลิก' : 'ปกติ'}"`
        );
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `cheque_history_${user.id}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const d = (() => {
        if (!data.date) return { d1: '', d2: '', m1: '', m2: '', y1: '', y2: '', y3: '', y4: '' };
        const [y, m, day] = data.date.split('-');
        let yearStr = y;
        if (lang === 'TH') {
            const beYear = parseInt(y) + 543;
            yearStr = beYear.toString();
        }
        return {
            d1: day?.[0] || '', d2: day?.[1] || '',
            m1: m?.[0] || '', m2: m?.[1] || '',
            y1: yearStr?.[0] || '', y2: yearStr?.[1] || '', y3: yearStr?.[2] || '', y4: yearStr?.[3] || ''
        };
    })();

    const totalAmount = history
        .filter(item => item.status !== 'VOID')
        .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    // Helper to get selected font family style
    const currentFontFamily = fontOptions.find(f => f.value === fontConfig.family)?.family || 'sans-serif';

    // --- Login Screen ---
    if (!user) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl max-w-md w-full">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="bg-blue-50 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-4 border-4 border-blue-100">
                            <Landmark className="w-10 h-10 text-blue-900" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Cheque Printer Pro</h1>
                        <p className="text-gray-500 mt-1">จัดการทุกการสั่งจ่าย ได้ง่ายในที่เดียว</p>
                    </div>

                    {/* Social Logins */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <button onClick={() => handleSocialLogin('facebook')} className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition group">
                            <Facebook className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform" />
                            <span className="text-xs text-gray-600">Facebook</span>
                        </button>
                        <button onClick={() => handleSocialLogin('line')} className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg border border-gray-200 hover:bg-green-50 hover:border-green-200 transition group">
                            <Smartphone className="w-6 h-6 text-green-500 group-hover:scale-110 transition-transform" />
                            <span className="text-xs text-gray-600">Line</span>
                        </button>
                        <button onClick={() => handleSocialLogin('apple')} className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition group">
                            <Apple className="w-6 h-6 text-black group-hover:scale-110 transition-transform" />
                            <span className="text-xs text-gray-600">Apple</span>
                        </button>
                    </div>

                    <div className="relative flex py-2 items-center mb-6">
                        <div className="flex-grow border-t border-gray-200"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">หรือ เข้าสู่ระบบด้วยอีเมล</span>
                        <div className="flex-grow border-t border-gray-200"></div>
                    </div>

                    {/* Email Form */}
                    <form onSubmit={handleEmailLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">อีเมลผู้ใช้งาน</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    required
                                    value={emailInput}
                                    onChange={(e) => setEmailInput(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    placeholder="yourname@example.com"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={authLoading}
                            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-70 shadow-md"
                        >
                            {authLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                            {authLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ / ลงทะเบียน'}
                        </button>
                    </form>

                    {/* Footer Notice */}
                    <div className="mt-8 text-center">
                        <p className="text-xs text-gray-400 bg-gray-50 p-2 rounded border border-gray-100">
                            🔒 <strong>Data Privacy:</strong> ข้อมูลทั้งหมดจะถูกเก็บไว้ในเครื่องของคุณ (Local Storage) เท่านั้น ไม่มีการส่งข้อมูลขึ้น Server ภายนอก
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // --- App Screen ---
    return (
        <div className="min-h-screen bg-gray-100 font-sans p-4 md:p-8 print:p-0 print:bg-white text-gray-900">

            {/* Import Google Fonts */}
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Charmonman:wght@400;700&family=Krub:wght@300;400;500;700&family=Sarabun:wght@300;400;500;700&display=swap');
      `}</style>

            {/* Print Styles Block */}
            <style>{`
            @media print {
            @page { size: auto; margin: 0; }
            body { 
                background: white; 
                margin: 0; 
                padding: 0; 
                visibility: hidden; /* Hide everything by default */
            }
            
            /* Unhide the root container to allow children to be visible */
            #root { visibility: visible; }

            /* Explicitly hide non-printable elements */
            .print\\:hidden { display: none !important; }

            /* Make the printable cheque visible */
            .printable-cheque { 
                visibility: visible;
                display: flex !important; 
                position: fixed !important; 
                top: 0 !important; 
                left: 0 !important; 
                width: 100% !important; 
                height: 100% !important;
                z-index: 9999;
                background-color: white;
                align-items: flex-start; /* Ensure top alignment */
                justify-content: center;
            }
            
            /* Report printing styles */
            .printable-report {
                visibility: visible;
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
            }
            
            /* Allow specific children of printable areas to be visible */
            .printable-cheque *, .printable-report * {
                visibility: visible;
            }
            }
        `}</style>

            {/* --- Header & Tabs (Hidden on Print) --- */}
            <div className="max-w-5xl mx-auto mb-4 flex flex-col md:flex-row md:items-end justify-between gap-4 print:hidden">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('printer')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-bold transition-colors ${activeTab === 'printer' ? 'bg-blue-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Printer className="w-5 h-5" /> พิมพ์เช็ค (Printer)
                    </button>
                    <button
                        onClick={() => setActiveTab('report')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-bold transition-colors ${activeTab === 'report' ? 'bg-blue-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                        <FileText className="w-5 h-5" /> รายงาน (History)
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-200">
                        <User className="w-4 h-4 text-blue-600" />
                        <span className="hidden sm:inline">User:</span>
                        <span className="font-mono text-xs text-gray-400 font-bold">{user.displayName}</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-sm transition-colors border border-red-200"
                    >
                        <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">ออกจากระบบ</span>
                    </button>
                </div>
            </div>

            {/* --- PRINTER TAB CONTENT --- */}
            {activeTab === 'printer' && (
                <>
                    <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-xl rounded-tl-none overflow-hidden mb-8 print:hidden">
                        <div className="bg-blue-900 text-white p-4 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Landmark className="w-6 h-6 text-yellow-400" />
                                <h1 className="text-xl font-bold">ระบบพิมพ์เช็ค</h1>
                            </div>
                            <button
                                onClick={handlePrintCheque}
                                disabled={isSaving}
                                className="flex items-center gap-2 bg-yellow-400 text-blue-900 px-4 py-2 rounded-lg font-bold hover:bg-yellow-300 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />}
                                {isSaving ? 'กำลังสั่งพิมพ์...' : 'สั่งพิมพ์ (Print)'}
                            </button>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Form Inputs */}
                            <div className="md:col-span-2 space-y-4">

                                {/* Header Controls */}
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-4">
                                    {/* Language Selector */}
                                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                                        <button onClick={() => handleLangChange('TH')} className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${lang === 'TH' ? 'bg-white text-blue-900 shadow' : 'text-gray-500 hover:text-gray-700'}`}>ไทย</button>
                                        <button onClick={() => handleLangChange('EN')} className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${lang === 'EN' ? 'bg-white text-blue-900 shadow' : 'text-gray-500 hover:text-gray-700'}`}>Eng</button>
                                    </div>

                                    {/* Bank Selector */}
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <Building2 className="w-5 h-5 text-blue-900" />
                                        <select
                                            value={selectedBank}
                                            onChange={handleBankChange}
                                            className="flex-grow p-2 rounded border border-gray-300 text-gray-700 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        >
                                            {Object.entries(bankPresets).map(([key, data]) => (
                                                <option key={key} value={key}>{data.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Section 1: Header Info (Grid 12) */}
                                <div className="grid grid-cols-12 gap-4">
                                    {/* Date - Top Priority */}
                                    <div className="col-span-12 sm:col-span-6">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" /> วันที่ (Date)
                                        </label>
                                        <input type="date" name="date" value={data.date} onChange={handleChange} className="w-full border rounded-lg p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                    </div>
                                    {/* Cheque No - Ref */}
                                    <div className="col-span-12 sm:col-span-6">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                                            <Hash className="w-3.5 h-3.5" /> เลขที่เช็ค (Cheque No.)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                name="chequeNo"
                                                value={data.chequeNo}
                                                onChange={handleChange}
                                                className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none ${duplicateWarning ? 'border-orange-500 bg-orange-50' : 'border-gray-300'}`}
                                                placeholder="ระบุเลขที่เช็ค (ถ้ามี)"
                                            />
                                            {duplicateWarning && (
                                                <div className="absolute top-full left-0 mt-1 w-full bg-orange-100 border border-orange-200 text-orange-800 text-xs p-2 rounded shadow-sm flex items-start gap-2 z-10">
                                                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                                    <div>
                                                        <b>แจ้งเตือน:</b> เลขนี้ซ้ำกับรายการในประวัติ
                                                        <div className="opacity-75">สั่งจ่าย: {duplicateWarning.payee}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Payment Details */}
                                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-4">
                                    <div className="grid grid-cols-12 gap-4">
                                        {/* Payee */}
                                        <div className="col-span-12 md:col-span-8">
                                            <label className="block text-sm font-semibold text-blue-900 mb-1 flex items-center gap-1">
                                                <UserCheck className="w-3.5 h-3.5" /> สั่งจ่ายแก่ (Pay To)
                                            </label>
                                            <input type="text" name="payee" value={data.payee} onChange={handleChange} className="w-full border border-blue-200 rounded-lg p-3 text-lg font-medium text-blue-900 focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-gray-400" placeholder="ชื่อผู้รับเงิน..." />
                                        </div>

                                        {/* Amount Number */}
                                        <div className="col-span-12 md:col-span-4">
                                            <label className="block text-sm font-semibold text-blue-900 mb-1 flex items-center gap-1">
                                                <Banknote className="w-3.5 h-3.5" /> จำนวนเงิน (Amount)
                                            </label>
                                            <input type="number" name="amount" step="0.01" value={data.amount} onChange={handleChange} className="w-full border border-blue-200 rounded-lg p-3 text-lg font-bold text-right text-blue-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0.00" />
                                        </div>

                                        {/* Amount Text */}
                                        <div className="col-span-12">
                                            <label className="block text-xs font-medium text-gray-500 mb-1">จำนวนเงินตัวอักษร (Amount in Text - Auto)</label>
                                            <div className="flex gap-2">
                                                <div className="flex-grow bg-white border border-gray-200 rounded-lg p-2.5 text-blue-800 font-medium italic min-h-[44px] flex items-center">
                                                    {data.amountText || <span className="text-gray-300">รอระบุตัวเลข...</span>}
                                                </div>
                                                <button onClick={() => setData(p => ({ ...p, amountText: convertAmount(p.amount, lang) }))} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors" title="Refresh Text">
                                                    <RefreshCcw className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Options (Toggles) */}
                                <div className="flex flex-wrap gap-4 pt-2">
                                    <label className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border transition-all ${data.acPayee ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'}`}>
                                        <input type="checkbox" name="acPayee" checked={data.acPayee} onChange={handleChange} className="w-4 h-4 text-blue-600 rounded" />
                                        <span className="text-sm font-medium text-gray-700">ขีดคร่อม (A/C Payee Only)</span>
                                    </label>
                                    <label className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border transition-all ${data.noBearer ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'}`}>
                                        <input type="checkbox" name="noBearer" checked={data.noBearer} onChange={handleChange} className="w-4 h-4 text-blue-600 rounded" />
                                        <span className="text-sm font-medium text-gray-700">ขีดฆ่า "หรือผู้ถือ" (Strike "Or Bearer")</span>
                                    </label>
                                </div>
                            </div>

                            {/* Settings Panel */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col gap-4">
                                <div>
                                    <h2 className="text-lg font-semibold border-b pb-2 text-gray-700 flex items-center gap-2">
                                        <Settings className="w-4 h-4" /> ตั้งค่าการพิมพ์
                                    </h2>

                                    <div className="space-y-4 mt-4">
                                        {/* Font Settings */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                                <Type className="w-4 h-4" /> รูปแบบตัวอักษร (Font Style)
                                            </label>
                                            <div className="space-y-2">
                                                <select
                                                    value={fontConfig.family}
                                                    onChange={(e) => handleFontChange({ family: e.target.value })}
                                                    className="w-full border rounded p-1.5 text-sm"
                                                >
                                                    {fontOptions.map(f => (
                                                        <option key={f.value} value={f.value}>{f.label}</option>
                                                    ))}
                                                </select>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-grow">
                                                        <span className="text-xs text-gray-500">ขนาด: {fontConfig.size}px</span>
                                                        <input
                                                            type="range" min="10" max="32"
                                                            value={fontConfig.size}
                                                            onChange={(e) => handleFontChange({ size: parseInt(e.target.value) })}
                                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => handleFontChange({ isBold: !fontConfig.isBold })}
                                                        className={`p-1.5 rounded border ${fontConfig.isBold ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-white text-gray-600'}`}
                                                        title="ตัวหนา"
                                                    >
                                                        <b className="text-sm">B</b>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <hr className="border-gray-200" />

                                        {/* Print Mode */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">โหมดแสดงผล</label>
                                            <div className="flex flex-col gap-2">
                                                <label className="flex items-center gap-2"><input type="radio" checked={printMode === 'textOnly'} onChange={() => setPrintMode('textOnly')} className="text-blue-600" /><span className="text-sm">พิมพ์เฉพาะข้อความ (Text Only)</span></label>
                                                <label className="flex items-center gap-2"><input type="radio" checked={printMode === 'full'} onChange={() => setPrintMode('full')} className="text-blue-600" /><span className="text-sm">พิมพ์ตัวอย่าง (Print Preview)</span></label>
                                            </div>
                                        </div>

                                        {/* Offsets */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                                <Move className="w-4 h-4" /> ปรับตำแหน่ง (Offset mm)
                                            </label>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div><span className="text-gray-500 text-xs">แนวนอน (X)</span><input type="number" value={offsets.x} onChange={(e) => handleOffsetChange({ ...offsets, x: Number(e.target.value) })} className="w-full border rounded p-1" /></div>
                                                <div><span className="text-gray-500 text-xs">แนวตั้ง (Y)</span><input type="number" value={offsets.y} onChange={(e) => handleOffsetChange({ ...offsets, y: Number(e.target.value) })} className="w-full border rounded p-1" /></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button onClick={handleResetPositions} className="mt-auto flex items-center justify-center gap-2 w-full border border-gray-300 bg-white p-2 rounded text-sm hover:bg-gray-100 text-gray-600">
                                    <RotateCcw className="w-4 h-4" /> รีเซ็ตตำแหน่ง
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* --- CHEQUE CANVAS --- */}
                    <div className={`flex justify-center printable-cheque ${activeTab !== 'printer' ? 'hidden' : ''}`}>
                        <div
                            className="relative bg-white shadow-2xl print:shadow-none overflow-hidden mx-auto select-none"
                            style={{
                                width: '178mm', height: '89mm',
                                backgroundImage: printMode === 'full' ? 'repeating-linear-gradient(45deg, #f0f9ff 0, #f0f9ff 10px, #e0f2fe 10px, #e0f2fe 20px)' : 'none',
                                border: printMode === 'full' ? '1px solid #ccc' : 'none',
                                transform: `translate(${offsets.x}mm, ${offsets.y}mm)`,
                                fontFamily: currentFontFamily, // Apply Font
                            }}
                        >
                            {printMode === 'full' && (
                                <div className="absolute inset-0 pointer-events-none text-blue-900 opacity-40 z-0" style={{ fontFamily: '"Sarabun", sans-serif' }}>
                                    <div className="absolute top-[5mm] left-[5mm] text-xs border border-blue-300 p-2 w-[30mm] h-[15mm] flex items-center justify-center bg-white">
                                        {bankPresets[selectedBank].label}
                                    </div>
                                    <div className="absolute top-[13mm] right-[55mm] text-sm font-bold">{lang === 'TH' ? 'วันที่' : 'Date'}</div>
                                    <div className="absolute top-[12mm] right-[10mm] w-[45mm] h-[6mm] border-b border-dotted border-blue-300"></div>
                                    <div className="absolute top-[27mm] left-[5mm] text-sm font-bold">{lang === 'TH' ? 'จ่าย' : 'Pay'}</div>
                                    <div className="absolute top-[32mm] left-[20mm] w-[130mm] h-[1px] bg-blue-200"></div>
                                    <div className="absolute top-[37mm] left-[5mm] text-sm font-bold">{lang === 'TH' ? 'จำนวนเงิน' : 'Amount'}</div>
                                    <div className="absolute top-[42mm] left-[25mm] w-[100mm] h-[1px] bg-blue-200"></div>
                                    <div className="absolute top-[34mm] right-[15mm] w-[40mm] h-[8mm] border border-blue-300 flex items-center justify-end pr-2 text-xs text-blue-300">{lang === 'TH' ? 'บาท' : 'Baht'}</div>
                                    <div className="absolute bottom-[15mm] right-[15mm] w-[40mm] border-t border-blue-900 text-center text-xs pt-1">{lang === 'TH' ? 'ลายเซ็น' : 'Signature'}</div>
                                    <div className="absolute bottom-[5mm] left-0 w-full h-[10mm] bg-white opacity-50 flex items-center justify-center font-mono tracking-widest text-lg text-slate-400">12345678 : 9999999 : 1234567890</div>
                                    <div className="absolute top-[28mm] right-[14mm] text-[10px] text-gray-400">{lang === 'TH' ? 'หรือผู้ถือ' : 'Or Bearer'}</div>
                                </div>
                            )}

                            <DraggableElement id="date" x={positions.date.x} y={positions.date.y} onDragStart={handleDragStart} isDragging={dragState.draggedId === 'date'}>
                                <div className="flex gap-[1.5mm] text-black" style={{ fontSize: `${fontConfig.size}px`, fontWeight: fontConfig.isBold ? 'bold' : 'normal' }}>
                                    <span className="w-4 text-center">{d.d1}</span><span className="w-4 text-center">{d.d2}</span>
                                    <span className="w-4 ml-2 text-center">{d.m1}</span><span className="w-4 text-center">{d.m2}</span>
                                    <span className="w-4 ml-2 text-center">{d.y1}</span><span className="w-4 text-center">{d.y2}</span>
                                    <span className="w-4 text-center">{d.y3}</span><span className="w-4 text-center">{d.y4}</span>
                                </div>
                            </DraggableElement>

                            <DraggableElement id="payee" x={positions.payee.x} y={positions.payee.y} onDragStart={handleDragStart} isDragging={dragState.draggedId === 'payee'}>
                                <div className="text-black w-[110mm] whitespace-nowrap overflow-visible" style={{ fontSize: `${fontConfig.size + 4}px`, fontWeight: fontConfig.isBold ? 'bold' : 'normal' }}>
                                    {data.payee}
                                </div>
                            </DraggableElement>

                            <DraggableElement id="amountText" x={positions.amountText.x} y={positions.amountText.y} onDragStart={handleDragStart} isDragging={dragState.draggedId === 'amountText'}>
                                <div className="text-black w-[100mm] whitespace-nowrap" style={{ fontSize: `${fontConfig.size}px`, fontWeight: fontConfig.isBold ? 'bold' : 'normal' }}>
                                    {data.amountText}
                                </div>
                            </DraggableElement>

                            <DraggableElement id="amountNumber" x={positions.amountNumber.x} y={positions.amountNumber.y} onDragStart={handleDragStart} isDragging={dragState.draggedId === 'amountNumber'}>
                                <div className="text-black w-[35mm] text-right" style={{ fontSize: `${fontConfig.size + 2}px`, fontWeight: fontConfig.isBold ? 'bold' : 'normal' }}>
                                    ={data.amount ? Number(data.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}=
                                </div>
                            </DraggableElement>

                            {data.acPayee && (
                                <DraggableElement id="acPayee" x={positions.acPayee.x} y={positions.acPayee.y} onDragStart={handleDragStart} isDragging={dragState.draggedId === 'acPayee'}>
                                    <div className="border-t-2 border-b-2 border-black -rotate-12 transform py-1 px-2 text-sm bg-transparent" style={{ fontWeight: 'bold' }}>& A/C PAYEE ONLY</div>
                                </DraggableElement>
                            )}

                            {data.noBearer && (
                                <DraggableElement id="bearerStrike" x={positions.bearerStrike.x} y={positions.bearerStrike.y} onDragStart={handleDragStart} isDragging={dragState.draggedId === 'bearerStrike'}>
                                    <div className="w-[15mm] h-[2mm] flex items-center justify-center"><div className="w-full h-[1.5px] bg-black transform -rotate-12"></div></div>
                                </DraggableElement>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* --- REPORT TAB CONTENT --- */}
            {activeTab === 'report' && (
                <div className="max-w-5xl mx-auto printable-report">
                    <div className="bg-white shadow-lg rounded-xl rounded-tl-none overflow-hidden print:shadow-none print:rounded-none">
                        <div className="bg-blue-900 text-white p-4 flex justify-between items-center print:hidden">
                            <div className="flex items-center gap-2">
                                <History className="w-6 h-6" />
                                <h1 className="text-xl font-bold">ประวัติการพิมพ์ (Printing History)</h1>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleExportCSV} className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white px-3 py-1.5 rounded-lg text-sm transition">
                                    <Download className="w-4 h-4" /> Export CSV
                                </button>
                                <button onClick={handlePrintReport} className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1.5 rounded-lg text-sm transition">
                                    <Printer className="w-4 h-4" /> Print Report
                                </button>
                            </div>
                        </div>

                        <div className="hidden print:block p-4 mb-4 border-b">
                            <h1 className="text-2xl font-bold text-center">รายงานการสั่งจ่ายเช็ค (Cheque Disbursement Report)</h1>
                            <p className="text-center text-gray-500 text-sm">พิมพ์เมื่อ: {new Date().toLocaleString('th-TH')}</p>
                        </div>

                        <div className="p-0 overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-100 text-gray-600 font-semibold border-b">
                                    <tr>
                                        <th className="p-4 w-1/6">วันที่พิมพ์</th>
                                        <th className="p-4 w-1/6">เลขที่เช็ค</th>
                                        <th className="p-4 w-1/6">วันที่หน้าเช็ค</th>
                                        <th className="p-4 w-1/6">ธนาคาร</th>
                                        <th className="p-4 w-1/3">สั่งจ่ายแก่ (Payee)</th>
                                        <th className="p-4 w-1/6 text-right">จำนวนเงิน</th>
                                        <th className="p-4 w-1/6 text-center print:hidden">สถานะ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {dataLoading ? (
                                        <tr><td colSpan="7" className="p-8 text-center text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />กำลังโหลดข้อมูล...</td></tr>
                                    ) : history.length === 0 ? (
                                        <tr><td colSpan="7" className="p-8 text-center text-gray-400">ยังไม่มีประวัติการพิมพ์ในบัญชีนี้</td></tr>
                                    ) : (
                                        history.map((item) => (
                                            <tr key={item.id} className={`hover:bg-gray-50 ${item.status === 'VOID' ? 'bg-red-50' : ''}`}>
                                                <td className="p-3 text-sm text-gray-500">{item.printDate}</td>
                                                <td className="p-3 text-sm text-gray-700 font-mono">{item.chequeNo || '-'}</td>
                                                <td className="p-3 font-medium">{item.date}</td>
                                                <td className="p-3 text-sm text-gray-600">{item.bank || '-'}</td>
                                                <td className={`p-3 font-medium ${item.status === 'VOID' ? 'text-gray-400 line-through' : 'text-blue-900'}`}>{item.payee}</td>
                                                <td className={`p-3 font-mono font-bold text-right ${item.status === 'VOID' ? 'text-gray-400 line-through' : ''}`}>{Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="p-3 text-center print:hidden">
                                                    <button
                                                        onClick={() => handleToggleStatus(item.id, item.status)}
                                                        className={`p-1.5 rounded-full transition-colors ${item.status === 'VOID' ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                                                        title={item.status === 'VOID' ? "คืนสถานะ (Restore)" : "ยกเลิก (Void)"}
                                                    >
                                                        {item.status === 'VOID' ? <Undo2 className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                <tfoot className="bg-gray-50 border-t-2 border-gray-200 font-bold">
                                    <tr>
                                        <td colSpan="5" className="p-4 text-right text-gray-700">รวมยอดสุทธิ (ไม่รวมที่ยกเลิก):</td>
                                        <td className="p-4 text-right text-blue-900 text-lg">{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="print:hidden"></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {history.length > 0 && (
                            <div className="p-4 bg-gray-50 border-t flex justify-end print:hidden">
                                <button onClick={handleClearHistory} disabled={dataLoading} className="flex items-center gap-2 text-red-600 hover:text-red-800 text-sm disabled:opacity-50">
                                    {dataLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} ล้างประวัติทั้งหมด
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
