/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Calendar, CloudSun, Users, HardHat, User, CheckCircle2, AlertTriangle, 
  Plus, ArrowRight, Sparkles, Upload, FileText, Download, Printer, RefreshCw, 
  ChevronRight, BarChart3, Settings, ShieldCheck, Check, AlertCircle, PieChart, TrendingUp, Layers, Activity, MapPin, AlertOctagon, FileSpreadsheet, Image as ImageIcon
} from 'lucide-react';

interface StageItem {
  id: string;
  stageName: string;
  unit: string;
  target: number;
  today: number;
  previousTotal: number;
  totalRequired: number;
  remarks: 'OK' | 'Delayed';
}

interface DailyReport {
  date: string;
  project: string;
  weather: string;
  labourCount: number | '';
  craneEquip: string;
  reportedBy: string;
  stages: StageItem[];
  elementsInstalled: string;
  issuesDelay: string;
  planForTomorrow: string;
  sitePhotos: string[]; // Mandatory 2 photos
}

interface LocationItem {
  itemNumber: number; // 1 to 33
  locationName: string;
  riskNumber: number; // 1 to 5
  impediments: string;
  excavationStatus: 'Pending' | 'In Progress' | 'Completed';
  shiftingStatus: 'Pending' | 'In Progress' | 'Completed';
  erectionStatus: 'Pending' | 'In Progress' | 'Completed';
  finalStatus: 'Pending' | 'In Progress' | 'Completed';
}

