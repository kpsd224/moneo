import { Row, Column, Text, Image } from '@expo/ui/jetpack-compose';
import { background, cornerRadius, paddingAll, size } from '@expo/ui/jetpack-compose/modifiers';
import { createWidget } from 'expo-widgets';
import type { WidgetSnapshot } from '../src/widgetHealth';

const AnaFinanceWidget = (props: WidgetSnapshot) => {
  'widget';
  function statusMeta(props: WidgetSnapshot){
    if(props.label==='Aman') return {pillBg:'#DFF2EA', pillText:'#15836A', range:'> 80%'};
    if(props.label==='Waspada') return {pillBg:'#F7E8C8', pillText:'#9B6529', range:'50–80%'};
    if(props.label==='Hemat') return {pillBg:'#F7DDE5', pillText:'#B64F70', range:'25–50%'};
    if(props.label==='Kritis') return {pillBg:'#FFD9E2', pillText:'#C43A65', range:'< 25%'};
    return {pillBg:'#E8E0FB', pillText:'#7054B6', range:'0%'};
  }
  const meta = statusMeta(props);
  const mascotWidth = props.mood === 'happy' ? 108 : props.mood === 'thoughtful' ? 100 : props.mood === 'worried' ? 96 : 104;
  const mascotHeight = props.mood === 'worried' ? 110 : props.mood === 'thoughtful' ? 104 : 108;
  const progress = Math.max(18, Math.min(190, Math.round(190 * props.ratio)));
  return (
    <Column modifiers={[cornerRadius(24), background('#F5EEFF'), paddingAll(14)]}>
      <Row>
        {props.mascotUri ? (
          <Image source={{uri:props.mascotUri}} contentScale="crop" contentDescription={`Maskot ${props.label}`} modifiers={[size(mascotWidth, mascotHeight), cornerRadius(18)]}/>
        ) : (
          <Column modifiers={[size(104,104), cornerRadius(18), background('#ECE4FF'), paddingAll(12)]}><Text color="#7054B6">Maskot</Text></Column>
        )}
        <Column modifiers={[paddingAll(8)]}>
          <Text color="#655C89" style={{fontSize:11,fontWeight:'bold'}}>Saldo Total</Text>
          <Text color="#362264" style={{fontSize:24,fontWeight:'bold'}}>{props.balanceText}</Text>
          <Row modifiers={[background(meta.pillBg), cornerRadius(99), paddingAll(6)]}>
            <Text color={meta.pillText} style={{fontSize:11,fontWeight:'bold'}}>{props.label}</Text>
            <Text color={meta.pillText} style={{fontSize:11}}>  {meta.range}</Text>
          </Row>
          <Row modifiers={[background('#E9DFFC'), cornerRadius(99), size(192,10), paddingAll(0)]}>
            <Row modifiers={[background('#7F53F5'), cornerRadius(99), size(progress,10)]}></Row>
          </Row>
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
      </Row>
    </Column>
  );
};
export default createWidget<WidgetSnapshot>('AnaFinanceWidget', AnaFinanceWidget, {
  balanceText:'Rp 0', incomeText:'Rp 0', expenseText:'Rp 0', ratio:0,
  percent:0, mood:'thoughtful', label:'Belum ada dana', period:'', privateMode:false, mascotUri:''
});
