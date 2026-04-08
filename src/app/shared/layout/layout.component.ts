import { Component, OnInit, OnDestroy, computed, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { NgComponentOutlet } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { AiPanelService } from '../../features/ai-insights/ai-panel.service';
import type { AiInsightsComponent } from '../../features/ai-insights/ai-insights.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgComponentOutlet],
  template: `
@if (isOffline()) {
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
    <button class="op-retry" (click)="checkOnline()">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
      Try Again
    </button>
  </div>
</div>
} @else {
<div class="shell">

  <!-- NAVBAR -->
  <nav class="navbar">
    <div class="nav-inner">
      <a routerLink="/speed-test" class="logo">
       
        <img class="logo-np" src="/assets/images/net%20pulse%20logo%203.png" alt="NetPulse logo" />
      </a>

      <div class="nav-links">
        @for (item of navItems; track item.path) {
          <a [routerLink]="item.path" routerLinkActive="nav-active" class="nav-link">{{ item.label }}</a>
        }
      </div>

      <div class="nav-right">
        <div class="plan-pill">
          <span class="plan-dot"></span>
          {{ user()?.plan?.isp }} · {{ user()?.plan?.download }} Mbps
        </div>

        <!-- Profile avatar -->
        <div class="profile-wrap" (click)="toggleProfile()">
          <div class="profile-av">{{ initial() }}</div>
          @if (profileOpen()) {
            <div class="profile-dropdown" (click)="$event.stopPropagation()">
              <div class="pd-user">
                <div class="pd-av">{{ initial() }}</div>
                <div>
                  <div class="pd-name">{{ user()?.name }}</div>
                  <div class="pd-id">{{ user()?.userId }}</div>
                </div>
              </div>
              <div class="pd-divider"></div>
              <div class="pd-row"><span class="pd-lbl">Plan</span><span class="pd-val">{{ user()?.plan?.name }}</span></div>
              <div class="pd-row"><span class="pd-lbl">City</span><span class="pd-val">{{ user()?.plan?.city }}</span></div>
              <div class="pd-divider"></div>
              <button class="pd-logout" (click)="logout()">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Sign Out
              </button>
            </div>
          }
        </div>
      </div>
    </div>
  </nav>

  <!-- PAGE CONTENT -->
  <div class="page-area" (click)="closeProfile()">
    <router-outlet />
  </div>

  <!-- FOOTER -->
  <footer class="footer">
    <div class="ft-row">
      <!-- LEFT: Brand -->
      <div class="ft-left">
        <div class="ft-brand">
          <a href="https://www.actcorp.in/" target="_blank" rel="noopener noreferrer" class="ft-act-link">ACT</a>
          <span class="ft-netpulse">NetPulse</span>
        </div>
      </div>

      <!-- CENTER: Social icons -->
      <div class="ft-center">
        <div class="ft-social">
          <a href="https://www.facebook.com/ACTFibernet" target="_blank" rel="noopener noreferrer" title="Facebook">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </a>
          <a href="https://www.linkedin.com/company/atria-convergence-technologies/" target="_blank" rel="noopener noreferrer" title="LinkedIn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          </a>
          <a href="https://x.com/ACTFibernet" target="_blank" rel="noopener noreferrer" title="X (Twitter)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
          <a href="https://www.instagram.com/ACTfibernet_india/" target="_blank" rel="noopener noreferrer" title="Instagram">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
          </a>
          <a href="https://www.youtube.com/user/ACTBroadband" target="_blank" rel="noopener noreferrer" title="YouTube">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          </a>
        </div>
      </div>

      <!-- RIGHT: Info -->
      <div class="ft-right">
        <div class="ft-tagline">MEAN Stack Internet Speed Monitor · Built for transparent network performance analytics</div>
      </div>
    </div>

    <!-- Divider -->
    <div class="ft-divider"></div>

    <!-- Bottom: official website -->
    <div class="ft-bottom">
      <a href="https://www.actcorp.in/" target="_blank" rel="noopener noreferrer" class="ft-official">actcorp.in</a>
      <span class="ft-dot">·</span>
      <span class="ft-official-text">ACT Fibernet Official Website</span>
    </div>
  </footer>

  <!-- AI FLOATING BUTTON -->
    <button class="ai-fab" (click)="aiSvc.toggle()" [class.fab-open]="aiSvc.open()" title="AI Network Assistant">
      @if (aiSvc.open()) {
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      } @else {
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span>AI</span>
      }
    </button>
    

  <!-- AI PANEL -->
  @if (aiSvc.open()) {
    <div class="ai-overlay" (click)="aiSvc.close()"></div>
    <div class="ai-panel">
      @if (aiComp) {
        <ng-container *ngComponentOutlet="aiComp" />
      }
    </div>
  }
</div>
}
  `,
  styles: [`
    /* Offline full-page */
    .offline-page{display:flex;align-items:center;justify-content:center;min-height:100vh;background:var(--navy);padding:40px 20px;animation:offFade .4s ease}
    .op-card{text-align:center;max-width:440px;background:rgba(255,255,255,.07);backdrop-filter:blur(12px);border-radius:var(--r-xl);padding:48px 40px;box-shadow:0 12px 48px rgba(0,0,0,.3);border:1.5px solid rgba(255,255,255,.1)}
    .op-icon{color:#ff6b6b;margin-bottom:18px}
    .op-title{font-family:var(--font-d);font-size:1.6rem;font-weight:800;color:#fff;margin-bottom:8px}
    .op-desc{font-size:.88rem;color:rgba(255,255,255,.6);line-height:1.55;margin-bottom:22px}
    .op-tips{display:flex;flex-direction:column;gap:8px;text-align:left;margin-bottom:24px;background:rgba(255,255,255,.05);border-radius:var(--r-md);padding:14px 18px;border:1px solid rgba(255,255,255,.08)}
    .op-tip{font-size:.82rem;color:rgba(255,255,255,.7)}
    .op-retry{display:inline-flex;align-items:center;gap:8px;padding:12px 28px;background:var(--red);color:#fff;border:none;border-radius:var(--r-lg);font-size:.92rem;font-weight:700;cursor:pointer;transition:all .2s;box-shadow:0 4px 16px rgba(226,0,26,.3)}
    .op-retry:hover{background:var(--red-dark);transform:translateY(-1px);box-shadow:0 6px 24px rgba(226,0,26,.4)}
    @keyframes offFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

    .shell{display:flex;flex-direction:column;min-height:100vh;background:var(--bg)}

    .navbar{background:var(--navy);position:sticky;top:0;z-index:200;border-bottom:1px solid rgba(255,255,255,.06)}
    .nav-inner{max-width:1400px;margin:0 auto;padding:0 28px;height:58px;display:flex;align-items:center;position:relative}

    .logo{display:flex;align-items:center;gap:10px;text-decoration:none;margin-right:36px;flex-shrink:0;position:relative;z-index:1}
    .logo-img{height:24px;width:auto;display:block;object-fit:contain;flex-shrink:0}
    .logo-np{height:50px;width:auto;display:block;object-fit:contain;flex-shrink:0}

    .nav-links{display:flex;align-items:center;gap:4px;position:absolute;left:50%;transform:translateX(-50%)}
    .nav-link{padding:7px 18px;border-radius:6px;color:rgba(255,255,255,.6);font-size:.96rem;font-weight:600;text-decoration:none;transition:all .15s;white-space:nowrap}
    .nav-link:hover{color:#fff;background:rgba(255,255,255,.07)}
    .nav-link.nav-active{background:var(--red);color:#fff;box-shadow:0 2px 10px rgba(226,0,26,.35);font-weight:600}

    .nav-right{display:flex;align-items:center;gap:12px;margin-left:auto;position:relative;z-index:1}

    .plan-pill{display:flex;align-items:center;gap:7px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:5px 14px;font-size:.78rem;font-weight:500;color:rgba(255,255,255,.8)}
    .plan-dot{width:7px;height:7px;border-radius:50%;background:#22c55e;box-shadow:0 0 6px #22c55e;flex-shrink:0}

    .profile-wrap{position:relative;cursor:pointer;flex-shrink:0}
    .profile-av{width:36px;height:36px;border-radius:50%;background:var(--red);color:#fff;display:flex;align-items:center;justify-content:center;font-family:var(--font-d);font-weight:700;font-size:1.05rem;border:2.5px solid rgba(255,255,255,.2);transition:border-color .15s;user-select:none}
    .profile-wrap:hover .profile-av{border-color:rgba(255,255,255,.55)}

    .profile-dropdown{position:absolute;top:calc(100% + 10px);right:0;width:220px;background:var(--white);border-radius:var(--r-lg);box-shadow:0 8px 32px rgba(0,0,0,.18);border:1px solid var(--border);z-index:300;overflow:hidden;animation:fup .15s ease}
    @keyframes fup{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    .pd-user{display:flex;align-items:center;gap:10px;padding:14px 16px}
    .pd-av{width:36px;height:36px;border-radius:50%;background:var(--red);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.95rem;flex-shrink:0}
    .pd-name{font-weight:700;font-size:.88rem;color:var(--text)}
    .pd-id{font-size:.7rem;color:var(--text2);font-family:monospace}
    .pd-divider{height:1px;background:var(--border)}
    .pd-row{display:flex;justify-content:space-between;padding:7px 16px;font-size:.78rem}
    .pd-lbl{color:var(--text2)} .pd-val{font-weight:600;color:var(--text)}
    .pd-logout{width:100%;display:flex;align-items:center;gap:8px;padding:10px 16px;background:none;border:none;color:#dc2626;font-size:.82rem;font-weight:600;cursor:pointer;font-family:var(--font);transition:background .15s}
    .pd-logout:hover{background:#fef2f2}

    .page-area{flex:1;overflow-y:auto}

    .footer{background:var(--navy);padding:24px 40px 18px}
    .ft-row{display:flex;align-items:center;justify-content:space-between;gap:24px;position:relative}
    .ft-left{flex-shrink:0}
    .ft-center{position:absolute;left:50%;transform:translateX(-50%)}
    .ft-right{flex-shrink:0;text-align:right;margin-left:auto}
    .ft-brand{display:flex;align-items:baseline;gap:6px}
    .ft-act-link{font-family:var(--font-d);font-size:1.6rem;font-weight:900;color:var(--red);text-decoration:none;letter-spacing:.02em;transition:color .15s}
    .ft-act-link:hover{color:#fff}
    .ft-netpulse{font-family:var(--font-d);font-size:1.6rem;font-weight:900;color:rgba(255,255,255,.5);letter-spacing:.02em}
    .ft-social{display:flex;gap:24px;justify-content:center;align-items:center}
    .ft-social a{display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.06);color:rgba(255,255,255,.4);transition:all .2s;text-decoration:none}
    .ft-social a:hover{background:var(--red);color:#fff;transform:scale(1.15);box-shadow:0 4px 16px rgba(226,0,26,.35)}
    .ft-divider{height:1px;background:rgba(255,255,255,.1);margin:16px 0 12px}
    .ft-bottom{display:flex;align-items:center;justify-content:center;gap:8px;font-size:.72rem;color:rgba(255,255,255,.2)}
    .ft-dot{color:rgba(255,255,255,.12)}
    .ft-official{color:rgba(255,255,255,.5);font-weight:700;text-decoration:none}
    .ft-official:hover{text-decoration:underline;color:#fff}
    .ft-official-text{color:rgba(255,255,255,.2)}
    .ft-tagline{font-size:.72rem;color:rgba(255,255,255,.25);max-width:260px;line-height:1.4}

    .ai-fab{position:fixed;bottom:28px;right:28px;z-index:400;display:flex;align-items:center;gap:7px;padding:12px 20px;border-radius:28px;background:var(--red);color:#fff;border:none;cursor:pointer;box-shadow:0 4px 20px rgba(226,0,26,.45);font-family:var(--font);font-size:.875rem;font-weight:700;transition:all .2s;letter-spacing:.03em}
    .ai-fab:hover{background:var(--red-dark);transform:translateY(-2px);box-shadow:0 6px 28px rgba(226,0,26,.5)}
    .ai-fab.fab-open{border-radius:50%;width:46px;height:46px;padding:0;justify-content:center}

    .ai-overlay{position:fixed;inset:0;background:rgba(0,0,0,.15);z-index:350}
    .ai-panel{position:fixed;bottom:86px;right:28px;z-index:360;width:460px;max-height:72vh;background:var(--white);border-radius:var(--r-xl);box-shadow:0 16px 60px rgba(0,0,0,.2);border:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden;animation:ps .2s ease}
    @keyframes ps{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}

    @media(max-width:900px){
      .plan-pill{display:none}
      .nav-inner{padding:0 14px}
      .nav-links{position:static;left:auto;transform:none;margin:0 auto}
      .logo{margin-right:16px}
      .ai-panel{right:10px;left:10px;width:auto}
      .ai-fab{bottom:20px;right:20px}
    }
  `]
})
export class LayoutComponent implements OnInit, OnDestroy {
  constructor(
    public aiSvc: AiPanelService,
    private auth: AuthService,
    private router: Router
  ) { }

  user = this.auth.currentUser;
  initial = computed(() => (this.user()?.name ?? 'U').charAt(0).toUpperCase());
  profileOpen = signal(false);
  isOffline = signal(!navigator.onLine);
  aiComp: any = null;

  private onOnline = () => this.isOffline.set(false);
  private onOffline = () => this.isOffline.set(true);

  navItems = [
    { path: '/speed-test', label: 'Speed Test' },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/history', label: 'History' },
    { path: '/settings', label: 'Settings' }
  ];

  ngOnInit() {
    window.addEventListener('online', this.onOnline);
    window.addEventListener('offline', this.onOffline);
    this.router.events.subscribe(() => this.profileOpen.set(false));
    import('../../features/ai-insights/ai-insights.component')
      .then(m => this.aiComp = m.AiInsightsComponent);
  }

  ngOnDestroy() {
    window.removeEventListener('online', this.onOnline);
    window.removeEventListener('offline', this.onOffline);
  }

  checkOnline() {
    this.isOffline.set(!navigator.onLine);
  }

  toggleProfile() { this.profileOpen.update(v => !v); }
  closeProfile() { this.profileOpen.set(false); }
  logout() { this.auth.logout(); this.profileOpen.set(false); }
}
