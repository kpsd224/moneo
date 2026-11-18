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
const destinationCache = new Map<string,Promise<string>>();
async function mascotUri(mood: keyof typeof files): Promise<string> {
  const saved = destinationCache.get(mood);
  if (saved) return saved;
  if (!widgetsDirectory) return '';
  const copyTask = (async () => {
    const source = await Asset.fromModule(files[mood]).downloadAsync();
    if (!source.localUri) return '';
    const destination = new File(widgetsDirectory, `moneo-widget-${mood}-1115-v2.png`);
    if (destination.exists) destination.delete();
    await new File(source.localUri).copy(destination);
    if (!destination.exists || destination.size <= 0) throw new Error('Asset maskot widget tidak berhasil disalin ke folder bersama');
    return destination.uri;
  })();
  destinationCache.set(mood, copyTask);
  try {
    const uri = await copyTask;
    if (!uri) destinationCache.delete(mood);
    return uri;
  } catch (error) {
    destinationCache.delete(mood);
    throw error;
  }
}
export async function publishWidget(book: Book, showAmounts = true): Promise<void> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;
  const request = ++lastRequested;
  const snapshot = calculateWidgetSnapshot(book, monthNow(), showAmounts);
  if (Platform.OS === 'android') {
    AnaFinanceWidget.updateSnapshot(snapshot);
    return;
  }
  if (!widgetsDirectory) return;
  // Keep balance/status visible even if a mascot file cannot be copied.
  let uri = '';
  try { uri = await mascotUri(snapshot.mood); }
  catch (error) { console.warn('Gagal menyalin gambar maskot:', error); }
  if (request !== lastRequested) return;
  // Only the shared file URI goes into the isolated widget: no require() in widget code.
  AnaFinanceWidget.updateSnapshot({...snapshot, mascotUri:uri});
}
