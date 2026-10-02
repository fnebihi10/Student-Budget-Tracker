import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export async function shareExportFile(contents, format) {
  const filename = `pocketwise-export-${new Date().toISOString().slice(0, 10)}.${format}`;
  const mime = format === 'json' ? 'application/json' : 'text/csv';
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([contents], { type: mime }));
    try {
      const anchor = globalThis.document.createElement('a');
      anchor.href = url; anchor.download = filename;
      globalThis.document.body.appendChild(anchor); anchor.click(); anchor.remove();
    } finally { URL.revokeObjectURL(url); }
    return;
  }
  if (!await Sharing.isAvailableAsync()) throw new Error('File sharing is unavailable on this device.');
  const uri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, contents, { encoding: FileSystem.EncodingType.UTF8 });
  try { await Sharing.shareAsync(uri, { mimeType: mime, UTI: format === 'json' ? 'public.json' : 'public.comma-separated-values-text', dialogTitle: 'Export Pocketwise data' }); }
  finally { await FileSystem.deleteAsync(uri, { idempotent: true }); }
}
