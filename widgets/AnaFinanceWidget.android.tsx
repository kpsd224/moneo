import { Box, Row, Column, Text, Image, Spacer, TextButton } from '@expo/ui/jetpack-compose';
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
  const filled = Math.round(164 * ratio);
  const hidden = props.privateMode === true;
  const balanceDisplay = hidden ? 'Rp ••••••' : (props.balanceWidgetText || props.balanceFullText || props.balanceText);
  const incomeDisplay = hidden ? 'Rp ••••••' : (props.incomeWidgetText || props.incomeFullText || props.incomeText);
  const expenseDisplay = hidden ? 'Rp ••••••' : (props.expenseWidgetText || props.expenseFullText || props.expenseText);
  return (
    <Box contentAlignment="center" modifiers={[fillMaxSize()]}>
      <Box modifiers={[size(320,180)]}>
        <Image source={{uri:'moneo_widget_card'}} contentScale="fillBounds" contentDescription={null} modifiers={[fillMaxSize()]}/>
        <Row horizontalArrangement="center" verticalAlignment="center" modifiers={[fillMaxSize(),paddingAll(4)]}>
          <Column verticalArrangement="spaceBetween" modifiers={[size(126,160)]}>
            <Image source={{uri:'moneo_logo'}} contentScale="fit" contentDescription="Logo Moneo" modifiers={[size(110,50)]}/>
            <Image source={{uri:props.mascotUri || mood}} contentScale="fit" contentDescription={`Maskot ${label}`} modifiers={[size(126,110)]}/>
          </Column>
          <Spacer modifiers={[size(5,1)]}/>
          <Column verticalArrangement="center" modifiers={[width(166)]}>
            <Row verticalAlignment="center">
              <Text color="#275843" style={{fontSize:14,fontWeight:'bold'}}>Saldo Total</Text>
              <Spacer modifiers={[size(7,1)]}/>
              <TextButton {...{target:'moneo-toggle-amounts'}} onClick={() => ({ ...props, privateMode: !hidden })} colors={{containerColor:'#E2F2E3'}} modifiers={[size(30,30),cornerRadius(10)]}>
                <Image source={{uri:hidden ? 'moneo_eye_off' : 'moneo_eye_on'}} contentDescription={hidden ? 'Tampilkan nominal' : 'Sembunyikan nominal'} modifiers={[size(20,20)]}/>
              </TextButton>
            </Row>
            <Text color="#0A4B2B" style={{fontSize:28,fontWeight:'bold'}}>{balanceDisplay}</Text>
            <Spacer modifiers={[size(1,2)]}/>
            <Row modifiers={[cornerRadius(99),background(pillBg),paddingAll(3)]}>
              <Text color={pillText} style={{fontSize:11,fontWeight:'bold'}}>{label} · {percent}%</Text>
            </Row>
            <Spacer modifiers={[size(1,3)]}/>
            <Row modifiers={[background('#DDE8E3'),cornerRadius(99),size(164,9)]}>
              <Row modifiers={[background('#26754C'),cornerRadius(99),size(filled,9)]}/>
            </Row>
            <Spacer modifiers={[size(1,3)]}/>
            <Row>
              <Column modifiers={[width(80),background('#E8F5E9'),cornerRadius(12),paddingAll(5)]}>
                <Text color="#26754C" style={{fontSize:10,fontWeight:'bold'}}>↑ Pemasukan</Text>
                <Text color="#0A4B2B" style={{fontSize:13,fontWeight:'bold'}}>{incomeDisplay}</Text>
              </Column>
              <Spacer modifiers={[size(6,1)]}/>
              <Column modifiers={[width(80),background('#FBE5EF'),cornerRadius(12),paddingAll(5)]}>
                <Text color="#A52C61" style={{fontSize:10,fontWeight:'bold'}}>↓ Pengeluaran</Text>
                <Text color="#7D2049" style={{fontSize:13,fontWeight:'bold'}}>{expenseDisplay}</Text>
              </Column>
            </Row>
          </Column>
        </Row>
      </Box>
    </Box>
  );
};
export default createWidget<WidgetSnapshot>('AnaFinanceWidget', AnaFinanceWidget, {
  balanceText:'Rp 0',incomeText:'Rp 0',expenseText:'Rp 0',balanceFullText:'Rp 0',incomeFullText:'Rp 0',expenseFullText:'Rp 0',balanceWidgetText:'Rp 0',incomeWidgetText:'Rp 0',expenseWidgetText:'Rp 0',ratio:0,percent:0,
  mood:'thoughtful',label:'Belum ada dana',period:'',privateMode:false,mascotUri:'',logoUri:''
});
