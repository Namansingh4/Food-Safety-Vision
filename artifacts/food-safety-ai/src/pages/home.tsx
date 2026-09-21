import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Braces, CalendarClock, Camera, Check, CheckCircle2, Clock3, Cpu, Database, FileText, Gauge, Info, RotateCcw, ScanText, ShieldCheck, Tag, UploadCloud, X } from 'lucide-react';
import { getGetFoodPipelineInfoQueryKey, getHealthCheckQueryKey, useAnalyzeFoodImage, useGetFoodPipelineInfo, useHealthCheck, type FoodAnalysis, type FoodExtractedField } from '@workspace/api-client-react';

const demoStages = [
  { id: 'capture', label: 'Image capture', description: 'Image received and preserved' },
  { id: 'preprocess', label: 'Preprocessing', description: 'Balancing contrast and orientation' },
  { id: 'vision', label: 'Visual classification', description: 'Estimating package category' },
  { id: 'ocr', label: 'OCR extraction', description: 'Reading printed fields' },
  { id: 'logic', label: 'Expiry logic', description: 'Normalizing date signals' },
  { id: 'risk', label: 'Risk screening', description: 'Combining interpretable indicators' },
];

function confidence(value: number) {
  return `${Math.round(value * 100)}%`;
}

function prettyDate(value: string) {
  if (!value || value === '—') return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function fieldValue(field: FoodExtractedField | undefined) {
  return field?.value || 'Not detected';
}

function UploadPanel({ onFile, selectedFile, preview, onClear, disabled }: { onFile: (file: File) => void; selectedFile: File | null; preview: string; onClear: () => void; disabled: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const acceptFile = (file?: File) => {
    if (file && file.type.startsWith('image/')) onFile(file);
  };

  return (
    <section className="upload-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="section-kicker">Input / one image</div>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">Bring a package into focus.</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Use a clear front or label photo. The readout works best when dates and ingredients are in frame.</p>
        </div>
        <div className="hidden rounded-full border border-border bg-background p-2.5 text-primary sm:block"><Camera size={19} /></div>
      </div>

      {selectedFile && preview ? (
        <div className="selected-file mt-7">
          <img data-testid="img-upload-preview" src={preview} alt="Selected package preview" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold">{selectedFile.name}</div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB / ready to analyze</div>
          </div>
          <button data-testid="button-clear-upload" type="button" aria-label="Remove selected image" onClick={onClear} disabled={disabled} className="icon-button"><X size={16} /></button>
        </div>
      ) : (
        <button
          data-testid="button-upload-dropzone"
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => { event.preventDefault(); setDragging(false); acceptFile(event.dataTransfer.files[0]); }}
          className={`upload-dropzone mt-7 ${dragging ? 'upload-dropzone-active' : ''}`}
        >
          <div className="upload-icon"><UploadCloud size={23} /></div>
          <span className="mt-4 text-sm font-bold">{dragging ? 'Release to stage the image' : 'Drop an image here or browse'}</span>
          <span className="mt-1 text-xs text-muted-foreground">JPG, PNG, WEBP / one file / 10 MB max</span>
        </button>
      )}
      <input data-testid="input-food-image" ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => acceptFile(event.target.files?.[0])} />
      <div className="mt-6 flex items-center gap-2 text-[11px] text-muted-foreground"><Info size={13} /> Your image is used for this analysis request only.</div>
    </section>
  );
}

