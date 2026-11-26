const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { install, patchWidgetRoot } = require('../scripts/patch-widget-open-app.cjs');

const root = path.resolve(__dirname, '..');
const fixture = `import androidx.glance.action.clickable
internal fun ReadableMap.toPeekRoot(context: Context, source: InteractionSource, size: DpSize): Emittable {
  val converterContext = WidgetConverterContext(context, size)
  return EmittableColumn().also { root ->
    root.children += toPeekNodes(converterContext, source)
  }
}`;
const patched = patchWidgetRoot(fixture);
assert.match(patched, /actionStartActivity\(launchIntent\)/);
assert.match(patched, /source is InteractionSource\.Widget/);
assert.equal(patchWidgetRoot(patched), patched);
assert.throws(() => patchWidgetRoot('different dependency source'), /expo-widgets berubah/);

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'moneo-widget-'));
try {
  const nativeFile = path.join(temp, 'java', 'expo', 'modules', 'widgets', 'ExpoWidgetEmittableTree.kt');
  fs.mkdirSync(path.dirname(nativeFile), { recursive: true });
  fs.writeFileSync(nativeFile, fixture);
  install(temp);
  assert.equal(fs.readFileSync(nativeFile, 'utf8'), patched);
  for (const name of ['moneo_eye_on.xml', 'moneo_eye_off.xml', 'moneo_widget_card.xml', 'moneo_logo.png']) {
    assert.deepEqual(fs.readFileSync(path.join(temp, 'res', 'drawable', name)), fs.readFileSync(path.join(root, 'assets', 'widget', name)));
  }
  install(temp);
  assert.equal(fs.readFileSync(nativeFile, 'utf8'), patched);
} finally {
  if (path.dirname(temp) !== os.tmpdir()) throw new Error('Lokasi sementara di luar direktori yang dimaksud.');
  fs.rmSync(temp, { recursive: true, force: true });
}

const actualNative = path.join(root, 'node_modules', 'expo-widgets', 'android', 'src', 'main', 'java', 'expo', 'modules', 'widgets', 'ExpoWidgetEmittableTree.kt');
if (fs.existsSync(actualNative)) assert.match(fs.readFileSync(actualNative, 'utf8'), /GlanceModifier\.fillMaxSize\(\)\.clickable\(actionStartActivity\(launchIntent\)\)/);

const android = fs.readFileSync(path.join(root, 'widgets', 'AnaFinanceWidget.android.tsx'), 'utf8');
const ios = fs.readFileSync(path.join(root, 'widgets', 'AnaFinanceWidget.ios.tsx'), 'utf8');
const app = fs.readFileSync(path.join(root, 'App.tsx'), 'utf8');
const widgetConfig = require('../app.json').expo.plugins.find(plugin => Array.isArray(plugin) && plugin[0] === 'expo-widgets')[1].widgets[0].android;
assert.equal(widgetConfig.minWidth, 280);
assert.equal(widgetConfig.targetCellWidth, 4);
assert.match(android, /<Box modifiers=\{\[size\(280,164\)\]\}>/);
assert.equal(widgetConfig.minHeight, 110);
assert.equal(widgetConfig.targetCellHeight, 2);
assert.equal(widgetConfig.resizeMode, 'none');
assert.match(android, /source=\{\{uri:'moneo_logo'\}\}/);
assert.match(android, /moneo_eye_off/);
assert.match(android, /contentScale="fit"/);
assert.match(android, /contentAlignment="center" modifiers=\{\[fillMaxSize\(\)\]\}/);
assert.match(android, /moneo_widget_card/);
assert.match(android, /contentScale="fillBounds" contentDescription=\{null\} modifiers=\{\[fillMaxSize\(\)\]\}/);
assert.match(android, /source=\{\{uri:props\.mascotUri \|\| mood\}\}/);
assert(android.indexOf('<TextButton') < android.indexOf('↓ Pengeluaran'), 'eye control must be in the top right header');
assert.match(ios, /widgetURL\('moneo:\/\/'\)/);
assert.match(ios, /uiImage=\{props\.logoUri\}/);
assert.match(fs.readFileSync(path.join(root, 'src', 'publishWidget.ts'), 'utf8'), /sharedImageUri\('logo'\)/);
assert(require('../app.json').expo.plugins.find(plugin => Array.isArray(plugin) && plugin[0] === 'expo-asset')[1].assets.includes('./assets/widget/moneo_logo.png'));
const bundledAssets = require('../app.json').expo.plugins.find(plugin => Array.isArray(plugin) && plugin[0] === 'expo-asset')[1].assets;
for (const mood of ['happy','thoughtful','worried','panic']) {
  for (const character of ['bunny','sehun']) {
  const name = `./assets/widget/${character}_${mood}.png`;
  assert(bundledAssets.includes(name), `missing widget asset ${name}`);
  const png = fs.readFileSync(path.join(root, name));
  assert.equal(png[25], 6, `${name} must keep its transparent RGBA background`);
}
}
const publisher = fs.readFileSync(path.join(root, 'src', 'publishWidget.ts'), 'utf8');
assert(publisher.includes('`${character}_${snapshot.mood}`'));
assert.match(app, /setWidgetCharacter\(choice\.id\)/);
assert.match(app, /widgetCharacter:\s*'bibble'/);
assert.match(ios, /containerBackground\('#F9F7F5','widget'\)/);
assert.match(ios, /contentMode:'fit'/);
assert(ios.indexOf('<Button') < ios.indexOf('↓ Pengeluaran'), 'iOS eye control must be in the top right header');
assert.doesNotMatch(app, /Ketuk kategori untuk mengganti nama/);
assert.doesNotMatch(app, /Arus kas bersih \{periodLabel\(period\)\}/);
assert.match(app, /function resetAllData\(\)/);
assert.match(app, /await AsyncStorage\.setItem\(STORAGE, JSON\.stringify\(\{book:empty/);
assert.doesNotMatch(app, /Aplikasi keuangan pribadi Android & iOS/);
console.log('PASS: native widget patch, eye icon assets, and layout source checks');
