/**
 * Versos linha a linha, estrofes separadas, refrão rotulado — FR-11.
 * Extraído de MusicaPagina para servir três usos: a página da Música, o
 * ModoCanto e a prévia viva do cadastro na Área Admin.
 */
export default function Letra({ secoes, className = '', ampliada = false, style }) {
  return (
    <div className={className} style={style}>
      {secoes.map((s, i) =>
        s.tipo === 'refrao' ? (
          <div
            key={i}
            className={`my-6 border-l-4 border-azul bg-azul-claro py-3 pr-4 pl-5 ${ampliada ? '' : 'rounded-r-lg'}`}
          >
            {/* rotulo-refrao, e não uma utilitária de tamanho: o rótulo mede
                em `em` para acompanhar a letra ao lado da qual ele está, que
                muda de tamanho nos três usos deste componente. */}
            <p className="rotulo-refrao mb-1 font-semibold tracking-wide text-azul uppercase">
              Refrão
            </p>
            {s.linhas.map((l, j) => (
              <p key={j} className="text-azul-escuro">{l}</p>
            ))}
          </div>
        ) : (
          <div key={i} className="my-6">
            {s.linhas.map((l, j) => (
              <p key={j}>{l}</p>
            ))}
          </div>
        ),
      )}
    </div>
  )
}
