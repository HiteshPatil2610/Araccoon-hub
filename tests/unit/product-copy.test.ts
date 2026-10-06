import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { productName, formatProductCopy, descriptionSummary } from '../../shared/productCopy';
import { ProductDescription } from '../../src/components/ProductDescription';

const title = 'Lenovo Legion {SmartChoice} R27qe Gen 2 | 27" (68.58cm) QHD IPS 200Hz Gaming Monitor | 0.5MS, AMD FreeSync, 99%sRGB, 2xHDMI 2.1, TMDS, 1xDP 1.4 | Tilt, Swivel, Pivot, Height Adjust | Black | 68C7GAC3IN';
const description = '• Display: 27-inch QHD | IPS Panel | 200Hz Refresh Rate | Response Time: 0.5ms (MPRT), 1ms (Level 4), 2ms (Level 3) • Visual Experience: 1.07 Billion Colours | 99% sRGB, 90% DCI-P3 | Brightness: 400 nits | Anti-Glare | HDR10 Compliance • Response Time: 0.5ms | AMD Freesync, VESA Adaptive Sync, NVIDIA G-SYNC Compatible • Connectivity: 2x HDMI 2.1 TMDS,1x DisplayPort 1.4 • Included components: Monitor, cables, guide • Warranty: 3 Years Limited warranty Brand: Lenovo Screen Size: 27 Inches';

test('extracts the requested product name and retains model/generation', () => {
  assert.equal(productName(title), 'Lenovo Legion R27qe Gen 2');
  assert.equal(productName('Lenovo Legion R27qe Gen 2 27-inch QHD Gaming Monitor'), 'Lenovo Legion R27qe Gen 2');
  assert.equal(productName('Logitech G102 LightSync Gaming Mouse, RGB lighting'), 'Logitech G102 LightSync');
  assert.equal(productName('Dell Inspiron 3530 Laptop | Intel Core i5'), 'Dell Inspiron 3530');
  assert.equal(productName('Adjustable & Foldable Desk Stand'), 'Adjustable & Foldable Desk Stand');
  assert.equal(productName('Example A100 Monitor Arm, Steel mount'), 'Example A100 Monitor Arm');
});

test('turns the monitor listing into concise verified specs and removes repeated variants', () => {
  const result = formatProductCopy(title, description);
  assert.equal(result.title, 'Lenovo Legion R27qe Gen 2');
  assert.match(result.description, /^Display: 27-inch QHD IPS\nRefresh rate: 200Hz\nResponse time: 0.5ms \(MPRT\)/);
  assert.match(result.description, /Colour coverage: 99% sRGB · 90% DCI-P3/);
  assert.match(result.description, /Connectivity: 2x HDMI 2.1 TMDS,1x DisplayPort 1.4/);
  assert.match(result.description, /Warranty: 3 Years Limited warranty/);
  assert.equal((result.description.match(/AMD FreeSync/gi) || []).length, 1);
  assert.doesNotMatch(result.description, /Level 4|Brand: Lenovo|SmartChoice/);
  assert.match(result.description, /Included components: Monitor, cables, guide/);
  assert.equal(formatProductCopy(result.title, result.description).description, result.description);
});

test('missing facts stay missing and ordinary copy remains readable', () => {
  const result = formatProductCopy('Example M27 Monitor', 'Display: 27-inch IPS');
  assert.doesNotMatch(result.description, /200Hz|0.5ms|Warranty/);
  assert.equal(formatProductCopy('A desk stand', 'Folds flat for storage.').description, 'Storage: Foldable');
  assert.equal(descriptionSummary('Display: 27-inch QHD IPS\nRefresh rate: 200Hz\nResponse time: 0.5ms\nWarranty: 3 years'), '27-inch QHD IPS · 200Hz · 0.5ms');
});

test('descriptions render semantic bold labels and escape untrusted listing markup', () => {
  const markup = renderToStaticMarkup(createElement(ProductDescription, {text:'Display: 27-inch IPS\nConnectivity: <img src=x onerror=alert(1)>\nRefresh rate: **200Hz**'}));
  assert.match(markup, /<strong[^>]*>Display<\/strong>/);
  assert.match(markup, /<dl/);
  assert.doesNotMatch(markup, /<img/);
  assert.match(markup, /&lt;img/);
  assert.doesNotMatch(markup, /\*\*/);
});

const mouseDescription = [
  'Next-generation HERO sensor delivers incredible performance and up to 10x the power efficiency over previous generations. HERO is an optical sensor capable of exceptional accuracy and responsiveness with 400 IPS precision and up to 12,000 DPI.',
  'Ultra-fast LIGHTSPEED Wireless technology gives you a lag-free gaming experience. G304 delivers incredible responsiveness and reliability with a super fast 1 ms report rate for competition-level performance.',
  'Play at peak performance without worrying about running out of power. G304 boasts an incredible 250 hours of continuous gameplay at 1ms report rate in Performance mode on just one AA battery.',
  'G304 is designed to be lightweight for high maneuverability. G304 is a lightweight gaming mouse that comes in at only 99 grams thanks to efficient lightweight mechanical design.',
  'The durable, compact design with built-in nano receiver storage makes G304 a great laptop travel companion.',
  'Colour: White',
  'Connectivity Technology: wireless',
].join('\n');

