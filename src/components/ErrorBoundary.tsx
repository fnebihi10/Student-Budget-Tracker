import React from 'react';
import { Text, View } from 'react-native';
import AppButton from './AppButton';
import { colors, type } from '../design';
import { recordDiagnostic } from '../services/diagnostics';

export default class ErrorBoundary extends React.Component<React.PropsWithChildren> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { recordDiagnostic('render_failed'); }
  render() {
    if (!this.state.failed) return this.props.children;
    return <View style={{ flex: 1, backgroundColor: colors.canvas, justifyContent: 'center', padding: 24, gap: 16 }}>
      <Text accessibilityRole="alert" style={type.h1}>Pocketwise could not display this screen.</Text>
      <Text style={type.body}>Your confirmed records are retained. Reload to restore your account; check unconfirmed saves before trying them again.</Text>
      <AppButton title="Reload Pocketwise" onPress={() => this.setState({ failed: false })} />
    </View>;
  }
}
