import { Image, HStack, VStack, Text, Spacer } from '@expo/ui/swift-ui';
import { containerBackground, font, foregroundStyle, padding, frame, resizable, aspectRatio } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import type { WidgetSnapshot } from '../src/widgetHealth';

const AnaFinanceWidget = (props: WidgetSnapshot, environment: WidgetEnvironment) => {
  'widget';
  function statusMeta(props: WidgetSnapshot){
    if(props.label==='Aman') return {pillBg:'#DFF2EA', pillText:'#15836A', range:'> 80%'};
    if(props.label==='Waspada') return {pillBg:'#F7E8C8', pillText:'#9B6529', range:'50–80%'};
    if(props.label==='Hemat') return {pillBg:'#F7DDE5', pillText:'#B64F70', range:'25–50%'};
    if(props.label==='Kritis') return {pillBg:'#FFD9E2', pillText:'#C43A65', range:'< 25%'};
    return {pillBg:'#E8E0FB', pillText:'#7054B6', range:'0%'};
  }
  const large = environment.widgetFamily === 'systemLarge';
  const imageWidth = large ? 144 : 120;
  const imageHeight = large ? 152 : 126;
  const barWidth = large ? 210 : 172;
  const progressWidth = Math.max(18, Math.min(barWidth, Math.round(barWidth * props.ratio)));
  const meta = statusMeta(props);
  const mascot = props.mascotUri ?
    <Image uiImage={props.mascotUri} modifiers={[resizable(), aspectRatio({ratio:1,contentMode:'fill'}), frame({width: imageWidth, height: imageHeight})]} /> :
    <VStack modifiers={[frame({width:imageWidth,height:imageHeight}), containerBackground('#ECE4FF','widget')]}><Text modifiers={[font({size: 14}), foregroundStyle('#7054B6')]}>Maskot</Text></VStack>;
  return (
    <HStack spacing={10} modifiers={[containerBackground('#F5EEFF','widget'), padding({all:12})]}>
      {mascot}
      <VStack spacing={6}>
        <Text modifiers={[font({size: 11}), foregroundStyle('#655C89')]}>Saldo Total</Text>
        <Text modifiers={[font({size: large ? 28 : 23, weight: 'bold', design: 'rounded'}), foregroundStyle('#362264')]}>{props.balanceText}</Text>
        <HStack spacing={4} modifiers={[padding({horizontal:10, vertical:6}), containerBackground(meta.pillBg,'widget')]}>
          <Text modifiers={[font({size: 11, weight: 'bold'}), foregroundStyle(meta.pillText)]}>{props.label}</Text>
          <Text modifiers={[font({size: 11}), foregroundStyle(meta.pillText)]}>{meta.range}</Text>
        </HStack>
        <HStack spacing={0} modifiers={[frame({width: barWidth, height: 10}), containerBackground('#E9DFFC','widget')]}>
          <VStack modifiers={[frame({width: progressWidth, height: 10}), containerBackground('#7F53F5','widget')]}><Spacer /></VStack>
          <Spacer />
        </HStack>
        <HStack spacing={16} modifiers={[padding({all:8}), containerBackground('#FFFFFF','widget')]}>
          <VStack spacing={2}>
            <Text modifiers={[font({size: 10, weight: 'bold'}), foregroundStyle('#4CA77B')]}>↑ Pemasukan</Text>
            <Text modifiers={[font({size: 12, weight: 'bold'}), foregroundStyle('#453568')]}>{props.incomeText}</Text>
          </VStack>
          <VStack spacing={2}>
            <Text modifiers={[font({size: 10, weight: 'bold'}), foregroundStyle('#D56495')]}>↓ Pengeluaran</Text>
            <Text modifiers={[font({size: 12, weight: 'bold'}), foregroundStyle('#453568')]}>{props.expenseText}</Text>
          </VStack>
          <Spacer />
        </HStack>
      </VStack>
      <Spacer />
    </HStack>
  );
};
export default createWidget<WidgetSnapshot>('AnaFinanceWidget', AnaFinanceWidget, {
  balanceText:'Rp 0', incomeText:'Rp 0', expenseText:'Rp 0', ratio:0,
  percent:0, mood:'thoughtful', label:'Belum ada dana', period:'', privateMode:false, mascotUri:''
});