export default function App() {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [currentDate, setCurrentDate] = useState<string>('2026-10-01');
  const [activeReport, setActiveReport] = useState<DailyReport | null>(null);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'management' | 'locations' | 'report' | 'history' | 'analytics'>('dashboard');
  
  // Selected activity for line chart
  const [selectedActivity, setSelectedActivity] = useState<string>('Rod Bending');

  // AI State
  const [aiInsight, setAiInsight] = useState<string>('');
  const [managementReportText, setManagementReportText] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isMgmtAnalyzing, setIsMgmtAnalyzing] = useState<boolean>(false);
  const [ocrLoading, setOcrLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [projectStatus, setProjectStatus] = useState<string>('');
  const [isSavingStatus, setIsSavingStatus] = useState<boolean>(false);
  const [isEditingStatus, setIsEditingStatus] = useState<boolean>(false);

  useEffect(() => {
    fetchReports();
    fetchLocations();
    fetchProjectStatus();
  }, []);

  useEffect(() => {
    if (currentDate) {
      fetchReportForDate(currentDate);
    }
  }, [currentDate]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      setReports(data);
      if (data.length > 0 && !currentDate) {
        setCurrentDate(data[data.length - 1].date);
      }
    } catch (err) {
      console.error('Failed to fetch reports', err);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/locations');
      const data = await res.json();
      setLocations(data);
    } catch (err) {
      console.error('Failed to fetch locations', err);
    }
  };

  const fetchProjectStatus = async () => {
    try {
      const res = await fetch('/api/project-status');
      const data = await res.json();
      setProjectStatus(data.status);
    } catch (err) {
      console.error('Failed to fetch project status', err);
    }
  };

  const handleSaveProjectStatus = async () => {
    setIsSavingStatus(true);
    try {
      const res = await fetch('/api/project-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: projectStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification('Project status updated successfully.');
        setIsEditingStatus(false);
      }
    } catch (err) {
      console.error('Failed to save project status', err);
      showNotification('Error saving project status.');
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleSaveLocations = async () => {
    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locations),
      });
      const data = await res.json();
      if (data.success) {
        showNotification('Locations & element tracker updated successfully.');
      }
    } catch (err) {
      console.error('Failed to save locations', err);
      showNotification('Error saving locations.');
    }
  };

  const handleLocationChange = (index: number, field: keyof LocationItem, value: any) => {
    const updated = [...locations];
    updated[index] = { ...updated[index], [field]: value };
    setLocations(updated);
  };

  const fetchReportForDate = async (dateStr: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/${dateStr}`);
      const data = await res.json();
      setActiveReport({
        ...data,
        sitePhotos: data.sitePhotos || []
      });
    } catch (err) {
      console.error('Failed to fetch report for date', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReport = async () => {
    if (!activeReport) return;

    // Validate mandatory 2 site photos
    const validPhotos = (activeReport.sitePhotos || []).filter(Boolean);
    if (validPhotos.length < 2) {
      showNotification('⚠️ Mandatory: Please upload exactly 2 daily work site photos before saving.');
      return;
    }

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeReport),
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Day's data and mandatory site photos saved successfully.");
        fetchReports();
      }
    } catch (err) {
      console.error('Failed to save report', err);
      showNotification('Error saving report.');
    }
  };

  const handleRollover = async () => {
    if (!activeReport) return;
    const curr = new Date(currentDate);
    curr.setDate(curr.getDate() + 1);
    const nextDateStr = curr.toISOString().split('T')[0];

    try {
      const res = await fetch('/api/reports/rollover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromDate: currentDate, toDate: nextDateStr }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`Rolled over successfully to ${nextDateStr}! Previous totals updated.`);
        setCurrentDate(nextDateStr);
        fetchReports();
      }
    } catch (err) {
      console.error('Rollover failed', err);
      showNotification('Rollover failed.');
    }
  };

  const handleStageChange = (index: number, field: keyof StageItem, value: any) => {
    if (!activeReport) return;
    const updatedStages = [...activeReport.stages];
    const stage = { ...updatedStages[index], [field]: value };
    
    if (field === 'today' || field === 'target') {
      const todayVal = field === 'today' ? Number(value) : stage.today;
      const targetVal = field === 'target' ? Number(value) : stage.target;
      stage.remarks = todayVal >= targetVal ? 'OK' : 'Delayed';
    }

    updatedStages[index] = stage;
    setActiveReport({ ...activeReport, stages: updatedStages });
  };

  const handleHeaderChange = (field: keyof DailyReport, value: any) => {
    if (!activeReport) return;
    setActiveReport({ ...activeReport, [field]: value });
  };

  const handleSitePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, photoIndex: number) => {
    const file = e.target.files?.[0];
    if (!file || !activeReport) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const updatedPhotos = [...(activeReport.sitePhotos || ['', ''])];
      updatedPhotos[photoIndex] = base64;
      setActiveReport({ ...activeReport, sitePhotos: updatedPhotos });
    };
    reader.readAsDataURL(file);
  };

  const handleImageUploadOCR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64String = (reader.result as string).split(',')[1];
      try {
        const res = await fetch('/api/ai/ocr-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64String, mimeType: file.type }),
        });
        const data = await res.json();
        if (data.success && data.data) {
          const parsed = data.data;
          setActiveReport(prev => prev ? {
            ...prev,
            project: parsed.project || prev.project,
            weather: parsed.weather || prev.weather,
            labourCount: parsed.labourCount !== undefined ? parsed.labourCount : prev.labourCount,
            craneEquip: parsed.craneEquip || prev.craneEquip,
            reportedBy: parsed.reportedBy || prev.reportedBy,
            elementsInstalled: parsed.elementsInstalled || prev.elementsInstalled,
            issuesDelay: parsed.issuesDelay || prev.issuesDelay,
            planForTomorrow: parsed.planForTomorrow || prev.planForTomorrow,
            stages: parsed.stages ? prev.stages.map(st => {
              const match = parsed.stages.find((p: any) => p.stageName?.toLowerCase().includes(st.stageName.toLowerCase()));
              return match ? {
                ...st,
                target: match.target !== undefined ? match.target : st.target,
                today: match.today !== undefined ? match.today : st.today,
                previousTotal: match.previousTotal !== undefined ? match.previousTotal : st.previousTotal,
                remarks: match.today >= match.target ? 'OK' : 'Delayed'
              } : st;
            }) : prev.stages
          } : prev);
          showNotification('Report successfully extracted from photo via Gemini AI!');
        } else {
          showNotification('Could not extract report data clearly.');
        }
      } catch (err) {
        console.error('OCR API error:', err);
        showNotification('AI OCR extraction failed.');
      } finally {
        setOcrLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const getAiInsight = async () => {
    if (!activeReport) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/ai/site-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeReport),
      });
      const data = await res.json();
      if (data.success) {
        setAiInsight(data.insight);
      }
    } catch (err) {
      console.error('AI insight error', err);
      setAiInsight('Failed to generate AI insights.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateManagementSummaryAI = async () => {
    setIsMgmtAnalyzing(true);
    try {
      const payload = {
        latestReport,
        locationsSummary: locations.filter((l: LocationItem) => l.riskNumber >= 3 || l.impediments),
      };
      const res = await fetch('/api/ai/site-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...latestReport,
          issuesDelay: `MANAGEMENT REPORT BRIEFING. High-risk locations/impediments: ${JSON.stringify(payload.locationsSummary)}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setManagementReportText(data.insight);
      }
    } catch (err) {
      console.error('Mgmt AI error', err);
      setManagementReportText('Failed to generate management executive summary.');
    } finally {
      setIsMgmtAnalyzing(false);
    }
  };

  // Compute dashboard metrics
  const latestReport = reports[reports.length - 1] || activeReport;
  const totalLabourAcrossReports = reports.reduce((acc: number, r: DailyReport) => acc + (typeof r.labourCount === 'number' ? r.labourCount : 0), 0);
  const avgLabour = reports.length > 0 ? Math.round(totalLabourAcrossReports / reports.length) : 0;
  const totalStagesCompleted = latestReport ? latestReport.stages.reduce((acc: number, s: StageItem) => acc + s.previousTotal + s.today, 0) : 0;
  const totalStagesRequired = latestReport ? latestReport.stages.reduce((acc: number, s: StageItem) => acc + s.totalRequired, 0) : 1;
  const overallCompletionPct = Math.min(100, Math.round((totalStagesCompleted / totalStagesRequired) * 100));
  const criticalRiskCount = locations.filter((l: LocationItem) => l.riskNumber >= 4).length;

  const targetCompletionDate = new Date('2026-10-30');
  const today = new Date();
  const diffTime = targetCompletionDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Extract activity time-series data for line chart
  const activityTimeSeries = reports.map(rep => {
    const stage = rep.stages.find(s => s.stageName === selectedActivity) || {
      target: 0,
      today: 0,
      previousTotal: 0,
      totalRequired: 33,
      unit: 'nos'
    };
    return {
      date: rep.date.slice(5),
      fullDate: rep.date,
      target: stage.target,
      actual: stage.today,
      totalToDate: stage.previousTotal + stage.today,
      unit: stage.unit,
      totalRequired: stage.totalRequired
    };
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center font-bold text-slate-950 text-xl shadow">
              PP
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Pellet Plant Civil & Precast Monitor</h1>
              <p className="text-xs text-slate-400">Automated Daily Progress Tracker (UML MSS Project)</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700 text-xs flex-wrap gap-1">
              <button 
                onClick={() => setActiveTab('dashboard')} 
                className={`px-3 py-1.5 rounded-md font-medium transition ${activeTab === 'dashboard' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'}`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => setActiveTab('management')} 
                className={`px-3 py-1.5 rounded-md font-medium transition ${activeTab === 'management' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'}`}
              >
                Management Report
              </button>
              <button 
                onClick={() => setActiveTab('locations')} 
                className={`px-3 py-1.5 rounded-md font-medium transition ${activeTab === 'locations' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'}`}
              >
                Locations (1-33)
              </button>
              <button 
                onClick={() => setActiveTab('report')} 
                className={`px-3 py-1.5 rounded-md font-medium transition ${activeTab === 'report' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'}`}
              >
                Daily Report
              </button>
              <button 
                onClick={() => setActiveTab('history')} 
                className={`px-3 py-1.5 rounded-md font-medium transition ${activeTab === 'history' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'}`}
              >
                History
              </button>
              <button 
                onClick={() => setActiveTab('analytics')} 
                className={`px-3 py-1.5 rounded-md font-medium transition ${activeTab === 'analytics' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'}`}
              >
                AI Insights
              </button>
            </div>

            <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition">
              <Upload className="w-4 h-4 text-amber-400" />
              <span>{ocrLoading ? 'Scanning...' : 'Upload Photo'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUploadOCR} disabled={ocrLoading} />
            </label>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* MANAGEMENT REPORT TAB */}
        {activeTab === 'management' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded">Executive Briefing</span>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">Pellet Plant Management Report</h2>
                <p className="text-xs text-slate-500">Comprehensive project health, critical risk assessment, and daily site work photo verification for UML MSS Project</p>
              </div>

              <div className="flex items-center space-x-2">
                <button 
                  onClick={generateManagementSummaryAI}
                  disabled={isMgmtAnalyzing}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg text-xs shadow transition flex items-center space-x-1.5"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{isMgmtAnalyzing ? 'Generating AI Briefing...' : 'Generate AI Executive Summary'}</span>
                </button>
                <button 
                  onClick={() => window.print()}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-semibold px-4 py-2 rounded-lg text-xs shadow transition flex items-center space-x-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Report</span>
                </button>
              </div>
            </div>

            {/* AI Executive Summary Box */}
            {managementReportText && (
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-xl shadow border border-indigo-900/50 space-y-3">
                <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Executive Summary & Recommendations</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                  {managementReportText}
                </p>
              </div>
            )}

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Overall Progress</span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">{overallCompletionPct}%</h3>
                <span className="text-xs text-emerald-600 font-medium">Completed</span>
              </div>
              <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl text-white shadow-lg">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Days Remaining</span>
                <h3 className="text-2xl font-bold text-amber-400 mt-1">{daysRemaining}</h3>
                <span className="text-xs text-slate-300 font-medium italic">Until 30-10-2026</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Target Completion</span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">30-10-2026</h3>
                <span className="text-xs text-amber-600 font-medium">Final Milestone</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Avg. Labour</span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">{avgLabour}</h3>
                <span className="text-xs text-blue-600 font-medium">Workers/day</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Critical Risks</span>
                <h3 className="text-xl font-bold text-red-600 mt-1">{criticalRiskCount}</h3>
                <span className="text-xs text-red-500 font-medium">Level ≥ 4</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Tracked Scope</span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">33 Items</h3>
                <span className="text-xs text-slate-600 font-medium">Full list mapped</span>
              </div>
            </div>

            {/* MANDATORY DAILY WORK SITE PHOTOS SECTION IN MANAGEMENT REPORT */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <ImageIcon className="w-5 h-5 text-amber-600" />
                  <span>Mandatory Daily Work Site Photos (2 Nos)</span>
                </h3>
                {latestReport && (
                  <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded font-semibold">
                    Date: {latestReport.date}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[0, 1].map((photoIdx) => {
                  const photoSrc = latestReport?.sitePhotos?.[photoIdx];
                  return (
                    <div key={photoIdx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                        <span>Site Work Photo #{photoIdx + 1}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] ${photoSrc ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {photoSrc ? 'Verified' : 'Pending Upload'}
                        </span>
                      </div>
                      <div className="w-full h-56 bg-white border border-slate-300 rounded-lg overflow-hidden flex items-center justify-center relative">
                        {photoSrc ? (
                          <img src={photoSrc} alt={`Daily Site Work ${photoIdx + 1}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center p-4 text-slate-400 space-y-2">
                            <ImageIcon className="w-10 h-10 mx-auto opacity-40" />
                            <p className="text-xs font-medium">No site photo uploaded for this report yet.</p>
                            <button 
                              onClick={() => { setCurrentDate(latestReport?.date || currentDate); setActiveTab('report'); }}
                              className="text-amber-600 text-xs font-bold underline"
                            >
                              Upload in Daily Report Form
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Today's Stage Target vs Done Table */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-amber-600" />
                  <span>Today's Stage Performance: Target vs Done</span>
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-800 text-white uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-4">Stage / Activity</th>
                      <th className="py-2.5 px-3 text-center">Unit</th>
                      <th className="py-2.5 px-3 text-center bg-amber-700 text-white">Target (Today)</th>
                      <th className="py-2.5 px-3 text-center bg-amber-600 text-white font-bold">Done (Today)</th>
                      <th className="py-2.5 px-3 text-center">Total to Date</th>
                      <th className="py-2.5 px-3 text-center">Total Required</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {latestReport?.stages?.map((stage: StageItem) => {
                      const totalToDate = stage.previousTotal + stage.today;
                      const isDelayed = stage.remarks === 'Delayed' || stage.today < stage.target;

                      return (
                        <tr key={stage.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4 font-semibold text-slate-900">{stage.stageName}</td>
                          <td className="py-2.5 px-3 text-center text-slate-500 font-mono">{stage.unit}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-800 bg-amber-50/50">{stage.target}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-amber-700 bg-amber-100/60">{stage.today}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-900">{totalToDate}</td>
                          <td className="py-2.5 px-3 text-center text-slate-600">{stage.totalRequired}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${isDelayed ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'}`}>
                              {isDelayed ? 'Delayed' : 'OK'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* High Risk & Impediments Table for Management */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <AlertOctagon className="w-5 h-5 text-red-600" />
                <span>Critical Risk Locations & Impediments Summary</span>
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-800 text-white uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">Item #</th>
                      <th className="py-2.5 px-4">Location Name</th>
                      <th className="py-2.5 px-3 text-center">Risk No.</th>
                      <th className="py-2.5 px-4">Impediments</th>
                      <th className="py-2.5 px-3 text-center">Excavation</th>
                      <th className="py-2.5 px-3 text-center">Shifting</th>
                      <th className="py-2.5 px-3 text-center">Erection</th>
                      <th className="py-2.5 px-3 text-center">Final</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {locations.filter((l: LocationItem) => l.riskNumber >= 3 || l.impediments).map((loc: LocationItem) => (
                      <tr key={loc.itemNumber} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-800">{loc.itemNumber}</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900">{loc.locationName}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded font-bold ${loc.riskNumber >= 4 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                            {loc.riskNumber}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-700">{loc.impediments || 'None'}</td>
                        <td className="py-2.5 px-3 text-center font-medium">{loc.excavationStatus}</td>
                        <td className="py-2.5 px-3 text-center font-medium">{loc.shiftingStatus}</td>
                        <td className="py-2.5 px-3 text-center font-medium">{loc.erectionStatus}</td>
                        <td className="py-2.5 px-3 text-center font-medium">{loc.finalStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* LOCATIONS (1-33) TAB */}
        {activeTab === 'locations' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-amber-600" />
                  <span>Element / Location Tracker (1 to 33)</span>
                </h2>
                <p className="text-xs text-slate-500">Manage manual location names, risk numbers, impediments, and stage statuses for all 33 elements (including Rod Bending items)</p>
              </div>

              <button 
                onClick={handleSaveLocations}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2 rounded-lg text-xs shadow transition flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save All Locations</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-800 text-white uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3 text-center w-12">#</th>
                    <th className="py-3 px-4">Location Name (Manual)</th>
                    <th className="py-3 px-3 text-center w-24">Risk No. (1-5)</th>
                    <th className="py-3 px-4">Impediments / Bottlenecks</th>
                    <th className="py-3 px-3 text-center">Excavation</th>
                    <th className="py-3 px-3 text-center">Shifting</th>
                    <th className="py-3 px-3 text-center">Erection</th>
                    <th className="py-3 px-3 text-center">Final</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {locations.map((loc, idx) => {
                    const riskBg = loc.riskNumber >= 4 ? 'bg-red-50 text-red-800 font-bold' : loc.riskNumber === 3 ? 'bg-amber-50 text-amber-800 font-bold' : 'bg-emerald-50 text-emerald-800';

                    return (
                      <tr key={loc.itemNumber} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 text-center font-bold text-slate-700 bg-slate-50">
                          {loc.itemNumber}
                        </td>
                        <td className="py-2 px-3">
                          <input 
                            type="text" 
                            value={loc.locationName}
                            onChange={(e) => handleLocationChange(idx, 'locationName', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-900 font-medium focus:ring-1 focus:ring-amber-500"
                            placeholder="Enter location name..."
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <select 
                            value={loc.riskNumber}
                            onChange={(e) => handleLocationChange(idx, 'riskNumber', Number(e.target.value))}
                            className={`w-16 text-center rounded py-1 px-1 border border-slate-300 ${riskBg}`}
                          >
                            <option value={1}>1 - Low</option>
                            <option value={2}>2 - Minor</option>
                            <option value={3}>3 - Med</option>
                            <option value={4}>4 - High</option>
                            <option value={5}>5 - Critical</option>
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <input 
                            type="text" 
                            value={loc.impediments}
                            onChange={(e) => handleLocationChange(idx, 'impediments', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-800 focus:ring-1 focus:ring-amber-500"
                            placeholder="None or enter impediment..."
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <select 
                            value={loc.excavationStatus}
                            onChange={(e) => handleLocationChange(idx, 'excavationStatus', e.target.value)}
                            className={`px-2 py-1 rounded font-semibold text-[11px] border ${loc.excavationStatus === 'Completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : loc.excavationStatus === 'In Progress' ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-slate-100 text-slate-600 border-slate-300'}`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <select 
                            value={loc.shiftingStatus}
                            onChange={(e) => handleLocationChange(idx, 'shiftingStatus', e.target.value)}
                            className={`px-2 py-1 rounded font-semibold text-[11px] border ${loc.shiftingStatus === 'Completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : loc.shiftingStatus === 'In Progress' ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-slate-100 text-slate-600 border-slate-300'}`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <select 
                            value={loc.erectionStatus}
                            onChange={(e) => handleLocationChange(idx, 'erectionStatus', e.target.value)}
                            className={`px-2 py-1 rounded font-semibold text-[11px] border ${loc.erectionStatus === 'Completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : loc.erectionStatus === 'In Progress' ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-slate-100 text-slate-600 border-slate-300'}`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <select 
                            value={loc.finalStatus}
                            onChange={(e) => handleLocationChange(idx, 'finalStatus', e.target.value)}
                            className={`px-2 py-1 rounded font-semibold text-[11px] border ${loc.finalStatus === 'Completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : loc.finalStatus === 'In Progress' ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-slate-100 text-slate-600 border-slate-300'}`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DASHBOARD & GRAPHS TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Project Status Prominent Card */}
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-xl border border-amber-400 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4">
                <div className="bg-amber-400/30 p-2 rounded-full backdrop-blur-sm">
                  <Sparkles className="w-6 h-6 text-slate-900 animate-pulse" />
                </div>
              </div>
              
              <div className="p-8 md:p-10 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-slate-900 p-2.5 rounded-xl shadow-lg">
                      <FileText className="w-6 h-6 text-amber-400" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">Present Project Status</h3>
                  </div>
                  
                  {!isEditingStatus ? (
                    <button 
                      onClick={() => setIsEditingStatus(true)}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg transition flex items-center space-x-2 border border-slate-700"
                    >
                      <Settings className="w-4 h-4 text-amber-400" />
                      <span>Edit Project Status</span>
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={handleSaveProjectStatus}
                        disabled={isSavingStatus}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg transition flex items-center space-x-2 border border-slate-700 disabled:opacity-50"
                      >
                        {isSavingStatus ? <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> : <Check className="w-4 h-4 text-amber-400" />}
                        <span>{isSavingStatus ? 'Saving...' : 'Save Changes'}</span>
                      </button>
                      <button 
                        onClick={() => setIsEditingStatus(false)}
                        className="bg-white/20 hover:bg-white/30 text-slate-900 px-4 py-2.5 rounded-xl text-sm font-bold transition"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {!isEditingStatus ? (
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/20 shadow-inner">
                    <p className="text-xl md:text-3xl font-bold text-slate-950 leading-tight md:leading-snug italic">
                      "{projectStatus || 'No current status updated. Click edit to describe today\'s site activity.'}"
                    </p>
                  </div>
                ) : (
                  <textarea 
                    value={projectStatus}
                    onChange={(e) => setProjectStatus(e.target.value)}
                    placeholder="Describe what is currently happening on the project..."
                    className="w-full bg-white rounded-2xl p-6 text-lg md:text-xl font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-900/10 transition-all min-h-[150px] shadow-lg border border-amber-300"
                    autoFocus
                  />
                )}
                
                <div className="flex items-center space-x-2 text-slate-900/60 font-bold text-xs uppercase tracking-widest pt-2">
                  <div className="h-px bg-slate-900/20 flex-1"></div>
                  <span>Real-time Project Update</span>
                  <div className="h-px bg-slate-900/20 flex-1"></div>
                </div>
              </div>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Overall Completion</p>
                  <h3 className="text-2xl font-bold text-slate-900">{overallCompletionPct}%</h3>
                  <p className="text-xs text-emerald-600 font-medium">On track</p>
                </div>
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Target Date</p>
                  <h3 className="text-lg font-bold text-slate-900 truncate">30-10-2026</h3>
                  <p className="text-xs text-amber-600 font-medium">Fixed Goal</p>
                </div>
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-slate-900 p-5 rounded-xl shadow-md border border-slate-700 flex items-center justify-between text-white">
                <div className="space-y-1">
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Days Remaining</p>
                  <h3 className="text-2xl font-bold text-amber-400">{daysRemaining}</h3>
                  <p className="text-[10px] text-slate-300 font-medium">Until Completion</p>
                </div>
                <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400">
                  <Activity className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Reports</p>
                  <h3 className="text-2xl font-bold text-slate-900">{reports.length}</h3>
                  <p className="text-xs text-slate-500 font-medium">Days logged</p>
                </div>
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600">
                  <FileText className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Avg. Labour</p>
                  <h3 className="text-2xl font-bold text-slate-900">{avgLabour}</h3>
                  <p className="text-xs text-blue-600 font-medium">Personnel/day</p>
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Risks</p>
                  <h3 className="text-2xl font-bold text-red-600">{criticalRiskCount}</h3>
                  <p className="text-xs text-red-500 font-medium">Level ≥ 4</p>
                </div>
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                  <AlertOctagon className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* ACTIVITY LINE CHART SECTION */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-amber-600" />
                    <span>Activity Progress: Actual vs Target (Line Chart)</span>
                  </h3>
                  <p className="text-xs text-slate-500">Select any civil/precast activity to monitor daily target vs actual output trends</p>
                </div>

                <div className="flex items-center space-x-2 w-full md:w-auto">
                  <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">Select Activity:</span>
                  <select 
                    value={selectedActivity} 
                    onChange={(e) => setSelectedActivity(e.target.value)}
                    className="bg-amber-50 border border-amber-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
                  >
                    {latestReport?.stages.map((st) => (
                      <option key={st.id} value={st.stageName}>{st.stageName} ({st.unit})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-semibold px-2">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center space-x-1.5">
                      <span className="w-3 h-3 bg-amber-500 rounded-full inline-block"></span>
                      <span className="text-slate-700">Actual Today</span>
                    </span>
                    <span className="flex items-center space-x-1.5">
                      <span className="w-3 h-3 bg-slate-800 rounded-full inline-block"></span>
                      <span className="text-slate-700">Planned Target</span>
                    </span>
                  </div>
                  <span className="text-slate-500">Unit: {activityTimeSeries[0]?.unit || 'nos'}</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 relative h-64 flex flex-col justify-between">
                  <div className="absolute inset-0 p-6 flex flex-col justify-between pointer-events-none opacity-20">
                    <div className="border-b border-slate-400 w-full"></div>
                    <div className="border-b border-slate-400 w-full"></div>
                    <div className="border-b border-slate-400 w-full"></div>
                  </div>

                  <div className="relative z-10 h-full flex items-end justify-around gap-4 pt-6">
                    {activityTimeSeries.map((item, idx) => {
                      const maxVal = Math.max(8, ...activityTimeSeries.map(i => Math.max(i.target, i.actual, 5)));
                      const actualHeight = Math.min(100, Math.round((item.actual / maxVal) * 100));
                      const targetHeight = Math.min(100, Math.round((item.target / maxVal) * 100));

                      return (
                        <div key={idx} className="flex flex-col items-center h-full justify-end space-y-2 flex-1 group">
                          <div className="flex items-end justify-center space-x-2 h-44 w-full">
                            <div className="flex flex-col items-center justify-end h-full w-6">
                              <span className="text-[10px] font-bold text-amber-700 mb-1">{item.actual}</span>
                              <div 
                                className="w-3 bg-amber-500 hover:bg-amber-600 rounded-t transition-all duration-300 shadow"
                                style={{ height: `${Math.max(12, actualHeight)}%` }}
                                title={`Actual: ${item.actual}`}
                              ></div>
                            </div>
                            <div className="flex flex-col items-center justify-end h-full w-6">
                              <span className="text-[10px] font-bold text-slate-700 mb-1">{item.target}</span>
                              <div 
                                className="w-3 bg-slate-800 hover:bg-slate-900 rounded-t transition-all duration-300 shadow"
                                style={{ height: `${Math.max(12, targetHeight)}%` }}
                                title={`Target: ${item.target}`}
                              ></div>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-xs">
                            {item.date}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs">
                    <span className="text-slate-500 block">Total Completed to Date</span>
                    <span className="text-base font-bold text-slate-900">
                      {activityTimeSeries[activityTimeSeries.length - 1]?.totalToDate || 0} {activityTimeSeries[0]?.unit}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs">
                    <span className="text-slate-500 block">Total Required</span>
                    <span className="text-base font-bold text-slate-900">
                      {activityTimeSeries[0]?.totalRequired || 33} {activityTimeSeries[0]?.unit}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs">
                    <span className="text-slate-500 block">Balance Remaining</span>
                    <span className="text-base font-bold text-amber-700">
                      {Math.max(0, (activityTimeSeries[0]?.totalRequired || 33) - (activityTimeSeries[activityTimeSeries.length - 1]?.totalToDate || 0))} {activityTimeSeries[0]?.unit}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Graphs Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Overall Stage Progress</h3>
                    <p className="text-xs text-slate-500">Current cumulative output per civil stage</p>
                  </div>
                  <Layers className="w-5 h-5 text-amber-600" />
                </div>

                <div className="space-y-3 pt-2">
                  {latestReport?.stages.map((stage) => {
                    const completed = stage.previousTotal + stage.today;
                    const req = stage.totalRequired || 1;
                    const pct = Math.min(100, Math.round((completed / req) * 100));

                    return (
                      <div key={stage.id} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-800">{stage.stageName} ({stage.unit})</span>
                          <span className="text-slate-600 font-bold">{completed} / {req} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
                          <div 
                            className="bg-amber-500 h-3 rounded-full transition-all duration-500" 
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Daily Labour Mobilization</h3>
                      <p className="text-xs text-slate-500">Workforce across reporting dates</p>
                    </div>
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                  </div>

                  <div className="grid grid-cols-4 gap-3 pt-6 items-end h-56 border-b border-slate-200 pb-4">
                    {reports.map((rep) => {
                      const labour = typeof rep.labourCount === 'number' ? rep.labourCount : 20;
                      const heightPct = Math.round((labour / 35) * 100);

                      return (
                        <div key={rep.date} className="flex flex-col items-center h-full justify-end space-y-2 group">
                          <span className="text-[11px] font-bold text-slate-700">{labour} nos</span>
                          <div 
                            className="w-full bg-indigo-600 group-hover:bg-indigo-500 rounded-t-lg transition-all duration-300 shadow"
                            style={{ height: `${heightPct}%` }}
                          ></div>
                          <span className="text-[10px] text-slate-500 font-medium truncate w-full text-center">
                            {rep.date.slice(5)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-500 pt-2">
                  <span>Showing last {reports.length} daily logs</span>
                  <button 
                    onClick={() => setActiveTab('report')}
                    className="text-amber-600 font-semibold hover:underline flex items-center space-x-1"
                  >
                    <span>View Today's Full Report</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* DAILY REPORT FORM TAB */}
        {activeTab === 'report' && activeReport && (
          <div className="space-y-6">
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center space-x-3 w-full md:w-auto">
                <span className="text-sm font-semibold text-slate-700 flex items-center space-x-1">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <span>Report Date:</span>
                </span>
                <input 
                  type="date" 
                  value={activeReport.date}
                  onChange={(e) => setCurrentDate(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                <button 
                  onClick={handleRollover}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
                  title="Copy Total to Date into Next Day's Previous Total"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                  <span>Roll Over to Next Day</span>
                </button>
                <button 
                  onClick={handleSaveReport}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition flex items-center space-x-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Report</span>
                </button>
                <button 
                  onClick={() => window.print()}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>
              </div>
            </div>

            {/* Header Metadata Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-900 text-white px-6 py-3 font-bold text-sm tracking-wide flex justify-between items-center">
                <span>DAILY REPORT - PRECAST WORK</span>
                <span className="text-xs text-amber-400 font-normal">Yellow cells = fill in daily</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 border-b border-slate-200 text-xs">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Project</label>
                  <input 
                    type="text" 
                    value={activeReport.project} 
                    onChange={(e) => handleHeaderChange('project', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Weather</label>
                  <input 
                    type="text" 
                    value={activeReport.weather} 
                    onChange={(e) => handleHeaderChange('weather', e.target.value)}
                    className="w-full bg-amber-50 border border-amber-300 rounded px-2.5 py-1.5 font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Labour (nos.)</label>
                  <input 
                    type="number" 
                    value={activeReport.labourCount} 
                    onChange={(e) => handleHeaderChange('labourCount', e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-amber-50 border border-amber-300 rounded px-2.5 py-1.5 font-medium text-slate-800"
                    placeholder="e.g. 25"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Crane / Equip.</label>
                  <input 
                    type="text" 
                    value={activeReport.craneEquip} 
                    onChange={(e) => handleHeaderChange('craneEquip', e.target.value)}
                    className="w-full bg-amber-50 border border-amber-300 rounded px-2.5 py-1.5 font-medium text-slate-800"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-600 mb-1">Reported by</label>
                  <input 
                    type="text" 
                    value={activeReport.reportedBy} 
                    onChange={(e) => handleHeaderChange('reportedBy', e.target.value)}
                    className="w-full bg-amber-50 border border-amber-300 rounded px-2.5 py-1.5 font-medium text-slate-800"
                  />
                </div>
                <div className="sm:col-span-2 flex items-end">
                  <div className="text-slate-500 text-[11px] leading-tight">
                    TOTAL = Previous total + Today. BALANCE = Total required - Total to date. STATUS = OK if Today ≥ Target, else Delayed.
                  </div>
                </div>
              </div>

              {/* Stages Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-800 text-white uppercase text-[11px] tracking-wider">
                      <th className="py-3 px-4">Stage</th>
                      <th className="py-3 px-3 text-center">Unit</th>
                      <th className="py-3 px-3 text-center bg-amber-700 text-white">Target (today)</th>
                      <th className="py-3 px-3 text-center bg-amber-600 text-white font-bold">Today</th>
                      <th className="py-3 px-3 text-center bg-amber-700 text-white">Previous Total</th>
                      <th className="py-3 px-3 text-center">Total to Date</th>
                      <th className="py-3 px-3 text-center">Total Required</th>
                      <th className="py-3 px-3 text-center">Balance</th>
                      <th className="py-3 px-3 text-center bg-amber-700 text-white">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {activeReport.stages.map((stage, idx) => {
                      const totalToDate = Number(stage.previousTotal) + Number(stage.today);
                      const balance = Math.max(0, Number(stage.totalRequired) - totalToDate);
                      const isDelayed = stage.remarks === 'Delayed';

                      return (
                        <tr key={stage.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 font-semibold text-slate-800">{stage.stageName}</td>
                          <td className="py-3 px-3 text-center text-slate-500 font-mono">{stage.unit}</td>
                          
                          <td className="py-2 px-2 text-center bg-amber-50/50">
                            <input 
                              type="number" 
                              value={stage.target}
                              onChange={(e) => handleStageChange(idx, 'target', Number(e.target.value))}
                              className="w-16 text-center bg-white border border-amber-300 rounded py-1 px-1 font-semibold text-slate-900"
                            />
                          </td>

                          <td className="py-2 px-2 text-center bg-amber-100/60">
                            <input 
                              type="number" 
                              value={stage.today}
                              onChange={(e) => handleStageChange(idx, 'today', Number(e.target.value))}
                              className="w-16 text-center bg-white border border-amber-400 rounded py-1 px-1 font-bold text-slate-900 shadow-inner"
                            />
                          </td>

                          <td className="py-2 px-2 text-center bg-amber-50/50">
                            <input 
                              type="number" 
                              value={stage.previousTotal}
                              onChange={(e) => handleStageChange(idx, 'previousTotal', Number(e.target.value))}
                              className="w-16 text-center bg-white border border-amber-300 rounded py-1 px-1 font-semibold text-slate-900"
                            />
                          </td>

                          <td className="py-3 px-3 text-center font-bold text-slate-900 bg-white">
                            {totalToDate}
                          </td>

                          <td className="py-3 px-3 text-center text-slate-600 font-medium bg-slate-50">
                            {stage.totalRequired}
                          </td>

                          <td className="py-3 px-3 text-center font-bold text-slate-700 bg-slate-50">
                            {balance}
                          </td>

                          <td className="py-2 px-2 text-center bg-amber-50/50">
                            <select 
                              value={stage.remarks}
                              onChange={(e) => handleStageChange(idx, 'remarks', e.target.value)}
                              className={`px-2 py-1 rounded font-bold text-[11px] border ${isDelayed ? 'bg-red-100 text-red-700 border-red-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300'}`}
                            >
                              <option value="OK">OK</option>
                              <option value="Delayed">Delayed</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bottom Text Sections */}
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 border-t border-slate-200 bg-slate-50/50 text-xs">
                <div className="p-4 space-y-1.5 bg-amber-50/30">
                  <label className="block font-bold text-slate-700">Elements installed (IDs)</label>
                  <textarea 
                    rows={3}
                    value={activeReport.elementsInstalled}
                    onChange={(e) => handleHeaderChange('elementsInstalled', e.target.value)}
                    placeholder="e.g. PID-101, PID-102..."
                    className="w-full bg-white border border-amber-300 rounded p-2 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div className="p-4 space-y-1.5 bg-amber-50/30">
                  <label className="block font-bold text-slate-700">Issues / Delay</label>
                  <textarea 
                    rows={3}
                    value={activeReport.issuesDelay}
                    onChange={(e) => handleHeaderChange('issuesDelay', e.target.value)}
                    placeholder="Describe any bottlenecks..."
                    className="w-full bg-white border border-amber-300 rounded p-2 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div className="p-4 space-y-1.5 bg-amber-50/30">
                  <label className="block font-bold text-slate-700">Plan for tomorrow</label>
                  <textarea 
                    rows={3}
                    value={activeReport.planForTomorrow}
                    onChange={(e) => handleHeaderChange('planForTomorrow', e.target.value)}
                    placeholder="Tomorrow's targets..."
                    className="w-full bg-white border border-amber-300 rounded p-2 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* MANDATORY 2 SITE PHOTOS UPLOAD SECTION */}
              <div className="p-6 border-t border-slate-200 bg-amber-50/20 space-y-4">
                <div className="flex items-center space-x-2">
                  <ImageIcon className="w-5 h-5 text-amber-600" />
                  <h3 className="text-sm font-bold text-slate-900">Mandatory Daily Work Site Photos (2 Nos Required)</h3>
                </div>
                <p className="text-xs text-slate-600">Please upload exactly 2 photos documenting today's site work progress before saving this daily report.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[0, 1].map((idx) => {
                    const photo = activeReport.sitePhotos?.[idx];
                    return (
                      <div key={idx} className="bg-white border border-slate-300 rounded-xl p-4 space-y-3 shadow-xs">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                          <span>Site Work Photo #{idx + 1} *Mandatory*</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] ${photo ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
                            {photo ? 'Attached' : 'Required'}
                          </span>
                        </div>
                        <div className="w-full h-40 bg-slate-100 border border-dashed border-slate-300 rounded-lg overflow-hidden flex items-center justify-center relative">
                          {photo ? (
                            <img src={photo} alt={`Site Work ${idx + 1}`} className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-center p-4 text-slate-400 space-y-1">
                              <ImageIcon className="w-8 h-8 mx-auto opacity-50" />
                              <p className="text-[11px]">Click to upload photo #{idx + 1}</p>
                            </div>
                          )}
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleSitePhotoUpload(e, idx)}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Daily Reports History</h2>
                <p className="text-xs text-slate-500">All archived daily progress logs for UML MSS Pellet Plant</p>
              </div>
              <div className="text-xs font-semibold bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
                {reports.length} Reports Recorded
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map((rep) => (
                <div 
                  key={rep.date} 
                  onClick={() => { setCurrentDate(rep.date); setActiveTab('report'); }}
                  className="bg-slate-50 hover:bg-amber-50/40 border border-slate-200 hover:border-amber-300 p-4 rounded-xl cursor-pointer transition shadow-sm space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                      <Calendar className="w-4 h-4 text-amber-600" />
                      <span>{rep.date}</span>
                    </span>
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded">
                      {rep.weather}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100">
                    <div><span className="font-medium text-slate-500">Project:</span> {rep.project}</div>
                    <div><span className="font-medium text-slate-500">Labour:</span> {rep.labourCount || 'N/A'}</div>
                    <div className="col-span-2 truncate"><span className="font-medium text-slate-500">Reported By:</span> {rep.reportedBy}</div>
                  </div>

                  <div className="text-xs text-slate-500 italic truncate">
                    "{rep.issuesDelay || 'No issues reported'}"
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI INSIGHTS TAB */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-6 shadow-md border border-indigo-900/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                  <h2 className="text-base font-bold tracking-tight">AI Site Executive Advisor</h2>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Get instant AI-powered bottleneck analysis, labor productivity breakdown, and recommendations for tomorrow based on today's progress table and delay logs.
                </p>
                {aiInsight && (
                  <div className="mt-4 bg-slate-800/90 border border-indigo-500/30 p-4 rounded-lg text-xs leading-relaxed whitespace-pre-line text-slate-200">
                    {aiInsight}
                  </div>
                )}
              </div>
              <button 
                onClick={getAiInsight}
                disabled={isAnalyzing}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-lg text-xs transition flex items-center space-x-2 shrink-0 shadow-lg"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Site...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate AI Site Briefing</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Floating Save Day's Data Bar */}
      {activeTab === 'report' && activeReport && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center space-x-4 animate-slide-up">
          <div className="text-xs">
            <span className="font-bold text-amber-400 block">Report: {activeReport.date}</span>
            <span className="text-slate-300">2 Site Photos Required</span>
          </div>
          <button 
            onClick={handleSaveReport}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow transition flex items-center space-x-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Save Day's Data</span>
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 mt-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Pellet Plant Civil Works Monitoring System — UML MSS Project</span>
          </div>
          <div className="text-slate-500">
            Powered by Google AI Studio & Gemini API
          </div>
        </div>
      </footer>
    </div>
  );
}
