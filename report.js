const modeBtns = document.querySelectorAll('.mode-btn');
const urgentBanner = document.getElementById('urgentBanner');
const reportModeInput = document.getElementById('report_mode');
const emailSubject = document.getElementById('emailSubject');
const whenField = document.getElementById('whenField');
const grpInquiry = document.getElementById('grp-inquiry');
const grpBreach = document.getElementById('grp-breach');
const natureSelect = document.getElementById('natureSelect');
const submitBtn = document.getElementById('submitBtn');

function setMode(mode){
  modeBtns.forEach(b => {
    const active = b.dataset.mode === mode;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  reportModeInput.value = mode;
  if(mode === 'breach'){
    urgentBanner.classList.add('show');
    whenField.style.display = 'block';
    emailSubject.value = 'NDHSCCI Privacy Channel — SUSPECTED BREACH';
    submitBtn.textContent = 'Send urgent report to DPO & Breach Response Team';
    submitBtn.dataset.label = submitBtn.textContent;
    try{ natureSelect.value = grpBreach.querySelector('option').value; }catch(e){}
  } else {
    urgentBanner.classList.remove('show');
    whenField.style.display = 'none';
    emailSubject.value = 'NDHSCCI Privacy Channel — New Inquiry';
    submitBtn.textContent = 'Send to the Data Protection Officer';
    submitBtn.dataset.label = submitBtn.textContent;
    try{ natureSelect.value = grpInquiry.querySelector('option').value; }catch(e){}
  }
}

modeBtns.forEach(btn => {
  btn.addEventListener('click', () => setMode(btn.dataset.mode));
});

const anonToggle = document.getElementById('anonToggle');
const fullName = document.getElementById('fullName');
const email = document.getElementById('email');
const phone = document.getElementById('phone');
anonToggle.addEventListener('change', () => {
  const anon = anonToggle.checked;
  [fullName, email, phone].forEach(f => { f.disabled = anon; if(anon) f.value=''; });
});

function refNumber(){
  const d = new Date();
  const pad = n => String(n).padStart(2,'0');
  const rand = Math.floor(1000 + Math.random()*9000);
  return `DPO-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${rand}`;
}

const form = document.getElementById('privacyForm');
const formError = document.getElementById('formError');

function showError(message){
  formError.textContent = message;
  formError.classList.add('show');
  window.scrollTo({top: form.getBoundingClientRect().top + window.scrollY - 90, behavior:'smooth'});
}

function setSubmitting(isSubmitting){
  submitBtn.disabled = isSubmitting;
  submitBtn.dataset.label = submitBtn.dataset.label || submitBtn.textContent;
  submitBtn.textContent = isSubmitting ? 'Sending…' : submitBtn.dataset.label;
}

form.addEventListener('submit', async function(e){
  e.preventDefault();
  formError.classList.remove('show');
  setSubmitting(true);

  try{
    const response = await fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    });

    if(response.ok){
      const ref = refNumber();
      document.getElementById('refNumber').textContent = 'REF: ' + ref;
      const isAnon = anonToggle.checked;
      document.getElementById('confirmText').textContent = isAnon
        ? 'Your anonymous report has been sent to the Office of the Data Protection Officer. Since no contact details were provided, please keep your reference number for any follow-up.'
        : "Your report has been sent to the Office of the Data Protection Officer. If you left contact details, you'll hear back within 3 business days.";

      form.style.display = 'none';
      document.querySelector('.mode-toggle').style.display = 'none';
      urgentBanner.classList.remove('show');
      document.getElementById('confirmPanel').classList.add('show');
      document.getElementById('confirmPanel').scrollIntoView({behavior:'smooth', block:'start'});
    } else {
      let message = 'Something went wrong sending this report. Please try again, or contact the DPO directly if this keeps happening.';
      try{
        const data = await response.json();
        if(data && Array.isArray(data.errors) && data.errors.length){
          message = data.errors.map(err => err.message || err.field).join(' ');
        }
      }catch(parseErr){ /* keep default message */ }
      showError(message);
      setSubmitting(false);
    }
  } catch(networkErr){
    showError('Could not reach the server — check your connection and try again. If this is urgent, contact the DPO directly rather than retrying repeatedly.');
    setSubmitting(false);
  }
});
