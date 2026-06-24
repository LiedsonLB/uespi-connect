// frontend/src/utils/slideLoader.ts
export interface Slide {
  id: string;
  html: string;
  title?: string;
}

export async function loadSlidesFromHtml(htmlContent: string): Promise<Slide[]> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const slideContainers = doc.querySelectorAll('.slide-container');
  
  const slides: Slide[] = [];
  slideContainers.forEach((container, index) => {
    slides.push({
      id: container.id || `slide-${index}`,
      html: container.outerHTML,
      title: container.querySelector('.slide-title')?.textContent || `Slide ${index + 1}`
    });
  });
  
  return slides;
}

// You can also embed the slides directly as a JSON file:
export const embeddedSlides: Slide[] = [
  {
    id: "slide1",
    title: "WebRTC + LiveKit",
    html: `<div class="slide-container active" id="slide1">
        <div class="academic-header">
            <img class="academic-logo" alt="Logo UESPI" src="https://upload.wikimedia.org/wikipedia/commons/7/70/Bras%C3%A3o_da_UESPI.svg">
            <div class="academic-info">
                <h4>UNIVERSIDADE ESTADUAL DO PIAUÍ (UESPI)</h4>
                <h4>CAMPUS PROF. ANTÔNIO GIOVANNE ALVES DE SOUSA</h4>
                <h4 class="course">CURSO: CIÊNCIA DA COMPUTAÇÃO</h4>
                <h4>DISCIPLINA: SISTEMAS DISTRIBUÍDOS</h4>
            </div>
            <img class="academic-logo" alt="Brasão Piauí" src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Bras%C3%A3o_do_Piau%C3%AD.svg/330px-Bras%C3%A3o_do_Piau%C3%AD.svg.png">
        </div>
        
        <div class="content-area" style="text-align: center;">
            <h1 style="margin-bottom: 40px;">WebRTC + LiveKit: A Engenharia por trás das Reuniões Online</h1>
            <h3 style="font-size: 28px; color: #fff; margin-bottom: 10px;">Francisco Liédson Bonfim Barros</h3>
            <p style="color: var(--primary); font-family: 'Fira Code', monospace; font-size: 18px;">fliedsonbbarros@aluno.uespi.br</p>
        </div>

        <div class="academic-footer">
            <p style="font-weight: 700; color: #fff; letter-spacing: 2px;">PIRIPIRI-PI | 2026</p>
        </div>
    </div>`
  },
  // Add all your other slides here...
];