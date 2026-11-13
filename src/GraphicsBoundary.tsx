import { reportFailure } from './errorReporting';
import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onAlternate: () => void;
  alternateLabel?: string;
}
interface State {
  failed: boolean;
  attempt: number;
}
/** Keeps project and simulator state above the disposable renderer. */
export class GraphicsBoundary extends Component<Props, State> {
  state: State = { failed: false, attempt: 0 };
  private host: HTMLDivElement | null = null;
  static getDerivedStateFromError() {
    return { failed: true };
  }
  private lost = (event: Event) => {
    event.preventDefault();
    reportFailure('graphics-context');
    this.setState({ failed: true });
  };
  componentDidCatch() {
    reportFailure('graphics-render');
  }
  componentDidMount() {
    this.host?.addEventListener('webglcontextlost', this.lost, true);
  }
  componentWillUnmount() {
    this.host?.removeEventListener('webglcontextlost', this.lost, true);
  }
  private retry = async () => {
    // Failed loader promises are cached; discard them before remounting the renderer.
    const { useGLTF } = await import('@react-three/drei');
    for (const id of ['pi4', 'hc283', 'resistor', 'capacitor']) useGLTF.clear(`/models/${id}.glb`);
    this.setState(({ attempt }) => ({ failed: false, attempt: attempt + 1 }));
  };
  render() {
    return (
      <div
        className="graphics-host"
        ref={(node) => {
          this.host = node;
        }}
      >
        {this.state.failed ? (
          <div className="graphics-recovery" role="alert">
            <h2>Não foi possível exibir o 3D</h2>
            <p>
              O navegador perdeu o contexto gráfico ou não conseguiu carregar um modelo. Sua
              montagem continua disponível.
            </p>
            <button onClick={() => void this.retry()}>Tentar carregar o 3D novamente</button>
            <button onClick={this.props.onAlternate}>
              {this.props.alternateLabel ?? 'Continuar pelo esquema'}
            </button>
          </div>
        ) : (
          <div className="graphics-content" key={this.state.attempt}>
            {this.props.children}
          </div>
        )}
      </div>
    );
  }
}
