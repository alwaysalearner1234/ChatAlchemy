export const catalog = [
  ['gear','Gear','!gear','Mechanism','gear',['motion'],['transfers-motion']], ['laser','Laser','!laser','Energy','laser',['light'],['cuts']], ['portal','Portal','!portal','Transport','portal',['space'],['transports']], ['battery','Battery','!battery','Storage','battery',['energy'],['stores-energy']], ['duck','Duck','!duck','Wildcard','duck',['chaos'],['quacks']], ['black-hole','Black Hole','!blackhole','Gravity','black-hole',['gravity'],['attracts']], ['spring','Spring','!spring','Motion','spring',['motion'],['bounces']], ['fan','Fan','!fan','Force','fan',['air'],['pushes']], ['magnet','Magnet','!magnet','Field','magnet',['magnetic'],['attracts-metal']], ['prism','Prism','!prism','Optics','prism',['light'],['splits-light']]
].map(([id,name,command,category,assetKey,connectionTypes,effects])=>({id:String(id),name:String(name),command:String(command),category:String(category),assetKey:String(assetKey),connectionTypes:connectionTypes as string[],effects:effects as string[]}));
export type ComponentInstance = { instanceId:string; componentId:string; contributorId:string; contributorName:string; timestamp:number; position:{x:number;y:number} };
export type Challenge = {title:string;instructions:string;difficulty:'easy'|'medium'|'hard';challengeType:'precision'|'reaction'|'creativity'|'movement'};
export type MachineState = {sessionId:string;status:'idle'|'building'|'paused'|'finalizing'|'revealed';components:ComponentInstance[];activeCombos:string[];buildEndsAt:number|null;machineName:string|null;description:string|null;personality:string|null;challenge:Challenge|null;revision:number; mode:'DEMO'|'LIVE'; eventIds:string[]};
export const rules = [
  {ids:['battery','gear'],name:'Mechanical Power'}, {ids:['battery','laser'],name:'Powered Laser'}, {ids:['laser','portal'],name:'Portal Laser'}, {ids:['portal','black-hole'],name:'Anomaly'}, {ids:['gear','spring'],name:'Launch Mechanism'}, {ids:['laser','prism'],name:'Split Beam'}, {ids:['laser','portal','duck'],name:'Unstable Duck Cannon'}
];
export function assembly(componentIds:string[]) { const found:string[]=[]; for(const rule of rules) if(rule.ids.every(id=>componentIds.includes(id))) found.push(rule.name); return found; }
export function componentsForCombo(combo:string) { return rules.find(rule=>rule.name===combo)?.ids ?? []; }
export function approvedInstructions(type:Challenge['challengeType']) {
  const templates:Record<Challenge['challengeType'],string>={
    precision:'In your current game, complete one low-risk precision task using your usual setup.',
    reaction:'In your current game, respond to the next ordinary event with one deliberate action; skip anything unsafe.',
    creativity:'Invent a short story about how this machine could help a character in your current game.',
    movement:'Move your in-game character along a familiar, low-risk route while narrating the machine’s role.'
  };
  return templates[type];
}
export function position(index:number) { return {x: 20 + (index%5)*15, y: 25 + Math.floor(index/5)*18}; }
export function fallback(state:MachineState) {
  const names=state.components.map(c=>catalog.find(d=>d.id===c.componentId)?.name ?? ''); const combos=state.activeCombos;
  const challenge:Challenge = state.components.length>8 ? {title:'Overloaded Invention',instructions:'Complete a short precision task while narrating how the machine works.',difficulty:'hard',challengeType:'precision'} : combos.length ? {title:`${combos[0]} Trial`,instructions:`Explain the ${combos[0]} and complete a playful movement challenge inspired by it.`,difficulty:combos.length>2?'hard':'medium',challengeType:'movement'} : {title:'First Spark',instructions:`Use the machine's ${names.join(', ')||'empty'} setup as inspiration for a 30-second creative challenge.`,difficulty:'easy',challengeType:'creativity'};
  return {machineName: combos.length ? `${combos[0]} Mk. ${state.components.length||1}` : names.length ? `The ${names[0]} Spark` : 'The Quiet Contraption', description:names.length ? `A community-built machine featuring ${names.join(', ')}${combos.length ? `, joined by ${combos.join(', ')}` : ''}.` : 'A curious machine waiting for its first component.', personality:'Curious, inventive, and slightly unpredictable.', challenge};
}
