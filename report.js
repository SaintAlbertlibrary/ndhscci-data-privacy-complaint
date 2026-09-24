const choiceStep = document.getElementById('choiceStep');
const formStep = document.getElementById('formStep');
const choiceCards = document.querySelectorAll('.choice-card');
const currentChoiceLabel = document.getElementById('currentChoiceLabel');
const changeTypeBtn = document.getElementById('changeType');
const urgentBanner = document.getElementById('urgentBanner');
const reportModeInput = document.getElementById('report_mode');
const emailSubject = document.getElementById('emailSubject');
const whenField = document.getElementById('whenField');
const natureSelect = document.getElementById('natureSelect');
const submitBtn = document.getElementById('submitBtn');

const NATURE_OPTIONS = {
  inquiry: [
    'Request to access my personal data',
    'Request to correct my personal data',
    'Request to delete my personal data',
    'General question about how my data is used',
    'Complaint about how my data was handled'
  ],
  breach: [
    'Lost or stolen device/document with student data',
    'Unauthorized person accessed student records',
    'Data sent to the wrong recipient',
    'Suspicious system access or possible hacking',
    'Other suspected breach'
  ]
};

const CHOICE_LABELS = {
  inquiry: 'Privacy Inquiry or Request',
  breach: 'Report a Suspected Breach'
};

function populateNature(type){
  natureSelect.innerHTML = '';
  NATURE_OPTIONS[type].forEach(text => {
    const opt = document.createElement('option');
    opt.textContent = text;
    natureSelect.appendChild(opt);
  });
}

function selectReportType(type){
  reportModeInput.value = type;
  populateNature(type);
  currentChoiceLabel.textContent = CHOICE_LABELS[type];

  if(type === 'breach'){
    urgentBanner.classList.add('show');
    whenField.style.display = 'block';
    emailSubject.value = 'NDHSCCI Privacy Channel — SUSPECTED BREACH';
    submitBtn.textContent = 'Send urgent report to DPO & Breach Response Team';
    submitBtn.dataset.label = submitBtn.textContent;
  } else {
    urgentBanner.classList.remove('show');
    whenField.style.display = 'none';
    emailSubject.value = 'NDHSCCI Privacy Channel — New Inquiry';
    submitBtn.textContent = 'Send to the Data Protection Officer';
    submitBtn.dataset.label = submitBtn.textContent;
  }

  choiceStep.style.display = 'none';
  formStep.style.display = 'block';
  formStep.scrollIntoView({behavior:'smooth', block:'start'});
}

choiceCards.forEach(card => {
  card.addEventListener('click', () => selectReportType(card.dataset.choice));
});

changeTypeBtn.addEventListener('click', () => {
  formStep.style.display = 'none';
  choiceStep.style.display = 'block';
  choiceStep.scrollIntoView({behavior:'smooth', block:'start'});
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
      document.querySelector('.current-choice-bar').style.display = 'none';
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
