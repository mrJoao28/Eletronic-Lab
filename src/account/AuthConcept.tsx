import { useId } from 'react';
export default function AuthConcept() {
  const id = useId();
  return (
    <aside className="auth-concept" aria-label="Conceito visual do laboratório">
      <div className="concept-index">
        <span>ELETRÔNICA / ARQUITETURA</span>
        <span>01 — 40</span>
      </div>
      <svg
        viewBox="0 0 620 440"
        role="img"
        aria-label="Circuito em camadas com processador, trilhas e pontos de conexão"
      >
        <defs>
          <linearGradient id={`${id}-board`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#252c3b" />
            <stop offset="1" stopColor="#101319" />
          </linearGradient>
          <linearGradient id={`${id}-chip`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#9eafdc" />
            <stop offset="1" stopColor="#414c69" />
          </linearGradient>
        </defs>
        <g fill="none" stroke="#252a34" strokeWidth="1">
          <path d="M20 260 310 100 600 260 310 420Z" />
          <path d="M20 290 310 130 600 290 310 450M20 230 310 70 600 230" />
          {Array.from({ length: 10 }, (_, i) => (
            <path
              key={i}
              d={`M${50 + i * 26} ${246 - i * 14}l280 154M${330 + i * 26} ${110 + i * 14}l-280 154`}
            />
          ))}
        </g>
        <path d="M85 244 303 118 535 251 316 380Z" fill={`url(#${id}-board)`} stroke="#66728d" />
        <path d="M85 244v14l231 134 219-128v-13L316 380Z" fill="#101318" stroke="#343b49" />
        <g stroke="#859bda" strokeWidth="2" fill="none" opacity=".8">
          {Array.from({ length: 8 }, (_, i) => (
            <path
              key={i}
              d={`M${187 + i * 11} ${231 - i * 6}l-34-20-39 23M${345 + i * 11} ${253 - i * 6}l36 22 45-26`}
            />
          ))}
          <path d="m256 293-38 22-52-30M326 175l30-18 57 33" />
        </g>
        <path d="m233 215 70-40 86 49-72 42Z" fill="#12161f" stroke="#7585ab" />
        <path d="m233 215v30l84 49 72-42v-28l-72 42Z" fill="#222a3b" stroke="#5b6887" />
        <path d="m243 184 60-35 76 44-62 35Z" fill={`url(#${id}-chip)`} stroke="#c5cfed" />
        <path d="m243 184v12l74 43 62-35v-11l-62 35Z" fill="#414e6b" stroke="#8394be" />
        <g stroke="#66728e" strokeDasharray="3 5">
          <path d="M243 184v31M379 193v31M317 228v38" />
        </g>
        <g fill="#b3c5f6">
          {[
            [120, 245],
            [306, 137],
            [502, 251],
            [316, 364],
            [169, 285],
            [414, 190],
          ].map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r="5" />
              <circle cx={x} cy={y} r="12" fill="none" stroke="#6b80b4" />
            </g>
          ))}
        </g>
        <g fill="#141a25" stroke="#7b8bac">
          <path d="m359 293 26-15 42 24-26 15Z" />
          <path d="m192 269 26-15 42 24-26 15Z" />
        </g>
        <g fill="#a6b5d8" fontFamily="monospace" fontSize="10">
          <text x="392" y="132">
            PROCESSAMENTO
          </text>
          <text x="52" y="330">
            CONEXÕES
          </text>
          <text x="413" y="371">
            MONTAGEM / 01
          </text>
        </g>
        <g stroke="#7184ad" fill="none">
          <path d="M375 168l26-24h80M170 295l-38 25H52M400 313l36 44h74" />
        </g>
      </svg>
      <div className="concept-caption">
        <h2>Da conexão ao circuito.</h2>
        <p>Projetos de eletrônica e arquitetura, em uma bancada visual.</p>
        <div>
          <span>40 modelos abertos</span>
          <span>Montagens editáveis</span>
        </div>
      </div>
    </aside>
  );
}
