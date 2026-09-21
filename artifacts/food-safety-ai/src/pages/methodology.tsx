import { useMemo } from 'react';
import { Link } from 'wouter';
import { AlertTriangle, ArrowRight, Check, CircleDot, ScanLine, SlidersHorizontal, Sparkles } from 'lucide-react';
import { getGetFoodModelInfoQueryKey, getGetFoodPipelineInfoQueryKey, useGetFoodModelInfo, useGetFoodPipelineInfo } from '@workspace/api-client-react';

const fallbackStages = [
  { id: 'capture', label: 'Image capture', description: 'A single package image enters the workspace with its original pixels preserved.', status: 'ready' },
  { id: 'preprocess', label: 'Preprocessing', description: 'Contrast, orientation, and crop improvements make label text easier to read.', status: 'ready' },
  { id: 'vision', label: 'Visual classification', description: 'A trained classifier estimates the most likely food category from package cues.', status: 'ready' },
  { id: 'ocr', label: 'OCR extraction', description: 'Printed fields are located and transcribed with source-aware confidence.', status: 'ready' },
  { id: 'logic', label: 'Expiry logic', description: 'Dates are normalized and compared with the current date when a usable date is found.', status: 'ready' },
  { id: 'risk', label: 'Risk screening', description: 'Signals are combined into a transparent risk band, not a binary safety verdict.', status: 'ready' },
];

export default function Methodology() {
  const pipeline = useGetFoodPipelineInfo({ query: { queryKey: getGetFoodPipelineInfoQueryKey() } });
  const model = useGetFoodModelInfo({ query: { queryKey: getGetFoodModelInfoQueryKey() } });
  const stages = useMemo(() => pipeline.data?.stages ?? fallbackStages, [pipeline.data]);
  const modelInfo = model.data;

  return (
    <div className="page-wrap">
      <section className="method-hero animate-in">
        <div>
          <div className="eyebrow"><span className="eyebrow-rule" />How the readout is built</div>
          <h1 className="display-heading mt-5 max-w-3xl">A screening chain you can <em>follow.</em></h1>
          <p className="mt-6 max-w-2xl text-[15px] leading-7 text-muted-foreground">Food Safety AI turns one package image into a structured research note. Each stage leaves a trace, so the output can be challenged, learned from, and improved.</p>
        </div>
        <div className="method-hero-stamp">
          <ScanLine size={34} strokeWidth={1.3} />
          <span>TRACEABLE<br />BY DESIGN</span>
        </div>
      </section>

      <section className="method-section">
        <div className="section-kicker">01 / Pipeline anatomy</div>
        <div className="pipeline-list">
          {stages.map((stage, index) => (
            <div className="pipeline-row" key={stage.id} data-testid={`method-stage-${stage.id}`}>
              <div className="pipeline-index">{String(index + 1).padStart(2, '0')}</div>
              <div className="pipeline-icon"><CircleDot size={16} /></div>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-[17px] font-bold">{stage.label}</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{stage.description}</p>
              </div>
              <div className="hidden items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-emerald-700 sm:flex"><Check size={13} /> {stage.status}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="method-grid">
        <article className="method-card method-card-ink">
          <div className="method-card-icon"><SlidersHorizontal size={19} /></div>
          <div className="section-kicker text-accent">Computer vision</div>
          <h2 className="mt-3 font-display text-2xl font-bold">Make the label legible.</h2>
          <p className="mt-3 text-sm leading-6 text-sidebar-foreground/68">The image is prepared before any reading happens. This can include orientation correction, contrast balancing, and focused crops. Preprocessing improves signal; it never adds information that was not in the photograph.</p>
          <div className="mt-6 flex flex-wrap gap-2">{(pipeline.data?.visionLibrary ? [pipeline.data.visionLibrary] : ['OpenCV-compatible vision layer', 'contrast normalization']).map((item) => <span className="dark-chip" key={item}>{item}</span>)}</div>
        </article>
        <article className="method-card">
          <div className="method-card-icon method-card-icon-light"><Sparkles size={19} /></div>
          <div className="section-kicker">OCR + date reasoning</div>
          <h2 className="mt-3 font-display text-2xl font-bold">Read fields, then show your work.</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">OCR output stays available beside normalized fields. Expiry status depends on the date signal and its confidence—an absent or ambiguous date is reported as unavailable, never silently assumed safe.</p>
          <div className="mt-6 rounded-lg border border-border bg-background/60 p-3 font-mono text-[10px] leading-5 text-muted-foreground">RAW TEXT → FIELD CANDIDATE → DATE LOGIC</div>
        </article>
        <article className="method-card">
          <div className="method-card-icon method-card-icon-light"><Sparkles size={19} /></div>
          <div className="section-kicker">Risk model</div>
          <h2 className="mt-3 font-display text-2xl font-bold">A probability, not a promise.</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">The classifier combines visual category cues, extracted dates, and risk indicators into an interpretable band. Confidence describes model certainty—not the real-world safety of the food.</p>
          <div className="mt-6 flex flex-wrap gap-2">{(modelInfo?.classes ?? ['low', 'moderate', 'high']).map((item) => <span className="soft-chip" key={item}>{item}</span>)}</div>
        </article>
      </section>

      <section className="model-band">
        <div>
          <div className="section-kicker text-accent">Active model card</div>
          <h2 className="mt-3 font-display text-2xl font-bold text-sidebar-foreground">{modelInfo?.name ?? 'Food risk screening model'}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-sidebar-foreground/60">{modelInfo?.trainingNote ?? 'Model metadata will appear here when the analysis service is connected.'}</p>
        </div>
        <div className="model-stats">
          <div><span>Algorithm</span><strong>{modelInfo?.algorithm ?? '—'}</strong></div>
          <div><span>Version</span><strong>{modelInfo?.version ?? '—'}</strong></div>
          <div><span>Training samples</span><strong>{modelInfo ? modelInfo.trainedSamples.toLocaleString() : '—'}</strong></div>
        </div>
      </section>

      <section className="disclaimer-panel">
        <div className="disclaimer-symbol"><AlertTriangle size={23} /></div>
        <div>
          <div className="section-kicker text-destructive">Laboratory confirmation required</div>
          <h2 className="mt-2 font-display text-xl font-bold">This tool screens. It does not certify.</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">A photograph can be incomplete, the print can be obscured, and a model can be wrong. Do not use this output as a substitute for a laboratory test, regulatory inspection, sensory evaluation, or professional food-safety judgment. When risk matters, isolate the product and follow your local protocol.</p>
          <Link data-testid="link-methodology-to-workspace" href="/" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">Run a sample <ArrowRight size={15} /></Link>
        </div>
      </section>
    </div>
  );
}