import { Image, HStack, VStack, Text, Spacer, Button } from '@expo/ui/swift-ui';
import { background, clipShape, containerBackground, font, foregroundStyle, padding, frame, resizable, aspectRatio, buttonStyle, labelStyle, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import type { WidgetSnapshot } from '../src/widgetHealth';

// Widget code runs in an isolated runtime. No top-level helper or image reference is allowed.
const AnaFinanceWidget = (props: WidgetSnapshot, environment: WidgetEnvironment) => {
  'widget';
  const large = environment.widgetFamily === 'systemLarge';
  const label = props.label || 'Belum ada dana';
  const percent = Number.isFinite(props.percent) ? Math.max(0, Math.min(100, props.percent)) : 0;
  const ratio = Number.isFinite(props.ratio) ? Math.max(0, Math.min(1, props.ratio)) : 0;
  const pillBg = label === 'Aman' ? '#E7F3E9' : label === 'Waspada' ? '#FFF0D6' : label === 'Hemat' ? '#FCE8F0' : label === 'Kritis' ? '#F8DCE6' : '#E7F3E9';
  const pillText = label === 'Aman' ? '#26754C' : label === 'Waspada' ? '#805A2E' : label === 'Hemat' ? '#9F3B65' : label === 'Kritis' ? '#A92B54' : '#26754C';
  const barWidth = 174;
  const mascotWidth = large ? 132 : 126;
  const contentWidth = 176;
  const progressWidth = Math.round(barWidth * ratio);
  const hidden = props.privateMode === true;
  const balanceDisplay = hidden ? 'Rp ••••••' : (props.balanceWidgetText || props.balanceFullText || props.balanceText);
  const incomeDisplay = hidden ? 'Rp ••••••' : (props.incomeWidgetText || props.incomeFullText || props.incomeText);
  const expenseDisplay = hidden ? 'Rp ••••••' : (props.expenseWidgetText || props.expenseFullText || props.expenseText);
  return (
    <HStack spacing={4} modifiers={[containerBackground('#F9F7F5','widget'),padding({all:6}),widgetURL('moneo://')]}>
      <VStack spacing={0} modifiers={[frame({width:mascotWidth})]}>
        {props.logoUri ?
          <Image uiImage={props.logoUri} modifiers={[resizable(),aspectRatio({ratio:2,contentMode:'fit'}),frame({width:110,height:48})]}/> :
          <Text modifiers={[font({size:18,weight:'bold'}),foregroundStyle('#0B603A')]}>Moneo</Text>
        }
        {props.mascotUri ?
          <Image uiImage={props.mascotUri} modifiers={[resizable(),aspectRatio({ratio:1,contentMode:'fit'}),frame({width:mascotWidth,height:104})]}/> :
          <Text modifiers={[font({size:12}),foregroundStyle('#526557')]}>Maskot sedang dimuat</Text>
        }
      </VStack>
      <VStack spacing={4} modifiers={[frame({width:contentWidth})]}>
        <HStack spacing={4}>
          <Text modifiers={[font({size:13,weight:'bold'}),foregroundStyle('#275843')]}>Saldo Total</Text>
          <Button
            label={hidden ? 'Tampilkan nominal' : 'Sembunyikan nominal'}
            systemImage={hidden ? 'eye.slash.fill' : 'eye.fill'}
            target="moneo-toggle-amounts"
            modifiers={[buttonStyle('plain'), labelStyle('iconOnly'),frame({width:30,height:30})]}
            onPress={() => ({ ...props, privateMode: !hidden })}
          />
        </HStack>
        <Text modifiers={[font({size:large?28:26,weight:'bold',design:'rounded'}),foregroundStyle('#0A4B2B')]}>{balanceDisplay}</Text>
        <HStack spacing={0} modifiers={[padding({horizontal:7,vertical:4}),background(pillBg),clipShape('capsule')]}>
          <Text modifiers={[font({size:11,weight:'bold'}),foregroundStyle(pillText)]}>{label} · {percent}%</Text>
        </HStack>
        <HStack spacing={0} modifiers={[frame({width:barWidth,height:8}),background('#DDE8E3'),clipShape('capsule')]}>
          <VStack modifiers={[frame({width:progressWidth,height:8}),background('#26754C')]}><Spacer /></VStack>
          <Spacer />
        </HStack>
        <HStack spacing={4}>
          <VStack spacing={2} modifiers={[frame({width:76}),padding({all:4}),background('#E8F5E9'),clipShape('roundedRectangle',12)]}>
            <Text modifiers={[font({size:10,weight:'bold'}),foregroundStyle('#26754C')]}>↑ Pemasukan</Text>
            <Text modifiers={[font({size:13,weight:'bold'}),foregroundStyle('#0A4B2B')]}>{incomeDisplay}</Text>
          </VStack>
          <VStack spacing={2} modifiers={[frame({width:76}),padding({all:4}),background('#FBE5EF'),clipShape('roundedRectangle',12)]}>
            <Text modifiers={[font({size:10,weight:'bold'}),foregroundStyle('#A52C61')]}>↓ Pengeluaran</Text>
            <Text modifiers={[font({size:13,weight:'bold'}),foregroundStyle('#7D2049')]}>{expenseDisplay}</Text>
          </VStack>
        </HStack>
      </VStack>
    </HStack>
  );
};
export default createWidget<WidgetSnapshot>('AnaFinanceWidget', AnaFinanceWidget, {
  balanceText:'Rp 0',incomeText:'Rp 0',expenseText:'Rp 0',balanceFullText:'Rp 0',incomeFullText:'Rp 0',expenseFullText:'Rp 0',balanceWidgetText:'Rp 0',incomeWidgetText:'Rp 0',expenseWidgetText:'Rp 0',ratio:0,percent:0,
  mood:'thoughtful',label:'Belum ada dana',period:'',privateMode:false,mascotUri:'',logoUri:''
});
