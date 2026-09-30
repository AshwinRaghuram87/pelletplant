import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

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

// Initial 33 locations / elements clean
let locationsDB: LocationItem[] = Array.from({ length: 33 }, (_, i) => ({
  itemNumber: i + 1,
  locationName: ``,
  riskNumber: 1,
  impediments: ``,
  excavationStatus: 'Pending',
  shiftingStatus: 'Pending',
  erectionStatus: 'Pending',
  finalStatus: 'Pending',
}));


interface DailyReport {
  date: string; // YYYY-MM-DD or DD-MM-YYYY
  project: string;
  weather: string;
  labourCount: number | '';
  craneEquip: string;
  reportedBy: string;
  stages: StageItem[];
  elementsInstalled: string;
  issuesDelay: string;
  planForTomorrow: string;
  sitePhotos: string[]; // 2 numbers of daily work site photos
}

// Clean template for stages
const defaultStages: StageItem[] = [
  { id: '1', stageName: 'Rod Bending', unit: 'nos', target: 0, today: 0, previousTotal: 0, totalRequired: 33, remarks: 'OK' },
  { id: '2', stageName: 'Ready for Conc.', unit: 'nos', target: 0, today: 0, previousTotal: 0, totalRequired: 33, remarks: 'OK' },
  { id: '3', stageName: 'Concreting', unit: 'nos', target: 0, today: 0, previousTotal: 0, totalRequired: 33, remarks: 'OK' },
  { id: '4', stageName: 'Erection', unit: 'nos', target: 0, today: 0, previousTotal: 0, totalRequired: 33, remarks: 'OK' },
  { id: '5', stageName: 'Curing', unit: 'nos', target: 0, today: 0, previousTotal: 0, totalRequired: 33, remarks: 'OK' },
  { id: '6', stageName: 'Excavation', unit: 'nos', target: 0, today: 0, totalRequired: 33, previousTotal: 0, remarks: 'OK' },
  { id: '7', stageName: 'Shifting and Installation', unit: 'nos', target: 0, today: 0, previousTotal: 0, totalRequired: 33, remarks: 'OK' },
  { id: '8', stageName: 'Filling', unit: 'nos', target: 0, today: 0, previousTotal: 0, totalRequired: 33, remarks: 'OK' },
];

// Initial report representing progress till now (2026-09-30)
const initialReportDate = '2026-09-30';
let reportsDB: Record<string, DailyReport> = {
  [initialReportDate]: {
    date: initialReportDate,
    project: 'UML MSS',
    weather: 'Normal',
    labourCount: 0,
    craneEquip: 'NA',
    reportedBy: 'System',
    stages: defaultStages.map(s => s.stageName === 'Rod Bending' ? { ...s, today: 13 } : s),
    elementsInstalled: 'Initial 13 Rod Bending items completed since 25-09-2026',
    issuesDelay: 'Initial setup phase',
    planForTomorrow: 'Start full daily data entry',
    sitePhotos: ['', ''],
  }
};

