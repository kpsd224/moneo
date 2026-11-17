import { Row, Column, Text, Image, Spacer, TextButton } from '@expo/ui/jetpack-compose';
import { background, cornerRadius, paddingAll, size } from '@expo/ui/jetpack-compose/modifiers';
import { createWidget } from 'expo-widgets';
import type { WidgetSnapshot } from '../src/widgetHealth';

const AnaFinanceWidget = (props: WidgetSnapshot) => {
  'widget';
  // Isolated widget bundle: all values must be local or come from props.
  const label = props.label || (props.mood === 'happy' ? 'Aman' : props.mood === 'thoughtful' ? 'Waspada' : props.mood === 'worried' ? 'Hemat' : props.mood === 'panic' ? 'Kritis' : 'Belum ada dana');
  const percent = Math.max(0, Math.min(100, Number(props.percent) || 0));
  const ratio = Math.max(0, Math.min(1, Number(props.ratio) || 0));
  const mood = props.mood || 'thoughtful';
  const pillBg = mood === 'happy' ? '#D9F3E8' : mood === 'thoughtful' ? '#FFF0D6' : mood === 'worried' ? '#FFE6F1' : '#FFDCE8';
  const pillText = mood === 'happy' ? '#187A62' : mood === 'thoughtful' ? '#96612A' : mood === 'worried' ? '#AA4774' : '#C03866';
  const filled = Math.round(152 * ratio);
  const hidden = props.privateMode === true;
  const balanceDisplay = hidden ? 'Rp ••••••' : (props.balanceFullText || props.balanceText);
  const incomeDisplay = hidden ? 'Rp ••••••' : (props.incomeFullText || props.incomeText);
  const expenseDisplay = hidden ? 'Rp ••••••' : (props.expenseFullText || props.expenseText);
  return (
    <Row modifiers={[background('#F5EBFF'), cornerRadius(23), paddingAll(12)]}>
      <Column modifiers={[size(108,130)]}>
        {props.mascotUri ? (
          <Image source={{uri:props.mascotUri}} contentScale="fit" contentDescription={`Maskot ${label}`} modifiers={[size(108,130)]}/>
        ) : mood === 'happy' ? (
          <Image source={require('../assets/widget/happy.png')} contentScale="fit" contentDescription="Maskot senang" modifiers={[size(108,130)]}/>
        ) : mood === 'worried' ? (
          <Image source={require('../assets/widget/worried.png')} contentScale="fit" contentDescription="Maskot khawatir" modifiers={[size(108,130)]}/>
        ) : mood === 'panic' ? (
          <Image source={require('../assets/widget/panic.png')} contentScale="fit" contentDescription="Maskot panik" modifiers={[size(108,130)]}/>
        ) : (
          <Image source={require('../assets/widget/thoughtful.png')} contentScale="fit" contentDescription="Maskot berpikir" modifiers={[size(108,130)]}/>
        )}
      </Column>
      <Column modifiers={[paddingAll(5)]}>
        <Row>
          <Text color="#71638C" style={{fontSize:10,fontWeight:'bold'}}>Saldo Total</Text>
          <Spacer modifiers={[size(5,1)]}/>
          <TextButton onClick={() => ({ ...props, privateMode: !hidden })} colors={{contentColor:'#6E50C2',containerColor:'#EBE2FC'}}>
            <Text color="#6E50C2" style={{fontSize:12,fontWeight:'bold'}}>{hidden ? '👁 Lihat' : '👁 Tutup'}</Text>
          </TextButton>
        </Row>
        <Text color="#332057" style={{fontSize:18,fontWeight:'bold'}}>{balanceDisplay}</Text>
        <Spacer modifiers={[size(1,4)]}/>
        <Row modifiers={[cornerRadius(99),background(pillBg),paddingAll(5)]}>
          <Text color={pillText} style={{fontSize:10,fontWeight:'bold'}}>{label} · {percent}%</Text>
        </Row>
        <Spacer modifiers={[size(1,5)]}/>
        <Row modifiers={[background('#E5D8F7'),cornerRadius(99),size(152,9)]}>
          <Row modifiers={[background('#8155F5'),cornerRadius(99),size(filled,9)]}/>
        </Row>
        <Spacer modifiers={[size(1,7)]}/>
        <Row modifiers={[background('#FFFFFF'),cornerRadius(14),paddingAll(4)]}>
          <Column modifiers={[paddingAll(2)]}>
            <Text color="#209D75" style={{fontSize:9,fontWeight:'bold'}}>↑ Pemasukan</Text>
            <Text color="#433465" style={{fontSize:9,fontWeight:'bold'}}>{incomeDisplay}</Text>
          </Column>
          <Spacer modifiers={[size(6,1)]}/>
          <Column modifiers={[paddingAll(2)]}>
            <Text color="#D25C93" style={{fontSize:9,fontWeight:'bold'}}>↓ Pengeluaran</Text>
            <Text color="#433465" style={{fontSize:9,fontWeight:'bold'}}>{expenseDisplay}</Text>
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
