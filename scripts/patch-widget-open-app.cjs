const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const dependencyAndroid = path.join(projectRoot, 'node_modules', 'expo-widgets', 'android', 'src', 'main');

function patchWidgetRoot(source) {
  const text = source.replace(/\r\n/g, '\n');
  if (text.includes('GlanceModifier.fillMaxSize().clickable(actionStartActivity(launchIntent))')) return text;

  const importLine = 'import androidx.glance.action.clickable\n';
  const root = '  return EmittableColumn().also { root ->\n    root.children += toPeekNodes(converterContext, source)\n  }';
  if (!text.includes(importLine) || !text.includes(root)) {
    throw new Error('Struktur expo-widgets berubah; aksi buka Moneo perlu diperiksa sebelum build.');
  }

  return text
    .replace(importLine, `${importLine}import androidx.glance.appwidget.action.actionStartActivity\n`)
    .replace(root, `  return EmittableColumn().also { root ->
    if (source is InteractionSource.Widget) {
      context.packageManager.getLaunchIntentForPackage(context.packageName)?.let { launchIntent ->
        root.modifier = GlanceModifier.fillMaxSize().clickable(actionStartActivity(launchIntent))
      }
    }
    root.children += toPeekNodes(converterContext, source)
  }`);
}

function install(widgetsAndroid = dependencyAndroid) {
  const treeFile = path.join(widgetsAndroid, 'java', 'expo', 'modules', 'widgets', 'ExpoWidgetEmittableTree.kt');
  const original = fs.readFileSync(treeFile, 'utf8');
  const patched = patchWidgetRoot(original);
  if (patched !== original) fs.writeFileSync(treeFile, patched);

  const drawable = path.join(widgetsAndroid, 'res', 'drawable');
  fs.mkdirSync(drawable, { recursive: true });
  for (const name of ['moneo_eye_on.xml', 'moneo_eye_off.xml']) {
    fs.copyFileSync(path.join(projectRoot, 'assets', 'widget', name), path.join(drawable, name));
  }
  console.log('Widget Moneo: ketuk kartu untuk membuka aplikasi; ikon mata terpasang.');
}

if (require.main === module) install();
module.exports = { patchWidgetRoot, install };
