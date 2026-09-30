function refNumber(){
  const d = new Date();
  const pad = n => String(n).padStart(2,'0');
  const rand = Math.floor(1000 + Math.random()*9000);
  return `DPO-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${rand}`;
}

const form = document.getElementById('privacyForm');
const formError = document.getElementById('formError');
const submitBtn = document.getElementById('submitBtn');

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

      form.style.display = 'none';
      document.querySelector('#breachFormStep .current-choice-bar').style.display = 'none';
      document.querySelector('#breachFormStep .urgent-banner').style.display = 'none';
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