function Pipeline({ active, stages }: { active: boolean; stages: Array<{ id: string; label: string; description: string; status?: string }> }) {
  const [activeStage, setActiveStage] = useState(0);
  useEffect(() => {
    if (!active) { setActiveStage(0); return; }
    const timer = window.setInterval(() => setActiveStage((value) => Math.min(value + 1, stages.length - 1)), 950);
    return () => window.clearInterval(timer);
  }, [active, stages.length]);

  return (
    <section className="pipeline-card">
      <div className="flex items-start justify-between gap-4">
        <div><div className="section-kicker">Live pipeline</div><h2 className="mt-2 font-display text-xl font-bold">{active ? 'Following the signal…' : 'Analysis chain'}</h2></div>
        <div data-testid="status-pipeline" className={`pipeline-status ${active ? 'pipeline-status-active' : 'pipeline-status-ready'}`}><span className="status-dot" />{active ? 'processing' : 'ready'}</div>
      </div>
      <div className="pipeline-track">
        {stages.map((stage, index) => {
          const complete = active ? index < activeStage : false;
          const current = active && index === activeStage;
          return (
            <div className={`pipeline-stage ${complete ? 'pipeline-stage-complete' : ''} ${current ? 'pipeline-stage-current' : ''}`} key={stage.id} data-testid={`pipeline-stage-${stage.id}`}>
              <div className="pipeline-stage-marker">{complete ? <Check size={13} /> : <span>{String(index + 1).padStart(2, '0')}</span>}</div>
              <div className="min-w-0"><div className="text-[12px] font-bold">{stage.label}</div><div className="mt-1 text-[11px] leading-4 text-muted-foreground">{current ? stage.description : complete ? 'Complete' : stage.description}</div></div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ConfidenceBar({ label, value, tone = 'teal' }: { label: string; value: number; tone?: 'teal' | 'amber' | 'red' }) {
  return <div className="confidence-row"><div className="flex justify-between gap-3 text-[11px]"><span className="font-semibold">{label}</span><span className="font-mono text-muted-foreground">{confidence(value)}</span></div><div className="confidence-track"><div className={`confidence-fill confidence-fill-${tone}`} style={{ width: `${Math.max(4, Math.min(100, value * 100))}%` }} /></div></div>;
}

function RiskBadge({ level }: { level: FoodAnalysis['riskLevel'] }) {
  return <span data-testid="badge-risk-level" className={`risk-badge risk-${level}`}>{level}</span>;
}

function Report({ analysis }: { analysis: FoodAnalysis }) {
  const extractedRows: Array<[string, keyof FoodAnalysis['extracted'], boolean]> = [
    ['Product name', 'productName', false], ['Brand', 'brand', false], ['Manufacturing date', 'manufacturingDate', true], ['Expiry date', 'expiryDate', true],
    ['Best before', 'bestBefore', true], ['Batch / lot', 'batchNumber', false], ['Ingredients', 'ingredients', false], ['MRP', 'mrp', false],
  ];
  const expiryTone = analysis.expiryStatus === 'expired' ? 'red' : analysis.expiryStatus === 'not_expired' ? 'teal' : 'amber';
  return (
    <div className="report-stack animate-in">
      <div className="report-header">
        <div>
          <div className="eyebrow"><span className="eyebrow-rule" />Latest readout</div>
          <h2 data-testid="text-analysis-title" className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">{analysis.extracted.productName?.value || 'Package analysis'}</h2>
          <p data-testid="text-analysis-meta" className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{analysis.filename} <span className="mx-2 text-border">/</span> {prettyDate(analysis.analyzedAt)} <span className="mx-2 text-border">/</span> ID {analysis.analysisId.slice(0, 8)}</p>
        </div>
        <div className="analysis-complete"><CheckCircle2 size={16} /> readout complete</div>
      </div>

      <div className="report-top-grid">
        <div className={`expiry-card expiry-card-${expiryTone}`}>
          <div className="flex items-start justify-between"><div className="mini-label">Expiry signal</div><CalendarClock size={19} /></div>
          <div data-testid="status-expiry" className="mt-8 font-display text-3xl font-bold">{analysis.expiryStatus === 'expired' ? 'Expired' : analysis.expiryStatus === 'not_expired' ? 'Within date' : 'Unavailable'}</div>
          <p className="mt-2 text-sm leading-6 opacity-80">{analysis.expiryMessage}</p>
          <div className="mt-7 border-t border-current/15 pt-3 font-mono text-[10px] uppercase tracking-wider opacity-70">date confidence / {confidence(analysis.expiryConfidence)}</div>
        </div>
        <div className="summary-card">
          <div className="mini-label">Model summary</div>
          <div className="mt-5 flex items-end justify-between gap-4"><div><div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Risk band</div><div className="mt-2"><RiskBadge level={analysis.riskLevel} /></div></div><Gauge size={34} className="text-primary/70" /></div>
          <div className="mt-6"><ConfidenceBar label="Risk confidence" value={analysis.riskConfidence} tone={analysis.riskLevel === 'high' ? 'red' : analysis.riskLevel === 'moderate' ? 'amber' : 'teal'} /></div>
          <div className="mt-5 flex items-center justify-between border-t border-border pt-4"><span className="text-xs text-muted-foreground">Category</span><span data-testid="text-food-category" className="text-sm font-bold">{analysis.foodCategory} <span className="ml-1 font-mono text-[10px] font-normal text-muted-foreground">{confidence(analysis.categoryConfidence)}</span></span></div>
        </div>
        <div className="probability-card">
          <div className="mini-label">Risk probabilities</div>
          <div className="mt-5 space-y-4">{analysis.riskProbabilities.map((item) => <ConfidenceBar key={item.label} label={item.label} value={item.probability} tone={item.label === 'high' ? 'red' : item.label === 'moderate' ? 'amber' : 'teal'} />)}</div>
        </div>
      </div>

      <div className="report-columns">
        <section className="report-section">
          <div className="report-section-heading"><div><div className="section-kicker">Evidence / extracted fields</div><h3 className="mt-2 font-display text-xl font-bold">What the label yielded</h3></div><Tag size={18} className="text-muted-foreground" /></div>
          <div className="field-grid">{extractedRows.map(([label, key, isDate]) => { const field = analysis.extracted[key]; return <div className="field-cell" key={key}><div className="field-label">{label}<span className="field-source">{field?.source || '—'}</span></div><div data-testid={`text-field-${key}`} className="field-value">{isDate ? prettyDate(fieldValue(field)) : fieldValue(field)}</div><div className="mt-2"><ConfidenceBar label="confidence" value={field?.confidence ?? 0} /></div></div>; })}</div>
        </section>
        <section className="report-section">
          <div className="report-section-heading"><div><div className="section-kicker">Signals / attention points</div><h3 className="mt-2 font-display text-xl font-bold">Why this band?</h3></div><ShieldCheck size={18} className="text-muted-foreground" /></div>
          <div className="indicator-list">{analysis.riskIndicators.length ? analysis.riskIndicators.map((indicator, index) => <div className="indicator-row" key={`${indicator.label}-${index}`} data-testid={`indicator-${index}`}><div className={`indicator-severity indicator-severity-${indicator.severity}`} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-bold">{indicator.label}</span><span className={`severity-text severity-text-${indicator.severity}`}>{indicator.severity}</span></div><p className="mt-1 text-xs leading-5 text-muted-foreground">{indicator.detail}</p></div></div>) : <div className="empty-state"><ShieldCheck size={20} /><span>No additional indicators were returned.</span></div>}</div>
        </section>
      </div>

      <div className="report-columns">
        <section className="report-section">
          <div className="report-section-heading"><div><div className="section-kicker">Trace / OCR transcript</div><h3 className="mt-2 font-display text-xl font-bold">Raw text, unedited</h3></div><ScanText size={18} className="text-muted-foreground" /></div>
          <pre data-testid="text-raw-ocr" className="ocr-box">{analysis.rawOcrText || 'No OCR text returned.'}</pre>
          <div className="mt-6"><div className="field-label mb-3">Preprocessing applied</div><div className="flex flex-wrap gap-2">{analysis.preprocessing.map((step) => <span className="soft-chip" key={step}>{step}</span>)}</div></div>
        </section>
        <section className="report-section">
          <div className="report-section-heading"><div><div className="section-kicker">Trace / model card</div><h3 className="mt-2 font-display text-xl font-bold">What ran underneath</h3></div><Cpu size={18} className="text-muted-foreground" /></div>
          <div className="meta-table"><div><span>Model</span><strong>{analysis.model.name}</strong></div><div><span>Algorithm</span><strong>{analysis.model.algorithm}</strong></div><div><span>Version</span><strong>{analysis.model.version}</strong></div><div><span>Training samples</span><strong>{analysis.model.trainedSamples.toLocaleString()}</strong></div></div>
          <div className="mt-5 flex flex-wrap gap-2">{analysis.model.features.map((feature) => <span className="soft-chip" key={feature}>{feature}</span>)}</div>
        </section>
      </div>
      <div className="disclaimer-inline"><AlertCircle size={17} /><span>{analysis.disclaimer}</span></div>
    </div>
  );
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  const analysisMutation = useAnalyzeFoodImage();
  const pipelineQuery = useGetFoodPipelineInfo({ query: { queryKey: getGetFoodPipelineInfoQueryKey() } });
  const health = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), staleTime: 30000 } });
  const stages = useMemo(() => pipelineQuery.data?.stages ?? demoStages, [pipelineQuery.data]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const selectFile = (nextFile: File) => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(nextFile);
    setAnalysis(null);
    setPreview(URL.createObjectURL(nextFile));
  };

  const clearFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null); setPreview(''); setAnalysis(null);
  };

  const analyze = () => {
    if (!file) return;
    analysisMutation.mutate({ data: { image: file } }, { onSuccess: (result) => setAnalysis(result) });
  };

  return (
    <div className="page-wrap">
      <section className="workspace-hero animate-in">
        <div>
          <div className="eyebrow"><span className="eyebrow-rule" />Lab notebook / analysis 01</div>
          <h1 className="display-heading mt-5 max-w-4xl">A clearer read on<br /><em>what’s on the label.</em></h1>
          <p className="mt-6 max-w-xl text-[15px] leading-7 text-muted-foreground">Upload a package photo for a fast, explainable screening readout. Computer vision, OCR, expiry logic, and risk signals—kept visible at every step.</p>
        </div>
        <div className="hero-aside">
          <div className={`service-pill ${health.isError ? 'service-pill-warn' : ''}`}><span className="status-dot status-dot-live" />{health.isLoading ? 'Checking services' : health.isError ? 'Service needs attention' : 'Analysis service online'}</div>
          <div className="hero-equation"><span>PHOTO</span><b>+</b><span>LABEL</span><b>→</b><strong>READOUT</strong></div>
        </div>
      </section>

      <div className="workspace-grid">
        <div className="space-y-5">
          <UploadPanel onFile={selectFile} selectedFile={file} preview={preview} onClear={clearFile} disabled={analysisMutation.isPending} />
          {file && !analysis && <button data-testid="button-analyze-image" type="button" onClick={analyze} disabled={analysisMutation.isPending} className="primary-action">{analysisMutation.isPending ? <><span className="loading-squares"><i /><i /><i /></span>Working through the label…</> : <><ScanText size={17} />Analyze this image</>}</button>}
          {analysisMutation.isError && <div role="alert" className="error-panel"><AlertCircle size={18} /><div><div className="font-bold">This image could not be analyzed.</div><p className="mt-1 text-xs text-muted-foreground">{(analysisMutation.error as { message?: string })?.message || 'Check the image and try again.'}</p><button data-testid="button-retry-analysis" type="button" onClick={analyze} className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-destructive hover:underline"><RotateCcw size={13} /> Retry request</button></div></div>}
          {!file && !analysis && <div className="empty-workspace"><div className="empty-orbit"><Database size={21} /></div><div><div className="font-display text-base font-bold">Your notebook is ready.</div><p className="mt-1 text-sm leading-6 text-muted-foreground">Start with one package image. The report will appear here once the signal has been read.</p></div></div>}
        </div>
        <Pipeline active={analysisMutation.isPending} stages={stages} />
      </div>

      {analysis && <Report analysis={analysis} />}

      {!analysis && <section className="trust-strip"><div className="trust-item"><FileText size={16} /><div><strong>Explainable fields</strong><span>Every extraction carries source + confidence.</span></div></div><div className="trust-item"><Clock3 size={16} /><div><strong>Fast screening</strong><span>Designed for a useful first read in seconds.</span></div></div><div className="trust-item"><Braces size={16} /><div><strong>Traceable output</strong><span>Raw OCR and model metadata stay attached.</span></div></div></section>}
    </div>
  );
}