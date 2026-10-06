import { test } from 'node:test';
import assert from 'node:assert/strict';
import { productPatchSchema } from '../../shared/schemas';

test('partial updates never inject create-time defaults into omitted fields', () => {
  assert.deepEqual(productPatchSchema.parse({status:'published'}), {status:'published'});
  assert.deepEqual(productPatchSchema.parse({description:'Material: Steel'}), {description:'Material: Steel'});
  assert.deepEqual(productPatchSchema.parse({}), {});
});

test('explicit clearing and false values remain valid while unknown or invalid fields are rejected', () => {
  assert.deepEqual(productPatchSchema.parse({description:'',badge:null,affiliateTag:null,featured:false,rating:0}), {description:'',badge:null,affiliateTag:null,featured:false,rating:0});
  for (const input of [{rating:6}, {status:'anything'}, {isAdmin:true}, {title:''}]) {
    assert.equal(productPatchSchema.safeParse(input).success, false);
  }
});
