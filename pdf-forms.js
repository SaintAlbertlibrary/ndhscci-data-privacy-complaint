/* ---------- Choice routing (3-way) ---------- */
const choiceStep = document.getElementById('choiceStep');
const formSteps = {
  access: document.getElementById('accessFormStep'),
  correction: document.getElementById('correctionFormStep'),
  breach: document.getElementById('breachFormStep')
};

function showChoiceStep(){
  Object.values(formSteps).forEach(el => { el.style.display = 'none'; });
  choiceStep.style.display = 'block';
  choiceStep.scrollIntoView({behavior:'smooth', block:'start'});
}

function showFormStep(type){
  choiceStep.style.display = 'none';
  Object.entries(formSteps).forEach(([key, el]) => {
    el.style.display = (key === type) ? 'block' : 'none';
  });
  formSteps[type].scrollIntoView({behavior:'smooth', block:'start'});
}

document.querySelectorAll('.choice-card').forEach(card => {
  card.addEventListener('click', () => showFormStep(card.dataset.choice));
});

document.querySelectorAll('.change-type-btn').forEach(btn => {
  btn.addEventListener('click', showChoiceStep);
});

/* ---------- Correction table: dynamic rows ---------- */
const correctionTable = document.getElementById('correctionTable');
const addRowBtn = document.getElementById('addRowBtn');

function makeCorrectionRow(){
  const row = document.createElement('div');
  row.className = 'correction-row';
  row.innerHTML =
    '<input type="text" class="corr-wrong" placeholder="What\'s currently on file">' +
    '<input type="text" class="corr-right" placeholder="What it should say">' +
    '<input type="text" class="corr-proof" placeholder="e.g. Birth certificate">' +
    '<button type="button" class="row-remove" aria-label="Remove row">✕</button>';
  return row;
}

if (addRowBtn) {
  addRowBtn.addEventListener('click', () => {
    correctionTable.appendChild(makeCorrectionRow());
  });
  correctionTable.addEventListener('click', (e) => {
    if (e.target.classList.contains('row-remove')) {
      const rows = correctionTable.querySelectorAll('.correction-row');
      if (rows.length > 1) {
        e.target.closest('.correction-row').remove();
      }
    }
  });
}

/* ---------- Correction form: same-as-requestor toggle ---------- */
const sameAsRequestorCheckbox = document.getElementById('corrSameAsRequestor');
const corrSubjectFields = document.getElementById('corrSubjectFields');
if (sameAsRequestorCheckbox) {
  sameAsRequestorCheckbox.addEventListener('change', () => {
    corrSubjectFields.style.display = sameAsRequestorCheckbox.checked ? 'none' : 'block';
  });
}

/* ---------- PDF generation helpers ---------- */
function pdfLetterhead(doc, title, annexLabel){
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(annexLabel, pageWidth - 18, y, {align:'right'});
  y += 8;
  doc.setFontSize(10);
  doc.text('Congregation of Dominican Sisters of St. Catherine of Siena', pageWidth/2, y, {align:'center'});
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('NOTRE DAME HOSPITAL AND SIENA COLLEGE OF COTABATO, INC', pageWidth/2, y, {align:'center'});
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Purok No. 1, Governor Gutierrez Avenue, Rosary Heights IX', pageWidth/2, y, {align:'center'});
  y += 4;
  doc.text('Cotabato City 9600', pageWidth/2, y, {align:'center'});
  y += 11;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(title, pageWidth/2, y, {align:'center'});
  y += 8;
  doc.setLineWidth(0.3);
  doc.line(18, y, pageWidth - 18, y);
  y += 9;
  return y;
}

function pdfFooterNote(doc){
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text('Generated via the NDHSCCI Data Privacy Office online request tool. Sign by hand before submitting to the DPO.', pageWidth/2, pageHeight - 12, {align:'center'});
  doc.setTextColor(0);
}