test('mouse prose becomes concise bold spec rows with battery conditions preserved', () => {
  const result = formatProductCopy('Logitech G304 Lightspeed', mouseDescription);
  assert.match(result.description, /^Sensor: HERO optical sensor\nSensitivity: up to 12,000 DPI\nTracking speed: 400 IPS/);
  assert.match(result.description, /Connection: LIGHTSPEED Wireless\nReport rate: 1 ms/);
  assert.match(result.description, /Battery life: 250 hours · Performance mode · 1ms report rate\nPower: one AA battery\nWeight: 99 grams/);
  assert.match(result.description, /Receiver storage: built-in nano receiver storage\nColour: White/);
  assert.doesNotMatch(result.description, /Next-generation|incredible|lag-free|Response time:|Buttons:/);
  assert.equal(formatProductCopy(result.title, result.description).description, result.description);
  const markup = renderToStaticMarkup(createElement(ProductDescription, {text:result.description}));
  for (const label of ['Sensor', 'Sensitivity', 'Connection', 'Battery life', 'Weight']) {
    assert.match(markup, new RegExp(`<strong[^>]*>${label}</strong>`));
  }
  assert.doesNotMatch(markup, /<p[ >]/);
});

test('previously clipped mouse descriptions still format but missing units are not guessed', () => {
  const clipped = mouseDescription.replace('12,000 DPI.', '12,000 D');
  const result = formatProductCopy('Logitech G304 Lightspeed', clipped);
  assert.match(result.description, /Sensor: HERO optical sensor/);
  assert.match(result.description, /Battery life: 250 hours · Performance mode · 1ms report rate/);
  assert.doesNotMatch(result.description, /Sensitivity:|12,000 D|Buttons:/);
});

test('other mice use supplied facts without inheriting Logitech-specific claims', () => {
  const result = formatProductCopy('Example M10 Wired Mouse', '', [
    {name:'Sensor', value:'Optical'}, {name:'DPI', value:'1600 DPI'},
    {name:'Connectivity Technology', value:'USB wired'}, {name:'Number of Buttons', value:'3'},
  ]);
  assert.match(result.description, /Sensor: Optical\nSensitivity: 1600 DPI\nConnection: USB wired\nButtons: 3/);
  assert.doesNotMatch(result.description, /HERO|LIGHTSPEED|Battery|250 hours|99 grams/);
  assert.deepEqual(formatProductCopy(result.title, result.description), result);
});

test('long generic descriptions retain complete sentences instead of chopping words', () => {
  const sentence = 'A useful storage stand that folds away when you have finished using it. ';
  const result = formatProductCopy('Desk stand', sentence.repeat(10));
  assert.ok(result.description.length <= 400);
  assert.ok(result.description.endsWith('it.'));
});

test('unfamiliar categories preserve supplied attributes before feature prose without a seven-row cutoff', () => {
  for (const name of ['Insulated Water Bottle', 'Cotton Cushion Cover', 'Wooden Puzzle', 'Rechargeable Desk Lamp']) {
    const specifications = Array.from({length:10}, (_, i) => ({name:`Source attribute ${i + 1}`, value:`Value ${i + 1}`}));
    const result = formatProductCopy(name, 'A useful addition to your room.', specifications, ['【Care】: Wipe clean with a soft cloth.']);
    for (const spec of specifications) assert.ok(result.description.includes(`${spec.name}: ${spec.value}`));
    assert.ok(result.description.startsWith('Source attribute 1:'));
    assert.match(result.description, /Care: Wipe clean with a soft cloth/);
    assert.deepEqual(formatProductCopy(result.title, result.description), result);
    assert.doesNotMatch(result.description, /Display:|Sensor:/);
  }
});

test('known types retain extra source attributes and do not treat accessories as their compatible product', () => {
  const monitor = formatProductCopy(title, description, [{name:'Material',value:'Aluminium'}, {name:'Speaker Output',value:'2 W'}]);
  assert.match(monitor.description, /Material: Aluminium\nSpeaker Output: 2 W/);
  const pad = formatProductCopy('Example Gaming Mouse Pad', 'Works with an optical mouse sensor up to 12,000 DPI.', [{name:'Material',value:'Rubber'}, {name:'Colour',value:'Black'}]);
  assert.doesNotMatch(pad.description, /Sensor:|Sensitivity:/);
  assert.match(pad.description, /Material: Rubber\nColour: Black/);
  const actualMonitor = formatProductCopy('Example M27 Monitor with Adjustable Stand', 'Display: 27-inch IPS\nRefresh rate: 144Hz');
  assert.match(actualMonitor.description, /Display: 27-inch IPS\nRefresh rate: 144Hz/);
});

test('feature summarization preserves decimals and measurement ranges as complete sentences', () => {
  const result = formatProductCopy('Desk Mount', '', [{name:'Mounting',value:'Clamp'}], ['【Installation】: Make your desk beautiful. The clamp requires 3CM-8CM thickness, and the grommet requires 1CM-7.8CM. Enjoy a new workspace.']);
  assert.match(result.description, /Clamp desk thickness: 3–8 cm\nGrommet desk thickness: 1–7.8 cm/);
  assert.doesNotMatch(result.description, /Make your desk|Enjoy a new workspace|Installation: 8CM/);
  assert.deepEqual(formatProductCopy(result.title, result.description), result);
});

test('compatibility mentions and printer DPI do not trigger unrelated product templates', () => {
  const keyboard = formatProductCopy('Example K100 Keyboard', 'Works beside a 27-inch QHD IPS monitor at 144Hz.', [{name:'Switch Type',value:'Mechanical'}, {name:'Layout',value:'75%'}]);
  assert.match(keyboard.description, /^Switch Type: Mechanical\nLayout: 75%/);
  assert.doesNotMatch(keyboard.description, /Display:|Refresh rate:/);
  const scanner = formatProductCopy('Example S100 Scanner', 'An optical sensor scans at 600 DPI.', [{name:'Scan Resolution',value:'600 DPI'}, {name:'Paper Size',value:'A4'}]);
  assert.match(scanner.description, /^Scan Resolution: 600 DPI\nPaper Size: A4/);
  assert.doesNotMatch(scanner.description, /Sensitivity:|Tracking speed:/);
});
