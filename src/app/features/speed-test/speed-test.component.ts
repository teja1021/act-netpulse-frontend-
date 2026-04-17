import {
  Component, OnDestroy, AfterViewInit,
  ViewChild, ElementRef, signal, computed, inject
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
import { SpeedTestService } from '../../core/services/speed-test.service';
import { LogService } from '../../core/services/log.service';

@Component({
  selector: 'app-speed-test',
  standalone: true,
  imports: [],
  template: `
@if (offline()) {
<!-- Full-page offline screen -->
<div class="offline-page">
  <div class="op-card">
    <div class="op-icon">
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <line x1="1" y1="1" x2="23" y2="23"/>
        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
        <path d="M10.71 5.05A16 16 0 0 1 22.56 9"/>
        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
        <line x1="12" y1="20" x2="12.01" y2="20"/>
      </svg>
    </div>
    <h2 class="op-title">No Internet Connection</h2>
    <p class="op-desc">It looks like you're offline. Please check your Wi-Fi or network cable and make sure you have an active internet connection.</p>
    <div class="op-tips">
      <div class="op-tip">💡 Check if your Wi-Fi is turned on</div>
      <div class="op-tip">🔌 Verify your router/modem is working</div>
      <div class="op-tip">📡 Try moving closer to your router</div>
    </div>
    <button class="op-retry" (click)="retryConnection()">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
      Try Again
    </button>
  </div>
</div>
} @else {
<!-- Hero -->
<div class="hero-banner">
  <h1>Internet <span>Speed Test</span></h1>
  <p>Real-time download, upload &amp; latency measurement against your subscribed plan</p>
</div>

<div class="st-layout">

  <!-- LEFT CARD: Meter + metrics + steps -->
  <div class="card st-left">

    <div class="meter-title">DOWNLOAD SPEED</div>

    <!-- Canvas Speedometer -->
    <div class="canvas-wrap">
      <canvas #meterCvs width="320" height="195"></canvas>
      <div class="speed-center">
        <div class="speed-big">{{ smooth().toFixed(0) }}</div>
        <div class="speed-unit">Mbps</div>
      </div>
    </div>

    <!-- 3 Metric boxes -->
    <div class="metric-row">
      <div class="metric-box">
        <div class="mb-label">DOWNLOAD</div>
        <div class="mb-line dl-line"></div>
        <div class="mb-val dl-val">{{ st().download > 0 ? st().download : '' }}</div>
        <div class="mb-unit">Mbps</div>
      </div>
      <div class="metric-box">
        <div class="mb-label">UPLOAD</div>
        <div class="mb-line ul-line"></div>
        <div class="mb-val ul-val">{{ st().upload > 0 ? st().upload : '' }}</div>
        <div class="mb-unit">Mbps</div>
      </div>
      <div class="metric-box">
        <div class="mb-label">LATENCY</div>
        <div class="mb-line lat-line"></div>
        <div class="mb-val lat-val">{{ st().latency > 0 ? st().latency : '' }}</div>
        <div class="mb-unit">ms</div>
      </div>
    </div>

    <!-- Progress bar while testing -->
    @if (st().phase !== 'idle' && st().phase !== 'done') {
      <div class="prog-wrap">
        <div class="prog-bar"><div class="prog-fill" [style.width.%]="st().progress"></div></div>
      </div>
    }

    <!-- START button -->
    <button class="start-btn" (click)="startTest()" [disabled]="testing()">
      @if (testing()) {
        <div class="spin-white"></div> TESTING…
      } @else {
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        {{ st().phase === 'done' ? 'RUN AGAIN' : 'START SPEED TEST' }}
      }
    </button>

    <!-- Steps list (shown while testing or idle) -->
    @if (st().phase !== 'done') {
      <div class="steps-list">
        @for (step of steps; track step.n) {
          <div class="step-item" [class.step-active]="step.phase === st().phase" [class.step-done]="isStepDone(step.phase)">
            <div class="step-num">{{ isStepDone(step.phase) ? '✓' : step.n }}</div>
            <span>{{ step.label }}</span>
          </div>
        }
      </div>
    }

    <!-- Jitter info after test -->
    @if (st().phase === 'done' && st().jitter > 0) {
      <div class="jitter-row">
        <span class="jitter-label">Jitter</span>
        <span class="jitter-val">{{ st().jitter }} ms</span>
        <span class="jitter-sep">·</span>
        <span class="jitter-label">Server</span>
        <span class="jitter-val">{{ st().server ? st().server!.city + ', ' + st().server!.country + ' (M-Lab)' : 'Localhost' }}</span>
      </div>
    }

    <!-- ═══════════════════════════════════════════════
         SPEED SUMMARY CARD (only after test completes)
         ═══════════════════════════════════════════════ -->
    @if (st().phase === 'done' && st().download > 0) {
      <div class="card speed-summary-card">

        <div class="ssc-head">
          <span class="ssc-icon">⚡</span>
          <h3>Speed Summary</h3>
        </div>

        <div class="info-title">
          <span class="info-icon">🌐</span>
          <span>How is my internet connection?</span>
        </div>

        <div class="speed-result-box" [class]="speedSummaryClass()">
          <div class="srb-content">
            <div class="srb-title">{{ speedGrade().title }}</div>
          </div>
          <div class="srb-mbps">{{ st().download }}<span>Mbps</span></div>
        </div>

        <div class="what-title">
          <span class="what-icon">?</span>
          What can I do with this connection?
        </div>
        <div class="what-box">
          <div class="speed-detail-text" [innerHTML]="speedGrade().desc"></div>
        </div>

      </div>
    }

  </div>

  <!-- RIGHT COLUMN -->
  <div class="st-right">

    <!-- Plan Comparison Card -->
    <div class="card plan-card">
      <div class="pc-head">
        <span class="pc-ic">📋</span>
        <h3>Plan Comparison</h3>
      </div>

      <!-- Plan box with red border -->
      <div class="plan-box">
        <div class="pb-label">YOUR PLAN — {{ user()?.plan?.name?.toUpperCase() }}</div>
        <div class="pb-speed">
          <strong>{{ user()?.plan?.download }}</strong>
          <span class="pb-mbps">Mbps</span>
        </div>
        <!-- Download bar -->
        <div class="plan-bar-row">
          <span class="pbr-label">Download</span>
          <div class="pbr-track"><div class="pbr-fill dl-fill" [style.width.%]="dlPct()"></div></div>
          <span class="pbr-pct">{{ st().download > 0 ? dlPct() + '%' : '—%' }}</span>
        </div>
        <!-- Upload bar -->
        <div class="plan-bar-row">
          <span class="pbr-label">Upload</span>
          <div class="pbr-track"><div class="pbr-fill ul-fill" [style.width.%]="ulPct()"></div></div>
          <span class="pbr-pct">{{ st().upload > 0 ? ulPct() + '%' : '—%' }}</span>
        </div>
      </div>

      <!-- Circular indicators -->
      <div class="circle-row">
        <div class="circ-item">
          <div class="circ-svg-wrap">
            <svg viewBox="0 0 80 80" width="90" height="90">
              <circle cx="40" cy="40" r="32" fill="none" stroke="#e5e7eb" stroke-width="6"/>
              <circle cx="40" cy="40" r="32" fill="none"
                stroke="#16a34a" stroke-width="6" stroke-linecap="round"
                stroke-dasharray="201.06"
                [attr.stroke-dashoffset]="201.06 - 201.06 * dlPct() / 100"
                transform="rotate(-90 40 40)"/>
            </svg>
            <div class="circ-pct">{{ dlPct() }}%</div>
          </div>
          <div class="circ-lbl">Download</div>
        </div>
        <div class="circ-item">
          <div class="circ-svg-wrap">
            <svg viewBox="0 0 80 80" width="90" height="90">
              <circle cx="40" cy="40" r="32" fill="none" stroke="#e5e7eb" stroke-width="6"/>
              <circle cx="40" cy="40" r="32" fill="none"
                stroke="#1e40af" stroke-width="6" stroke-linecap="round"
                stroke-dasharray="201.06"
                [attr.stroke-dashoffset]="201.06 - 201.06 * ulPct() / 100"
                transform="rotate(-90 40 40)"/>
            </svg>
            <div class="circ-pct">{{ ulPct() }}%</div>
          </div>
          <div class="circ-lbl">Upload</div>
        </div>
      </div>
    </div>

    <div>

  </div>
    <!-- Performance Rating Card -->
    <div class="card perf-card">
      <div class="pc-head">
        <span class="pc-ic">🏅</span>
        <h3>Performance Rating</h3>
      </div>

      @if (st().phase === 'done') {
        <!-- After test: show result -->
        <div class="perf-result" [class]="'pr-' + cat().toLowerCase()">
          <div class="pr-emoji">{{ catEmoji() }}</div>
          <div>
            <div class="pr-grade">{{ cat() }}</div>
            <div class="pr-desc">{{ perfDesc() }}</div>
          </div>
          <div class="pr-pct">{{ dlPct() }}%</div>
        </div>
        <div class="perf-stats">
          <div class="ps-row"><span>↓ Download</span><strong class="dl-val">{{ st().download }} Mbps</strong></div>
          <div class="ps-row"><span>↑ Upload</span>  <strong class="ul-val">{{ st().upload }} Mbps</strong></div>
          <div class="ps-row"><span>⚡ Latency</span><strong class="lat-val">{{ st().latency }} ms</strong></div>
          <div class="ps-row"><span>📊 Plan %</span> <strong>{{ dlPct() }}%</strong></div>
        </div>
        @if (autoSaved()) {
          <div class="saved-notice">✓ Result saved to history automatically</div>
        }
      } @else {
        <!-- Before test: awaiting state -->
        <div class="perf-awaiting">
          <div class="pa-icon">⏳</div>
          <div class="pa-title">Awaiting Test</div>
          <div class="pa-desc">Run a test to see your network health score</div>
        </div>
        <div class="grade-legend">
          <div class="gl-row"><span class="gl-dot best"></span><span><strong>Best</strong> — ≥ 90% of plan speed</span></div>
          <div class="gl-row"><span class="gl-dot good"></span><span><strong>Good</strong> — 70–89% of plan speed</span></div>
          <div class="gl-row"><span class="gl-dot avg"></span><span><strong>Average</strong> — 50–69% of plan speed</span></div>
          <div class="gl-row"><span class="gl-dot poor"></span><span><strong>Poor</strong> — &lt; 50% of plan speed</span></div>
        </div>
      }
    </div>

    <!-- ISP Info Card -->
    <div class="card isp-card">
      <div class="isp-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M1.75 7.75a10.5 10.5 0 0 1 20.5 0"/>
          <path d="M5.25 11.25a7 7 0 0 1 13.5 0"/>
          <path d="M8.75 14.75a3.5 3.5 0 0 1 6.5 0"/>
          <circle cx="12" cy="18" r="1" fill="white"/>
        </svg>
      </div>
      <div>
        <div class="isp-name">{{ user()?.plan?.isp }} — {{ user()?.plan?.city }}</div>
        <div class="isp-sub">{{ user()?.plan?.name }}</div>
      </div>
    </div>
  </div>
</div>
}
  `,
  styles: [`
    .hero-banner { background:linear-gradient(135deg,var(--navy) 0%,var(--navy3) 60%,#2a1040 100%); padding:36px 48px 40px; }
    .hero-banner h1 { font-family:var(--font-d); font-size:2.3rem; font-weight:800; color:#fff; margin-bottom:8px; }
    .hero-banner h1 span { color:var(--red); }
    .hero-banner p { font-size:.88rem; color:rgba(255,255,255,.5); }

    .st-layout { display:grid; grid-template-columns:1fr 370px; gap:20px; padding:24px 32px; max-width:1400px; margin:0 auto; }

    /* LEFT */
    .st-left { padding:24px 24px 20px; display:flex; flex-direction:column; align-items:center; gap:16px; }
    .meter-title { font-size:.7rem; font-weight:700; letter-spacing:.15em; color:var(--text2); }

    /* Canvas */
    .canvas-wrap { position:relative; width:320px; height:195px; margin:0 auto; }
    .canvas-wrap canvas { position:absolute; top:0; left:0; width:100%; height:100%; }
    .speed-center { position:absolute; bottom:36px; left:50%; transform:translateX(-50%); text-align:center; pointer-events:none; }
    .speed-big  { font-family:var(--font-d); font-size:2.2rem; font-weight:800; color:var(--text); line-height:1; }
    .speed-unit { font-size:.78rem; font-weight:600; color:var(--text2); letter-spacing:.06em; }

    /* Metrics */
    .metric-row { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; width:100%; }
    .metric-box { padding:14px 10px; background:var(--bg); border-radius:var(--r-lg); border:1px solid var(--border); text-align:center; }
    .mb-label { font-size:.6rem; font-weight:700; letter-spacing:.1em; color:var(--text2); margin-bottom:7px; text-transform:uppercase; }
    .mb-line  { width:24px; height:3px; border-radius:2px; margin:0 auto 7px; }
    .dl-line  { background:var(--green); }
    .ul-line  { background:var(--red); }
    .lat-line { background:var(--orange); }
    .mb-val   { font-family:var(--font-d); font-size:1.4rem; font-weight:700; min-height:1.4rem; line-height:1; }
    .dl-val   { color:var(--green); }
    .ul-val   { color:var(--red); }
    .lat-val  { color:var(--orange); }
    .mb-unit  { font-size:.7rem; color:var(--text2); margin-top:2px; }

    /* Progress */
    .prog-wrap { width:100%; }
    .prog-bar  { height:4px; background:var(--bg); border-radius:2px; overflow:hidden; }
    .prog-fill { height:100%; background:linear-gradient(90deg,var(--red),#ff5555); border-radius:2px; transition:width .25s ease; }

    /* Start button */
    .start-btn {
      width:100%; padding:18px; background:var(--red); color:#fff;
      border:none; border-radius:var(--r-lg); font-size:1rem; font-weight:700;
      letter-spacing:.06em; cursor:pointer; transition:all .2s;
      display:flex; align-items:center; justify-content:center; gap:10px;
      box-shadow:0 4px 16px rgba(226,0,26,.35);
    }
    .start-btn:hover:not(:disabled) { background:var(--red-dark); transform:translateY(-1px); box-shadow:0 6px 24px rgba(226,0,26,.4); }
    .start-btn:disabled { opacity:.6; cursor:not-allowed; transform:none; }
    .spin-white { width:18px; height:18px; border-radius:50%; border:2.5px solid rgba(255,255,255,.3); border-top-color:#fff; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    /* Steps */
    .steps-list { display:flex; flex-direction:column; gap:8px; width:100%; }
    .step-item { display:flex; align-items:center; gap:12px; padding:10px 14px; background:var(--bg); border-radius:var(--r-md); font-size:.84rem; color:var(--text2); border:1.5px solid var(--border); transition:all .25s; }
    .step-item.step-active { background:#fff5f5; border-color:rgba(226,0,26,.3); color:var(--text); }
    .step-item.step-done   { background:#f0fdf4; border-color:rgba(22,163,74,.2); color:var(--green); }
    .step-num { width:26px; height:26px; border-radius:50%; background:var(--border); color:var(--text2); display:flex; align-items:center; justify-content:center; font-size:.78rem; font-weight:700; flex-shrink:0; transition:all .25s; }
    .step-item.step-active .step-num { background:var(--red); color:#fff; }
    .step-item.step-done   .step-num { background:var(--green); color:#fff; }

    /* Jitter */
    .jitter-row { display:flex; align-items:center; gap:8px; font-size:.78rem; color:var(--text2); }
    .jitter-val { font-weight:600; color:var(--text); }
    .jitter-sep { color:var(--border); }

    /* ── Speed Summary Card ────────────────────────── */
    .speed-summary-card { width:100%; padding:20px; animation:fadeUp .35s ease; }
    .ssc-head { display:flex; align-items:center; gap:8px; margin-bottom:20px; }
    .ssc-head h3 { font-family:var(--font-d); font-size:1.18rem; font-weight:800; color:var(--text); }
    .ssc-icon { font-size:1.05rem; }

    .info-title {
      display:flex; align-items:center; gap:10px;
      margin-bottom:18px; font-weight:600; color:var(--text2);
      font-size:.82rem; line-height:1.4;
    }

    /* Connection quality banner */
    .speed-result-box {
      display:flex; align-items:center; gap:14px;
      padding:14px 16px; border-radius:var(--r-lg); border:1.5px solid;
      margin-bottom:12px;
    }
    .srb-content { flex:1; min-width:0; }
    .srb-title {
      font-size:.85rem; font-weight:700; line-height:1.4; color:inherit;
      margin-bottom:6px;
    }
    .srb-mbps {
      font-family:var(--font-d); font-size:1.3rem; font-weight:800; flex-shrink:0; line-height:1;
    }
    .srb-mbps span { font-size:.45rem; font-weight:600; margin-left:2px; opacity:.75; }

    .info-icon {
      display:inline-flex; align-items:center; justify-content:center;
      width:24px; height:24px; border-radius:8px;
      background:transparent; color:var(--text);
      font-size:1rem;
    }
    .what-title {
      display:flex; align-items:center; gap:8px;
      font-size:.82rem; font-weight:600;
      margin-bottom:10px; color:var(--text2);
    }
    .what-icon {
      display:inline-flex; align-items:center; justify-content:center;
      width:22px; height:22px; border-radius:6px;
      background:transparent; color:#2563eb;
      font-size:.75rem; font-weight:700;
    }
    .what-box {
      background:rgba(241,245,249,.95);
      border:1px solid rgba(100,116,139,.55);
      border-radius:var(--r-md);
      padding:14px 16px;
    }
    .speed-detail-text {
      font-size:.82rem; line-height:1.6; padding:0;
      color:var(--text); font-weight:400;
    }

    /* Colour variants — banner bg + border + text colours */
    .ss-outstanding { background:rgba(34,197,94,.09); border-color:rgba(34,197,94,.3); }
    .ss-outstanding .srb-title { color:#15803d; }
    .ss-outstanding .srb-mbps  { color:#16a34a; }

    .ss-excellent { background:rgba(34,197,94,.09); border-color:rgba(34,197,94,.3); }
    .ss-excellent .srb-title { color:#15803d; }
    .ss-excellent .srb-mbps  { color:#16a34a; }

    .ss-very-good { background:rgba(134,239,172,.1); border-color:rgba(34,197,94,.22); }
    .ss-very-good .srb-title { color:#16a34a; }
    .ss-very-good .srb-mbps  { color:#22c55e; }

    .ss-good { background:rgba(217,119,6,.09); border-color:rgba(217,119,6,.28); }
    .ss-good .srb-title { color:#92400e; }
    .ss-good .srb-mbps  { color:#b45309; }

    .ss-fair { background:rgba(217,119,6,.09); border-color:rgba(217,119,6,.28); }
    .ss-fair .srb-title { color:#92400e; }
    .ss-fair .srb-mbps  { color:#b45309; }

    .ss-slow { background:rgba(239,68,68,.08); border-color:rgba(239,68,68,.28); }
    .ss-slow .srb-title { color:#b91c1c; }
    .ss-slow .srb-mbps  { color:#dc2626; }

    .ss-very-slow { background:rgba(220,38,38,.08); border-color:rgba(220,38,38,.28); }
    .ss-very-slow .srb-title { color:#991b1b; }
    .ss-very-slow .srb-mbps  { color:#b91c1c; }

    /* RIGHT */
    .st-right { display:flex; flex-direction:column; gap:16px; }

    /* Plan card */
    .plan-card { padding:20px; }
    .pc-head   { display:flex; align-items:center; gap:8px; margin-bottom:16px; }
    .pc-head h3 { font-family:var(--font-d); font-size:1.1rem; font-weight:700; }
    .pc-ic { font-size:1.1rem; }

    .plan-box { border:1.5px solid var(--red); border-radius:var(--r-lg); padding:15px; margin-bottom:14px; }
    .pb-label { font-size:.6rem; font-weight:700; letter-spacing:.1em; color:var(--text2); margin-bottom:6px; text-transform:uppercase; }
    .pb-speed strong { font-family:var(--font-d); font-size:2.2rem; font-weight:800; color:var(--text); }
    .pb-mbps  { font-size:.9rem; color:var(--text2); margin-left:5px; }
    .pb-speed { margin-bottom:12px; }

    .plan-bar-row { display:flex; align-items:center; gap:8px; margin-bottom:8px; font-size:.78rem; color:var(--text2); }
    .plan-bar-row:last-child { margin-bottom:0; }
    .pbr-label { width:60px; flex-shrink:0; }
    .pbr-track { flex:1; height:4px; background:var(--border); border-radius:2px; overflow:hidden; }
    .pbr-fill  { height:100%; border-radius:2px; transition:width .6s ease; }
    .dl-fill   { background:var(--green); }
    .ul-fill   { background:var(--red); }
    .pbr-pct   { font-size:.75rem; font-weight:600; color:var(--text2); min-width:34px; text-align:right; }

    /* Circles */
    .circle-row { display:flex; justify-content:space-around; }
    .circ-item  { display:flex; flex-direction:column; align-items:center; gap:5px; }
    .circ-svg-wrap { position:relative; display:flex; align-items:center; justify-content:center; }
    .circ-pct   { position:absolute; font-family:var(--font-d); font-size:1.05rem; font-weight:700; color:var(--text); }
    .circ-lbl   { font-size:.73rem; color:var(--text2); }

    /* Perf card */
    .perf-card { padding:20px; }
    .perf-result { display:flex; align-items:center; gap:12px; padding:14px; border-radius:var(--r-lg); margin-bottom:14px; }
    .pr-best    { background:rgba(22,163,74,.08);  border:1px solid rgba(22,163,74,.2); }
    .pr-good    { background:rgba(30,64,175,.07);  border:1px solid rgba(30,64,175,.18); }
    .pr-average { background:rgba(217,119,6,.08);  border:1px solid rgba(217,119,6,.2); }
    .pr-poor    { background:rgba(226,0,26,.06);   border:1px solid rgba(226,0,26,.18); }
    .pr-emoji { font-size:1.8rem; flex-shrink:0; }
    .pr-grade { font-family:var(--font-d); font-size:1.3rem; font-weight:800; }
    .pr-best  .pr-grade  { color:var(--green); }
    .pr-good  .pr-grade  { color:var(--blue); }
    .pr-average .pr-grade { color:var(--orange); }
    .pr-poor  .pr-grade  { color:var(--red); }
    .pr-desc { font-size:.75rem; color:var(--text2); line-height:1.4; margin-top:2px; }
    .pr-pct  { margin-left:auto; font-family:var(--font-d); font-size:2rem; font-weight:800; color:var(--text); flex-shrink:0; }

    .perf-stats { display:flex; flex-direction:column; gap:6px; background:var(--bg); border-radius:var(--r-md); padding:11px 13px; margin-bottom:10px; }
    .ps-row { display:flex; justify-content:space-between; font-size:.82rem; color:var(--text2); }
    .ps-row strong { color:var(--text); }
    .dl-val  { color:var(--green) !important; }
    .ul-val  { color:var(--blue) !important; }
    .lat-val { color:var(--orange) !important; }

    .saved-notice { font-size:.75rem; color:var(--green); background:rgba(22,163,74,.08); border:1px solid rgba(22,163,74,.2); border-radius:var(--r-sm); padding:7px 12px; text-align:center; font-weight:600; }

    /* Awaiting */
    .perf-awaiting { display:flex; align-items:flex-start; gap:12px; padding:14px; background:#fffbeb; border-radius:var(--r-lg); border:1px solid rgba(217,119,6,.2); margin-bottom:14px; }
    .pa-icon  { font-size:1.8rem; flex-shrink:0; }
    .pa-title { font-family:var(--font-d); font-size:1.05rem; font-weight:700; color:var(--orange); }
    .pa-desc  { font-size:.78rem; color:var(--text2); margin-top:2px; }

    .grade-legend { display:flex; flex-direction:column; gap:8px; }
    .gl-row  { display:flex; align-items:center; gap:8px; font-size:.8rem; color:var(--text2); }
    .gl-dot  { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
    .gl-dot.best { background:var(--green); }
    .gl-dot.good { background:#fb923c; }
    .gl-dot.avg  { background:var(--orange); }
    .gl-dot.poor { background:var(--red); }

    /* ISP card */
    .isp-card { padding:16px 20px; display:flex; align-items:center; gap:14px; }
    .isp-icon { width:44px; height:44px; border-radius:var(--r-md); background:var(--navy); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .isp-name { font-weight:700; font-size:.9rem; color:var(--text); }
    .isp-sub  { font-size:.72rem; color:var(--text2); margin-top:2px; }

    /* Offline full-page */
    .offline-page { display:flex; align-items:center; justify-content:center; min-height:80vh; padding:40px 20px; animation:fadeUp .4s ease; }
    .op-card { text-align:center; max-width:440px; background:var(--white); border-radius:var(--r-xl); padding:48px 40px; box-shadow:0 8px 40px rgba(0,0,0,.08); border:1.5px solid #fecaca; }
    .op-icon { color:#dc2626; margin-bottom:18px; }
    .op-title { font-family:var(--font-d); font-size:1.6rem; font-weight:800; color:#991b1b; margin-bottom:8px; }
    .op-desc { font-size:.88rem; color:var(--text2); line-height:1.55; margin-bottom:22px; }
    .op-tips { display:flex; flex-direction:column; gap:8px; text-align:left; margin-bottom:24px; background:#fef2f2; border-radius:var(--r-md); padding:14px 18px; }
    .op-tip { font-size:.82rem; color:#991b1b; }
    .op-retry { display:inline-flex; align-items:center; gap:8px; padding:12px 28px; background:var(--red); color:#fff; border:none; border-radius:var(--r-lg); font-size:.92rem; font-weight:700; cursor:pointer; transition:all .2s; box-shadow:0 4px 16px rgba(226,0,26,.3); }
    .op-retry:hover { background:var(--red-dark); transform:translateY(-1px); box-shadow:0 6px 24px rgba(226,0,26,.4); }
    @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

    @media(max-width:1100px) { .st-layout { grid-template-columns:1fr; } .canvas-wrap { width:290px; height:180px; } .speed-big { font-size:2.7rem; } }

    @media(max-width:680px) {
      .hero-banner{padding:24px 16px 28px}
      .hero-banner h1{font-size:1.6rem}
      .hero-banner p{font-size:.78rem}
      .st-layout{padding:14px 10px;gap:14px}
      .st-left{padding:16px 12px 14px;gap:14px}
      .canvas-wrap{width:min(280px, 80vw);height:0;padding-bottom:calc(min(280px, 80vw) * 195 / 320);margin:0 auto}
      .speed-center{bottom:20%;left:50%;transform:translateX(-50%)}
      .speed-big{font-size:1.6rem}
      .speed-unit{font-size:.65rem}
      .meter-title{font-size:.6rem}
      .metric-row{grid-template-columns:repeat(3,1fr);gap:6px;width:100%}
      .metric-box{padding:10px 6px}
      .mb-label{font-size:.5rem;letter-spacing:.06em;margin-bottom:4px}
      .mb-line{width:18px;height:2.5px;margin-bottom:4px}
      .mb-val{font-size:1.05rem}
      .mb-unit{font-size:.6rem}
      .start-btn{padding:14px;font-size:.88rem}
      .step-item{padding:8px 10px;font-size:.78rem;gap:8px}
      .step-num{width:22px;height:22px;font-size:.7rem}
      .jitter-row{flex-wrap:wrap;justify-content:center;font-size:.72rem}
      .speed-summary-card{padding:14px}
      .ssc-head h3{font-size:.88rem}
      .speed-result-box{padding:11px 13px;gap:10px;margin-bottom:10px}
      .srb-title{font-size:.78rem}
      .srb-mbps{font-size:1.45rem}
      .srb-mbps span{font-size:.58rem}
      .ssc-usage-box{padding:10px 11px}
      .ssc-usage-label{font-size:.6rem}
      .ssc-usage-text{font-size:.74rem}
      .st-right{gap:12px}
      .plan-card,.perf-card{padding:14px}
      .pc-head h3{font-size:.95rem}
      .plan-box{padding:12px}
      .pb-speed strong{font-size:1.6rem}
      .circle-row{transform:scale(.82);transform-origin:center}
      .perf-result{padding:10px;gap:8px}
      .pr-emoji{font-size:1.3rem}
      .pr-pct{font-size:1.4rem}
      .pr-grade{font-size:1.05rem}
      .pr-desc{font-size:.7rem}
      .perf-stats{padding:9px 10px}
      .ps-row{font-size:.76rem}
      .isp-card{padding:12px 14px;gap:10px}
      .isp-icon{width:36px;height:36px}
      .isp-name{font-size:.82rem}
      .isp-sub{font-size:.66rem}
    }
  `]
})
export class SpeedTestComponent implements AfterViewInit, OnDestroy {
  @ViewChild('meterCvs') cvs!: ElementRef<HTMLCanvasElement>;
  private auth = inject(AuthService);
  private svc = inject(SpeedTestService);
  private log = inject(LogService);

  st = toSignal(this.svc.state$, { initialValue: this.svc.state$.value });
  user = this.auth.currentUser;
  testing = signal(false);
  autoSaved = signal(false);
  smooth = signal(0);
  offline = signal(false);

  private _raf = 0;
  private _d = 0;

  steps = [
    { n: 1, label: 'Measuring latency & ping', phase: 'ping' },
    { n: 2, label: 'Testing download speed', phase: 'download' },
    { n: 3, label: 'Testing upload speed', phase: 'upload' },
    { n: 4, label: 'Analyzing results', phase: 'done' }
  ];

  dlPct = computed(() => Math.min(100, Math.round((this.st().download / (this.user()?.plan?.download ?? 1)) * 100)));
  ulPct = computed(() => Math.min(100, Math.round((this.st().upload / (this.user()?.plan?.upload ?? 1)) * 100)));

  cat = computed<'Best' | 'Good' | 'Average' | 'Poor'>(() => {
    const p = this.dlPct();
    return p >= 90 ? 'Best' : p >= 70 ? 'Good' : p >= 50 ? 'Average' : 'Poor';
  });

  catEmoji = computed(() => ({ Best: '🏆', Good: '✅', Average: '⚠️', Poor: '🔴' })[this.cat()]);

  perfDesc = computed(() => {
    const p = this.dlPct();
    if (p >= 90) return 'Excellent! Delivering near-plan speed.';
    if (p >= 70) return 'Good performance from your plan.';
    if (p >= 50) return 'Average — speeds are below plan expectations.';
    return 'Below average. Consider contacting your Act\'s Network Engineer.';
  });

  speedGrade = computed(() => {
    const dl = this.st().download;
    if (dl >= 300) return {
      grade: 'Looks Outstanding',
      title: 'Your internet connection is outstanding.',
      desc: 'Your connection should effortlessly handle ultra-fast downloads, many simultaneous users, online gaming, and 4K/8K streaming all at the same time.'
    };
    if (dl >= 100) return {
      grade: 'Looks Excellent',
      title: 'Your internet connection is excellent.',
      desc: 'Your connection should comfortably support multiple 4K video streams, intense gaming, fast downloads, and numerous connected devices.'
    };
    if (dl >= 50) return {
      grade: 'Looks Very Good',
      title: 'Your internet connection is very fast.',
      desc: 'Your connection should handle 4K video streaming, online gaming, fast downloads, and support several devices simultaneously.'
    };
    if (dl >= 25) return {
      grade: 'Looks Good',
      title: 'Your internet connection is fast.',
      desc: 'Your connection should handle HD video streaming, video calls, online gaming, and multiple devices at the same time.'
    };
    if (dl >= 10) return {
      grade: 'Looks Fair',
      title: 'Your internet connection is fair.',
      desc: 'Your connection should handle HD videos and video calls on 1–2 devices. Smooth performance for standard streaming.'
    };
    if (dl >= 5) return {
      grade: 'Looks Slow',
      title: 'Your internet connection is slow.',
      desc: 'Your connection should handle basic web browsing and lower-quality video streaming on one device at a time.'
    };
    return {
      grade: 'Looks Very Slow',
      title: 'Your internet connection is very slow.',
      desc: 'Your connection is suitable for basic browsing and messaging. Video streaming may experience buffering.'
    };
  });

  speedSummaryClass = computed(() => {
    const grade = this.speedGrade().grade
      .replace(/^looks\s+/i, '')
      .toLowerCase()
      .replace(/\s+/g, '-');
    return 'ss-' + grade;
  });

  isStepDone(phase: string): boolean {
    const order = ['ping', 'download', 'upload', 'done'];
    return order.indexOf(this.st().phase) > order.indexOf(phase);
  }

  ngAfterViewInit() { this.draw(0); this.loop(); }
  ngOnDestroy() { cancelAnimationFrame(this._raf); }

  async startTest() {
    if (this.testing()) return;
    this.offline.set(false);
    this.testing.set(true);
    this.autoSaved.set(false);
    this._d = 0;
    this.svc.reset();
    try {
      const result = await this.svc.runTest();
      this.autoSave(result);
    } catch (e: any) {
      if (e?.message === 'OFFLINE') {
        this.offline.set(true);
      }
    } finally {
      this.testing.set(false);
    }
  }

  dismissOffline() { this.offline.set(false); }

  retryConnection() {
    this.offline.set(false);
    this.startTest();
  }

  private autoSave(s: { download: number; upload: number; latency: number; jitter: number; downloadPath: string; uploadPath: string; server?: { city?: string; country?: string; machine?: string } }) {
    const u = this.user();
    if (!u) return;

    let testPath: 'mlab' | 'cdn' | 'backend' | 'mixed' = 'backend';
    if (s.downloadPath === 'mlab' && s.uploadPath === 'mlab') testPath = 'mlab';
    else if (s.downloadPath === 'cdn' && s.uploadPath === 'cdn') testPath = 'cdn';
    else if (s.downloadPath !== 'backend' || s.uploadPath !== 'backend') testPath = 'mixed';

    const serverLabel = s.server
      ? `${s.server.city || ''}${s.server.country ? ', ' + s.server.country : ''} (${s.server.machine || 'M-Lab'})`
      : '';

    this.log.save({
      userId: u.userId,
      download: s.download,
      upload: s.upload,
      latency: s.latency,
      jitter: s.jitter,
      server: serverLabel,
      testPath,
      planDownload: u.plan.download,
      planUpload: u.plan.upload
    }).subscribe({
      next: () => this.autoSaved.set(true),
      error: (err) => console.error('[SpeedTest] Failed to save results:', err.status, err.message)
    });
  }

  private loop() {
    const frame = () => {
      const target = this.svc.state$.value.liveSpeed;
      this._d += (target - this._d) * 0.10;
      if (Math.abs(this._d - target) < 0.05) this._d = target;
      this.smooth.set(this._d);
      this.draw(this._d);
      this._raf = requestAnimationFrame(frame);
    };
    this._raf = requestAnimationFrame(frame);
  }

  private draw(spd: number) {
    const cv = this.cvs?.nativeElement;
    if (!cv) return;
    const ctx = cv.getContext('2d')!;
    const W = cv.width, H = cv.height, cx = W / 2, cy = H - 20, R = 128;
    ctx.clearRect(0, 0, W, H);

    const max = this.user()?.plan?.download ?? 300;
    const frac = Math.min(1, spd / max);
    const sA = Math.PI, nA = sA + frac * Math.PI;

    ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI, 2 * Math.PI);
    ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 20; ctx.lineCap = 'round'; ctx.stroke();

    const zones = [
      { from: 0, to: .5, color: '#fecaca' },
      { from: .5, to: .7, color: '#fde68a' },
      { from: .7, to: .9, color: '#bbf7d0' },
      { from: .9, to: 1.0, color: '#86efac' }
    ];
    zones.forEach(z => {
      ctx.beginPath();
      ctx.arc(cx, cy, R, sA + z.from * Math.PI, sA + z.to * Math.PI);
      ctx.strokeStyle = z.color; ctx.lineWidth = 16; ctx.lineCap = 'butt'; ctx.stroke();
    });

    [{ at: .5, c: '#f59e0b' }, { at: .7, c: '#22c55e' }, { at: .9, c: '#16a34a' }].forEach(d => {
      const a = sA + d.at * Math.PI;
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 5, 0, 2 * Math.PI);
      ctx.fillStyle = d.c; ctx.fill();
    });

    ctx.beginPath(); ctx.arc(cx + Math.cos(sA) * R, cy + Math.sin(sA) * R, 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#e2001a'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx + Math.cos(2 * Math.PI) * R, cy + Math.sin(2 * Math.PI) * R, 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#16a34a'; ctx.fill();

    for (let i = 0; i <= 10; i++) {
      const a = Math.PI + (i / 10) * Math.PI, maj = i % 2 === 0;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (R - 22), cy + Math.sin(a) * (R - 22));
      ctx.lineTo(cx + Math.cos(a) * (R - (maj ? 36 : 28)), cy + Math.sin(a) * (R - (maj ? 36 : 28)));
      ctx.strokeStyle = maj ? '#9ca3af' : '#d1d5db'; ctx.lineWidth = maj ? 2 : 1; ctx.stroke();
      if (maj) {
        ctx.fillStyle = '#6b7280'; ctx.font = '500 10px Inter,sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(Math.round(i / 10 * max)), cx + Math.cos(a) * (R - 50), cy + Math.sin(a) * (R - 50));
      }
    }

    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.2)'; ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(nA - .04) * 11, cy + Math.sin(nA - .04) * 11);
    ctx.lineTo(cx + Math.cos(nA) * (R - 24), cy + Math.sin(nA) * (R - 24));
    ctx.lineTo(cx + Math.cos(nA + .04) * 11, cy + Math.sin(nA + .04) * 11);
    ctx.closePath(); ctx.fillStyle = '#111827'; ctx.fill(); ctx.restore();

    ctx.beginPath(); ctx.arc(cx, cy, 11, 0, 2 * Math.PI); ctx.fillStyle = '#1f2937'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, 5, 0, 2 * Math.PI); ctx.fillStyle = '#fff'; ctx.fill();
  }
}
