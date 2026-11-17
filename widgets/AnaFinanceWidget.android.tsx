import { Row, Column, Text, Image } from '@expo/ui/jetpack-compose';
import { background, cornerRadius, paddingAll, size } from '@expo/ui/jetpack-compose/modifiers';
import { createWidget } from 'expo-widgets';
import type { WidgetSnapshot } from '../src/widgetHealth';

const localMascot = {
  happy: require('../assets/widget/happy.jpg'),
  thoughtful: require('../assets/widget/thoughtful.jpg'),
  worried: require('../assets/widget/worried.jpg'),
  panic: require('../assets/widget/panic.jpg'),
};
const logoAsset = require('../assets/icon.png');
function statusMeta(props: WidgetSnapshot){
  if(props.label==='Aman') return {pillBg:'#DFF2EA', pillText:'#15836A', range:'> 80%'};
  if(props.label==='Waspada') return {pillBg:'#F7E8C8', pillText:'#9B6529', range:'50–80%'};
  if(props.label==='Hemat') return {pillBg:'#F7DDE5', pillText:'#B64F70', range:'25–50%'};
  if(props.label==='Kritis') return {pillBg:'#FFD9E2', pillText:'#C43A65', range:'< 25%'};
  return {pillBg:'#E8E0FB', pillText:'#7054B6', range:'0%'};
}
const AnaFinanceWidget = (props: WidgetSnapshot) => {
  'widget';
  const meta = statusMeta(props);
  const source = props.mascotUri ? {uri:props.mascotUri} : localMascot[props.mood === 'panic' ? 'panic' : props.mood === 'worried' ? 'worried' : props.mood === 'happy' ? 'happy' : 'thoughtful'];
  const progress = Math.max(18, Math.min(186, Math.round(186 * props.ratio)));
  return (
    <Column modifiers={[cornerRadius(24), background('#F7F0FF'), paddingAll(14)]}>
      <Row>
        <Image source={source} contentScale="crop" contentDescription={`Maskot ${props.label}`} modifiers={[size(118,118), cornerRadius(18)]}/>
        <Column modifiers={[paddingAll(8)]}>
          <Text color="#5F567C" style={{fontSize:11,fontWeight:'bold'}}>Saldo Total</Text>
          <Text color="#362264" style={{fontSize:24,fontWeight:'bold'}}>{props.balanceText}</Text>
          <Row modifiers={[background(meta.pillBg), cornerRadius(99), paddingAll(6)]}>
            <Text color={meta.pillText} style={{fontSize:11,fontWeight:'bold'}}>{props.label}</Text>
            <Text color={meta.pillText} style={{fontSize:11}}>  {meta.range}</Text>
          </Row>
          <Row modifiers={[background('#E9DFFC'), cornerRadius(99), size(188,10)]}><Row modifiers={[background('#7F53F5'), cornerRadius(99), size(progress,10)]}></Row></Row>
          <Row modifiers={[background('#FFFFFF'), cornerRadius(16), paddingAll(8)]}>
            <Column>
              <Text color="#4CA77B" style={{fontSize:10,fontWeight:'bold'}}>↑ Pemasukan</Text>
              <Text color="#453568" style={{fontSize:12,fontWeight:'bold'}}>{props.incomeText}</Text>
            </Column>
            <Column modifiers={[paddingAll(0)]}>
              <Text color="#D56495" style={{fontSize:10,fontWeight:'bold'}}>↓ Pengeluaran</Text>
              <Text color="#453568" style={{fontSize:12,fontWeight:'bold'}}>{props.expenseText}</Text>
            </Column>
          </Row>
        </Column>
        <Column modifiers={[paddingAll(4)]}><Image source={logoAsset} contentScale="fit" contentDescription="Moneo" modifiers={[size(42,42), cornerRadius(12)]}/></Column>
      </Row>
    </Column>
  );
};
export default createWidget<WidgetSnapshot>('AnaFinanceWidget', AnaFinanceWidget, {
  balanceText:'Rp 0', incomeText:'Rp 0', expenseText:'Rp 0', ratio:0,
  percent:0, mood:'thoughtful', label:'Belum ada dana', period:'', privateMode:false, mascotUri:''
});
