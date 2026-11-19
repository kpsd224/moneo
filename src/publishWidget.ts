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
  logo: require('../assets/icon.png'),
};
let lastRequested = 0;
const destinationCache = new Map<string,Promise<string>>();
async function sharedImageUri(name: keyof typeof files): Promise<string> {
  const saved = destinationCache.get(name);
  if (saved) return saved;
  if (!widgetsDirectory) return '';
  const copyTask = (async () => {
    const source = await Asset.fromModule(files[name]).downloadAsync();
    if (!source.localUri) return '';
    const destination = new File(widgetsDirectory, `moneo-widget-${name}-1115-v3.png`);
    if (destination.exists) destination.delete();
    await new File(source.localUri).copy(destination);
    if (!destination.exists || destination.size <= 0) throw new Error('Gambar widget tidak berhasil disalin ke folder bersama');
    return destination.uri;
  })();
  destinationCache.set(name, copyTask);
  try {
    const uri = await copyTask;
    if (!uri) destinationCache.delete(name);
    return uri;
  } catch (error) {
    destinationCache.delete(name);
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
  let logoUri = '';
  try { uri = await sharedImageUri(snapshot.mood); }
  catch (error) { console.warn('Gagal menyalin gambar maskot:', error); }
  try { logoUri = await sharedImageUri('logo'); }
  catch (error) { console.warn('Gagal menyalin logo widget:', error); }
  if (request !== lastRequested) return;
  // Only the shared file URI goes into the isolated widget: no require() in widget code.
  AnaFinanceWidget.updateSnapshot({...snapshot, mascotUri:uri, logoUri});
}