function pdfCheckBreak(doc, y, marginBottom){
  marginBottom = marginBottom || 25;
  if (y > doc.internal.pageSize.getHeight() - marginBottom) {
    doc.addPage();
    return 20;
  }
  return y;
}

function pdfSectionTitle(doc, text, x, y){
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(text, x, y);
  doc.setLineWidth(0.15);
  doc.line(x, y + 1.8, pageWidth - x, y + 1.8);
  return y + 9;
}

function pdfTextField(doc, label, value, x, y, width){
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(label, x, y);
  doc.setFont('helvetica', 'normal');
  const lines = doc.splitTextToSize(value || '—', width);
  doc.text(lines, x, y + 6);
  return y + 6 + (lines.length * 5) + 6;
}

function pdfBlankLine(doc, label, x, y, lineWidth){
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(label, x, y);
  const labelWidth = doc.getTextWidth(label);
  doc.setLineWidth(0.2);
  doc.line(x + labelWidth + 4, y, x + labelWidth + 4 + lineWidth, y);
  return y + 12;
}

function val(id){
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

/* ---------- Access to Information Request PDF (Annex E — Form 5) ---------- */
function generateAccessPDF(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 18;
  const contentWidth = pageWidth - marginX * 2;
  let y = pdfLetterhead(doc, 'ACCESS TO INFORMATION REQUEST FORM', 'Annex E — Form 5');

  const office = val('accessOffice');
  const details = val('accessDetails');
  const methodInput = document.querySelector('input[name="accessMethod"]:checked');
  const method = methodInput ? methodInput.value : '';
  const name = val('accessName');
  const contact = val('accessContact');
  const email = val('accessEmail');

  y = pdfTextField(doc, 'Office/Department most likely to have this information:', office, marginX, y, contentWidth);
  y = pdfCheckBreak(doc, y);
  y = pdfTextField(doc, 'Details regarding the information being sought:', details, marginX, y, contentWidth);

  y = pdfCheckBreak(doc, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Method of access preferred:', marginX, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  ['Receive paper copies of the document/s', 'Receive electronic copies of the document/s', 'View only the information being sought'].forEach(m => {
    const mark = (m === method) ? '[X]' : '[   ]';
    doc.text(mark + '  ' + m, marginX + 4, y);
    y += 7;
  });
  y += 4;

  y = pdfCheckBreak(doc, y);
  y = pdfTextField(doc, 'Name of Requestor:', name, marginX, y, contentWidth);
  y = pdfTextField(doc, 'Contact Number:', contact, marginX, y, contentWidth);
  y = pdfTextField(doc, 'Email Address:', email, marginX, y, contentWidth);

  y = pdfCheckBreak(doc, y);
  y += 6;
  y = pdfBlankLine(doc, 'Signature over Printed Name:', marginX, y, 70);
  y = pdfBlankLine(doc, 'Date:', marginX, y, 50);

  pdfFooterNote(doc);
  doc.save('NDHSCCI-Access-Request-' + Date.now() + '.pdf');
}

