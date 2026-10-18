import type { SlideTheme, TeachingArtifact } from "./project";
const escapeHTML = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c
  );
export function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const themeColors: Record<SlideTheme, string> = {
  blue: "2563EB",
  ink: "162137",
  forest: "17684A",
};
export function buildTeachingHTML(artifact: TeachingArtifact, theme: SlideTheme = "blue"): string {
  const title = escapeHTML(artifact.title);
  const color = `#${themeColors[theme]}`;
  const css = `*{box-sizing:border-box}body{margin:0;background:#f1f5f9;color:#0f172a;font:18px/1.5 Arial,sans-serif}main{max-width:1100px;margin:auto;padding:24px}h1,h2{line-height:1.25}article,fieldset{background:white;border:1px solid #e2e8f0;border-radius:16px;padding:40px;margin:24px 0}article{aspect-ratio:16/9;display:flex;flex-direction:column;justify-content:center;page-break-after:always}article.cover{background:${color};color:white}article h2{font-size:38px}article li{font-size:24px;margin:14px 0}small{opacity:.7}button{background:${color};color:white;border:0;border-radius:10px;padding:12px 20px;cursor:pointer}label{display:block;padding:12px;border:1px solid #e2e8f0;border-radius:10px;margin:8px 0}p.result{font-weight:bold;color:${color}}.feedback{color:#475569}.correct{background:#dcfce7}.wrong{background:#fee2e2}@media(max-width:600px){main{padding:12px}article,fieldset{padding:24px}article{aspect-ratio:auto;min-height:300px}article h2{font-size:26px}article li{font-size:18px}}@media print{body{background:white}main{max-width:none;padding:0}article{margin:0;border:0;border-radius:0}button,.hint{display:none}}`;
  let content = "",
    script = "";
  if (artifact.kind === "slides")
    content = artifact.slides
      .map(
        (slide, i) =>
          `<article class="${slide.layout === "cover" ? "cover" : ""}"><small>ForteX · ${i + 1}/${artifact.slides.length}</small><h2>${escapeHTML(slide.title)}</h2><p>${escapeHTML(slide.subtitle)}</p><ul>${slide.bullets.map((b) => `<li>${escapeHTML(b)}</li>`).join("")}</ul></article>`
      )
      .join("");
  else {
    content = `<p class="hint">Bản luyện tập offline · đáp án nằm trong file này, không dùng làm đề thi bảo mật.</p><form id="quiz">${artifact.questions.map((q, i) => `<fieldset><legend>Câu ${i + 1}</legend><h2>${escapeHTML(q.question)}</h2>${q.options.map((o, j) => `<label id="o-${i}-${j}"><input required type="radio" name="q${i}" value="${j}"> ${String.fromCharCode(65 + j)}. ${escapeHTML(o)}</label>`).join("")}<p class="feedback" id="f-${i}" hidden></p></fieldset>`).join("")}<button type="submit">Nộp bài</button> <button type="reset">Làm lại</button><p role="status" class="result" id="result"></p></form>`;
    const questions = JSON.stringify(artifact.questions).replace(/</g, "\\u003c");
    script = `const questions=${questions};const form=document.getElementById('quiz');form.addEventListener('submit',event=>{event.preventDefault();let score=0;questions.forEach((q,i)=>{const selected=Number(new FormData(form).get('q'+i));if(selected===q.correct_answer)score++;q.options.forEach((_,j)=>{const label=document.getElementById('o-'+i+'-'+j);label.className=j===q.correct_answer?'correct':selected===j?'wrong':'';});const feedback=document.getElementById('f-'+i);feedback.hidden=false;feedback.textContent='Đáp án '+String.fromCharCode(65+q.correct_answer)+'. '+q.explanation;});document.getElementById('result').textContent='Kết quả: '+score+'/'+questions.length+' câu đúng';});form.addEventListener('reset',()=>{document.querySelectorAll('.correct,.wrong').forEach(n=>n.className='');document.querySelectorAll('.feedback').forEach(n=>n.hidden=true);document.getElementById('result').textContent='';});`;
  }
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; form-action 'none'; base-uri 'none'"><title>${title}</title><style>${css}</style></head><body><main><h1>${title}</h1>${content}</main>${script ? `<script>${script}</script>` : ""}</body></html>`;
}
export async function exportPowerPoint(
  artifact: Extract<TeachingArtifact, { kind: "slides" }>,
  theme: SlideTheme
) {
  const { default: PptxGenJS } = await import("pptxgenjs");
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "ForteX";
  pptx.subject = "Bản nháp bài giảng";
  pptx.title = artifact.title;
  pptx.theme = { headFontFace: "Arial", bodyFontFace: "Arial" };
  artifact.slides.forEach((source, i) => {
    const slide = pptx.addSlide();
    const cover = source.layout === "cover";
    const foreground = cover ? "FFFFFF" : "0F172A";
    slide.background = { color: cover ? themeColors[theme] : "FFFFFF" };
    slide.addText(`ForteX · ${i + 1}/${artifact.slides.length}`, {
      x: 0.7,
      y: 0.35,
      w: 12,
      h: 0.25,
      fontSize: 10,
      color: foreground,
      fontFace: "Arial",
    });
    slide.addText(source.title, {
      x: 0.7,
      y: 0.9,
      w: 11.9,
      h: 1.05,
      fontSize: source.title.length > 80 ? 27 : 34,
      bold: true,
      color: foreground,
      fontFace: "Arial",
      breakLine: false,
      margin: 0,
      fit: "shrink",
    });
    if (source.subtitle)
      slide.addText(source.subtitle, {
        x: 0.7,
        y: 2.05,
        w: 11.9,
        h: 0.65,
        fontSize: 18,
        color: foreground,
        fontFace: "Arial",
        margin: 0,
        fit: "shrink",
      });
    source.bullets.forEach((b, j) =>
      slide.addText(`•  ${b}`, {
        x: 0.8,
        y: 2.95 + j * 0.61,
        w: 11.6,
        h: 0.55,
        fontSize: 18,
        color: foreground,
        fontFace: "Arial",
        margin: 0,
        fit: "shrink",
      })
    );
    slide.addNotes(source.notes);
  });
  await pptx.writeFile({ fileName: `fortex-slides-${Date.now()}.pptx` });
}
