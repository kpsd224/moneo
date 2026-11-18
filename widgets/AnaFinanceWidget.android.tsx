import { Row, Column, Text, Image, Spacer, TextButton } from '@expo/ui/jetpack-compose';
import { background, cornerRadius, fillMaxWidth, paddingAll, size, width } from '@expo/ui/jetpack-compose/modifiers';
import { createWidget } from 'expo-widgets';
import type { WidgetSnapshot } from '../src/widgetHealth';

const AnaFinanceWidget = (props: WidgetSnapshot) => {
  'widget';
  // Isolated widget bundle: all values must be local or come from props.
  const label = props.label || (props.mood === 'happy' ? 'Aman' : props.mood === 'thoughtful' ? 'Waspada' : props.mood === 'worried' ? 'Hemat' : props.mood === 'panic' ? 'Kritis' : 'Belum ada dana');
  const percent = Math.max(0, Math.min(100, Number(props.percent) || 0));
  const ratio = Math.max(0, Math.min(1, Number(props.ratio) || 0));
  const mood = props.mood || 'thoughtful';
  const pillBg = mood === 'happy' ? '#E7F3E9' : mood === 'thoughtful' ? '#FFF0D6' : mood === 'worried' ? '#FCE8F0' : '#F8DCE6';
  const pillText = mood === 'happy' ? '#26754C' : mood === 'thoughtful' ? '#805A2E' : mood === 'worried' ? '#9F3B65' : '#A92B54';
  const filled = Math.round(184 * ratio);
  const hidden = props.privateMode === true;
  const balanceDisplay = hidden ? 'Rp ••••••' : (props.balanceFullText || props.balanceText);
  const incomeDisplay = hidden ? 'Rp ••••••' : (props.incomeFullText || props.incomeText);
  const expenseDisplay = hidden ? 'Rp ••••••' : (props.expenseFullText || props.expenseText);
  return (
    <Row modifiers={[background('#F7F3EC'), cornerRadius(20), paddingAll(12), fillMaxWidth()]}>
      <Column modifiers={[size(108,130)]}>
        <Image source={{uri:mood}} contentScale="fit" contentDescription={`Maskot ${label}`} modifiers={[size(108,130)]}/>
      </Column>
      <Column modifiers={[paddingAll(5), width(200)]}>
        <Row>
          <Text color="#607367" style={{fontSize:10,fontWeight:'bold'}}>Saldo Total</Text>
          <Spacer modifiers={[size(5,1)]}/>
          <TextButton onClick={() => ({ ...props, privateMode: !hidden })} colors={{contentColor:'#26754C',containerColor:'#E2EFE2'}}>
            <Text color="#26754C" style={{fontSize:12,fontWeight:'bold'}}>{hidden ? 'Lihat' : 'Tutup'}</Text>
          </TextButton>
        </Row>
        <Text color="#173C2E" style={{fontSize:18,fontWeight:'bold'}}>{balanceDisplay}</Text>
        <Spacer modifiers={[size(1,4)]}/>
        <Row modifiers={[cornerRadius(99),background(pillBg),paddingAll(5)]}>
          <Text color={pillText} style={{fontSize:10,fontWeight:'bold'}}>{label} · {percent}%</Text>
        </Row>
        <Spacer modifiers={[size(1,5)]}/>
        <Row modifiers={[background('#DFE8DE'),cornerRadius(99),size(184,8)]}>
          <Row modifiers={[background('#26754C'),cornerRadius(99),size(filled,8)]}/>
        </Row>
        <Spacer modifiers={[size(1,7)]}/>
        <Row modifiers={[background('#FFFEFB'),cornerRadius(13),paddingAll(4)]}>
          <Column modifiers={[paddingAll(2)]}>
            <Text color="#26754C" style={{fontSize:9,fontWeight:'bold'}}>↑ Pemasukan</Text>
            <Text color="#173C2E" style={{fontSize:9,fontWeight:'bold'}}>{incomeDisplay}</Text>
          </Column>
          <Spacer modifiers={[size(6,1)]}/>
          <Column modifiers={[paddingAll(2)]}>
            <Text color="#B8326B" style={{fontSize:9,fontWeight:'bold'}}>↓ Pengeluaran</Text>
            <Text color="#173C2E" style={{fontSize:9,fontWeight:'bold'}}>{expenseDisplay}</Text>
          </Column>
        </Row>
      </Column>
    </Row>
  );
};
export default createWidget<WidgetSnapshot>('AnaFinanceWidget', AnaFinanceWidget, {
  balanceText:'Rp 0',incomeText:'Rp 0',expenseText:'Rp 0',balanceFullText:'Rp 0',incomeFullText:'Rp 0',expenseFullText:'Rp 0',ratio:0,percent:0,
  mood:'thoughtful',label:'Belum ada dana',period:'',privateMode:false,mascotUri:''
});
