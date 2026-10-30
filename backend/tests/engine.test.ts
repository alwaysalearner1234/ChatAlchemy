import { describe, expect, it } from 'vitest';
import { assembly, approvedInstructions, catalog, position, fallback, type MachineState } from '../src/engine.js';

describe('deterministic assembly rules',()=>{
  const cases:[string[],string][]=[
    [['battery','gear'],'Mechanical Power'],[['battery','laser'],'Powered Laser'],[['laser','portal'],'Portal Laser'],[['portal','black-hole'],'Anomaly'],[['gear','spring'],'Launch Mechanism'],[['laser','prism'],'Split Beam'],[['laser','portal','duck'],'Unstable Duck Cannon']
  ];
  it.each(cases)('%j activates %s', (parts,result)=>expect(assembly(parts)).toContain(result));
  it('does not activate a rule more than once',()=>expect(assembly(['battery','gear','battery','gear'])).toEqual(['Mechanical Power']));
  it('is deterministic for repeated ordered inputs',()=>expect(assembly(['laser','portal','duck'])).toEqual(assembly(['laser','portal','duck'])));
  it('keeps positions stable by insertion index',()=>expect(position(5)).toEqual(position(5)));
  it('contains the ten supported command definitions',()=>expect(catalog.map(x=>x.command)).toEqual(['!gear','!laser','!portal','!battery','!duck','!blackhole','!spring','!fan','!magnet','!prism']));
  it('generates valid deterministic fallback content for empty state',()=>{const state:MachineState={sessionId:'s',status:'revealed',components:[],activeCombos:[],buildEndsAt:null,machineName:null,description:null,personality:null,challenge:null,revision:0,mode:'DEMO',eventIds:[]};expect(fallback(state).challenge.difficulty).toBe('easy');});
  it('limits generated challenge instructions to approved safe templates',()=>expect(approvedInstructions('movement')).toMatch(/in-game character/i));
});
