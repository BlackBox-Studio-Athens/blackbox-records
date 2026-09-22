import { Component, Suspense, type ReactNode } from 'react';

export default class ContentFeature extends Component<{ name: string; children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override render() {
    if (this.state.failed)
      return <p role="alert">{this.props.name} could not load. Save your work before reloading to try again.</p>;
    return (
      <Suspense fallback={<p role="status">Loading {this.props.name.toLowerCase()}…</p>}>
        {this.props.children}
      </Suspense>
    );
  }
}
