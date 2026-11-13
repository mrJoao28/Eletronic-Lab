import { GraphicsBoundary } from './GraphicsBoundary';
import { inspectModel } from './models/inspection';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, Html, OrbitControls, useGLTF } from '@react-three/drei';
import { Box3, Vector3 } from 'three';
import {
  ArrowDownToLine,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  RotateCw,
} from 'lucide-react';
import type { Kind } from './engine';
import { modelCatalog, type ModelId } from './models/catalog';

const details = [
  {
    id: 'processor',
    title: 'Processador BCM2711',
    text: 'O SoC integra CPU, GPU e controladores. A tampa metálica distribui calor; a geometria deste estudo não é um modelo térmico.',
    at: [-9, 4, -2],
  },
  {
    id: 'memory',
    title: 'Memória LPDDR4',
    text: 'Memória de trabalho do computador. Capacidade e marcação variam conforme a versão da placa.',
    at: [9, 4, -1],
  },
  {
    id: 'gpio',
    title: 'Header GPIO · 40 pinos',
    text: 'Conector de expansão com alimentação, terra e sinais. Este visualizador não calcula nem aciona seus pinos.',
    at: [-10, 12, -24],
  },
  {
    id: 'ports',
    title: 'Conectores de entrada e saída',
    text: 'USB, Ethernet, USB-C de alimentação e duas saídas micro-HDMI. Aberturas e contatos são representações visuais.',
    at: [35, 18, 0],
  },
  {
    id: 'ribbon',
    title: 'Conectores de cabo flat',
    text: 'Interfaces de câmera e display, representadas com trava e contatos.',
    at: [-20, 7, 14],
  },
  {
    id: 'wireless',
    title: 'Módulo sem fio',
    text: 'Blindagem do conjunto de comunicação sem fio. Não há simulação de rádio ou antena.',
    at: [-28, 5, -12],
  },
  {
    id: 'pcb',
    title: 'Placa de circuito impresso',
    text: 'Contorno de 85 × 56 mm e furos de montagem. Trilhas e pequenos passivos são ilustrativos, sem correspondência com uma netlist.',
    at: [-28, 2, 21],
  },
] as const;
type View = 'perspective' | 'top' | 'bottom' | 'front';
function Hardware({
  id,
  selected,
  labels,
  onSelect,
  view,
  explosion,
  hidden,
}: {
  id: ModelId;
  selected: string;
  labels: boolean;
  onSelect: (id: string) => void;
  view: View;
  explosion: number;
  hidden: string[];
}) {
  const gltf = useGLTF(`/models/${id}.glb`);
  const model = useMemo(() => {
    const m = gltf.scene.clone(true);
    m.scale.setScalar(1000);
    if (id === 'pi4') inspectModel(m, explosion, hidden);
    return m;
  }, [gltf.scene, explosion, hidden, id]);
  const { camera, controls, invalidate } = useThree();
  useEffect(() => {
    model.updateMatrixWorld(true);
    const target = selected ? (model.getObjectByName(selected) ?? model) : model;
    const box = new Box3().setFromObject(target);
    const center = box.getCenter(new Vector3());
    const extent = Math.max(...box.getSize(new Vector3()).toArray(), 5);
    const direction =
      view === 'top'
        ? new Vector3(0, 1, 0.001)
        : view === 'bottom'
          ? new Vector3(0, -1, 0.001)
          : view === 'front'
            ? new Vector3(0, 0.3, 1)
            : new Vector3(0.9, 1.1, 1.2);
    camera.up.set(0, view === 'bottom' ? 0 : 1, view === 'bottom' ? 1 : 0);
    camera.position.copy(center).add(direction.normalize().multiplyScalar(extent * 1.8));
    camera.lookAt(center);
    camera.updateProjectionMatrix();
    if (controls && 'target' in controls) {
      (controls.target as Vector3).copy(center);
      (controls as unknown as { update: () => void }).update();
    }
    invalidate();
  }, [model, selected, view, camera, controls, invalidate]);
  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        let object = e.object;
        while (object.parent && !details.some((d) => d.id === object.name)) object = object.parent;
        if (details.some((d) => d.id === object.name)) onSelect(object.name);
      }}
    >
      <primitive object={model} dispose={null} />
      {id === 'pi4' &&
        labels &&
        details
          .filter((d) => !hidden.includes(d.id))
          .map((d) => (
            <Html
              key={d.id}
              position={[
                d.at[0],
                d.at[1] + (d.id === 'pcb' ? 0 : (details.indexOf(d) + 1) * 7) * explosion,
                d.at[2],
              ]}
              center
            >
              <button
                className={`model-hotspot ${selected === d.id ? 'active' : ''}`}
                aria-label={`Inspecionar ${d.title}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(d.id);
                }}
              >
                {details.indexOf(d) + 1}
              </button>
            </Html>
          ))}
    </group>
  );
}
export default function ModelGallery({
  onClose,
  onInsert,
}: {
  onClose: () => void;
  onInsert: (kind: Kind) => void;
}) {
  const [query, setQuery] = useState('');
  const [family, setFamily] = useState('all');
  const models = (Object.keys(modelCatalog) as ModelId[]).filter((key) => {
    const item = modelCatalog[key];
    const group = item.family ?? 'electronics';
    return (
      (family === 'all' || family === group) &&
      `${item.title} ${item.category}`
        .toLocaleLowerCase('pt-BR')
        .includes(query.trim().toLocaleLowerCase('pt-BR'))
    );
  });
  const [id, setId] = useState<ModelId>('pi4');
  const [selected, setSelected] = useState('');
  const [view, setView] = useState<View>('perspective');
  const [rotate, setRotate] = useState(false);
  const [lowPower, setLowPower] = useState(false);
  const [labels, setLabels] = useState(true);
  const [explosion, setExplosion] = useState(0);
  const [hidden, setHidden] = useState<string[]>([]);
  const info = modelCatalog[id];
  const current = details.find((d) => d.id === selected);
  const selectModel = (next: ModelId) => {
    setId(next);
    setExplosion(0);
    setHidden([]);
    setSelected('');
    setView('perspective');
  };
  const nextPart = (delta: number) => {
    if (!selected) {
      setSelected(details[delta > 0 ? 0 : details.length - 1].id);
      return;
    }
    const index = details.findIndex((d) => d.id === selected);
    setSelected(details[(index + delta + details.length) % details.length].id);
  };
  return (
    <section className="model-gallery" aria-label="Catálogo de modelos 3D">
      <header className="model-gallery-header">
        <button className="quiet-button" onClick={onClose}>
          <ArrowLeft size={16} /> Voltar à bancada
        </button>
        <span className="eyebrow">ELETRONIC LAB / ATLAS DE HARDWARE</span>
        <span className="model-license">MODELOS GRATUITOS · CÓDIGO ABERTO</span>
      </header>
      <div className="model-catalog-tools">
        <label>
          Buscar modelo
          <input
            type="search"
            aria-label="Buscar modelo 3D"
            placeholder="LED, ESP32, memória…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          Categoria
          <select
            aria-label="Filtrar modelos 3D"
            value={family}
            onChange={(e) => setFamily(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="electronics">Eletrônica e placas</option>
            <option value="computers">Computadores</option>
          </select>
        </label>
        <span role="status">
          {models.length} de {Object.keys(modelCatalog).length} modelos
        </span>
      </div>
      <div className="model-stage">
        <GraphicsBoundary onAlternate={onClose} alternateLabel="Voltar à bancada">
          <Canvas
            shadows={!lowPower}
            camera={{ fov: 38, near: 0.01, far: 2000 }}
            dpr={lowPower ? 1 : [1, 1.5]}
            frameloop={rotate ? 'always' : 'demand'}
            gl={{ powerPreference: 'low-power', antialias: !lowPower }}
          >
            <color attach="background" args={['#0b101a']} />
            <ambientLight intensity={1.3} />
            <hemisphereLight args={['#fff7e5', '#879c99', 2]} />
            <directionalLight
              position={[-35, 110, 40]}
              intensity={3.2}
              castShadow={!lowPower}
              shadow-mapSize={[1024, 1024]}
              shadow-camera-left={-100}
              shadow-camera-right={100}
              shadow-camera-top={100}
              shadow-camera-bottom={-100}
            />
            <OrbitControls
              makeDefault
              autoRotate={rotate}
              autoRotateSpeed={0.7}
              enableDamping
              minDistance={8}
              maxDistance={300}
            />
            <Suspense
              fallback={
                <Html center>
                  <span className="model-loading">Preparando modelo…</span>
                </Html>
              }
            >
              <Hardware
                id={id}
                selected={selected}
                labels={labels}
                onSelect={setSelected}
                view={view}
                explosion={explosion}
                hidden={hidden}
              />
            </Suspense>
            <gridHelper args={[600, 60, '#303d55', '#1d293e']} position={[0, -5, 0]} />
            {!lowPower && (
              <ContactShadows
                position={[0, -4.8, 0]}
                opacity={0.28}
                scale={230}
                blur={2.5}
                far={65}
                frames={1}
                key={`${id}-${selected}`}
              />
            )}
          </Canvas>
        </GraphicsBoundary>
        <aside className="model-info">
          <span className="eyebrow">{info.category}</span>
          <h1>{info.title}</h1>
          <span className="model-dimensions">{info.dimensions}</span>
          <div className="model-info-rule" />
          <span className="eyebrow">
            {current && id === 'pi4'
              ? `COMPONENTE ${details.indexOf(current) + 1} / ${details.length}`
              : 'SOBRE O MODELO'}
          </span>
          <h2>{id === 'pi4' && current ? current.title : 'Explore a construção'}</h2>
          <p>{id === 'pi4' && current ? current.text : info.description}</p>
          {id === 'pi4' && (
            <div className="model-part-nav">
              <button aria-label="Componente anterior" onClick={() => nextPart(-1)}>
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setSelected('')}>Placa completa</button>
              <button aria-label="Próximo componente" onClick={() => nextPart(1)}>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
          {id === 'pi4' && (
            <div className="inspection-tools">
              <label>
                Vista explodida{' '}
                <input
                  aria-label="Separação dos conjuntos"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={explosion}
                  onChange={(e) => setExplosion(+e.target.value)}
                />
              </label>
              <div>
                {[
                  ['ports', 'Conectores'],
                  ['wireless', 'Blindagem'],
                  ['ribbon', 'Cabos flat'],
                ].map(([name, title]) => (
                  <label key={name}>
                    <input
                      type="checkbox"
                      checked={!hidden.includes(name)}
                      onChange={(e) => {
                        setHidden((h) =>
                          e.target.checked ? h.filter((n) => n !== name) : [...h, name],
                        );
                        if (selected === name) setSelected('');
                      }}
                    />
                    {title}
                  </label>
                ))}
              </div>
              <button
                onClick={() => {
                  setExplosion(0);
                  setHidden([]);
                  setSelected('');
                }}
              >
                Remontar modelo
              </button>
              <p>
                A separação é didática; peças soldadas não são removíveis desta forma na placa real.
              </p>
            </div>
          )}
          {info.benchKind ? (
            <button className="model-insert" onClick={() => onInsert(info.benchKind!)}>
              Adicionar à bancada
            </button>
          ) : (
            <p className="model-visual-only">Inspeção visual · sem simulação</p>
          )}
          <a className="model-source" href={info.source} target="_blank" rel="noreferrer">
            Referência do fabricante <ExternalLink size={12} />
          </a>
        </aside>
        <div className="model-fidelity">
          {id === 'pi4' ? 'ESTUDO VISUAL · SEM EMULAÇÃO' : 'MODELO DE INSPEÇÃO'}
          <span>Arraste para orbitar · scroll para aproximar</span>
        </div>
        <div className="model-view-controls" aria-label="Controles do modelo">
          {(
            [
              ['perspective', '3/4'],
              ['top', 'Superior'],
              ['bottom', 'Inferior'],
              ['front', 'Frente'],
            ] as const
          ).map(([v, label]) => (
            <button key={v} aria-pressed={view === v} onClick={() => setView(v)}>
              {label}
            </button>
          ))}
          <span className="model-control-divider" />
          <button aria-pressed={lowPower} onClick={() => setLowPower((v) => !v)}>
            Modo leve
          </button>
          <button aria-pressed={rotate} onClick={() => setRotate((v) => !v)}>
            <RotateCw size={13} /> Girar
          </button>
          <button aria-pressed={labels} onClick={() => setLabels((v) => !v)}>
            Identificações
          </button>
          <a href={`/models/${id}.glb`} download>
            <ArrowDownToLine size={13} /> GLB
          </a>
        </div>
      </div>
      <footer className="model-shelf">
        <div>
          <span className="eyebrow">ACERVO ABERTO</span>
          <strong>Escolha um modelo</strong>
        </div>
        {models.length === 0 && (
          <p className="model-empty">Nenhum modelo encontrado. Tente outro termo ou categoria.</p>
        )}
        {models.map((key) => (
          <button
            key={key}
            className={`model-card ${key === id ? 'active' : ''}`}
            aria-pressed={key === id}
            onClick={() => selectModel(key)}
          >
            <span className={`model-card-symbol ${key}`} aria-hidden="true">
              {key === 'pi4' ? '▦' : key === 'hc283' ? '▤' : key === 'resistor' ? '━' : '◉'}
            </span>
            <span>
              <strong>{modelCatalog[key].title}</strong>
              <small>{modelCatalog[key].dimensions}</small>
            </span>
          </button>
        ))}
      </footer>
    </section>
  );
}
