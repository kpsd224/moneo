/** Local-only widget publisher. Safe no-op in Expo Go / web (requires custom native build). */
import { Platform } from 'react-native';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { widgetsDirectory } from 'expo-widgets';
import AnaFinanceWidget from '../widgets/AnaFinanceWidget';
import type { Book } from './finance';
import { calculateWidgetSnapshot, monthNow } from './widgetHealth';

const files = {
  happy: require('../assets/widget/happy.png'),
  thoughtful: require('../assets/widget/thoughtful.png'),
  worried: require('../assets/widget/worried.png'),
  panic: require('../assets/widget/panic.png'),
};
let lastRequested = 0;
const destinationCache = new Map<string,string>();
async function mascotUri(mood: keyof typeof files): Promise<string> {
  const saved = destinationCache.get(mood);
  if (saved) return saved;
  if (!widgetsDirectory) return '';
  const destination = new File(widgetsDirectory, `moneo-widget-${mood}-1114.png`);
  if (!destination.exists || destination.size === 0) {
    const source = await Asset.fromModule(files[mood]).downloadAsync();
    if (!source.localUri) return '';
    new File(source.localUri).copy(destination);
  }
  if (!destination.exists || destination.size <= 0) throw new Error('Asset maskot widget tidak berhasil disalin ke folder bersama');
  destinationCache.set(mood, destination.uri);
  return destination.uri;
}
export async function publishWidget(book: Book, showAmounts = true): Promise<void> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;
  // Prebuild/dev build is needed; Expo Go has no expo-widgets native module.
  if (!widgetsDirectory) return;
  const request = ++lastRequested;
  const snapshot = calculateWidgetSnapshot(book, monthNow(), showAmounts);
  // Keep balance/status visible even if a mascot file cannot be copied.
  let uri = '';
  try { uri = await mascotUri(snapshot.mood); }
  catch (error) { console.warn('Gagal menyalin gambar maskot:', error); }
  if (request !== lastRequested) return;
  // Bundled in-widget image is the last-resort fallback when an OS widget cannot read the shared URI.
  AnaFinanceWidget.updateSnapshot({...snapshot, mascotUri:uri});
}
