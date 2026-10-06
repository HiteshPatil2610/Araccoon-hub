import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compactParts, featureFacts } from '../../shared/featureFacts';
import { formatProductCopy } from '../../shared/productCopy';

const features = [
  'Achieve Ultimate Versatility: The arm accommodates screens ranging from 13" to 32" and weighing 2kg to 9kg. With VESA 75x75mm or 100x100mm mounting holes, it suits a desk setup.',
  'Experience Unmatched Flexibility: Tilt your screen from -45° to 90°, swivel it ±90°, and enjoy a 360° rotation.',
  'Fluid Motion, Secure Mounting: The thickness required for the C-type clamp is 3CM-8CM, and the thickness required for the Gromment Hole is 1CM-7.8CM, using a C-clamp or grommet mount.',
  'Ergonomic Comfort: It promotes optimal ergonomic comfort and reduces fatigue.',
  "Strength and Security: Crafted from durable steel, this stand protects your screen. It's your screen's bodyguard.",
  'Space-Saving Marvel: Reclaim your desk space, conserving over 80% of your desktop real estate.',
  'Effortless Assembly: Follow the installation manual to assemble in just 5 minutes.',
  'Cable Organization: Say goodbye to tangled cables with removable cable clamps that keep your tabletop neat and stylish.',
];

test('replaces the supplied promotional copy with short factual rows and preserves essential limits', () => {
  const result = formatProductCopy('HEYMIX LIFE Single Monitor Arm', '', [{name:'Material',value:'Alloy Steel'}], features);
  for (const fact of ['Screen compatibility: 13–32 inches', 'Supported weight: 2–9 kg', 'VESA mounting: 75 × 75 mm · 100 × 100 mm', 'Tilt: -45–90°', 'Swivel: ±90°', 'Rotation: 360°', 'Clamp desk thickness: 3–8 cm', 'Grommet desk thickness: 1–7.8 cm', 'Cable management: removable cable clamps', 'Material: Alloy Steel']) assert.ok(result.description.includes(fact), fact);
  assert.ok(result.description.length < 450);
  assert.doesNotMatch(result.description, /Ultimate|Unmatched|Comfort|Security|Marvel|Effortless|80%|5 minutes|bodyguard|say goodbye/i);
  assert.deepEqual(formatProductCopy(result.title, result.description), result);
  const legacy = formatProductCopy(result.title, `Material: Alloy Steel\n${features.join('\n')}`);
  assert.equal(legacy.description, result.description);
});

test('the same fact extraction works for unrelated categories and preserves short unfamiliar fields', () => {
  const bottle = formatProductCopy('Travel Bottle', '', [{name:'Lid Mechanism',value:'Twist lock'}], [
    'Ultimate Hydration: Made of stainless steel, this bottle holds 750 ml. It is your perfect adventure companion.',
  ]);
  assert.equal(bottle.description, 'Lid Mechanism: Twist lock\nMaterial: stainless steel\nCapacity: 750 ml');
  const lamp = formatProductCopy('Desk Lamp', '', [], ['Powerful Comfort: Rated power is 12 W. Battery capacity is 4000 mAh. It brings incredible comfort to your desk.']);
  assert.equal(lamp.description, 'Power: 12 W\nBattery capacity: 4000 mAh');
  assert.deepEqual(compactParts([{label:'Care', value:'Wipe clean with a soft cloth.'}]), [{label:'Care',value:'Wipe clean with a soft cloth.'}]);
});

test('negative statements never become positive features or guessed measurements', () => {
  assert.deepEqual(featureFacts('No gas spring is included. This product does not support VESA 100x100mm. It is not IP67 rated.'), []);
  assert.deepEqual(featureFacts('Weighing 2kg, this item is portable.'), [{label:'Weight',value:'2 kg'}]);
  assert.doesNotMatch(formatProductCopy('Desk Arm', '', [], ['Amazing versatility without exact specifications.']).description, /13|32|9 kg|VESA/);
});

test('range separators do not become negative endpoints and negative tilt stays negative', () => {
  assert.deepEqual(featureFacts('The clamp requires 3CM-8CM. Tilt from -45° to 90°. It supports a load of 2kg to 9kg.'), [
    {label:'Clamp desk thickness',value:'3–8 cm'}, {label:'Tilt',value:'-45–90°'}, {label:'Supported weight',value:'2–9 kg'},
  ]);
});