let projectStatus = "Project initialized. Initial 13 Rod Bending items completed.";

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  const PORT = Number(process.env.PORT || 3000);

  // API Routes
  app.get('/api/project-status', (req, res) => {
    res.json({ status: projectStatus });
  });

  app.post('/api/project-status', (req, res) => {
    const { status } = req.body;
    if (typeof status !== 'string') {
      return res.status(400).json({ error: 'Status must be a string' });
    }
    projectStatus = status;
    res.json({ success: true, status: projectStatus });
  });

  app.get('/api/locations', (req, res) => {
    res.json(locationsDB);
  });

  app.post('/api/locations', (req, res) => {
    const locations: LocationItem[] = req.body;
    if (!Array.isArray(locations)) {
      return res.status(400).json({ error: 'Invalid locations payload' });
    }
    locationsDB = locations;
    res.json({ success: true, locations: locationsDB });
  });

  app.get('/api/reports', (req, res) => {
    res.json(Object.values(reportsDB).sort((a, b) => a.date.localeCompare(b.date)));
  });

  app.get('/api/reports/:date', (req, res) => {
    const date = req.params.date;
    const report = reportsDB[date];
    if (!report) {
      // Create a default report for this date, carrying over previous totals from the latest prior date if available
      const dates = Object.keys(reportsDB).sort();
      const latestDate = dates.reverse().find(d => d < date);
      let prevStages = defaultStages.map(s => ({ ...s, previousTotal: 0, today: 0 }));
      
      if (latestDate && reportsDB[latestDate]) {
        prevStages = reportsDB[latestDate].stages.map(s => {
          const totalToDate = s.previousTotal + s.today;
          return {
            ...s,
            previousTotal: totalToDate,
            today: 0,
          };
        });
      }

      const newReport: DailyReport = {
        date,
        project: 'UML MSS',
        weather: 'Normal',
        labourCount: '',
        craneEquip: 'NA',
        reportedBy: 'Ashwin',
        stages: prevStages,
        elementsInstalled: '',
        issuesDelay: '',
        planForTomorrow: '',
        sitePhotos: [],
      };
      reportsDB[date] = newReport;
      return res.json(newReport);
    }
    res.json(report);
  });

  app.post('/api/reports', (req, res) => {
    const report: DailyReport = req.body;
    if (!report || !report.date) {
      return res.status(400).json({ error: 'Invalid report data or missing date' });
    }
    reportsDB[report.date] = report;
    res.json({ success: true, report });
  });

  // Roll over to next day
  app.post('/api/reports/rollover', (req, res) => {
    const { fromDate, toDate } = req.body;
    const sourceReport = reportsDB[fromDate];
    if (!sourceReport) {
      return res.status(404).json({ error: 'Source report not found' });
    }

    const carriedStages = sourceReport.stages.map(s => {
      const totalToDate = s.previousTotal + s.today;
      return {
        ...s,
        previousTotal: totalToDate,
        today: 0,
      };
    });

    const targetReport: DailyReport = {
      date: toDate,
      project: sourceReport.project,
      weather: sourceReport.weather,
      labourCount: sourceReport.labourCount,
      craneEquip: sourceReport.craneEquip,
      reportedBy: sourceReport.reportedBy,
      stages: carriedStages,
      elementsInstalled: '',
      issuesDelay: '',
      planForTomorrow: '',
      sitePhotos: [],
    };

    reportsDB[toDate] = targetReport;
    res.json({ success: true, report: targetReport });
  });

  // AI OCR report extraction from image upload
  app.post('/api/ai/ocr-report', async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'Missing image data' });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            inlineData: {
              data: imageBase64,
              mimeType: mimeType || 'image/png',
            },
          },
          {
            text: `Extract daily precast and civil works report data from this image into JSON format matching this TypeScript structure:
{
  "project": string,
  "date": string (YYYY-MM-DD format if possible),
  "weather": string,
  "labourCount": number,
  "craneEquip": string,
  "reportedBy": string,
  "stages": [
    {
      "stageName": "Rod Bending" | "Ready for Conc." | "Concreting" | "Erection" | "Curing" | "Excavation" | "Shifting and Installation" | "Filling" (or similar),
      "unit": string,
      "target": number,
      "today": number,
      "previousTotal": number,
      "totalRequired": number,
      "remarks": "OK" | "Delayed"
    }
  ],
  "elementsInstalled": string,
  "issuesDelay": string,
  "planForTomorrow": string
}
Return ONLY valid JSON.`,
          },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const jsonText = response.text || '{}';
      const parsedData = JSON.parse(jsonText);
      res.json({ success: true, data: parsedData });
    } catch (err: any) {
      console.error('OCR Error:', err);
      res.status(500).json({ error: err.message || 'Failed to process image with AI' });
    }
  });

  // AI Site Insights & Delay Mitigation
  app.post('/api/ai/site-insight', async (req, res) => {
    try {
      const report: DailyReport = req.body;
      const prompt = `Analyze this daily civil & precast works report for a pellet plant and provide executive insights:
Project: ${report.project}
Date: ${report.date}
Weather: ${report.weather}
Labour: ${report.labourCount}
Crane/Equip: ${report.craneEquip}
Stages: ${JSON.stringify(report.stages)}
Issues/Delay: ${report.issuesDelay}
Plan for tomorrow: ${report.planForTomorrow}

Provide 3 concise bullet points:
1. Progress Summary & Bottlenecks (highlighting any delayed stages where Today < Target)
2. Resource & Labor Productivity Advice
3. Recommendations for Tomorrow's Plan
Return plain text with clear headings.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      res.json({ success: true, insight: response.text });
    } catch (err: any) {
      console.error('AI Insight Error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate AI insight' });
    }
  });

  // Vite middleware for dev
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
