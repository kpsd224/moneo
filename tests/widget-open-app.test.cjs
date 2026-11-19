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
  for (const name of ['moneo_eye_on.xml', 'moneo_eye_off.xml']) {
    assert.deepEqual(fs.readFileSync(path.join(temp, 'res', 'drawable', name)), fs.readFileSync(path.join(root, 'assets', 'widget', name)));
  }
  assert.deepEqual(fs.readFileSync(path.join(temp, 'res', 'drawable-nodpi', 'moneo_widget_logo.png')), fs.readFileSync(path.join(root, 'assets', 'icon.png')));
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
assert.match(android, /moneo_widget_logo/);
assert.match(android, /moneo_eye_off/);
assert.match(ios, /widgetURL\('moneo:\/\/'\)/);
assert.match(ios, /props\.logoUri/);
assert.doesNotMatch(app, /Ketuk kategori untuk mengganti nama/);
assert.doesNotMatch(app, /Arus kas bersih \{periodLabel\(period\)\}/);
console.log('PASS: native widget patch, logo/icon assets, and layout source checks');