/* ---------- Personal Data Correction Request PDF (Annex D — Form 4) ---------- */
function generateCorrectionPDF(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 18;
  const contentWidth = pageWidth - marginX * 2;
  let y = pdfLetterhead(doc, 'PERSONAL DATA CORRECTION REQUEST FORM', 'Annex D — Form 4');

  const reqName = val('corrReqName');
  const reqAddress = val('corrReqAddress');
  const reqContact = val('corrReqContact');
  const sameAsRequestor = document.getElementById('corrSameAsRequestor').checked;

  y = pdfSectionTitle(doc, "II. Requestor's Personal Particulars", marginX, y);
  y = pdfTextField(doc, 'Name of Requestor:', reqName, marginX, y, contentWidth);
  y = pdfTextField(doc, 'Address:', reqAddress, marginX, y, contentWidth);
  y = pdfTextField(doc, 'Contact Number:', reqContact, marginX, y, contentWidth);

  y = pdfCheckBreak(doc, y);
  y = pdfSectionTitle(doc, 'III. Personal Particulars of the Data Subject (if different)', marginX, y);
  if (sameAsRequestor) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.text('Same as requestor above.', marginX, y);
    y += 10;
  } else {
    y = pdfTextField(doc, 'Name of Data Subject:', val('corrSubName'), marginX, y, contentWidth);
    y = pdfTextField(doc, 'Address:', val('corrSubAddress'), marginX, y, contentWidth);
    y = pdfTextField(doc, 'Contact Number:', val('corrSubContact'), marginX, y, contentWidth);
    y = pdfTextField(doc, 'Email Address:', val('corrSubEmail'), marginX, y, contentWidth);
  }

  y = pdfCheckBreak(doc, y);
  y = pdfSectionTitle(doc, 'IV. Personal Data to which the Request Relates', marginX, y);

  const colWidths = [contentWidth * 0.32, contentWidth * 0.32, contentWidth * 0.36];
  const colX = [marginX, marginX + colWidths[0], marginX + colWidths[0] + colWidths[1]];

  function drawRow(values, isHeader){
    doc.setFont('helvetica', isHeader ? 'bold' : 'normal');
    doc.setFontSize(9);
    const wrapped = values.map((v, i) => doc.splitTextToSize(v || (isHeader ? '' : '—'), colWidths[i] - 4));
    const rowHeight = Math.max.apply(null, wrapped.map(w => w.length)) * 4.5 + 4;
    y = pdfCheckBreak(doc, y, 30);
    colX.forEach((x, i) => { doc.text(wrapped[i], x + 2, y + 4.5); });
    doc.setLineWidth(0.15);
    doc.rect(marginX, y, contentWidth, rowHeight);
    colX.slice(1).forEach(x => doc.line(x, y, x, y + rowHeight));
    y += rowHeight;
  }

  drawRow(['Erroneous Data', 'Correct Data', 'Certifying Document'], true);

  const rows = Array.from(document.querySelectorAll('.correction-row')).map(row => ({
    wrong: row.querySelector('.corr-wrong').value.trim(),
    right: row.querySelector('.corr-right').value.trim(),
    proof: row.querySelector('.corr-proof').value.trim()
  })).filter(r => r.wrong || r.right || r.proof);

  if (rows.length === 0) {
    drawRow(['', '', ''], false);
  } else {
    rows.forEach(r => drawRow([r.wrong, r.right, r.proof], false));
  }
  y += 10;

  y = pdfCheckBreak(doc, y, 55);
  y = pdfSectionTitle(doc, 'V. Declaration of Requestor', marginX, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const declaration = 'I hereby declare and confirm that all information and supporting documents provided by me in connection with this correction request are true, accurate and complete. I understand that it will be necessary for NDHSCCI to verify my identity and that NDHSCCI may contact me for more information in order to correct or update the personal data requested, and I consent to the collection, use and disclosure of the personal data that I have provided in this form for the purpose of this request.';
  const declLines = doc.splitTextToSize(declaration, contentWidth);
  doc.text(declLines, marginX, y);
  y += declLines.length * 4.5 + 10;

  y = pdfCheckBreak(doc, y, 35);
  y = pdfBlankLine(doc, 'Signature over Printed Name:', marginX, y, 70);
  y = pdfBlankLine(doc, 'Date:', marginX, y, 50);

  pdfFooterNote(doc);
  doc.save('NDHSCCI-Correction-Request-' + Date.now() + '.pdf');
}

const accessBtn = document.getElementById('accessGenerateBtn');
if (accessBtn) accessBtn.addEventListener('click', generateAccessPDF);

const correctionBtn = document.getElementById('correctionGenerateBtn');
if (correctionBtn) correctionBtn.addEventListener('click', generateCorrectionPDF);
