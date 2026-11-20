import { Row, Column, Text, Image, Spacer, TextButton } from '@expo/ui/jetpack-compose';
import { background, cornerRadius, fillMaxSize, paddingAll, size, width } from '@expo/ui/jetpack-compose/modifiers';
import { createWidget } from 'expo-widgets';
import type { WidgetSnapshot } from '../src/widgetHealth';

const AnaFinanceWidget = (props: WidgetSnapshot) => {
  'widget';
  // Isolated widget bundle: all values must be local or come from props.
  const label = props.label || (props.mood === 'happy' ? 'Aman' : props.mood === 'thoughtful' ? 'Waspada' : props.mood === 'worried' ? 'Hemat' : props.mood === 'panic' ? 'Kritis' : 'Belum ada dana');
  const percent = Math.max(0, Math.min(100, Number(props.percent) || 0));
  const ratio = Math.max(0, Math.min(1, Number(props.ratio) || 0));
  const mood = props.mood || 'thoughtful';
  const pillBg = label === 'Belum ada dana' || mood === 'happy' ? '#E7F3E9' : mood === 'thoughtful' ? '#FFF0D6' : mood === 'worried' ? '#FCE8F0' : '#F8DCE6';
  const pillText = label === 'Belum ada dana' || mood === 'happy' ? '#26754C' : mood === 'thoughtful' ? '#805A2E' : mood === 'worried' ? '#9F3B65' : '#A92B54';
  const filled = Math.round(154 * ratio);
  const hidden = props.privateMode === true;
  const balanceDisplay = hidden ? 'Rp ••••••' : (props.balanceFullText || props.balanceText);
  const incomeDisplay = hidden ? 'Rp ••••••' : (props.incomeFullText || props.incomeText);
  const expenseDisplay = hidden ? 'Rp ••••••' : (props.expenseFullText || props.expenseText);
  return (
    <Row horizontalArrangement="spaceBetween" verticalAlignment="center" modifiers={[fillMaxSize(), background('#F7EEF3'), cornerRadius(22), paddingAll(10)]}>
      <Column modifiers={[size(148,148)]}>
        <Image source={{uri:mood}} contentScale="fit" contentDescription={`Maskot ${label}`} modifiers={[size(148,148)]}/>
      </Column>
      <Column modifiers={[width(158)]}>
        <Row horizontalArrangement="spaceBetween" verticalAlignment="center">
          <Text color="#607367" style={{fontSize:12,fontWeight:'bold'}}>Saldo Total</Text>
          <TextButton {...{target:'moneo-toggle-amounts'}} onClick={() => ({ ...props, privateMode: !hidden })} colors={{containerColor:'#E2EFE2'}} modifiers={[size(36,36),cornerRadius(10)]}>
            <Image source={{uri:hidden ? 'moneo_eye_on' : 'moneo_eye_off'}} contentDescription={hidden ? 'Tampilkan nominal' : 'Sembunyikan nominal'} modifiers={[size(21,21)]}/>
          </TextButton>
        </Row>
        <Text color="#173C2E" style={{fontSize:22,fontWeight:'bold'}}>{balanceDisplay}</Text>
        <Spacer modifiers={[size(1,4)]}/>
        <Row modifiers={[cornerRadius(99),background(pillBg),paddingAll(6)]}>
          <Text color={pillText} style={{fontSize:11,fontWeight:'bold'}}>{label} · {percent}%</Text>
        </Row>
        <Spacer modifiers={[size(1,6)]}/>
        <Row modifiers={[background('#DFE8DE'),cornerRadius(99),size(154,8)]}>
          <Row modifiers={[background('#26754C'),cornerRadius(99),size(filled,8)]}/>
        </Row>
        <Spacer modifiers={[size(1,8)]}/>
        <Row modifiers={[background('#FFFEFB'),cornerRadius(13),paddingAll(5)]}>
          <Column modifiers={[paddingAll(2)]}>
            <Text color="#26754C" style={{fontSize:10,fontWeight:'bold'}}>↑ Pemasukan</Text>
            <Text color="#173C2E" style={{fontSize:11,fontWeight:'bold'}}>{incomeDisplay}</Text>
          </Column>
          <Spacer modifiers={[size(6,1)]}/>
          <Column modifiers={[paddingAll(2)]}>
            <Text color="#B8326B" style={{fontSize:10,fontWeight:'bold'}}>↓ Pengeluaran</Text>
            <Text color="#173C2E" style={{fontSize:11,fontWeight:'bold'}}>{expenseDisplay}</Text>
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
