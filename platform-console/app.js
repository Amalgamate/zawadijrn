const instances = [
  {
    name: 'Zawadi Main',
    domain: 'zawadi.elimucrown.co.ke',
    status: 'Online',
    createdAt: '2026-04-27',
    version: '91a4982',
    frontendPort: 3000,
    backendPort: 5000,
    database: 'zawadi_sms',
    storageGb: 2.1,
    dbGb: 0.42,
    uploadsGb: 1.2,
    backupsGb: 0.48,
    containers: 3,
  },
  {
    name: 'School B',
    domain: 'schoolb.elimucrown.co.ke',
    status: 'Online',
    createdAt: '2026-04-28',
    version: '91a4982',
    frontendPort: 3001,
    backendPort: 5001,
    database: 'zawadi_school_b',
    storageGb: 1.3,
    dbGb: 0.18,
    uploadsGb: 0.61,
    backupsGb: 0.51,
    containers: 3,
  },
  {
    name: 'School C',
    domain: 'schoolc.elimucrown.co.ke',
    status: 'Online',
    createdAt: '2026-04-28',
    version: '91a4982',
    frontendPort: 3002,
    backendPort: 5002,
    database: 'zawadi_school_c',
    storageGb: 1.6,
    dbGb: 0.21,
    uploadsGb: 0.76,
    backupsGb: 0.63,
    containers: 3,
  },
];

const deployments = [
  {
    time: '10:47 EAT',
    title: 'Super admin OTP bypass deployed',
    copy: 'Frontend and backend images published, all live instances redeployed.',
  },
  {
    time: '10:36 EAT',
    title: 'Health check retries enabled',
    copy: 'Deploy script now waits for services to warm up before failing.',
  },
  {
    time: '10:20 EAT',
    title: 'All instances moved to GHCR images',
    copy: 'Main, School B, and School C use the shared latest images.',
  },
];

const formatDate = (value) =>
  new Intl.DateTimeFormat('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));

const formatNumber = (value) => value.toFixed(1).replace('.0', '');

const showToast = (message) => {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('visible');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('visible'), 2600);
};

const renderMetrics = () => {
  const totalStorage = instances.reduce((sum, item) => sum + item.storageGb, 0);
  const healthyContainers = instances.reduce((sum, item) => sum + item.containers, 0);

  document.getElementById('schoolCount').textContent = instances.length;
  document.getElementById('healthyContainers').textContent = `${healthyContainers}/9`;
  document.getElementById('storageUsed').textContent = `${formatNumber(totalStorage)} GB`;
  document.getElementById('lastDeploy').textContent = '91a4982';
};

const statusClass = (status) => {
  if (status === 'Online') return 'online';
  if (status === 'Degraded') return 'warning';
  return 'offline';
};

const renderInstances = () => {
  const rows = instances
    .map(
      (item) => `
        <tr>
          <td>
            <span class="school-name">${item.name}</span>
            <span class="domain">${item.domain}</span>
          </td>
          <td><span class="badge ${statusClass(item.status)}">${item.status}</span></td>
          <td>${formatDate(item.createdAt)}</td>
          <td><strong>${item.version}</strong></td>
          <td>
            <span class="ports">Frontend: ${item.frontendPort}<br />Backend: ${item.backendPort}<br />DB: ${item.database}</span>
          </td>
          <td>
            <strong>${formatNumber(item.storageGb)} GB</strong>
            <span class="storage-text">DB ${formatNumber(item.dbGb)} GB, uploads ${formatNumber(item.uploadsGb)} GB</span>
          </td>
          <td>
            <div class="action-row">
              <button class="action-button" data-action="Restart" data-school="${item.name}" type="button">Restart</button>
              <button class="action-button" data-action="Logs" data-school="${item.name}" type="button">Logs</button>
              <button class="action-button" data-action="Redeploy" data-school="${item.name}" type="button">Redeploy</button>
              <button class="action-button danger" data-action="Stop" data-school="${item.name}" type="button">Stop</button>
            </div>
          </td>
        </tr>
      `
    )
    .join('');

  document.getElementById('instanceTable').innerHTML = rows;
};

const renderStorage = () => {
  const content = instances
    .map(
      (item) => `
        <div class="storage-item">
          <div class="storage-title">
            <span>${item.name}</span>
            <span>${formatNumber(item.storageGb)} GB</span>
          </div>
          <div class="storage-meta">
            DB ${formatNumber(item.dbGb)} GB | Uploads ${formatNumber(item.uploadsGb)} GB | Backups ${formatNumber(item.backupsGb)} GB
          </div>
        </div>
      `
    )
    .join('');

  document.getElementById('storageList').innerHTML = content;
};

const renderTimeline = () => {
  const content = deployments
    .map(
      (item) => `
        <div class="timeline-item">
          <div class="timeline-time">${item.time}</div>
          <div class="timeline-body">
            <p class="timeline-title">${item.title}</p>
            <p class="timeline-copy">${item.copy}</p>
          </div>
        </div>
      `
    )
    .join('');

  document.getElementById('timeline').innerHTML = content;
};

const bindActions = () => {
  document.body.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;

    if (button.id === 'refreshButton') {
      document.getElementById('lastUpdated').textContent = `Refreshed ${new Date().toLocaleTimeString('en-KE', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
      showToast('Demo metrics refreshed. Live API wiring comes next.');
      return;
    }

    if (button.id === 'createSchoolButton') {
      showToast('Create School will open the provisioning workflow in Phase 2.');
      return;
    }

    const action = button.dataset.action;
    const school = button.dataset.school;
    if (action && school) {
      showToast(`${action} requested for ${school}. Controls are in demo mode.`);
      return;
    }

    if (button.classList.contains('control-button')) {
      showToast(`${button.textContent.trim()} will be connected to the console API in Phase 2.`);
    }
  });
};

const init = () => {
  renderMetrics();
  renderInstances();
  renderStorage();
  renderTimeline();
  bindActions();
  document.getElementById('lastUpdated').textContent = `Demo snapshot ${new Date().toLocaleTimeString('en-KE', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

init();
