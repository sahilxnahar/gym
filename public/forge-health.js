/* Optional, on-demand, read-only daily step display for the Capacitor companion. */
(() => {
  'use strict';
  const reading = { steps: null, updatedAt: 0, status: 'No step count read this session.', busy: false };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const isNative = () => globalThis.FORGE_NATIVE_APP === true && Boolean(globalThis.ForgeNativeHealth);

  function renderCard() {
    if (!isNative()) {
      return '<section class="card forge-health-card"><div class="forge-section-heading"><div><span class="tag">OPTIONAL · ON THIS DEVICE</span><h2>Steps from your health app</h2></div><span class="forge-health-mark" aria-hidden="true">STEP</span></div><p>A regular browser PWA cannot read Android Health Connect or Apple Health data. Forge stays fully usable without this connection; the native companion is being built separately.</p><p class="help">When available, it will request only read access to today’s step total. Step data will not sync, affect game XP, or change your training plan.</p><a href="/health-privacy.html">Read the health-data privacy note</a></section>';
    }
    if (!globalThis.ForgeNativeHealth?.requestSteps || !globalThis.ForgeNativeHealth?.readTodaySteps) {
      return '<section class="card forge-health-card"><span class="tag">OPTIONAL · ON THIS DEVICE</span><h2>Steps from your health app</h2><p>The native Health connection is not available in this build. Your workout journal remains available offline.</p></section>';
    }
    const count = reading.steps === null ? '' : `<p class="forge-health-count"><strong>${new Intl.NumberFormat().format(reading.steps)}</strong><span>steps today</span></p>`;
    const updated = reading.updatedAt ? ` · Updated ${new Date(reading.updatedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}` : '';
    return `<section class="card forge-health-card"><div class="forge-section-heading"><div><span class="tag">OPTIONAL · ON THIS DEVICE</span><h2>Steps from your health app</h2></div><span class="forge-health-mark" aria-hidden="true">STEP</span></div>${count}<p class="help" id="forge-health-status" role="status" aria-live="polite">${esc(reading.status + updated)}</p><button class="secondary" type="button" data-forge-action="connect-health" ${reading.busy ? 'disabled' : ''}>${reading.busy ? 'Reading…' : reading.steps === null ? 'Connect and read today’s steps' : 'Refresh today’s steps'}</button><p class="help">Forge requests only read access to today’s total after you tap. The number stays on this device, is not saved or synced, and never affects Forge XP or your plan.</p><a href="/health-privacy.html">Read the health-data privacy note</a></section>`;
  }

  async function readToday() {
    if (reading.busy || !isNative()) return false;
    reading.busy = true;
    reading.status = 'Waiting for your device permission…';
    try {
      await globalThis.ForgeNativeHealth.requestSteps();
      reading.status = 'Reading today’s total from your device…';
      reading.steps = await globalThis.ForgeNativeHealth.readTodaySteps();
      reading.updatedAt = Date.now();
      reading.status = reading.steps === 0 ? 'No steps were shared for today.' : 'Today’s step total was read from this device.';
      return true;
    } catch {
      reading.steps = null;
      reading.updatedAt = 0;
      reading.status = 'No step data was read. Check your device’s health permissions or try again; Forge works without connecting.';
      return false;
    } finally {
      reading.busy = false;
    }
  }

  globalThis.ForgeHealth = Object.freeze({ isNative, renderCard, readToday, getReading: () => ({ ...reading }) });
})();
