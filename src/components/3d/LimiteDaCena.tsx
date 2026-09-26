import { Component, type ReactNode } from "react";

/** Qualquer erro dentro de uma cena 3D (chunk que não baixou, shader que não compilou) só a remove. */
export class LimiteDaCena extends Component<{ children: ReactNode; onErro: () => void }, { erro: boolean }> {
  state = { erro: false };

  static getDerivedStateFromError() {
    return { erro: true };
  }

  componentDidCatch() {
    this.props.onErro();
  }

  render() {
    return this.state.erro ? null : this.props.children;
  }
}
