// CineWave Pega Architecture & Blueprint Inspector

let activePegaSubTab = 'stages';
let pegaBlueprintData = null;

async function fetchPegaBlueprint() {
  if (pegaBlueprintData) return pegaBlueprintData;
  try {
    const res = await fetch(`${API_BASE}/pega/blueprint`);
    pegaBlueprintData = await res.json();
    return pegaBlueprintData;
  } catch (err) {
    console.error('Error fetching Pega Blueprint:', err);
    return null;
  }
}

function switchPegaSubTab(tabName) {
  activePegaSubTab = tabName;
  const tabs = ['stages', 'datamodel', 'rules', 'personas'];
  tabs.forEach(t => {
    const btn = document.getElementById(`pega-tab-${t}`);
    if (btn) {
      if (t === tabName) {
        btn.className = 'btn btn-primary';
      } else {
        btn.className = 'btn btn-secondary';
      }
    }
  });

  if (tabName === 'stages') renderPegaStages();
  else if (tabName === 'datamodel') renderPegaDataModel();
  else if (tabName === 'rules') renderPegaRules();
  else if (tabName === 'personas') renderPegaPersonas();
}

// Sub-Tab 1: Case Lifecycle Stages & Steps
async function renderPegaStages() {
  const data = await fetchPegaBlueprint();
  const container = document.getElementById('pega-content-container');
  if (!container || !data) return;

  const caseType = data.caseTypes[0];

  container.innerHTML = `
    <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 28px; box-shadow: var(--shadow-lg);">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 16px; margin-bottom: 24px; flex-wrap: wrap; gap: 10px;">
        <div>
          <span style="font-size: 0.75rem; color: var(--accent-primary); text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Case Type: ${caseType.id}</span>
          <h3 style="font-size: 1.4rem; font-weight: 800; color: #fff;">${caseType.name} Case Lifecycle</h3>
          <p style="font-size: 0.85rem; color: var(--text-secondary);">${caseType.description}</p>
        </div>
        <div style="background: rgba(121, 40, 202, 0.2); border: 1px solid rgba(121, 40, 202, 0.5); padding: 6px 14px; border-radius: var(--radius-md); font-size: 0.8rem; color: #d8b4fe;">
          <i class="fa-solid fa-layer-group"></i> Class: <strong>${data.application.classStructure.workClass}</strong>
        </div>
      </div>

      <!-- Stage & Step Horizontal Workflow Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 16px; margin-bottom: 28px;">
        ${caseType.stages.map((stage, sIdx) => {
          const isAlt = stage.type === 'Alternate';
          const isRes = stage.type === 'Resolution';
          let badgeColor = 'var(--accent-primary)';
          if (isAlt) badgeColor = 'var(--danger)';
          if (isRes) badgeColor = 'var(--success)';

          return `
            <div style="background: var(--bg-primary); border: 1px solid ${isAlt ? 'rgba(239,68,68,0.4)' : 'var(--border-color)'}; border-radius: var(--radius-md); overflow: hidden; display: flex; flex-direction: column;">
              <div style="background: rgba(255,255,255,0.03); border-bottom: 1px solid var(--border-color); padding: 12px 14px; display: flex; justify-content: space-between; align-items: center;">
                <strong style="font-size: 0.85rem; color: #fff;">${stage.name}</strong>
                <span style="font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; background: rgba(0,0,0,0.4); color: ${badgeColor}; font-weight: 700; text-transform: uppercase;">${stage.type}</span>
              </div>
              <div style="padding: 12px; display: flex; flex-direction: column; gap: 8px; flex: 1;">
                ${stage.steps.map((step, stIdx) => `
                  <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 8px 10px; font-size: 0.75rem; cursor: pointer; transition: var(--transition);" 
                       onmouseover="this.style.borderColor='var(--accent-primary)'" 
                       onmouseout="this.style.borderColor='var(--border-color)'">
                    <div style="font-weight: 700; color: #fff; margin-bottom: 2px;">${stIdx + 1}. ${step.name}</div>
                    <div style="display: flex; justify-content: space-between; color: var(--text-muted); font-size: 0.7rem;">
                      <span><i class="fa-solid fa-gear"></i> ${step.type}</span>
                      <span style="color: var(--accent-primary);"><i class="fa-solid fa-user"></i> ${step.persona}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Pega SLA & Routing Matrix -->
      <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 20px;">
        <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 12px; color: var(--accent-primary);"><i class="fa-solid fa-clock-rotate-left"></i> Service Level Agreements (SLA) & Routing Configuration</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; font-size: 0.85rem;">
          <div style="background: var(--bg-primary); padding: 12px; border-radius: var(--radius-sm); border-left: 3px solid var(--warning);">
            <strong>Seat Hold Concurrency SLA:</strong>
            <div style="color: var(--text-secondary); margin-top: 4px;">Goal: 5 minutes | Deadline: 10 minutes (Automatically expires and releases temporary lock on seats).</div>
          </div>
          <div style="background: var(--bg-primary); padding: 12px; border-radius: var(--radius-sm); border-left: 3px solid var(--info);">
            <strong>Customer Worklist Routing:</strong>
            <div style="color: var(--text-secondary); margin-top: 4px;">Routing Type: <code>CurrentOperator</code> for Customer self-service checkout stages.</div>
          </div>
          <div style="background: var(--bg-primary); padding: 12px; border-radius: var(--radius-sm); border-left: 3px solid #a855f7;">
            <strong>Box Office WorkQueue Routing:</strong>
            <div style="color: var(--text-secondary); margin-top: 4px;">Routing Type: <code>WorkQueue (BoxOfficeQueue@CineWave)</code> for manual review and special ticket requests.</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Sub-Tab 2: Data Model & Data Pages
async function renderPegaDataModel() {
  const data = await fetchPegaBlueprint();
  const container = document.getElementById('pega-content-container');
  if (!container || !data) return;

  container.innerHTML = `
    <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 28px; box-shadow: var(--shadow-lg);">
      <h3 style="font-size: 1.4rem; font-weight: 800; color: #fff; margin-bottom: 6px;">Pega Data Modeling Schema</h3>
      <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 24px;">Configured Data Classes, Fields, and Data Pages (D_*) supporting the application</p>

      <!-- Data Classes Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 30px;">
        ${data.dataModel.map(dm => `
          <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px;">
            <div style="font-family: monospace; font-weight: 700; color: var(--accent-primary); font-size: 0.9rem; margin-bottom: 6px;">${dm.name}</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">${dm.description}</div>
          </div>
        `).join('')}
      </div>

      <!-- Data Pages Table -->
      <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 14px; color: #fff;"><i class="fa-solid fa-table-list" style="color: var(--accent-primary); margin-right: 8px;"></i> Data Pages Architecture (Pega D_*)</h4>
      <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border-color); background: rgba(0,0,0,0.3); color: var(--text-muted); text-transform: uppercase; font-size: 0.75rem;">
              <th style="padding: 12px 16px;">Data Page Name</th>
              <th style="padding: 12px 16px;">Scope</th>
              <th style="padding: 12px 16px;">Mode</th>
              <th style="padding: 12px 16px;">Data Source / Strategy</th>
            </tr>
          </thead>
          <tbody>
            ${data.dataPages.map(dp => `
              <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 12px 16px; font-family: monospace; font-weight: 700; color: var(--accent-primary);">${dp.name}</td>
                <td style="padding: 12px 16px;"><span style="background: rgba(59,130,246,0.15); color: #60a5fa; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">${dp.scope}</span></td>
                <td style="padding: 12px 16px;">${dp.mode}</td>
                <td style="padding: 12px 16px; color: var(--text-secondary);">${dp.source}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Sub-Tab 3: Business Logic & Rules
function renderPegaRules() {
  const container = document.getElementById('pega-content-container');
  if (!container) return;

  container.innerHTML = `
    <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 28px; box-shadow: var(--shadow-lg);">
      <h3 style="font-size: 1.4rem; font-weight: 800; color: #fff; margin-bottom: 6px;">Business Logic, When Rules & Decision Tables</h3>
      <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 24px;">Automated decision calculations, constraints, and validation logic configured in Pega App Studio</p>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <!-- Fare Calculation Logic -->
        <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 20px;">
          <h4 style="font-size: 1rem; font-weight: 700; color: var(--accent-primary); margin-bottom: 12px;"><i class="fa-solid fa-calculator"></i> Decision Table: Tier-Based Fare Calculation</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem; margin-bottom: 12px;">
            <thead>
              <tr style="border-bottom: 1px solid var(--border-color); color: var(--text-muted); text-align: left;">
                <th style="padding: 8px;">Seat Tier</th>
                <th style="padding: 8px;">Experience</th>
                <th style="padding: 8px;">Base Price</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid var(--border-color);"><td>VIP Recliners</td><td>IMAX 3D / 70mm</td><td>$22.00 - $28.00</td></tr>
              <tr style="border-bottom: 1px solid var(--border-color);"><td>Premium Club</td><td>Dolby Atmos / 4DX</td><td>$16.00 - $20.00</td></tr>
              <tr><td>Standard Classic</td><td>Digital 2D</td><td>$10.00 - $14.00</td></tr>
            </tbody>
          </table>
          <div style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.4;">
            • Convenience Fee = <code>Subtotal * 0.10</code><br>
            • Tax (GST) = <code>(Subtotal + ConvenienceFee) * 0.18</code>
          </div>
        </div>

        <!-- Validations & Constraints -->
        <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 20px;">
          <h4 style="font-size: 1rem; font-weight: 700; color: var(--warning); margin-bottom: 12px;"><i class="fa-solid fa-shield-halved"></i> Validation & When Rules</h4>
          <ul style="list-style: none; display: flex; flex-direction: column; gap: 10px; font-size: 0.85rem; color: var(--text-secondary);">
            <li style="display: flex; gap: 8px;">
              <i class="fa-solid fa-check" style="color: var(--success); margin-top: 4px;"></i>
              <div><strong>Max Ticket Limit (Validate Rule):</strong> Maximum 10 tickets permitted per single booking case instance.</div>
            </li>
            <li style="display: flex; gap: 8px;">
              <i class="fa-solid fa-check" style="color: var(--success); margin-top: 4px;"></i>
              <div><strong>Email & Phone Validation:</strong> Standard regex format enforcement on customer contact properties.</div>
            </li>
            <li style="display: flex; gap: 8px;">
              <i class="fa-solid fa-check" style="color: var(--success); margin-top: 4px;"></i>
              <div><strong>Cancellation Eligibility (When Rule):</strong> Case can only transition to Alternate Cancellation stage if current time is &gt; 2 hours prior to showtime.</div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  `;
}

// Sub-Tab 4: Personas & Channels
function renderPegaPersonas() {
  const container = document.getElementById('pega-content-container');
  if (!container) return;

  container.innerHTML = `
    <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 28px; box-shadow: var(--shadow-lg);">
      <h3 style="font-size: 1.4rem; font-weight: 800; color: #fff; margin-bottom: 6px;">Personas & Channels Matrix</h3>
      <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 24px;">Pega security access, operator personas, and channel interfaces</p>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px;">
        <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 20px;">
          <div style="width: 44px; height: 44px; background: rgba(0, 229, 255, 0.15); color: var(--accent-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; margin-bottom: 12px;">
            <i class="fa-solid fa-user"></i>
          </div>
          <h4 style="font-size: 1.1rem; font-weight: 700; color: #fff; margin-bottom: 6px;">Customer Persona</h4>
          <div style="font-size: 0.75rem; color: var(--accent-primary); margin-bottom: 10px;">Channel: Self-Service Web Portal</div>
          <p style="font-size: 0.8rem; color: var(--text-secondary);">Initiates booking case, selects movie, theatre, showtime, reserves seats, performs payment, tracks case status, and downloads e-tickets.</p>
        </div>

        <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 20px;">
          <div style="width: 44px; height: 44px; background: rgba(168, 85, 247, 0.15); color: #c084fc; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; margin-bottom: 12px;">
            <i class="fa-solid fa-user-shield"></i>
          </div>
          <h4 style="font-size: 1.1rem; font-weight: 700; color: #fff; margin-bottom: 6px;">Box Office Staff</h4>
          <div style="font-size: 0.75rem; color: #c084fc; margin-bottom: 10px;">Channel: Operator Workspace (Queue)</div>
          <p style="font-size: 0.8rem; color: var(--text-secondary);">Monitors live case queue, handles exceptions, performs customer overrides, cancels bookings, and schedules new theatre showtimes.</p>
        </div>

        <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 20px;">
          <div style="width: 44px; height: 44px; background: rgba(245, 158, 11, 0.15); color: #fbbf24; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; margin-bottom: 12px;">
            <i class="fa-solid fa-crown"></i>
          </div>
          <h4 style="font-size: 1.1rem; font-weight: 700; color: #fff; margin-bottom: 6px;">Author / Administrator</h4>
          <div style="font-size: 0.75rem; color: #fbbf24; margin-bottom: 10px;">ID: author@uplus (Pega App Studio)</div>
          <p style="font-size: 0.8rem; color: var(--text-secondary);">Configures Case Types, Data Pages, Integration Connectors, UI Views, Notification Templates, and SLA rules.</p>
        </div>
      </div>
    </div>
  `;
}
