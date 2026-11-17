/** Local-only widget publisher. Safe no-op in Expo Go / web (requires custom native build). */
import { Platform } from 'react-native';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { widgetsDirectory } from 'expo-widgets';
import AnaFinanceWidget from '../widgets/AnaFinanceWidget';
import type { Book } from './finance';
import { calculateWidgetSnapshot, monthNow } from './widgetHealth';

const files = {
  happy: require('../assets/widget/happy.jpg'),
  thoughtful: require('../assets/widget/thoughtful.jpg'),
  worried: require('../assets/widget/worried.jpg'),
  panic: require('../assets/widget/panic.jpg'),
};
let lastRequested = 0;
const destinationCache = new Map<string,string>();
async function mascotUri(mood: keyof typeof files): Promise<string> {
  const saved = destinationCache.get(mood);
  if (saved) return saved;
  if (!widgetsDirectory) return '';
  const destination = new File(widgetsDirectory, `moneo-widget-${mood}-119.jpg`);
  if (!destination.exists) {
    const source = await Asset.fromModule(files[mood]).downloadAsync();
    if (!source.localUri) return '';
    await new File(source.localUri).copy(destination);
  }
  destinationCache.set(mood, destination.uri);
  return destination.uri;
}
export async function publishWidget(book: Book, showAmounts = true): Promise<void> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;
  // Prebuild/dev build is needed; Expo Go has no expo-widgets native module.
  if (!widgetsDirectory) return;
  const request = ++lastRequested;
  const snapshot = calculateWidgetSnapshot(book, monthNow(), showAmounts);
  const uri = await mascotUri(snapshot.mood);
  if (request !== lastRequested) return; // Never let an earlier async publish overwrite newer balances.
  AnaFinanceWidget.updateSnapshot({...snapshot, mascotUri:uri});
}
