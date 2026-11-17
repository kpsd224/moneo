import { Row, Column, Text, Image } from '@expo/ui/jetpack-compose';
import { background, cornerRadius, paddingAll, size } from '@expo/ui/jetpack-compose/modifiers';
import { createWidget } from 'expo-widgets';
import type { WidgetSnapshot } from '../src/widgetHealth';

// Widget code runs in an isolated runtime. No top-level helper or image reference is allowed.
const AnaFinanceWidget = (props: WidgetSnapshot) => {
  'widget';
  const label = props.label || 'Belum ada dana';
  const percent = Number.isFinite(props.percent) ? Math.max(0, Math.min(100, props.percent)) : 0;
  const ratio = Number.isFinite(props.ratio) ? Math.max(0, Math.min(1, props.ratio)) : 0;
  const pillBg = label === 'Aman' ? '#DDF4E8' : label === 'Waspada' ? '#FFEDD0' : label === 'Hemat' ? '#FFE3ED' : label === 'Kritis' ? '#FFDDE4' : '#E9E2FF';
  const pillText = label === 'Aman' ? '#12775B' : label === 'Waspada' ? '#936020' : label === 'Hemat' ? '#AD3F6B' : label === 'Kritis' ? '#C02B50' : '#6D52AC';
  const progressWidth = Math.round(173 * ratio);
  const mascotHeight = label === 'Aman' ? 134 : label === 'Waspada' ? 128 : label === 'Hemat' ? 124 : 134;
  return (
    <Row modifiers={[background('#F5EFFF'), cornerRadius(24), paddingAll(11)]}>
      <Column>
        {props.mascotUri ?
          <Image source={{uri:props.mascotUri}} contentScale="crop" contentDescription={`Maskot Moneo: ${label}`} modifiers={[size(110,mascotHeight),cornerRadius(21)]}/> :
          <Column modifiers={[size(110,126),background('#ECE2FF'),cornerRadius(21),paddingAll(10)]}>
            <Text color="#6752A6" style={{fontSize:11,fontWeight:'bold'}}>Moneo</Text>
            <Text color="#6752A6" style={{fontSize:11}}>Buka aplikasi agar maskot muncul</Text>
          </Column>
        }
      </Column>
      <Column modifiers={[paddingAll(5)]}>
        <Text color="#60547F" style={{fontSize:10,fontWeight:'bold'}}>Saldo Total</Text>
        <Text color="#35215D" style={{fontSize:18,fontWeight:'bold'}}>{props.balanceText}</Text>
        <Row modifiers={[background(pillBg), cornerRadius(99), paddingAll(4)]}>
          <Text color={pillText} style={{fontSize:10,fontWeight:'bold'}}>{label} · {percent}%</Text>
        </Row>
        <Row modifiers={[background('#E4DAF5'),cornerRadius(99),size(173,8)]}>
          <Row modifiers={[background('#7F53F5'),cornerRadius(99),size(progressWidth,8)]}/>
        </Row>
        <Row modifiers={[background('#FFFFFF'),cornerRadius(14),paddingAll(5)]}>
          <Column>
            <Text color="#16906A" style={{fontSize:9,fontWeight:'bold'}}>↑ Pemasukan</Text>
            <Text color="#453568" style={{fontSize:10,fontWeight:'bold'}}>{props.incomeText}</Text>
          </Column>
          <Column>
            <Text color="#C9568F" style={{fontSize:9,fontWeight:'bold'}}>↓ Pengeluaran</Text>
            <Text color="#453568" style={{fontSize:10,fontWeight:'bold'}}>{props.expenseText}</Text>
          </Column>
        </Row>
      </Column>
    </Row>
  );
};
export default createWidget<WidgetSnapshot>('AnaFinanceWidget', AnaFinanceWidget, {
  balanceText:'Rp 0',incomeText:'Rp 0',expenseText:'Rp 0',ratio:0,percent:0,
  mood:'thoughtful',label:'Belum ada dana',period:'',privateMode:false,mascotUri:''
});
