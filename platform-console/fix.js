const fs = require('fs');
let content = fs.readFileSync('app.js', 'utf8');

content = content.replace(/function renderEverything\(\) \{[\s\S]*?init\(\);/m, \
function renderEverything() {
  renderMetrics();
  renderInstances();
  renderRunningInstances();
  renderCapacity();
  renderTimeline('timeline-mini', 3);
  renderTimeline('timeline-full');
  renderStorageSection();
  renderSpaceUsage();
  renderAuditLog();
  renderControlInstances();
  renderModuleToggles();
  renderPricingPlans();
  if(typeof renderPipeline === 'function') renderPipeline();
  if(typeof renderLeadsList === 'function') renderLeadsList();
}

async function init() {
  bindModalEvents();
  await refreshFromRuntime();
  renderEverything();
  renderLogs();
  if ( + "$" + ('last-updated'))  + "$" + ('last-updated').textContent = \\\\\\ · \\\\\\;
}

// CRM View Toggles
 + "$" + ('btn-view-pipeline')?.addEventListener('click', () => {
  if( + "$" + ('kanban-board'))  + "$" + ('kanban-board').style.display = 'flex';
  if( + "$" + ('leads-list-panel'))  + "$" + ('leads-list-panel').style.display = 'none';
   + "$" + ('btn-view-pipeline')?.classList.add('active');
   + "$" + ('btn-view-list')?.classList.remove('active');
   + "$" + ('btn-view-clients')?.classList.remove('active');
});

 + "$" + ('btn-view-list')?.addEventListener('click', () => {
  if( + "$" + ('kanban-board'))  + "$" + ('kanban-board').style.display = 'none';
  if( + "$" + ('leads-list-panel'))  + "$" + ('leads-list-panel').style.display = 'block';
  if( + "$" + ('leads-panel-title'))  + "$" + ('leads-panel-title').textContent = 'All Leads';
  if( + "$" + ('crm-table-sub'))  + "$" + ('crm-table-sub').textContent = 'Showing all pipeline stages';
  activeLeadFilter = null;
  renderLeadsList();
   + "$" + ('btn-view-pipeline')?.classList.remove('active');
   + "$" + ('btn-view-list')?.classList.add('active');
   + "$" + ('btn-view-clients')?.classList.remove('active');
});

 + "$" + ('btn-view-clients')?.addEventListener('click', () => {
  if( + "$" + ('kanban-board'))  + "$" + ('kanban-board').style.display = 'none';
  if( + "$" + ('leads-list-panel'))  + "$" + ('leads-list-panel').style.display = 'block';
  if( + "$" + ('leads-panel-title'))  + "$" + ('leads-panel-title').textContent = 'Client Base';
  if( + "$" + ('crm-table-sub'))  + "$" + ('crm-table-sub').textContent = 'Showing converted clients only';
  activeLeadFilter = 'converted';
  renderLeadsList();
   + "$" + ('btn-view-pipeline')?.classList.remove('active');
   + "$" + ('btn-view-list')?.classList.remove('active');
   + "$" + ('btn-view-clients')?.classList.add('active');
});

window.openLeadModal = function(defaultStage = 'new', editLeadId = null) {
  const lead = editLeadId ? LEADS.find(l => l.id === editLeadId) : null;
  
  if( + "$" + ('lead-modal-title'))  + "$" + ('lead-modal-title').textContent = lead ? 'Edit Lead' : 'Add New Lead';
  if( + "$" + ('lead-modal-submit'))  + "$" + ('lead-modal-submit').dataset.editId = editLeadId || '';

  if( + "$" + ('l-name'))  + "$" + ('l-name').value = lead?.name || '';
  if( + "$" + ('l-phone'))  + "$" + ('l-phone').value = lead?.phone || '';
  if( + "$" + ('l-school'))  + "$" + ('l-school').value = lead?.school || '';
  if( + "$" + ('l-stage'))  + "$" + ('l-stage').value = lead?.stage || defaultStage;
  if( + "$" + ('l-priority'))  + "$" + ('l-priority').value = lead?.priority || '1';
  if( + "$" + ('l-students'))  + "$" + ('l-students').value = lead?.students || '';
  if( + "$" + ('l-tags'))  + "$" + ('l-tags').value = (lead?.tags || []).join(', ');
  
  if( + "$" + ('l-sys-assessment'))  + "$" + ('l-sys-assessment').value = lead?.systems?.assessment || '';
  if( + "$" + ('l-sys-fees'))  + "$" + ('l-sys-fees').value = lead?.systems?.fees || '';
  if( + "$" + ('l-sys-lms'))  + "$" + ('l-sys-lms').value = lead?.systems?.lms || '';
  if( + "$" + ('l-notes'))  + "$" + ('l-notes').value = lead?.notes || '';

   + "$" + ('lead-modal-overlay')?.classList.add('open');
};

 + "$" + ('lead-modal-close')?.addEventListener('click', () =>  + "$" + ('lead-modal-overlay')?.classList.remove('open'));
 + "$" + ('lead-modal-cancel')?.addEventListener('click', () =>  + "$" + ('lead-modal-overlay')?.classList.remove('open'));
 + "$" + ('btn-new-lead')?.addEventListener('click', () => openLeadModal('new', null));

 + "$" + ('lead-modal-submit')?.addEventListener('click', () => {
  const name =  + "$" + ('l-name').value?.trim();
  const school =  + "$" + ('l-school').value?.trim();
  if (!name || !school) {
    toast('Name and School are required.');
    return;
  }

  const editId =  + "$" + ('lead-modal-submit').dataset.editId;
  const newLead = {
    id: editId || 'L' + Date.now(),
    name,
    school,
    phone:  + "$" + ('l-phone').value?.trim(),
    stage:  + "$" + ('l-stage').value,
    priority:  + "$" + ('l-priority').value,
    students: Number( + "$" + ('l-students').value) || 0,
    tags: ( + "$" + ('l-tags').value || '').split(',').map(t => t.trim()).filter(Boolean),
    systems: {
      assessment:  + "$" + ('l-sys-assessment').value?.trim() || 'None',
      fees:  + "$" + ('l-sys-fees').value?.trim() || 'None',
      lms:  + "$" + ('l-sys-lms').value?.trim() || 'None',
    },
    notes:  + "$" + ('l-notes').value?.trim(),
    nextActivity: editId ? (LEADS.find(l=>l.id===editId)?.nextActivity) : 'New lead added'
  };

  if (editId) {
    const idx = LEADS.findIndex(l => l.id === editId);
    if (idx >= 0) LEADS[idx] = { ...LEADS[idx], ...newLead };
  } else {
    LEADS.push(newLead);
  }

  addAudit({ action: editId ? 'Lead Updated' : 'Lead Added', instance: school, details: \\\Stage: \\\\\\ });
  
   + "$" + ('lead-modal-overlay')?.classList.remove('open');
  renderEverything();
  toast(editId ? 'Lead updated' : 'Lead added successfully');
});

init();
\
);
fs.writeFileSync('app.js', content, 'utf8');
console.log('Fixed app.js');
